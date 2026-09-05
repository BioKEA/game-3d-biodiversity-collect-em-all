# Game.tsx decomposition — design

**Date:** 2026-09-04
**Status:** approved in brainstorming, pending spec review
**Scope:** `src/game/Game.tsx` and its immediate collaborators. Not the renderer, not the data files.

## Why

WildCal is going to be worked on by people and LLMs who did not write it. The
codebase is 45.7k lines of TS/TSX. Three files dominate: `Game.tsx` (3,384 lines),
`IsometricRenderer.tsx` (3,209), `creatures.ts` (2,566). `Game.tsx` is the one that
every feature touches: 48 `useState`, 51 `useCallback`, 19 `useEffect`, 125
`setGameState` calls, and a 1,300-line JSX block switching over 32 screen values.
It is too large to hold in context and its boundaries are not inferable from names.

This pass makes `Game.tsx` legible: small files with one purpose each, pure logic
that can be read and tested without React, and a map (`docs/ARCHITECTURE.md`) that
says where things live.

## Constraints (hard)

1. **Existing saves must load.** The localStorage keys (`bioquest-bay-save-N`,
   `bioquest-bay-stats-N`, `bioquest-bay-explored-N`, `bioquest-bay-slot-name-N`,
   `bioquest-bay-player-name`, `bioquest-bay-baydex-ack-N`, the legacy unslotted
   keys, and the four loose keys listed in §5) and the JSON shape written to
   them do not change. The `GameState` type in `src/types/game.ts` does not change.
2. **Zero gameplay change.** Any observable behavior difference is a bug. Verified
   per §7, not by judgment.
3. **Hunt integration untouched.** `src/lib/golden-sample.ts` is not edited. Its
   single call site (`reportCreatureEncountered` in `Game.tsx`) may move file but
   must be called with the same argument at the same point in the same handler.

## Non-goals

- Splitting `IsometricRenderer.tsx` or `creatures.ts`.
- Code-splitting the 1.48 MB bundle.
- Resolving Bun vs npm and the stale `package-lock.json`.
- Adding `LICENSE` or `docs/screenshot.png`.
- Fine-grained rerender optimization (selectors, memoized subtrees).
- Introducing a state library. React state and context only.

## Approach

Chosen: **pure-logic extraction with React state kept as-is** (approach A of three
considered; `useReducer` and a Zustand store were rejected as higher-churn and
harder to prove behavior-identical).

The seam already exists. Most handlers have the shape
`setGameState(prev => <pure transform>)` with side effects (timers, toasts, stat
counters, daily-challenge progress) interleaved. The refactor separates the pure
transform from the side effects; it does not invent new structure.

## 1. Phases

Each phase lands green and is independently shippable.

### Phase 1 — safety net
- Fix the 18 failing tests. All are stale, not bugs:
  - `bridges.test.ts` searches x 12–32 / y 6–17; bridges now live at x 49–64,
    y 210–229. Update coordinates to the values in `bayAreaMap.ts` `BRIDGES`.
  - `creatures.test.ts` allowlists lack `reptile`, `plant` types; `activeTime`
    assertion assumes every creature sets it (the type marks it optional).
    Align the test with the `CreatureType` union and the optional field.
  - `timeWeather.test.ts` allowlist lacks `thunderstorm`. Align with `WeatherType`.
  - `GameHUD.test.tsx` fixture lacks the `moon` prop the component reads
    (`moon.mysticMultiplier`). Add it.
- Delete `src/game/voxel/` (imported by nothing). Remove `three`,
  `@react-three/fiber`, `@react-three/drei`, `@types/three` from `package.json`.
  Confirm `tsc -b` and `vite build` still pass and bundle size drops.
- Correct README "Tech" section: the world is a 2D Canvas isometric renderer,
  not three.js. State is React `useState`, not "Zustand-style".
- Write `docs/ARCHITECTURE.md` (see §6).
- Write the replay oracle and the save fixture (§7) **before** any extraction.

### Phase 2 — logic extraction
Move handler transforms into `src/game/features/<name>/logic.ts` with tests.
`Game.tsx` keeps state, effects, and thin handlers. Done in feature-sized commits.

### Phase 3 — screen split
Replace the JSX switchboard with `ScreenRouter` + `GameContext`. `Game.tsx`
ends as a shell of roughly 300 lines.

## 2. Target layout

```
src/game/
  Game.tsx                     ~300 lines: state, effects, wiring, providers
  core/
    state.ts                   createInitialState + GameState helpers (from gameState.ts)
    persistence.ts             slot saves + the 4 loose keys from Game.tsx
    GameContext.tsx            GameStateContext + GameActionsContext + hooks
  features/
    battle/logic.ts            applyBattleWin, applyBattleLose, applyFlee, applyBattleSwitch, applyUseItem
    capture/logic.ts           captureCreature, recordEncounter
    quests/logic.ts            acceptQuest, claimQuestReward
    trade/logic.ts             applyTrade, importCreature, removeTradeCreature
    crafting/logic.ts          applyCraft
    breeding/logic.ts          startBreeding, hatchCreature, cancelBreeding
    team/logic.ts              swapLead, releaseFromTeam, swapFromReserve, adoptFromReserve,
                               releaseFromReserve, manualEvolve, teachMove, learnAbility
    trainers/logic.ts          acceptTrainer, declineTrainer, trainerBattleWin,
                               rangerBattleWin/Lose, arenaWin/Lose
    world/logic.ts             stepPlayer, boatTravel, fastTravel, border peek/return
    bosses/logic.ts            lunar/shadow challenge + flee, alcatrazBattle/Complete, fusion
    minigames/logic.ts         fishCatch, diveEncounter, diveCollect, friendlyGift
    <each dir also has logic.test.ts>
  screens/
    ScreenRouter.tsx           switch on gameState.screen
    WorldScreen.tsx            world render + the 21 world-only overlays
    WorldOverlays.tsx          split out if WorldScreen exceeds ~400 lines
    BattleScreenWrapper.tsx    (one thin wrapper per non-world screen, <40 lines)
    ...
  <all existing components, data files, and tests stay where they are>
```

Feature grouping follows the handler names in today's `Game.tsx` so a reader can
grep `handleBattleWin` and land in `features/battle/logic.ts: applyBattleWin`.

`gameState.ts` becomes a re-export shim of `core/state.ts` + `core/persistence.ts`
for one release, then is deleted once no importer remains. Tests that import from
it keep working during the transition.

## 3. Pure-logic contract

Signature: `(state: GameState, ...args, deps?: LogicDeps) => GameState`, or
`=> { state: GameState; ...resultFields }` when the caller needs information
back (e.g. `captureCreature` returns `{ state, isNewSpecies, teamFull, teamIndex }`
so the handler can fire the notification and nickname prompt).

```ts
export interface LogicDeps {
  rng: () => number          // Math.random at runtime; seeded in tests
  now: () => string          // new Date().toISOString() at runtime; fixed in tests
}
```

Rules:
- No `Math.random`, `Date`, timers, `localStorage`, `window`, or React setters
  inside a logic function. Randomness and time enter via `deps`.
- Callers pass `{ rng: Math.random, now: () => new Date().toISOString() }` so
  runtime behavior is identical. A `defaultDeps` constant lives in `core/state.ts`.
- Side effects that today run *inside* a `setGameState` updater (e.g.
  `setCaptureNotif` inside `handleCapture`'s updater) move to *after* the
  `setGameState` call, driven by the result fields. Ordering relative to other
  setters in the handler is preserved.
- Handlers keep their current names, argument lists, and `useCallback`
  dependency arrays. Only their bodies change.
- `movePlayer` is the one handler that is restructured rather than lifted: it
  becomes `stepPlayer` (pure: position, walkability, journal, explored set) plus
  the existing encounter roll (`getRandomEncounter`, `checkHerdEncounter`,
  `rollTrainerEncounter`) called from the handler with `deps.rng`. Biome
  transition, tutorial tips, and timers stay in the handler.

Tests: each `logic.test.ts` covers the branches present in the current code
(team full / not full, new species / repeat, boss / regular, quest complete /
incomplete, etc.) against a fixture from `src/test/fixtures.ts`. Coverage target
is "every `if` in the extracted function has a test on each side," not
exhaustive.

## 4. Screen router and context

`core/GameContext.tsx` exports two contexts and two hooks:

- `GameStateContext` / `useGameState()` — `gameState`, `playerStats`, `dailyState`,
  `map`, `exploredTiles`, `activeSlot`, `playerName`, and the transient UI state
  currently held in `Game.tsx` (`captureNotif`, `battleReward`, `pendingEvolution`,
  `tutorialTip`, boss popups, etc.).
- `GameActionsContext` / `useGameActions()` — every handler. All are already
  `useCallback`-wrapped; the context value is memoized so it never changes
  identity unless a handler does.

Two contexts, not one, so a consumer of actions alone does not rerender on
state change. Consumers of state rerender on every state change, which is
today's behavior. Selector-based optimization is explicitly out of scope.

`screens/ScreenRouter.tsx` is a single `switch (gameState.screen)`. Non-world
screens get a thin wrapper that reads context and passes props to the existing
component (`BattleScreen`, `BayDex`, `TradeCenter`, …). **Existing components'
prop interfaces do not change**, so their tests do not change. The wrapper layer
is accepted cost.

`WorldScreen.tsx` holds the `IsometricRenderer`, `GameHUD`, `Minimap`, and the 21
overlays that today are `gameState.screen === 'world' && ...` conditionals. It
is the one screen file expected to be large; if it exceeds ~400 lines the
overlays move to `WorldOverlays.tsx`.

The 32-value `screen` union in `types/game.ts` is untouched (persisted).

## 5. Persistence

`core/persistence.ts` absorbs `gameState.ts`'s save/load/clear functions and the
four loose keys currently accessed directly from `Game.tsx` (verified by grep;
these are the only bare `localStorage` calls outside a module that already owns
its keys):

| Key | Today | After |
|---|---|---|
| `bioquest-bay-alcatraz-escaped` | inline get/set in Game.tsx | `loadAlcatrazEscaped()` / `saveAlcatrazEscaped()` |
| `bioquest-bay-defeated-trainers` | inline | `loadDefeatedTrainers()` / `saveDefeatedTrainers()` |
| `bioquest-bay-fish-log` | inline | `loadFishLog()` / `saveFishLog()` |
| `bioquest-conservation-dismissed` | inline | `loadConservationDismissed()` / `saveConservationDismissed()` |

Keys already owned by a single module stay where they are and are **not**
moved: `wildcal:sfx-vol` / `wildcal:music-vol` (`sounds.ts`),
`bioquest-daily-challenges` (`dailyChallengesData.ts`), the `biokea:*` handle,
subscription, and session-skip keys (`BiokeaLeaderboardPrompt.tsx`), and the
hunt keys in `golden-sample.ts` (constraint 3). `ARCHITECTURE.md` lists all of
them in one table so the full set is discoverable even though the code is not
centralized.

Every key string is a named constant in one file. Every read keeps its existing
try/catch and default. Every write produces byte-identical JSON. No renames, no
migrations. The save-on-change effects stay in `Game.tsx` and call this module.

## 6. ARCHITECTURE.md

One page. Contents: the phase-3 layout from §2 annotated with one line per
directory; the "how a handler is structured" pattern from §3 with one worked
example (`handleCapture`); the full localStorage key table (§5, including keys owned by other modules); where the hunt
integration lives and that it is not to be modified; and a "how to add a
screen" and "how to add a feature" recipe of five steps each. It is the first
file a newcomer or LLM should read, and `CLAUDE.md` gets a one-line pointer to
it (nothing else in `CLAUDE.md` changes).

## 7. Verification of zero gameplay change

1. **Suite green** after every commit. Phase 1 makes the suite trustworthy.
2. **Replay oracle.** `src/game/__replay__/replay.test.ts` builds a fresh state,
   stubs `Math.random` with a seeded PRNG and `Date` with a fixed clock, drives a
   scripted sequence through the handlers (choose starter → walk N steps →
   capture → battle win → accept quest → craft → breed → trade → evolve → save),
   and snapshots the resulting `GameState` JSON to `__snapshots__`. Written in
   Phase 1 against the *current* `Game.tsx` (driving it via `@testing-library/react`
   and the component's keyboard/handler surface). After Phases 2 and 3 the same
   script must produce a byte-identical snapshot. Any diff is a regression
   until proven otherwise.
3. **Save round-trip.** A realistic mid-game save exported from the browser
   before the refactor is committed under `src/test/fixtures/save-v-prerefactor/`
   (one JSON per key). A test loads it through the new persistence module and
   asserts deep equality with what the old loader returned (captured as a
   snapshot in Phase 1).
4. **Manual smoke** at the end of each phase in the browser: title → starter →
   world movement → one wild encounter → one ranger battle → one minigame →
   save → reload → verify state. Recorded as a GIF for review.

## 8. Risks

- **Side effects inside updaters.** Moving `setCaptureNotif` etc. out of the
  updater changes *when* they fire relative to React's batching. In React 18
  both happen in the same batch, so the rendered result is the same. The replay
  oracle would not catch a timing-only difference; the manual smoke is the
  check.
- **`useCallback` dependency arrays.** If a handler's body now calls a pure
  function that closes over nothing, some deps become unnecessary. They are
  left as-is in this pass (harmless; removing them is a behavior-adjacent
  change).
- **Replay oracle cost.** Driving the current `Game.tsx` through Testing Library
  for a long script may be slow or brittle (timers, `requestAnimationFrame`).
  Fallback: script the handlers directly by exposing them via a test-only ref
  in Phase 1, removed in Phase 3 once context exists.
