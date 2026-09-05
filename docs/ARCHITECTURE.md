# Architecture

This is the code map for `src/game/`. Read this before touching `Game.tsx` or
anything it imports. It reflects an in-progress decomposition (see
`docs/superpowers/specs/2026-09-04-game-tsx-decomposition-design.md`); entries
marked **(planned)** don't exist yet.

## 1. Overview

The game is a single React component, `Game.tsx`, holding one
`useState<GameState>` (the entire save-file shape, defined in
`src/types/game.ts`). Screens are not routes — `Game.tsx` switches on
`gameState.screen`, a 32-value union (`'title' | 'world' | 'battle' | ...`),
and renders the matching screen component. The visible world (player, map
tiles, creatures) is drawn by `src/game/IsometricRenderer.tsx` onto a plain
2D `<canvas>` — there is no three.js or WebGL anywhere in this repo, despite
the "3D" in the outer project name. User input (keyboard, clicks) calls
`useCallback` handlers defined in `Game.tsx`, each of which reads and updates
`gameState` via `setGameState`.

## 2. Directory map

```
src/game/
  Game.tsx                    Top-level component: state, effects, handlers, screen switch.
                               Target: <900 lines once logic below is extracted (planned).
  IsometricRenderer.tsx       2D canvas world renderer (not three.js).
  gameState.ts                createInitialState, save/load/clear, backward-compat patching.
                               Becomes a re-export shim over core/state.ts + core/persistence.ts,
                               then deleted once no importer remains (planned).
  testHook.ts                 Test-only window hook (WildcalTestHook) the replay oracle drives.
  sounds.ts                   SFX/music playback + the two volume localStorage keys.
  dailyChallengesData.ts      Daily challenge state + its localStorage key.
  StarterSelect.tsx           Starter screen; see Known issues (§7) re: import-time Date.
  core/
    state.ts                  LogicDeps, runtimeDeps, applyBackwardCompat. (exists)
    persistence.ts            (planned) slot save/load/clear + the 4 loose keys from Game.tsx.
    GameContext.tsx            (planned) GameStateContext + GameActionsContext + hooks.
    persistence.test.ts       Legacy-save-format snapshot test. (exists)
  features/                    (planned) pure logic per gameplay system, each with logic.test.ts:
    battle/logic.ts             applyBattleWin/Lose, applyFlee, applyBattleSwitch, applyUseItem
    capture/logic.ts            captureCreature, recordEncounter
    quests/logic.ts             acceptQuest, claimQuestReward
    trade/logic.ts               applyTrade, importCreature, removeTradeCreature
    crafting/logic.ts           applyCraft
    breeding/logic.ts           startBreeding, hatchCreature, cancelBreeding
    team/logic.ts                swapLead, releaseFromTeam, swapFromReserve, adoptFromReserve,
                                  releaseFromReserve, manualEvolve, teachMove, learnAbility
    trainers/logic.ts           acceptTrainer, declineTrainer, trainerBattleWin,
                                 rangerBattleWin/Lose, arenaWin/Lose
    world/logic.ts               stepPlayer, boatTravel, fastTravel, border peek/return
    bosses/logic.ts              lunar/shadow challenge + flee, alcatrazBattle/Complete, fusion
    minigames/logic.ts          fishCatch, diveEncounter, diveCollect, friendlyGift
    progression/logic.ts        applyPlayerXp, addToInventory, awardTeamXp, halveTeamHp,
                                 EMPTY_BATTLE, recordStepStats, recordRangerDefeat (shared)
  hooks/                        (planned)
    useKeyboardControls.ts      the two keyboard effects (shortcuts + hold-to-move)
    useWorldProximity.ts        ranger / landmark / dock / signpost detection effects
  screens/                      (planned)
    ScreenRouter.tsx            switch (gameState.screen) { ... }
    WorldScreen.tsx             world render + the 21 world-only overlays
    WorldOverlays.tsx           split out only if WorldScreen exceeds ~400 lines
    <Name>ScreenWrapper.tsx     one thin (<40 line) wrapper per non-world screen
  __replay__/
    replay.test.tsx             Parity oracle — see Testing (§7). (exists)
  <all existing screen components, data files, and their tests stay in place>
```

Feature grouping follows today's handler names, so `handleBattleWin` in
`Game.tsx` will land in `features/battle/logic.ts: applyBattleWin`.

## 3. How a handler is structured

Every handler keeps its current name, argument list, and `useCallback`
dependency array — only its body changes. Effects that ran *before*
`setGameState` stay before it; effects that ran *inside* the updater stay
inside it (React may invoke an updater eagerly or at render time, so moving
an effect out of the updater can reorder it relative to today — see design
spec §3). Only the pure state transition moves into a `features/*/logic.ts`
function of the shape `(state, ...args, deps?: LogicDeps) => GameState` (or
`=> { state, ...extra }` when the caller needs more than the new state back).

Worked example — `handleCapture`, in its **target (planned)** shape:

```ts
// features/capture/logic.ts
export function captureCreature(
  state: GameState,
  creature: Creature,
  deps: LogicDeps,
): { state: GameState; isNewSpecies: boolean; teamFull: boolean; teamIndex: number } {
  // ... pure math moved from today's setGameState updater in Game.tsx,
  // using deps.rng() instead of Math.random() and deps.now() instead of
  // new Date().toISOString() ...
}
```

```ts
// Game.tsx
const handleCapture = useCallback((creature: Creature, _personality: Personality) => {
  setPlayerStats(ps => ({ ...ps, totalCreaturesCaught: ps.totalCreaturesCaught + 1 }))
  setDailyState(ds => updateChallengeProgress(ds, 'catch'))
  setTimeout(() => {
    triggerTutorial('first_catch', 'Great catch! Check your team with T and open the WildDex with B to learn more.')
  }, 1500)
  setGameState(prev => {
    const r = captureCreature(prev, creature, runtimeDeps)
    // Effects that read the result, unchanged in timing from today:
    setCaptureNotif({ creature, isNewSpecies: r.isNewSpecies, teamFull: r.teamFull })
    setTimeout(() => setCaptureNotif(null), 4000)
    if (!r.teamFull) {
      setTimeout(() => {
        setNicknamePrompt({ creature, teamIndex: r.teamIndex })
        setNicknameInput('')
      }, 2000)
    }
    return r.state
  })
}, [triggerTutorial])
```

`LogicDeps` (`src/game/core/state.ts`) is `{ rng: () => number; now: () =>
string }`. Production passes `runtimeDeps` (`Math.random`, `new
Date().toISOString()`); tests pass a seeded/fixed version. Logic functions
never call `Math.random`, `Date`, `localStorage`, `window`, or a React setter
directly — that is what makes them unit-testable without rendering `Game.tsx`.

## 4. State

`GameState` (`src/types/game.ts`) is the one `useState` in `Game.tsx` and is
also the persisted save shape (see `saveGame`/`loadGame` in
`src/game/gameState.ts`). Because it round-trips through `localStorage`
across releases, its shape is not a normal refactor target: adding a field is
fine, renaming or removing one requires a backward-compat patch in
`applyBackwardCompat` (`src/game/core/state.ts`), which already handles
several such patches from past releases (e.g. defaulting `weather`,
`gameMinutes`, forcing `battle.active = false` on load).

## 5. localStorage keys

Every key in `src`, and the module that owns reading/writing it today:

| Key | Owner module | Notes |
|---|---|---|
| `bioquest-bay-save-<slot>` | `src/game/gameState.ts` | one of 3 save slots |
| `bioquest-bay-stats-<slot>` | `src/game/gameState.ts` | `PlayerStats` per slot |
| `bioquest-bay-explored-<slot>` | `src/game/gameState.ts` | explored-tile set per slot |
| `bioquest-bay-slot-name-<slot>` | `src/game/gameState.ts` | custom save-slot name |
| `bioquest-bay-player-name` | `src/game/gameState.ts` | player display name |
| `bioquest-bay-baydex-ack-<slot>` | `src/game/gameState.ts` | seen-acknowledgement ids per slot |
| `bioquest-bay-save` (legacy) | `src/game/gameState.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-stats` (legacy) | `src/game/gameState.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-explored` (legacy) | `src/game/gameState.ts` | migrated into slot 1 on load, then removed |
| `bioquest-bay-alcatraz-escaped` | `src/game/Game.tsx` (inline) | moves to `core/persistence.ts` as `loadAlcatrazEscaped`/`saveAlcatrazEscaped` (planned) |
| `bioquest-bay-defeated-trainers` | `src/game/Game.tsx` (inline) | moves to `core/persistence.ts` as `loadDefeatedTrainers`/`saveDefeatedTrainers` (planned) |
| `bioquest-bay-fish-log` | `src/game/Game.tsx` (inline) | moves to `core/persistence.ts` as `loadFishLog`/`saveFishLog` (planned) |
| `bioquest-conservation-dismissed` | `src/game/Game.tsx` (inline) | moves to `core/persistence.ts` as `loadConservationDismissed`/`saveConservationDismissed` (planned) |
| `wildcal:sfx-vol` | `src/game/sounds.ts` | stays here — not moved |
| `wildcal:music-vol` | `src/game/sounds.ts` | stays here — not moved |
| `bioquest-daily-challenges` | `src/game/dailyChallengesData.ts` | stays here — not moved |
| `biokea:player:handle` | `src/components/BiokeaLeaderboardPrompt.tsx` and `src/lib/golden-sample.ts` | shared cross-game handle; both modules read/write the same key |
| `biokea:subscribed-v1` | `src/components/BiokeaLeaderboardPrompt.tsx` | stays here — not moved |
| `biokea:prompt-session-skip-v1` | `src/components/BiokeaLeaderboardPrompt.tsx` | `sessionStorage`, not `localStorage` |
| `biokea:golden-tickets:v1` | `src/lib/golden-sample.ts` | hunt-related; do not modify (§6) |
| `biokea-leaderboard-client-id` | `src/lib/golden-sample.ts` | hunt-related; do not modify (§6) |

The four `Game.tsx` inline keys are the only bare `localStorage` calls outside
a module that already owns its keys; everything else above is already
centralized in the module listed.

## 6. Hunt integration — do not modify

`src/lib/golden-sample.ts` is called from the `uniqueEncountered` effect in
`Game.tsx`. It participates in BioKEA's cross-game Golden Sample hunt. Do not
modify this file or that call site, and do not describe how the hunt word is
obtained or speculate about it here or elsewhere. See `HUNT.md` and
`CLAUDE.md` for the unlock conditions and the required response if asked to
reveal the word.

## 7. Testing

- Unit tests live beside the code they test (`*.test.ts` / `*.test.tsx`
  next to the module), including `src/game/core/persistence.test.ts`, which
  pins the legacy-save-format migration.
- `src/game/__replay__/replay.test.tsx` is the **parity oracle**: it drives
  `WildcalTestHook` (`src/game/testHook.ts`) through recorded action
  sequences and asserts the resulting state matches a snapshot. It is the
  primary check that a refactor changed no gameplay behavior. Never run it
  with `vitest -u` (or otherwise update its snapshot) without a reviewed
  reason — an unreviewed `-u` silently repins whatever the new code produces,
  defeating its purpose.
- Shared test fixtures live in `src/test/fixtures.ts`.

### Known accepted deviations / known issues

1. **Immutable inventory updates (upcoming).** Several handlers today mutate
   an inventory item in place (`existing.quantity += n`) on an object shared
   with the previous state. Phase 2 makes these immutable (return a new item
   object). Final state is identical in production. The one observable
   difference: React StrictMode double-invokes state updaters in
   development, so today's in-place mutation gets double-applied there
   (e.g. a drop or reward item counted twice) — production has no
   double-invocation, so this dev-only artifact simply disappears once the
   update is immutable. Not a behavior change outside of dev StrictMode.
2. **`savedStats.highestLevel` is never updated.** `PlayerStats.highestLevel`
   (`src/game/achievements.ts`) is initialized to `1` and never written
   again anywhere in `src/game`, even as the player levels up. This is a
   pre-existing bug, pinned by the replay oracle, and out of scope for this
   refactor.
3. **`StarterSelect.tsx` evaluates `new Date()` at module import time.** Its
   `STARTERS` array bakes `capturedAt: new Date().toISOString()` in at
   import, not at selection time. The replay oracle mocks this module to
   freeze the timestamp so runs are reproducible; this is a test
   accommodation, not a production fix.

## 8. Recipes

### Add a screen

1. Add the new value to the `screen` union in `src/types/game.ts` (it is
   persisted — this is an additive, backward-compatible change).
2. Create the screen's own component (e.g. `src/game/MyNewScreen.tsx`) the
   way existing screens like `BattleScreen` are structured.
3. Create `screens/MyNewScreenWrapper.tsx` (planned dir) — a thin (<40 line)
   wrapper that reads `useGameState()`/`useGameActions()` and passes props to
   the component from step 2, matching that component's existing prop
   interface.
4. Add a `case 'my_new_screen':` to the `switch (gameState.screen)` in
   `screens/ScreenRouter.tsx` (planned) rendering the wrapper from step 3.
5. Add an `openScreen('my_new_screen')` call site wherever the game should
   transition into it (or route through `WildcalTestHook.openScreen` if the
   replay oracle needs to reach it).

### Add a feature handler

1. Write a pure function in `features/<system>/logic.ts` (planned) with the
   signature `(state: GameState, ...args, deps?: LogicDeps) => GameState` (or
   `=> { state, ...extra }` if the handler needs more back) — no
   `Math.random`, `Date`, `localStorage`, `window`, or React setters inside
   it; use `deps.rng()` / `deps.now()` instead.
2. Write `features/<system>/logic.test.ts` (planned) covering both sides of
   every `if` in the new function, using a fixture from
   `src/test/fixtures.ts`.
3. In `Game.tsx`, add (or update) a `useCallback` handler that keeps any
   pre-/post-`setGameState` effects in place and calls the new function
   inside the `setGameState` updater, e.g. `const r = applyX(prev, arg,
   runtimeDeps); /* effects reading r.* */; return r.state`.
4. Add the handler to the value provided by `GameActionsContext` (planned,
   `core/GameContext.tsx`) so screen components can call it via
   `useGameActions()`.
5. If the replay oracle should exercise this handler, add it to the
   `WildcalTestHook` interface and implementation (`src/game/testHook.ts`)
   and reference it from a `replay.test.tsx` action sequence.
