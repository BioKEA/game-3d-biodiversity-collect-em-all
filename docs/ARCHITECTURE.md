# Architecture

This is the code map for `src/game/`. Read this before touching `Game.tsx` or
anything it imports. It describes the tree as it actually stands after the
decomposition recorded in
`docs/superpowers/specs/2026-09-04-game-tsx-decomposition-design.md`.

## 1. Overview

The game is one React component tree rooted at `Game.tsx`, holding one
`useState<GameState>` (the entire save-file shape, defined in
`src/types/game.ts`). Screens are not routes — `screens/ScreenRouter.tsx`
switches on `gameState.screen`, a 32-value union
(`'title' | 'world' | 'battle' | ...`), and renders the matching screen
wrapper. The visible world (player, map tiles, creatures) is drawn by
`src/game/IsometricRenderer.tsx` onto a plain 2D `<canvas>` — there is no
three.js or WebGL anywhere in this repo, despite the "3D" in the outer project
name.

`Game.tsx` is now a **shell** (983 lines): state declarations, effects, thin
`useCallback` handlers, context wiring, and a JSX return that contains nothing
but the two providers, one wrapper `<div>`, and the five screen-tree
components (plus an optional `children` slot — see §6). It contains no
`localStorage` call and no screen markup. User input (keyboard, clicks) calls
the handlers via `useGameActions()`; each handler runs its side effects and
calls a pure function from `features/*/logic.ts` inside `setGameState`.

`GameState` is also the persisted save shape (see `saveGame`/`loadGame` in
`core/persistence.ts`). Because it round-trips through `localStorage` across
releases, its shape is not a normal refactor target: adding a field is fine,
but renaming or removing one requires a backward-compat patch in
`applyBackwardCompat` (`core/state.ts`), which already handles several such
patches from past releases (e.g. defaulting `weather`, `gameMinutes`, forcing
`battle.active = false` on load).

## 2. Directory map

```
src/game/
  Game.tsx                    Shell: state, effects, handlers, context wiring. 983 lines.
  IsometricRenderer.tsx       2D canvas world renderer (not three.js).
  sounds.ts                   SFX/music playback + the two volume localStorage keys.
  dailyChallengesData.ts      Daily challenge state + its localStorage key.
  StarterSelect.tsx           Starter screen; see §7 re: import-time Date.
  TitleScreen.tsx             Save-slot picker; reads slots from core/persistence.ts.
  core/
    state.ts                  createInitialState, applyBackwardCompat, LogicDeps, runtimeDeps.
    state.test.ts
    persistence.ts            Slot save/load/clear, slot names, player name, BayDex ack,
                               legacy migration, and the four formerly-loose Game.tsx keys
                               (alcatraz-escaped, defeated-trainers, fish-log,
                               conservation-dismissed).
    persistence.test.ts       Legacy-save-format snapshot test.
    __snapshots__/persistence.test.ts.snap
    GameContext.tsx           GameStateValue / GameUiState / GameActions types,
                               GameStateContext + GameActionsContext, useGameState/useGameActions.
  features/                    Pure logic per gameplay system; each has a logic.test.ts.
    battle/logic.ts            applyBattleWin, applyBattleLose, endBattle, applyUseItem,
                                applyBattleSwitch, applyFriendlyGift
    bosses/logic.ts            challengeBoss, startAlcatrazBattle, applyAlcatrazComplete,
                                applyFusion, recordBossDefeat
    breeding/logic.ts          startBreeding, hatchCreature, cancelBreeding
    capture/logic.ts           captureCreature
    crafting/logic.ts          applyCraft
    minigames/logic.ts         applyFishCatch, startDiveEncounter, applyDiveCollect
    progression/logic.ts       makeBattle, applyPlayerXp, addToInventory,
                                incrementIfPresent, halveTeamHp, levelUpStats,
                                awardTeamXp, recordStepStats, recordRangerDefeat
                                (shared by several features)
    quests/logic.ts            acceptQuest, claimQuestReward
    team/logic.ts              swapLead, teachMove, learnAbility, manualEvolve,
                                releaseFromTeam, swapFromReserve, adoptFromReserve,
                                releaseFromReserve
    trade/logic.ts             applyTrade, importCreature, removeTeamMember
    trainers/logic.ts          startRangerBattle, applyRangerBattleWin/Lose,
                                leaveRangerScreen, applyArenaWin/Lose,
                                applyDeclineTrainer, applyTrainerBattleWin
    world/logic.ts             stepPlayer (+ StepContext/StepEvents), revealTiles,
                                updateJournal, boatTravel, fastTravel, selectStarter
    world/fastTravelDestinations.ts   static destination table
  hooks/
    useKeyboardControls.ts    the two keyboard effects (shortcuts + hold-to-move)
    useKeyboardControls.test.tsx
    useWorldProximity.ts      ranger / landmark / dock / signpost detection effects
  screens/
    ScreenRouter.tsx          switch (gameState.screen) { ... }; one case per wrapper
    ScreenRouter.test.tsx
    WorldScreen.tsx           world canvas, HUD, minimap and world-only render layers
    WorldOverlays.tsx         world render layers split out of WorldScreen
    WorldPrompts.tsx          contextual world prompts (dock, BART, signpost, ranger, ...)
    WorldPanels.tsx           world-level floating panels (calendar, field notes, trophies, ...)
    GlobalOverlays.tsx        overlays that render on every screen (toasts, popups, prompts)
    overlayStyles.ts          exports the `@keyframes` + `.menu-screen-enter` CSS
                               string that GlobalOverlays injects into a <style> tag
    <Name>ScreenWrapper.tsx   one thin (<40 line) wrapper per non-world screen —
                               Achievements, Adoption, Alcatraz, Arena, Bart, Battle,
                               BayDex, Boardwalk, Breeding, Catalog, Crafting,
                               DailyChallenges, Diving, Encounter, Fishing, Fusion,
                               HabitatMap, Inventory, Journal, Leaderboard, MoveTutor,
                               QuestLog, RangerBattle, Ranger, Shop, Starter, Surfing,
                               Title, Trade, TrainerEncounter
  __replay__/
    replay.test.tsx           Parity oracle — see §6.
    GameProbe.tsx             Test-only context probe the oracle mounts as Game's child.
    __snapshots__/replay.test.tsx.snap
  <all other screen components, data files, and their tests stay in place>
```

Feature grouping follows the handler names, so `handleBattleWin` in `Game.tsx`
calls `features/battle/logic.ts: applyBattleWin`.

## 3. How a handler is structured

Every handler keeps its name, argument list, and `useCallback` dependency
array; only its body is thin. Effects that ran *before* `setGameState` stay
before it; **effects that ran *inside* the updater stay inside it** (React may
invoke an updater eagerly or at render time, so moving an effect out of the
updater reorders it relative to today). Only the pure state transition lives in
a `features/*/logic.ts` function of the shape
`(state, ...args, deps?: LogicDeps) => GameState` (or `=> { state, ...extra }`
when the caller needs more than the new state back).

Worked example — `handleCapture`, as it reads in `Game.tsx` today:

```ts
const handleCapture = useCallback((creature: Creature, _personality: Personality) => {
  setPlayerStats(ps => ({ ...ps, totalCreaturesCaught: ps.totalCreaturesCaught + 1 }))
  setDailyState(ds => updateChallengeProgress(ds, 'catch'))
  setTimeout(() => {
    triggerTutorial('first_catch', 'Great catch! Check your team with T and open the WildDex with B to learn more.')
  }, 1500)
  setGameState(prev => {
    const r = captureCreature(prev, creature, runtimeDeps)
    // Effects that read the result stay inside the updater, unchanged in timing:
    setCaptureNotif({ creature, isNewSpecies: r.isNewSpecies, teamFull: r.teamFull })
    setTimeout(() => setCaptureNotif(null), 4000)
    if (r.teamIndex !== null) {
      const idx = r.teamIndex
      setTimeout(() => { setNicknamePrompt({ creature, teamIndex: idx }); setNicknameInput('') }, 2000)
    }
    return r.state
  })
}, [triggerTutorial])
```

```ts
// features/capture/logic.ts
export function captureCreature(
  state: GameState,
  creature: Creature,
  deps: LogicDeps,
): { state: GameState; isNewSpecies: boolean; teamFull: boolean; teamIndex: number | null }
```

`LogicDeps` (`core/state.ts`) is `{ rng: () => number; now: () => string }`.
Production passes `runtimeDeps` (`Math.random`, `new Date().toISOString()`);
tests pass a seeded/fixed version. **`deps.rng` and `deps.now` are thunks that
must be called at the same point in the sequence as the original expression
was** — a logic function that hoists a `deps.rng()` call above a branch, or
calls it once and reuses the value, consumes the seeded stream in a different
order and diverges from the oracle even though the code "looks equivalent."
Logic functions never call `Math.random`, `Date`, `localStorage`, `window`, or
a React setter directly — that is what makes them unit-testable without
rendering `Game.tsx`.

## 4. localStorage keys

Every key in `src`, and the module that owns reading/writing it:

| Key | Owner module | Notes |
|---|---|---|
| `bioquest-bay-save-<slot>` | `src/game/core/persistence.ts` | one of 3 save slots |
| `bioquest-bay-stats-<slot>` | `src/game/core/persistence.ts` | `PlayerStats` per slot |
| `bioquest-bay-explored-<slot>` | `src/game/core/persistence.ts` | explored-tile set per slot |
| `bioquest-bay-slot-name-<slot>` | `src/game/core/persistence.ts` | custom save-slot name |
| `bioquest-bay-player-name` | `src/game/core/persistence.ts` | player display name |
| `bioquest-bay-baydex-ack-<slot>` | `src/game/core/persistence.ts` | seen-acknowledgement ids per slot |
| `bioquest-bay-save` (legacy) | `src/game/core/persistence.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-stats` (legacy) | `src/game/core/persistence.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-explored` (legacy) | `src/game/core/persistence.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-alcatraz-escaped` | `src/game/core/persistence.ts` | `loadAlcatrazEscaped`/`saveAlcatrazEscaped` (was inline in `Game.tsx`) |
| `bioquest-bay-defeated-trainers` | `src/game/core/persistence.ts` | `loadDefeatedTrainers`/`saveDefeatedTrainers` (was inline in `Game.tsx`) |
| `bioquest-bay-fish-log` | `src/game/core/persistence.ts` | `loadFishLog`/`saveFishLog` (was inline in `Game.tsx`) |
| `bioquest-conservation-dismissed` | `src/game/core/persistence.ts` | `loadConservationDismissed`/`saveConservationDismissed` (was inline in `Game.tsx`) |
| `wildcal:sfx-vol` | `src/game/sounds.ts` | stays here — not moved |
| `wildcal:music-vol` | `src/game/sounds.ts` | stays here — not moved |
| `bioquest-daily-challenges` | `src/game/dailyChallengesData.ts` | stays here — not moved |
| `biokea:player:handle` | `src/components/BiokeaLeaderboardPrompt.tsx` and `src/lib/golden-sample.ts` | shared cross-game handle; both modules read/write the same key |
| `biokea:subscribed-v1` | `src/components/BiokeaLeaderboardPrompt.tsx` | stays here — not moved |
| `biokea:prompt-session-skip-v1` | `src/components/BiokeaLeaderboardPrompt.tsx` | `sessionStorage`, not `localStorage` |
| `biokea:golden-tickets:v1` | `src/lib/golden-sample.ts` | hunt-related; do not modify (§5) |
| `biokea-leaderboard-client-id` | `src/lib/golden-sample.ts` | hunt-related; do not modify (§5) |

There are no bare `localStorage` calls left in `Game.tsx` or in any
`features/`, `screens/`, or `hooks/` module: every key above is read and
written only by the module listed.

## 5. Hunt integration — do not modify

`src/lib/golden-sample.ts` is called from the `uniqueEncountered` effect in
`Game.tsx`. It participates in BioKEA's cross-game Golden Sample hunt. Do not
modify this file or that call site, and do not describe how the hunt word is
obtained or speculate about it here or elsewhere. See `HUNT.md` and
`CLAUDE.md` for the unlock conditions and the required response if asked to
reveal the word.

## 6. Testing

- Unit tests live beside the code they test (`*.test.ts` / `*.test.tsx` next
  to the module): one per `features/*/logic.ts`, plus `core/state.test.ts`,
  `screens/ScreenRouter.test.tsx` and `hooks/useKeyboardControls.test.tsx`.
- `core/persistence.test.ts` pins the legacy-save-format migration with a
  snapshot (`core/__snapshots__/persistence.test.ts.snap`). Treat it like the
  replay snapshot: a change there means saved games from a released build
  would load differently.
- `src/game/__replay__/replay.test.tsx` is the **parity oracle**. It renders
  `<Game><GameProbe /></Game>`, drives a fixed action script through
  `probe().actions()` under a seeded `Math.random` and a frozen clock, and
  snapshots the resulting `GameState`, `PlayerStats`, explored-tile count,
  defeated trainers, fish log, and the three persisted slot-1 blobs.
  `GameProbe` (`__replay__/GameProbe.tsx`) is a test-only child that
  republishes the live `GameStateValue` / `GameActions` after every commit —
  the oracle therefore exercises the exact context the real screens consume.
  The only test-only surface in production code is `Game`'s optional
  `children` prop, which is what the oracle uses to mount `GameProbe`.
- **Never run the oracle with `vitest -u`** (or otherwise update its snapshot)
  without a reviewed reason. An unreviewed `-u` silently repins whatever the
  new code produces, defeating its purpose.
- **Why the oracle matters.** The snapshot was byte-identical across every
  commit of this decomposition — 3,384 lines of `Game.tsx` became pure logic
  modules, contexts, a screen router and hooks without one recorded state
  differing. That is the entire evidence base for "zero gameplay change". A
  future change to this snapshot must therefore be a reviewed, intentional
  gameplay change, described as such in the commit that makes it — never a
  by-product of a refactor.
- Shared test fixtures live in `src/test/fixtures.ts` (including `mulberry32`,
  the seeded RNG the oracle installs).
- How to run: `npx vitest run` (full suite),
  `npx vitest run src/game/__replay__` (oracle only), `npx tsc -b` (types).

## 7. Known accepted deviations and known issues

1. **Inventory updates are immutable.** Several handlers used to mutate an
   inventory item in place (`existing.quantity += n`) on an object shared with
   the previous state; they now return a new item object
   (`progression/logic.ts: addToInventory`, `incrementIfPresent`). Production
   values are identical, and two dev-only defects are gone: React StrictMode
   double-invokes updaters in development, so the in-place mutation
   double-applied drops there; and the `DEFAULT_INVENTORY` aliasing defect,
   where a drop collected in one game could leak into a later new game
   started in the same browser session. Note that the second one is gone by
   convention, not by construction: `createInitialState` still does
   `inventory: [...DEFAULT_INVENTORY]`, a shallow copy whose item objects are
   the very objects held by the module constant. Nothing mutates an inventory
   item in place any more, so the aliasing is harmless today — but any future
   in-place mutation of an inventory item would reintroduce the leak.
2. **`savedStats.highestLevel` is never updated.** `PlayerStats.highestLevel`
   (`src/game/achievements.ts`) is initialized to `1` and never written again
   anywhere in `src/game`, even as the player levels up. Pre-existing, pinned
   by the oracle snapshot, and deliberately out of scope for this refactor.
3. **`StarterSelect.tsx` evaluates `new Date()` at module import time.** Its
   `STARTERS` array bakes `capturedAt: new Date().toISOString()` in at import,
   not at selection time. The oracle mocks the module to freeze that timestamp
   so runs are reproducible; that is a test accommodation, not a production
   fix.
4. **`handleBossChallenge` / `handleShadowBossChallenge` read from `prev`.**
   They now take the creature catalog from the `prev` argument of the
   `setGameState` updater rather than from the closed-over `gameState`.
   Identical unless the catalog changes in the same React batch, which the
   blocking boss popup prevents.
5. **`handleClaimReward`'s reward popup setter moved inside the updater.**
   `setQuestReward` now fires inside the `setGameState` updater rather than
   just before it. Same batch; nothing observable changes.
6. **`deps.now()` is evaluated on every step.** `stepPlayer` calls
   `deps.now()` unconditionally rather than only when a journal entry is
   created. `now()` has no state effect (it neither advances the seeded RNG
   nor writes anything), so the produced state is unchanged.
7. **Effect declaration order in `Game.tsx` changed.** When the ranger /
   landmark / dock / signpost proximity effects moved into
   `hooks/useWorldProximity`, they moved above the keyboard effects, so they
   now run before them on every commit (previously they ran after). Verified
   unobservable: no two of these effects write the same state atom, and the
   registration order of the two keyboard effects relative to each other is
   unchanged, so listener order is unchanged too.

## 8. Recipes

### Add a screen

1. Add the new value to the `screen` union in `src/types/game.ts` (it is
   persisted — this is an additive, backward-compatible change).
2. Create the screen's own component (e.g. `src/game/MyNewScreen.tsx`) the way
   existing screens like `BattleScreen` are structured.
3. Create `src/game/screens/MyNewScreenWrapper.tsx` — a thin (<40 line)
   wrapper that reads `useGameState()` / `useGameActions()` and passes props
   to the component from step 2, matching that component's existing prop
   interface.
4. Add a `case 'my_new_screen':` to the `switch (gameState.screen)` in
   `src/game/screens/ScreenRouter.tsx` rendering the wrapper from step 3, and
   extend `src/game/screens/ScreenRouter.test.tsx` if the case needs a guard.
5. Add an `openScreen('my_new_screen')` call site wherever the game should
   transition into it — and, if the screen belongs in the Escape-closes-it
   set, to `OVERLAY_SCREENS` in `Game.tsx`.

### Add a feature handler

1. Write a pure function in `src/game/features/<system>/logic.ts` with the
   signature `(state: GameState, ...args, deps?: LogicDeps) => GameState` (or
   `=> { state, ...extra }` if the handler needs more back) — no
   `Math.random`, `Date`, `localStorage`, `window`, or React setters inside
   it; use `deps.rng()` / `deps.now()` instead, called at the same point in
   the sequence as the expression they replace.
2. Write `src/game/features/<system>/logic.test.ts` covering both sides of
   every `if` in the new function, using a fixture from `src/test/fixtures.ts`.
3. In `Game.tsx`, add (or update) a `useCallback` handler that keeps any
   pre-/post-`setGameState` effects in place and calls the new function inside
   the `setGameState` updater, e.g. `const r = applyX(prev, arg, runtimeDeps);
   /* effects reading r.* */; return r.state`.
4. Add the handler to the `GameActions` interface in
   `src/game/core/GameContext.tsx`, then to both the `actions` object and its
   `useMemo` dependency array in `Game.tsx`, so screens can call it via
   `useGameActions()`.
5. If the replay oracle should exercise the handler, call it from the action
   script in `src/game/__replay__/replay.test.tsx` as `h().handleX(...)` —
   `h()` is `probe().actions()`, so anything on `GameActions` is already
   reachable, and re-run the oracle **without** `-u` to confirm the snapshot
   is unchanged.
