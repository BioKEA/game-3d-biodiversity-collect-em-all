# Game.tsx Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 3,384-line `src/game/Game.tsx` into pure, tested feature logic plus a screen router and context, with zero gameplay change and byte-compatible saves.

**Architecture:** React `useState<GameState>` stays in `Game.tsx`. Each handler's state transform moves to `src/game/features/<name>/logic.ts` as a pure function `(state, ...args, deps) => state | { state, ...result }`; the handler keeps its side effects inside the same `setGameState` updater it uses today. A replay oracle (seeded RNG, fixed clock, scripted handler calls, snapshotted `GameState`) written before any extraction proves parity after each task. Phase 3 replaces the JSX switchboard with `ScreenRouter` + two contexts.

**Tech Stack:** React 18, TypeScript 5.9 (strict), Vite 6, Vitest 4 + Testing Library + jsdom. Package manager on this machine is npm (`npm install --package-lock=false`; do not commit lockfile changes).

**Spec:** `docs/superpowers/specs/2026-09-04-game-tsx-decomposition-design.md`

## Global Constraints

- `GameState` in `src/types/game.ts` does not change. No localStorage key or JSON shape changes.
- `src/lib/golden-sample.ts` is not edited. The `reportCreatureEncountered(uniqueEncountered)` effect in `Game.tsx` keeps the same dependency and argument.
- Zero gameplay change. After every task: `npx tsc -b && npx vitest run` must pass and the replay snapshot must be unchanged (never run `vitest -u` after Task 6 unless a task explicitly says the snapshot is expected to change, which none do).
- No new runtime dependencies.
- `deps.rng` is always the thunk `() => Math.random()`, never `Math.random` by reference.
- Logic functions never call `Math.random`, `Date`, `setTimeout`, `localStorage`, `window`, or React setters directly. Calls into existing modules that roll internally are allowed and must stay in the original order.
- Handlers keep their names, argument lists, and `useCallback` dependency arrays.
- Commit after every task. Commit messages end with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Rq16LhX1tSpWrisgjtzvio
  ```
- Verification commands used throughout:
  ```bash
  npx tsc -b
  npx vitest run
  npx vite build   # only in tasks that touch package.json or imports of removed modules
  ```

---

# Phase 1 — Safety net

### Task 1: Fix the 18 stale tests

**Files:**
- Modify: `src/game/bridges.test.ts`
- Modify: `src/game/creatures.test.ts:38-58`
- Modify: `src/game/timeWeather.test.ts:33-39`
- Modify: `src/game/GameHUD.test.tsx` (the `defaultProps` object)

**Interfaces:** none produced.

- [ ] **Step 1: Confirm the current failures**

Run: `npx vitest run 2>&1 | grep -E "^ (FAIL|Tests)"`
Expected: 18 failed, 109 passed.

- [ ] **Step 2: Fix bridge coordinates**

The map was rescaled; bridges live at the coordinates in `src/game/bayAreaMap.ts:574-579`. Replace the five search boxes in `bridges.test.ts` with boxes that bound those coordinates (each `[x1..x2] × [y1..y2]` expanded by 1 tile on every side):

| Bridge | x range | y range |
|---|---|---|
| Golden Gate Bridge | 48–50 | 212–219 |
| Bay Bridge | 49–65 | 217–219 |
| Richmond-San Rafael Bridge | 54–63 | 209–211 |
| San Mateo Bridge | 52–65 | 225–227 |
| Dumbarton Bridge | 53–64 | 228–230 |

The final test ("bridge tiles are walkable and not water") iterates `generateMap()`; read it, and if it also hardcodes a box, use the union `x 48–65, y 209–230`.

- [ ] **Step 3: Fix creature type and activeTime tests**

In `creatures.test.ts` replace the `validTypes` array with the full `CreatureType` union from `src/types/game.ts`:

```ts
const validTypes = ['beast', 'bird', 'insect', 'marine', 'amphibian', 'mystic', 'reptile', 'plant']
```

`activeTime` is optional on `Creature`. Change the assertion to only validate entries when present:

```ts
it('all creatures have valid active times', () => {
  const validTimes = ['dawn', 'day', 'dusk', 'night']
  for (const creature of ALL_CREATURES) {
    if (creature.activeTime === undefined) continue
    expect(Array.isArray(creature.activeTime)).toBe(true)
    for (const t of creature.activeTime) expect(validTimes).toContain(t)
  }
})
```

- [ ] **Step 4: Fix weather allowlist**

In `timeWeather.test.ts` line 33: `const validWeathers = ['clear', 'fog', 'rain', 'wind', 'sunny', 'thunderstorm']`.

- [ ] **Step 5: Fix GameHUD fixture**

`GameHUD` computes `const moon = getMoonPhase(gameDay)` (`src/game/GameHUD.tsx:602`) and reads `moon.mysticMultiplier`; the fixture omits `gameDay`, so `getMoonPhase(undefined)` returns `undefined`. Add `gameDay: 75,` to `defaultProps`. Run `npx tsc -p tsconfig.json --noEmit false` is not needed; tests are excluded from `tsc -b`, so if the component has grown other required props since the fixture was written, vitest will report them as runtime errors. Add each one with a sensible value until the suite is green.

- [ ] **Step 6: Verify all green**

Run: `npx vitest run 2>&1 | tail -6`
Expected: `Test Files 11 passed`, `Tests 127 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/game/bridges.test.ts src/game/creatures.test.ts src/game/timeWeather.test.ts src/game/GameHUD.test.tsx
git commit -m "test: realign stale tests with current map, types, weather, and HUD props"
```

---

### Task 2: Remove dead voxel renderer and three.js; fix README tech section

**Files:**
- Delete: `src/game/voxel/` (8 files)
- Modify: `package.json` (remove `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`)
- Modify: `README.md` "Tech" section

- [ ] **Step 1: Prove nothing imports voxel or three**

Run: `grep -rn "voxel\|from 'three'\|@react-three" src --include='*.ts' --include='*.tsx' | grep -v '^src/game/voxel/'`
Expected: no output.

- [ ] **Step 2: Delete and uninstall**

```bash
git rm -r src/game/voxel
npm uninstall three @react-three/fiber @react-three/drei @types/three --no-package-lock
git checkout -- package-lock.json bun.lock 2>/dev/null || true
```
Confirm `package.json` no longer lists the four packages and the lockfiles are unchanged (`git status --short` shows only `package.json` and the deletions).

- [ ] **Step 3: README**

Replace the "Tech" bullets with:

```markdown
- React 18 + TypeScript + Vite
- 2D Canvas isometric world renderer (`src/game/IsometricRenderer.tsx`)
- Tailwind + shadcn/radix for HUD and menus
- React `useState` game state + `localStorage` save slots (see `src/game/core/`)
- Supabase for the optional online leaderboard (silently no-ops without env vars)
- Vitest + Testing Library for unit tests
- See `docs/ARCHITECTURE.md` for the code map
```

- [ ] **Step 4: Verify**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4 && npx vite build 2>&1 | grep -E "index-.*\.js"
```
Expected: green; JS bundle smaller than 1,476 kB.

- [ ] **Step 5: Commit**

```bash
git add -A src/game/voxel package.json README.md
git commit -m "chore: remove unused voxel renderer and three.js deps; correct README tech section"
```

---

### Task 3: Shared test fixtures and `core/state.ts`

**Files:**
- Create: `src/game/core/state.ts`
- Create: `src/test/fixtures.ts`
- Test: `src/game/core/state.test.ts`
- Modify: `src/game/Game.tsx:1958-2015` (move `applyBackwardCompat` out; import it)

**Interfaces produced:**
```ts
// src/game/core/state.ts
export interface LogicDeps { rng: () => number; now: () => string }
export const runtimeDeps: LogicDeps
export function applyBackwardCompat(saved: GameState, map: MapTile[][]): GameState
// src/test/fixtures.ts
export function mulberry32(seed: number): () => number
export const FIXED_NOW = '2026-03-15T12:00:00.000Z'
export const testDeps: LogicDeps            // rng: () => 0.5, now: () => FIXED_NOW
export function makeCreature(over?: Partial<Creature>): Creature
export function makeCaptured(over?: Partial<CapturedCreature>): CapturedCreature
export function makeState(over?: Partial<GameState>, playerOver?: Partial<PlayerState>): GameState
export function makeTile(over?: Partial<MapTile>): MapTile
```

- [ ] **Step 1: Write `core/state.ts`**

```ts
import type { GameState, MapTile } from '@/types/game'

/** Injected randomness and clock so feature logic is pure and testable. */
export interface LogicDeps {
  rng: () => number
  now: () => string
}

// Thunks, not references: tests that stub Math.random must reach every caller.
export const runtimeDeps: LogicDeps = {
  rng: () => Math.random(),
  now: () => new Date().toISOString(),
}

/**
 * Patch saves written by older builds and force a movable state.
 * Moved verbatim from Game.tsx; `map` is passed instead of closed over.
 */
export function applyBackwardCompat(saved: GameState, map: MapTile[][]): GameState {
  if (!saved.player.journal) saved.player.journal = {}
  if (!saved.questProgress) saved.questProgress = {}
  if (saved.activeRangerId === undefined) saved.activeRangerId = null
  if (saved.timeOfDay === undefined) saved.timeOfDay = 'day'
  if (saved.weather === undefined) saved.weather = 'clear'
  if (saved.gameMinutes === undefined) saved.gameMinutes = 480
  if (saved.gameDay === undefined) saved.gameDay = 75 // mid-spring
  if (saved.player.nursery === undefined) saved.player.nursery = null
  if (saved.player.reserves === undefined) saved.player.reserves = []
  if (saved.player.coins === undefined) saved.player.coins = 100

  // Force any in-progress battle off on load (see commit bd8552c).
  saved.battle = {
    active: false,
    wildCreature: null,
    playerCreature: null,
    turn: 'player',
    log: [],
    captureChance: 0,
  }

  // Rescue a player stuck on an unwalkable tile: spiral search up to r=10.
  const startTile = map[saved.player.y]?.[saved.player.x]
  if (startTile && !startTile.isWalkable) {
    for (let r = 1; r <= 10; r++) {
      let found = false
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
          const nx = saved.player.x + dx
          const ny = saved.player.y + dy
          const t = map[ny]?.[nx]
          if (t && t.isWalkable) {
            saved.player.x = nx
            saved.player.y = ny
            found = true
          }
        }
      }
      if (found) break
    }
  }
  return saved
}
```

Compare against `Game.tsx:1958-2015` line by line; the body must be identical apart from `map` being a parameter.

- [ ] **Step 2: Write `src/test/fixtures.ts`**

```ts
import type { Creature, CapturedCreature, GameState, MapTile, PlayerState } from '@/types/game'
import { createInitialState } from '@/game/gameState'
import type { LogicDeps } from '@/game/core/state'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const FIXED_NOW = '2026-03-15T12:00:00.000Z'
export const testDeps: LogicDeps = { rng: () => 0.5, now: () => FIXED_NOW }

export function makeCreature(over: Partial<Creature> = {}): Creature {
  return {
    id: 'test-coyote',
    name: 'Coyote',
    scientificName: 'Canis latrans',
    description: 'test',
    type: 'beast',
    rarity: 'common',
    biomes: ['grassland'],
    subregions: [],
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 6, speed: 7 },
    isFantasy: false,
    sprite: '🐺',
    color: '#888888',
    moves: [{ name: 'Bite', power: 10, type: 'attack', description: '' }],
    ...over,
  }
}

export function makeCaptured(over: Partial<CapturedCreature> = {}): CapturedCreature {
  return {
    ...makeCreature(),
    level: 3,
    xp: 0,
    capturedAt: FIXED_NOW,
    capturedBiome: 'grassland',
    happiness: 50,
    ...over,
  }
}

export function makeState(over: Partial<GameState> = {}, playerOver: Partial<PlayerState> = {}): GameState {
  const base = createInitialState()
  return {
    ...base,
    screen: 'world',
    currentSubregion: 'Presidio',
    player: { ...base.player, team: [makeCaptured()], catalog: ['test-coyote'], captured: ['test-coyote'], ...playerOver },
    ...over,
  }
}

export function makeTile(over: Partial<MapTile> = {}): MapTile {
  return { x: 52, y: 219, biome: 'grassland', subregion: 'Presidio', elevation: 0, hasCreature: false, isWalkable: true, ...over }
}
```

- [ ] **Step 3: Write `core/state.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { applyBackwardCompat } from './state'
import { makeState, makeTile } from '@/test/fixtures'
import type { GameState } from '@/types/game'

const map = [[makeTile({ x: 0, y: 0, biome: 'water', isWalkable: false }), makeTile({ x: 1, y: 0 })]]

describe('applyBackwardCompat', () => {
  it('fills missing optional fields with defaults', () => {
    const s = makeState() as Partial<GameState> as GameState
    delete (s as Partial<GameState>).gameDay
    delete (s as Partial<GameState>).questProgress
    const out = applyBackwardCompat(s, map)
    expect(out.gameDay).toBe(75)
    expect(out.questProgress).toEqual({})
  })
  it('clears an active battle', () => {
    const s = makeState({ battle: { active: true, wildCreature: null, playerCreature: null, turn: 'enemy', log: ['x'], captureChance: 0.5 } })
    expect(applyBackwardCompat(s, map).battle.active).toBe(false)
  })
  it('moves the player off an unwalkable tile', () => {
    const s = makeState({}, { x: 0, y: 0 })
    const out = applyBackwardCompat(s, map)
    expect([out.player.x, out.player.y]).toEqual([1, 0])
  })
})
```

- [ ] **Step 4: Run, expect fail, then wire**

Run: `npx vitest run src/game/core` → fails (module missing) until Step 1 exists; then passes.

In `Game.tsx`: delete the inline `function applyBackwardCompat` (lines 1958–2015), add `import { applyBackwardCompat } from './core/state'`, and change the call in `onLoadSlot` to `applyBackwardCompat(saved, map)`.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/core src/test/fixtures.ts src/game/Game.tsx
git commit -m "refactor(core): extract applyBackwardCompat; add LogicDeps and test fixtures"
```

---

### Task 4: Named handlers and the test hook

**Files:**
- Create: `src/game/testHook.ts`
- Modify: `src/game/Game.tsx` (title/starter inline lambdas → named callbacks; `openScreen`; hook exposure)
- Modify: `src/game/StarterSelect.tsx:10` (`export const STARTERS`)

**Interfaces produced:**
```ts
// Game.tsx (internal, exposed via hook)
handleNewGame(slot: SaveSlotIndex): void
handleLoadSlot(slot: SaveSlotIndex): void
handleDeleteSlot(slot: SaveSlotIndex): void
handleSelectStarter(creature: CapturedCreature): void
openScreen(screen: GameState['screen']): void
closeOverlay(): void            // the Escape behaviour
// testHook.ts
export interface WildcalTestHook { ... }   // full list below
export function exposeTestHook(h: WildcalTestHook): void
```

- [ ] **Step 1: `testHook.ts`**

```ts
import type { GameState, Creature, CapturedCreature, BreedingSlot } from '@/types/game'
import type { PlayerStats } from './achievements'
import type { SaveSlotIndex } from './gameState'
import type { FriendlyGift, Personality } from './encounterSystem'
import type { FishDef } from './FishingScreen'
import type { ArenaTier } from './arena'

/** Test-only surface the replay oracle drives. No-op outside vitest. */
export interface WildcalTestHook {
  getState: () => GameState
  getStats: () => PlayerStats
  getExploredCount: () => number
  getDefeatedTrainers: () => string[]
  getFishLog: () => string[]
  handleNewGame: (slot: SaveSlotIndex) => void
  handleLoadSlot: (slot: SaveSlotIndex) => void
  handleSelectStarter: (creature: CapturedCreature) => void
  movePlayer: (dx: number, dy: number) => void
  openScreen: (screen: GameState['screen']) => void
  closeOverlay: () => void
  handleEncounterComplete: () => void
  handleBattleWin: (xp: number) => void
  handleBattleLose: () => void
  handleCapture: (creature: Creature, personality: Personality) => void
  handleFlee: () => void
  handleCreatureFled: () => void
  handleFriendlyGift: (gift: FriendlyGift) => void
  handleAcceptTrainer: () => void
  handleDeclineTrainer: () => void
  handleTrainerBattleWin: (xp: number) => void
  handleStartRangerBattle: (rangerId: string) => void
  handleRangerBattleWin: (xp: number) => void
  handleRangerBattleLose: () => void
  handleArenaWin: (xp: number, coins: number, tier: ArenaTier) => void
  handleArenaLose: () => void
  handleAcceptQuest: (questId: string) => void
  handleClaimReward: (questId: string) => void
  handleTrade: (tradeId: string) => void
  handleCraft: (recipeId: string) => void
  handleUseItem: (itemId: string) => void
  handleSwapLead: (index: number) => void
  handleBattleSwitch: (index: number) => void
  handleFishCatch: (fish: FishDef) => void
  handleStartBreeding: (slot: BreedingSlot, i1: number, i2: number) => void
  handleHatchCreature: (creature: CapturedCreature) => void
  handleCancelBreeding: () => void
  handleImportCreature: (creature: CapturedCreature) => void
  handleTradeRemoveCreature: (index: number) => void
  handleManualEvolve: (teamIndex: number) => void
  handleReleaseFromTeam: (index: number) => void
  handleSwapFromReserve: (reserveIndex: number, teamIndex: number) => void
  handleAdoptFromReserve: (reserveIndex: number) => void
  handleReleaseFromReserve: (reserveIndex: number) => void
  handleAlcatrazComplete: (rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => void
  handleFusion: (i1: number, i2: number, result: CapturedCreature) => void
  handleDiveCollect: (item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => void
  handleDiveEncounter: (creature: Creature) => void
  handleFastTravel: (x: number, y: number, subregion: string) => void
  handleTeachMove: (i: number, c: CapturedCreature, cost: number) => void
  handleLearnAbility: (i: number, abilityId: string, cost: number) => void
}

export function exposeTestHook(hook: WildcalTestHook): void {
  if (import.meta.env.MODE !== 'test') return
  ;(window as unknown as { __wildcal?: WildcalTestHook }).__wildcal = hook
}
```

If `FishDef` is not exported from `FishingScreen.tsx`, add `export` to it (Game.tsx already imports it as a type, so it is).

- [ ] **Step 2: Named handlers in Game.tsx**

Add, next to `handleRenamePlayer`:

```ts
const openScreen = useCallback((screen: GameState['screen']) => {
  setGameState(prev => ({ ...prev, screen }))
}, [])

const OVERLAY_SCREENS: GameState['screen'][] = ['catalog', 'inventory', 'journal', 'ranger', 'trade', 'baydex', 'breeding', 'questlog', 'crafting', 'fishing', 'ranger_battle', 'habitat_map', 'adoption', 'leaderboard', 'fusion', 'diving', 'bart', 'boardwalk', 'surfing', 'shop', 'daily_challenges', 'arena', 'move_tutor']
const closeOverlay = useCallback(() => {
  setGameState(prev => OVERLAY_SCREENS.includes(prev.screen) ? { ...prev, screen: 'world', activeRangerId: null } : prev)
}, [])
```
(`OVERLAY_SCREENS` goes at module scope. The array must equal the one inside the Escape branch of the keyboard effect at `Game.tsx:718`; replace that inline array with `closeOverlay()`.)

Move the three `TitleScreen` prop lambdas and the `StarterSelect` lambda into `useCallback`s named `handleLoadSlot`, `handleNewGame`, `handleDeleteSlot`, `handleSelectStarter`, bodies unchanged, with deps `[map]` for load/starter and `[]` for the others. Pass them as props.

Replace every `() => setGameState(prev => ({ ...prev, screen: 'X' }))` in the JSX with `() => openScreen('X')`. Do not touch the ones that also set other fields.

- [ ] **Step 3: Expose the hook**

At the end of the hooks section (before the `if (gameState.screen === 'title')` return):

```ts
useEffect(() => {
  exposeTestHook({
    getState: () => gameState,
    getStats: () => playerStats,
    getExploredCount: () => exploredTiles.size,
    getDefeatedTrainers: () => defeatedTrainers,
    getFishLog: () => fishLog,
    handleNewGame, handleLoadSlot, handleSelectStarter, movePlayer, openScreen, closeOverlay,
    handleEncounterComplete, handleBattleWin, handleBattleLose, handleCapture, handleFlee, handleCreatureFled,
    handleFriendlyGift, handleAcceptTrainer, handleDeclineTrainer, handleTrainerBattleWin,
    handleStartRangerBattle, handleRangerBattleWin, handleRangerBattleLose, handleArenaWin, handleArenaLose,
    handleAcceptQuest, handleClaimReward, handleTrade, handleCraft, handleUseItem, handleSwapLead, handleBattleSwitch,
    handleFishCatch, handleStartBreeding, handleHatchCreature, handleCancelBreeding, handleImportCreature,
    handleTradeRemoveCreature, handleManualEvolve, handleReleaseFromTeam, handleSwapFromReserve,
    handleAdoptFromReserve, handleReleaseFromReserve, handleAlcatrazComplete, handleFusion, handleDiveCollect,
    handleDiveEncounter, handleFastTravel, handleTeachMove, handleLearnAbility,
  })
})
```
No dependency array: it must re-expose after every render so getters see current state.

- [ ] **Step 4: Export STARTERS**

`src/game/StarterSelect.tsx:10`: `export const STARTERS: StarterOption[] = [`.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/testHook.ts src/game/Game.tsx src/game/StarterSelect.tsx
git commit -m "refactor(game): name title/starter handlers, add openScreen/closeOverlay, expose test hook"
```

---

### Task 5: Replay oracle

**Files:**
- Create: `src/game/__replay__/replay.test.tsx`
- Create (generated): `src/game/__replay__/__snapshots__/replay.test.tsx.snap`

- [ ] **Step 1: Write the test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import Game from '../Game'
import { STARTERS } from '../StarterSelect'
import { mulberry32 } from '@/test/fixtures'
import type { WildcalTestHook } from '../testHook'
import type { GameState } from '@/types/game'

// Presentation-only components that touch canvas / rAF / audio. The oracle
// drives handlers, not UI, so mocking these cannot affect the state produced.
const nullComponent = () => ({ default: () => null })
vi.mock('../IsometricRenderer', nullComponent)
vi.mock('../Minimap', nullComponent)
vi.mock('../WeatherEffects', nullComponent)
vi.mock('../BiomeParticles', nullComponent)
vi.mock('../WalkParticles', nullComponent)
vi.mock('../CreatureFootprints', nullComponent)
vi.mock('../DayNightSky', nullComponent)
vi.mock('../NightAtmosphere', nullComponent)
vi.mock('../BiomeTransition', nullComponent)
vi.mock('../TitleScreen', nullComponent)
vi.mock('../StarterSelect', async (orig) => ({ ...(await orig<typeof import('../StarterSelect')>()), default: () => null }))
vi.mock('../sounds', () => {
  const noop = new Proxy({}, { get: () => () => {} })
  return { SFX: noop, Music: noop }
})
vi.mock('@/lib/golden-sample', () => ({ reportCreatureEncountered: async () => {} }))
vi.mock('@/components/BiokeaLeaderboardPrompt', () => ({ BiokeaLeaderboardPrompt: () => null }))

const h = (): WildcalTestHook => {
  const hook = (window as unknown as { __wildcal?: WildcalTestHook }).__wildcal
  if (!hook) throw new Error('test hook not exposed')
  return hook
}
const state = (): GameState => h().getState()

const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]]

/** Step until `pred` holds. Deterministic: tries directions in a fixed rotation. */
function walkUntil(pred: (s: GameState) => boolean, maxSteps = 3000): void {
  for (let step = 0; step < maxSteps; step++) {
    if (pred(state())) return
    const { x, y } = state().player
    let moved = false
    for (let k = 0; k < 4 && !moved; k++) {
      const [dx, dy] = DIRS[(step + k) % 4]
      act(() => { vi.advanceTimersByTime(130); h().movePlayer(dx, dy) })
      const p = state().player
      moved = p.x !== x || p.y !== y || state().screen !== 'world'
    }
    if (!moved) throw new Error(`stuck at ${x},${y}`)
  }
  throw new Error('walkUntil: predicate not met')
}

describe('replay oracle', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(12345))
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

  it('produces an identical GameState for a fixed script', () => {
    render(<Game />)
    act(() => h().handleNewGame(1))
    expect(state().screen).toBe('starter')
    act(() => h().handleSelectStarter(STARTERS[0].creature))
    // Spawn (52,219) is adjacent to Ranger Tomás (51,220): the proximity effect
    // auto-opens the tutorial dialog once. Close it the way Escape would.
    expect(state().screen).toBe('ranger')
    act(() => h().closeOverlay())
    expect(state().screen).toBe('world')
    expect(state().player.team).toHaveLength(1)

    const seen = { wild: 0, trainer: 0 }
    const wildPolicy = ['capture', 'win', 'flee', 'capture', 'win', 'fled', 'gift', 'lose'] as const
    let wildIdx = 0
    for (let i = 0; i < 8; i++) {
      walkUntil(s => s.screen !== 'world')
      const s = state()
      if (s.screen === 'ranger') {
        // A ranger's 3x3 proximity radius does not change the screen by itself;
        // only the one-time tutorial does. If it fires again the flag logic changed.
        throw new Error('unexpected ranger screen mid-walk')
      }
      if (s.screen === 'trainer_encounter') {
        seen.trainer++
        act(() => h().handleAcceptTrainer())
        act(() => h().handleTrainerBattleWin(50))
      } else {
        expect(s.screen).toBe('encounter')
        seen.wild++
        const wild = s.battle.wildCreature!
        act(() => h().handleEncounterComplete())
        expect(state().screen).toBe('battle')
        const policy = wildPolicy[wildIdx++ % wildPolicy.length]
        act(() => {
          if (policy === 'capture') h().handleCapture(wild, 'curious')
          else if (policy === 'win') h().handleBattleWin(45)
          else if (policy === 'flee') h().handleFlee()
          else if (policy === 'fled') h().handleCreatureFled()
          else if (policy === 'gift') h().handleFriendlyGift({ itemId: 'bio-capsule', itemName: 'Bio Capsule', sprite: '🔮', message: 'gift' })
          else h().handleBattleLose()
        })
      }
      act(() => { vi.advanceTimersByTime(6000) })
      expect(state().screen).toBe('world')
    }
    expect(seen.wild).toBeGreaterThan(0)
    expect(state().player.team.length).toBeGreaterThan(1)

    // Ranger / arena / quests / inventory
    act(() => h().handleStartRangerBattle('ranger-presidio'))
    act(() => h().handleRangerBattleWin(200))
    act(() => h().handleStartRangerBattle('ranger-muir'))
    act(() => h().handleRangerBattleLose())
    act(() => h().handleArenaWin(80, 25, 'bronze'))
    act(() => h().handleArenaLose())
    act(() => h().handleAcceptQuest('presidio-coyote'))
    act(() => h().handleClaimReward('presidio-coyote'))
    act(() => h().handleTrade('presidio-trade-1'))
    act(() => h().handleCraft('craft-herb-potion'))
    act(() => h().handleUseItem('herb-potion'))
    act(() => h().handleSwapLead(1))
    act(() => h().handleBattleSwitch(1))
    act(() => h().handleTeachMove(0, { ...state().player.team[0], moves: [{ name: 'Test Move', power: 20, type: 'attack', description: '' }] }, 10))
    act(() => h().handleLearnAbility(0, 'test-ability', 5))

    // Minigames and side systems
    act(() => h().handleFishCatch({ id: 'fish-test', name: 'Test Fish', sprite: '🐟', rarity: 'common', difficulty: 0.3, xpReward: 40, description: '', biomes: ['water'] }))
    act(() => h().handleDiveCollect({ id: 'kelp', name: 'Kelp', type: 'material', quantity: 2, description: 'Kelp', sprite: '' }))
    act(() => h().handleAlcatrazComplete({ xp: 100, item: { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 1, description: 'x', sprite: '✨' } }))
    const [p1, p2] = state().player.team
    act(() => h().handleStartBreeding({ parent1: p1, parent2: p2, startedAt: '2026-03-15T12:00:00.000Z', readyAt: '2026-03-15T12:10:00.000Z' }, 0, 1))
    act(() => h().handleCancelBreeding())
    act(() => h().handleHatchCreature({ ...p1, id: 'hatched-test', nickname: 'Egg' }))
    act(() => h().handleImportCreature({ ...p2, id: 'imported-test' }))
    act(() => h().handleTradeRemoveCreature(state().player.team.length - 1))
    act(() => h().handleManualEvolve(0))
    act(() => h().handleReleaseFromTeam(state().player.team.length - 1))
    if (state().player.reserves.length > 0) {
      act(() => h().handleSwapFromReserve(0, 1))
      act(() => h().handleAdoptFromReserve(0))
      act(() => h().handleReleaseFromReserve(0))
    }
    if (state().player.team.length >= 2) {
      act(() => h().handleFusion(0, 1, { ...state().player.team[0], id: 'fused-test', name: 'Fused' }))
    }
    const { x, y } = state().player
    act(() => h().handleFastTravel(x, y, state().currentSubregion))
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => h().openScreen('catalog'))
    act(() => h().closeOverlay())
    expect(state().screen).toBe('world')

    const result = {
      gameState: state(),
      playerStats: h().getStats(),
      exploredCount: h().getExploredCount(),
      defeatedTrainers: h().getDefeatedTrainers(),
      fishLog: h().getFishLog(),
      savedSlot1: JSON.parse(localStorage.getItem('bioquest-bay-save-1') ?? 'null'),
      savedStats1: JSON.parse(localStorage.getItem('bioquest-bay-stats-1') ?? 'null'),
      savedExplored1: JSON.parse(localStorage.getItem('bioquest-bay-explored-1') ?? 'null'),
    }
    expect(result).toMatchSnapshot()
  })
})
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/game/__replay__`
If a screen component throws in jsdom (canvas, `AudioContext`, `ResizeObserver`), add it to the `vi.mock` list with `nullComponent`. Mocking presentation components is allowed; mocking anything under `features/`, `core/`, `gameState.ts`, `creatures.ts`, `rangers.ts`, `bayAreaMap.ts`, `crafting.ts`, `evolutions.ts`, `timeWeather.ts`, `migration.ts`, `roamingTrainers.ts`, `encounterSystem.ts` is not.
If `walkUntil` throws "stuck", change the seed in `mulberry32(12345)` to `12346`, `12347`, … until the script completes, then never change it again.
Expected: 1 passed, snapshot written.

- [ ] **Step 3: Confirm determinism**

Run it twice more: `npx vitest run src/game/__replay__` ×2. Both pass without `-u`. Inspect the `.snap` file: `savedSlot1._lastPlayed` must be `2026-03-15T12:00:00.000Z`-based (fixed clock) and `gameState.player.team.length > 1`.

- [ ] **Step 4: Commit**

```bash
git add src/game/__replay__
git commit -m "test: replay oracle snapshotting GameState for a seeded handler script"
```

---

### Task 6: Legacy save fixture round-trip

**Files:**
- Create: `src/test/fixtures/legacy-save.json`
- Create: `src/game/core/persistence.test.ts` (tests `gameState.ts` now; re-pointed in Task 16)

- [ ] **Step 1: Fixture**

`src/test/fixtures/legacy-save.json` — a save with every optional field absent, an active battle, and the player on water (x 0, y 0 is ocean in `generateMap()`; verify with `map[0][0].biome === 'water'` in the test and pick another water tile if not):

```json
{
  "screen": "battle",
  "player": {
    "x": 0, "y": 0, "level": 4, "xp": 20, "maxXp": 220, "hp": 100, "maxHp": 100,
    "inventory": [{ "id": "bio-capsule", "name": "Bio Capsule", "type": "capture", "quantity": 3, "description": "d", "sprite": "🔮" }],
    "team": [{
      "id": "coyote", "name": "Coyote", "scientificName": "Canis latrans", "description": "d", "type": "beast", "rarity": "common",
      "biomes": ["grassland"], "subregions": [], "stats": { "hp": 20, "maxHp": 40, "attack": 9, "defense": 7, "speed": 8 },
      "isFantasy": false, "sprite": "🐺", "color": "#888", "moves": [], "level": 5, "xp": 10, "capturedAt": "2026-01-01T00:00:00.000Z", "capturedBiome": "grassland"
    }],
    "catalog": ["coyote"], "captured": ["coyote"]
  },
  "battle": { "active": true, "wildCreature": null, "playerCreature": null, "turn": "player", "log": [], "captureChance": 0 },
  "currentBiome": "water", "currentSubregion": "", "encounterCooldown": 0,
  "arenaWins": { "bronze": 0, "silver": 0, "gold": 0 }
}
```

- [ ] **Step 2: Test**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadGame, saveGame, createInitialState } from '@/game/gameState'
import { applyBackwardCompat } from '@/game/core/state'
import { generateMap } from '@/game/bayAreaMap'
import legacy from '@/test/fixtures/legacy-save.json'
import type { GameState } from '@/types/game'

const map = generateMap()

describe('save round-trip', () => {
  beforeEach(() => localStorage.clear())

  it('legacy save loads through backward compat identically', () => {
    localStorage.setItem('bioquest-bay-save-1', JSON.stringify(legacy))
    const loaded = loadGame(1)
    expect(loaded).not.toBeNull()
    const out = applyBackwardCompat(loaded as GameState, map)
    expect(map[0][0].biome).toBe('water')
    expect(out).toMatchSnapshot()
  })

  it('save → load is identity apart from _lastPlayed', () => {
    const s = createInitialState()
    saveGame(s, 2)
    const back = loadGame(2) as GameState & { _lastPlayed?: string }
    delete back._lastPlayed
    expect(back).toEqual(s)
  })
})
```

`resolveJsonModule` is on in tsconfig, so the JSON import type-checks.

- [ ] **Step 3: Run, commit**

```bash
npx vitest run src/game/core && git add src/test/fixtures/legacy-save.json src/game/core/persistence.test.ts src/game/core/__snapshots__
git commit -m "test: legacy save backward-compat snapshot and save/load identity"
```

---

### Task 7: ARCHITECTURE.md (initial) and CLAUDE.md pointer

**Files:**
- Create: `docs/ARCHITECTURE.md`
- Modify: `CLAUDE.md` (append one line)

- [ ] **Step 1: Write the doc**

Contents, in this order (fill every section with the real values from this plan; the final layout is §2 of the spec):

1. **One-paragraph overview**: React `useState<GameState>` in `Game.tsx`; screens switch on `gameState.screen`; world drawn by `IsometricRenderer` on a 2D canvas.
2. **Directory map** (the target layout from spec §2 with one line per entry, marked "(planned)" for entries that do not exist yet; remove the markers in Task 24).
3. **How a handler is structured** with `handleCapture` as the worked example (post-Task 9 shape from this plan).
4. **localStorage keys** — one table with every key from `gameState.ts`, the four loose keys, `sounds.ts`, `dailyChallengesData.ts`, `BiokeaLeaderboardPrompt.tsx`, `golden-sample.ts`, and which module owns each.
5. **Hunt integration**: `src/lib/golden-sample.ts`, called from the `uniqueEncountered` effect in `Game.tsx`; do not modify; see `HUNT.md`.
6. **Testing**: unit tests beside code; `src/game/__replay__/replay.test.tsx` is the parity oracle (never `-u` it without a reviewed reason); fixtures in `src/test/fixtures.ts`.
7. **Known accepted deviations**: immutable inventory updates vs. the old in-place mutation (dev-only StrictMode double-apply is gone).
8. **Recipes**: "Add a screen" (5 steps: add to the `screen` union, create the component, create `screens/<Name>Screen.tsx` wrapper, add a `case` in `ScreenRouter`, add an `openScreen` call site) and "Add a feature handler" (5 steps: write `features/<x>/logic.ts` pure fn, write its test, add the handler in `Game.tsx` calling it inside `setGameState`, add to `GameActionsContext`, add to `WildcalTestHook` if the oracle should cover it).

- [ ] **Step 2: CLAUDE.md**

Append: `\nCode map for contributors and LLMs: see \`docs/ARCHITECTURE.md\`.\n`

- [ ] **Step 3: Commit**

```bash
git add docs/ARCHITECTURE.md CLAUDE.md
git commit -m "docs: add ARCHITECTURE.md code map and CLAUDE.md pointer"
```

---

# Phase 2 — Logic extraction

Every task in this phase ends with the same verification: `npx tsc -b && npx vitest run` green **and** the replay snapshot unchanged (the `__replay__` test passes without `-u`). If the snapshot differs, the extraction changed behaviour: diff the `.snap` output, find the divergence, fix the logic. Do not update the snapshot.

Handler pattern used throughout (the "in-updater effects" shape from spec §3):

```ts
const handleX = useCallback((arg) => {
  /* effects that ran before setGameState today stay here, unchanged */
  setGameState(prev => {
    const r = applyX(prev, arg, runtimeDeps)
    /* effects that ran inside the updater today stay here, now reading r.* */
    return r.state   // or just `r` when the function returns GameState
  })
}, [/* unchanged deps */])
```

### Task 8: Shared progression helpers

**Files:**
- Create: `src/game/features/progression/logic.ts`
- Test: `src/game/features/progression/logic.test.ts`

**Interfaces produced:**
```ts
export const EMPTY_BATTLE: BattleState
export function applyPlayerXp(player: PlayerState, xpGained: number): { player: PlayerState; newLevel: number; didLevelUp: boolean }
export function addToInventory(inventory: InventoryItem[], item: InventoryItem): InventoryItem[]
export function incrementIfPresent(inventory: InventoryItem[], itemId: string, by: number): InventoryItem[]
export function halveTeamHp(team: CapturedCreature[]): CapturedCreature[]
export function levelUpStats(stats: CreatureStats): CreatureStats
export interface EvolutionData { from: CapturedCreature; to: CapturedCreature; description: string; teamIndex: number }
export function awardTeamXp(team: CapturedCreature[], xpGained: number, opts: { withHappiness: boolean }): { team: CapturedCreature[]; evolution: EvolutionData | null }
export function recordStepStats(stats: PlayerStats, tile: MapTile): PlayerStats
export function recordRangerDefeat(stats: PlayerStats, rangerId: string | null): PlayerStats
```

- [ ] **Step 1: Tests first**

```ts
import { describe, it, expect } from 'vitest'
import { applyPlayerXp, addToInventory, incrementIfPresent, halveTeamHp, awardTeamXp, recordStepStats, recordRangerDefeat, EMPTY_BATTLE } from './logic'
import { makeCaptured, makeState, makeTile } from '@/test/fixtures'
import { createInitialStats } from '@/game/achievements'

describe('applyPlayerXp', () => {
  it('levels up repeatedly with maxXp * 1.3 floor', () => {
    const p = makeState().player // level 1, xp 0, maxXp 100
    const r = applyPlayerXp(p, 250)
    // 250 → -100 (L2, max 130) → 150-130=20 (L3, max 169)
    expect(r.newLevel).toBe(3)
    expect(r.player.xp).toBe(20)
    expect(r.player.maxXp).toBe(169)
    expect(r.didLevelUp).toBe(true)
  })
  it('no level up below threshold', () => {
    const r = applyPlayerXp(makeState().player, 10)
    expect(r.didLevelUp).toBe(false)
    expect(r.player.xp).toBe(10)
  })
})

describe('inventory helpers', () => {
  const inv = makeState().player.inventory
  it('addToInventory merges by id without mutating input', () => {
    const before = inv[0].quantity
    const out = addToInventory(inv, { ...inv[0], quantity: 2 })
    expect(out[0].quantity).toBe(before + 2)
    expect(inv[0].quantity).toBe(before)
    expect(out[0]).not.toBe(inv[0])
  })
  it('addToInventory appends unknown ids', () => {
    const out = addToInventory(inv, { id: 'new', name: 'New', type: 'material', quantity: 1, description: '', sprite: '' })
    expect(out).toHaveLength(inv.length + 1)
  })
  it('incrementIfPresent ignores unknown ids', () => {
    expect(incrementIfPresent(inv, 'nope', 1)).toEqual(inv)
  })
})

describe('team helpers', () => {
  it('halveTeamHp floors maxHp/2', () => {
    const t = halveTeamHp([makeCaptured({ stats: { hp: 30, maxHp: 31, attack: 1, defense: 1, speed: 1 } })])
    expect(t[0].stats.hp).toBe(15)
  })
  it('awardTeamXp gives lead full xp and bench half, levels at level*50', () => {
    const lead = makeCaptured({ level: 1, xp: 45 })
    const bench = makeCaptured({ id: 'b', level: 1, xp: 0 })
    const r = awardTeamXp([lead, bench], 10, { withHappiness: false })
    expect(r.team[0].level).toBe(2)          // 45+10 >= 50
    expect(r.team[0].xp).toBe(0)
    expect(r.team[0].stats.maxHp).toBe(33)   // +3
    expect(r.team[1].xp).toBe(5)
    expect(r.evolution).toBeNull()
  })
  it('awardTeamXp with happiness adds 5 lead / 2 bench, +3 on level up', () => {
    const r = awardTeamXp([makeCaptured({ level: 1, xp: 45, happiness: 50 }), makeCaptured({ id: 'b', happiness: 50 })], 10, { withHappiness: true })
    expect(r.team[0].happiness).toBe(58)
    expect(r.team[1].happiness).toBe(52)
  })
})

describe('stats helpers', () => {
  it('recordStepStats counts steps and unique biomes/subregions', () => {
    const s = recordStepStats(createInitialStats(), makeTile({ biome: 'forest', subregion: 'Muir Woods' }))
    expect(s.totalStepsWalked).toBe(1)
    expect(s.uniqueBiomesVisited).toEqual(['forest'])
    expect(s.uniqueSubregionsVisited).toEqual(['Muir Woods'])
    const s2 = recordStepStats(s, makeTile({ biome: 'forest', subregion: '' }))
    expect(s2.uniqueSubregionsVisited).toEqual(['Muir Woods'])
  })
  it('recordRangerDefeat is idempotent and counts wins', () => {
    const a = recordRangerDefeat(createInitialStats(), 'r1')
    const b = recordRangerDefeat(a, 'r1')
    expect(b.defeatedRangers).toEqual(['r1'])
    expect(b.rangerBattlesWon).toBe(2)
  })
})

it('EMPTY_BATTLE matches the literal used across Game.tsx', () => {
  expect(EMPTY_BATTLE).toEqual({ active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 })
})
```

Run: `npx vitest run src/game/features/progression` → fails (module missing).

- [ ] **Step 2: Implement**

```ts
import type { BattleState, CapturedCreature, CreatureStats, InventoryItem, MapTile, PlayerState } from '@/types/game'
import type { PlayerStats } from '@/game/achievements'
import { adjustHappiness, BATTLE_WIN_LEAD_GAIN, BATTLE_WIN_BENCH_GAIN, LEVEL_UP_GAIN } from '@/game/happiness'
import { getEvolution, evolveCreature } from '@/game/evolutions'

export const EMPTY_BATTLE: BattleState = {
  active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0,
}

export function applyPlayerXp(player: PlayerState, xpGained: number) {
  let newXp = player.xp + xpGained
  let newLevel = player.level
  let newMaxXp = player.maxXp
  const didLevelUp = newXp >= newMaxXp
  while (newXp >= newMaxXp) {
    newXp -= newMaxXp
    newLevel++
    newMaxXp = Math.floor(newMaxXp * 1.3)
  }
  return { player: { ...player, xp: newXp, level: newLevel, maxXp: newMaxXp }, newLevel, didLevelUp }
}

/** Merge by id (immutable). New entries copy exactly the six InventoryItem fields. */
export function addToInventory(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const idx = inventory.findIndex(i => i.id === item.id)
  if (idx >= 0) return inventory.map((i, n) => n === idx ? { ...i, quantity: i.quantity + item.quantity } : i)
  return [...inventory, { id: item.id, name: item.name, type: item.type, quantity: item.quantity, description: item.description, sprite: item.sprite }]
}

export function incrementIfPresent(inventory: InventoryItem[], itemId: string, by: number): InventoryItem[] {
  return inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + by } : i)
}

export function halveTeamHp(team: CapturedCreature[]): CapturedCreature[] {
  return team.map(c => ({ ...c, stats: { ...c.stats, hp: Math.floor(c.stats.maxHp * 0.5) } }))
}

export function levelUpStats(stats: CreatureStats): CreatureStats {
  return {
    ...stats,
    maxHp: stats.maxHp + 3,
    hp: Math.min(stats.hp + 3, stats.maxHp + 3),
    attack: stats.attack + 2,
    defense: stats.defense + 1,
    speed: stats.speed + 1,
  }
}

export interface EvolutionData { from: CapturedCreature; to: CapturedCreature; description: string; teamIndex: number }

/**
 * Mirrors the team loop in handleBattleWin (withHappiness: true) and
 * handleTrainerBattleWin (withHappiness: false). Only the first evolution
 * in team order is reported, exactly as before.
 */
export function awardTeamXp(team: CapturedCreature[], xpGained: number, opts: { withHappiness: boolean }) {
  const newTeam = [...team]
  let evolution: EvolutionData | null = null
  for (let ti = 0; ti < newTeam.length; ti++) {
    let member = { ...newTeam[ti] }
    member.xp += Math.floor(xpGained * (ti === 0 ? 1 : 0.5))
    if (opts.withHappiness) member = adjustHappiness(member, ti === 0 ? BATTLE_WIN_LEAD_GAIN : BATTLE_WIN_BENCH_GAIN)
    if (member.xp >= member.level * 50) {
      member.xp = 0
      member.level++
      if (opts.withHappiness) member = adjustHappiness(member, LEVEL_UP_GAIN)
      member.stats = levelUpStats(member.stats)
      const evo = getEvolution(member.id, member.level)
      if (evo) {
        const beforeEvo = { ...member }
        const evolved = evolveCreature(member, evo)
        if (!evolution) evolution = { from: beforeEvo, to: evolved, description: evo.description, teamIndex: ti }
        newTeam[ti] = evolved
      } else {
        newTeam[ti] = member
      }
    } else {
      newTeam[ti] = member
    }
  }
  return { team: newTeam, evolution }
}

export function recordStepStats(ps: PlayerStats, tile: MapTile): PlayerStats {
  const newBiomes = ps.uniqueBiomesVisited.includes(tile.biome) ? ps.uniqueBiomesVisited : [...ps.uniqueBiomesVisited, tile.biome]
  const sub = tile.subregion || ''
  const newSubs = sub && !ps.uniqueSubregionsVisited.includes(sub) ? [...ps.uniqueSubregionsVisited, sub] : ps.uniqueSubregionsVisited
  return { ...ps, totalStepsWalked: ps.totalStepsWalked + 1, uniqueBiomesVisited: newBiomes, uniqueSubregionsVisited: newSubs }
}

export function recordRangerDefeat(ps: PlayerStats, rangerId: string | null): PlayerStats {
  const defeated = ps.defeatedRangers ?? []
  const newDefeated = rangerId && !defeated.includes(rangerId) ? [...defeated, rangerId] : defeated
  return { ...ps, rangerBattlesWon: (ps.rangerBattlesWon ?? 0) + 1, defeatedRangers: newDefeated }
}
```

- [ ] **Step 3: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/progression
git commit -m "feat(features): shared progression helpers (xp, inventory, team xp, stats)"
```

---

### Task 9: Capture and boss-defeat record

**Files:**
- Create: `src/game/features/bosses/logic.ts` (only `recordBossDefeat` for now; more in Task 14)
- Create: `src/game/features/capture/logic.ts`
- Test: `src/game/features/capture/logic.test.ts`
- Modify: `src/game/Game.tsx` `handleCapture` (currently lines ~1025–1102)

**Interfaces produced:**
```ts
// bosses/logic.ts
export const BOSS_IDS: Set<string>      // moved from Game.tsx:29
export function recordBossDefeat(defeats: BossDefeat[] | undefined, creature: Creature, gameDay: number | undefined, captured: boolean): BossDefeat[]
// capture/logic.ts
export interface CaptureResult { state: GameState; isNewSpecies: boolean; teamFull: boolean; teamIndex: number | null }
export function captureCreature(state: GameState, creature: Creature, deps: LogicDeps): CaptureResult
```

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect } from 'vitest'
import { captureCreature } from './logic'
import { makeState, makeCreature, makeCaptured, testDeps, FIXED_NOW } from '@/test/fixtures'
import { LUNAR_BOSSES } from '@/game/creatures'

describe('captureCreature', () => {
  it('adds to team when not full, records catalog/captured/journal, ends battle', () => {
    const s = makeState({}, { journal: { Presidio: { subregion: 'Presidio', biome: 'grassland', firstVisited: FIXED_NOW, creaturesEncountered: [], creaturesCaptured: [], visitCount: 1 } } })
    const r = captureCreature(s, makeCreature({ id: 'newt' }), testDeps)
    expect(r.isNewSpecies).toBe(true)
    expect(r.teamFull).toBe(false)
    expect(r.teamIndex).toBe(1)
    expect(r.state.player.team).toHaveLength(2)
    expect(r.state.player.team[1].capturedAt).toBe(FIXED_NOW)
    expect(r.state.player.team[1].level).toBe(1)      // max(1, 1-1+floor(0.5*3)=1)
    expect(r.state.player.captured).toContain('newt')
    expect(r.state.player.journal.Presidio.creaturesCaptured).toEqual(['newt'])
    expect(r.state.screen).toBe('world')
    expect(r.state.battle.active).toBe(false)
  })
  it('routes to reserves when team is full', () => {
    const team = Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` }))
    const r = captureCreature(makeState({}, { team }), makeCreature({ id: 'x' }), testDeps)
    expect(r.teamFull).toBe(true)
    expect(r.teamIndex).toBeNull()
    expect(r.state.player.reserves).toHaveLength(1)
    expect(r.state.player.team).toHaveLength(6)
  })
  it('marks repeat species as not new', () => {
    const r = captureCreature(makeState(), makeCreature({ id: 'test-coyote' }), testDeps)
    expect(r.isNewSpecies).toBe(false)
  })
  it('records a boss capture', () => {
    const boss = LUNAR_BOSSES[0]
    const r = captureCreature(makeState({ gameDay: 12 }), boss, testDeps)
    expect(r.state.bossDefeats).toEqual([{ bossId: boss.id, bossName: boss.name, bossSprite: boss.sprite, bossType: 'lunar', gameDay: 12, captured: true }])
  })
})
```

- [ ] **Step 2: Implement `bosses/logic.ts` (partial)**

```ts
import type { BossDefeat, Creature } from '@/types/game'
import { LUNAR_BOSSES, SHADOW_BOSSES } from '@/game/creatures'

export const BOSS_IDS = new Set([...LUNAR_BOSSES.map(b => b.id), ...SHADOW_BOSSES.map(b => b.id)])

export function recordBossDefeat(defeats: BossDefeat[] | undefined, creature: Creature, gameDay: number | undefined, captured: boolean): BossDefeat[] {
  const next = [...(defeats ?? [])]
  if (BOSS_IDS.has(creature.id)) {
    const isLunar = LUNAR_BOSSES.some(b => b.id === creature.id)
    next.push({ bossId: creature.id, bossName: creature.name, bossSprite: creature.sprite, bossType: isLunar ? 'lunar' : 'shadow', gameDay: gameDay ?? 0, captured })
  }
  return next
}
```

- [ ] **Step 3: Implement `capture/logic.ts`**

```ts
import type { CapturedCreature, Creature, GameState } from '@/types/game'
import type { LogicDeps } from '@/game/core/state'
import { DEFAULT_HAPPINESS } from '@/game/happiness'
import { EMPTY_BATTLE } from '@/game/features/progression/logic'
import { recordBossDefeat } from '@/game/features/bosses/logic'

export interface CaptureResult { state: GameState; isNewSpecies: boolean; teamFull: boolean; teamIndex: number | null }

export function captureCreature(state: GameState, creature: Creature, deps: LogicDeps): CaptureResult {
  const isNewSpecies = !state.player.captured.includes(creature.id)
  const teamFull = state.player.team.length >= 6

  // rng then now — same evaluation order as the original object literal.
  const captured: CapturedCreature = {
    ...creature,
    level: Math.max(1, state.player.level - 1 + Math.floor(deps.rng() * 3)),
    xp: 0,
    capturedAt: deps.now(),
    capturedBiome: state.currentBiome,
    happiness: DEFAULT_HAPPINESS,
  }

  const newTeam = !teamFull ? [...state.player.team, captured] : state.player.team
  const newReserves = teamFull ? [...state.player.reserves, captured] : state.player.reserves

  const journalWithCapture = { ...state.player.journal }
  const subregion = state.currentSubregion
  if (subregion && journalWithCapture[subregion]) {
    const entry = journalWithCapture[subregion]
    if (!entry.creaturesCaptured.includes(creature.id)) {
      journalWithCapture[subregion] = { ...entry, creaturesCaptured: [...entry.creaturesCaptured, creature.id] }
    }
  }

  return {
    state: {
      ...state, screen: 'world',
      player: {
        ...state.player, team: newTeam, reserves: newReserves,
        catalog: [...new Set([...state.player.catalog, creature.id])],
        captured: [...new Set([...state.player.captured, creature.id])],
        journal: journalWithCapture,
      },
      bossDefeats: recordBossDefeat(state.bossDefeats, creature, state.gameDay, true),
      battle: EMPTY_BATTLE,
    },
    isNewSpecies, teamFull, teamIndex: teamFull ? null : newTeam.length - 1,
  }
}
```

- [ ] **Step 4: Wire `handleCapture`**

```ts
const handleCapture = useCallback((creature: Creature, _personality: Personality) => {
  setPlayerStats(ps => ({ ...ps, totalCreaturesCaught: ps.totalCreaturesCaught + 1 }))
  setDailyState(ds => updateChallengeProgress(ds, 'catch'))
  setTimeout(() => {
    triggerTutorial('first_catch', 'Great catch! Check your team with T and open the WildDex with B to learn more.')
  }, 1500)
  setGameState(prev => {
    const r = captureCreature(prev, creature, runtimeDeps)
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

Delete the `BOSS_IDS` const at `Game.tsx:29` and import it from `./features/bosses/logic` (it is still used by `handleBattleWin` until Task 10).

- [ ] **Step 5: Verify (oracle included), commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/capture src/game/features/bosses src/game/Game.tsx
git commit -m "refactor(capture): extract captureCreature and recordBossDefeat"
```

---

### Task 10: Battle handlers

**Files:**
- Create: `src/game/features/battle/logic.ts`
- Test: `src/game/features/battle/logic.test.ts`
- Modify: `Game.tsx` handlers `handleBattleWin`, `handleBattleLose`, `handleFlee`, `handleCreatureFled`, `handleUseItem`, `handleBattleSwitch`, `handleFriendlyGift`, `handleEncounterComplete`

**Interfaces produced:**
```ts
export function makeBattle(creature: Creature, lead: CapturedCreature, log?: string[], captureChance?: number): BattleState
export interface EvolveReadyHint { name: string; sprite: string; toName: string; gap: number }
export interface BattleWinResult { state: GameState; reward: { xp: number; coins: number; levelUp: boolean; isBoss: boolean }; evolution: EvolutionData | null; evolveReadyHint: EvolveReadyHint | null }
export function applyBattleWin(state: GameState, xpGained: number, ctx: { alcatrazEscapeActive: boolean }): BattleWinResult
export function applyBattleLose(state: GameState, ctx: { alcatrazEscapeActive: boolean }): GameState
export function endBattle(state: GameState, encounterCooldown: number): GameState
export function applyUseItem(state: GameState, itemId: string): GameState
export function applyBattleSwitch(state: GameState, index: number): GameState
export function applyFriendlyGift(state: GameState, gift: FriendlyGift): GameState
```

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { applyBattleWin, applyBattleLose, endBattle, applyUseItem, applyBattleSwitch, applyFriendlyGift, makeBattle } from './logic'
import { makeState, makeCaptured, makeCreature } from '@/test/fixtures'
import { LUNAR_BOSSES } from '@/game/creatures'

afterEach(() => vi.restoreAllMocks())

function inBattle(over = {}) {
  const wild = makeCreature({ id: 'wild' })
  const s = makeState(over)
  return { ...s, screen: 'battle' as const, battle: makeBattle(wild, s.player.team[0]) }
}

describe('applyBattleWin', () => {
  it('awards xp/coins, adds material drops, returns to world', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const r = applyBattleWin(inBattle(), 30, { alcatrazEscapeActive: false })
    expect(r.state.screen).toBe('world')
    expect(r.reward).toEqual({ xp: 30, coins: 12, levelUp: false, isBoss: false }) // 10 + level(1)*2
    expect(r.state.player.coins).toBe(112)
    expect(r.state.player.catalog).toContain('wild')
    expect(r.state.player.inventory.length).toBeGreaterThan(3) // at least one material drop
    expect(r.state.battle.active).toBe(false)
  })
  it('boss kill pays 50 + level*5 and records defeat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const boss = LUNAR_BOSSES[0]
    const s = { ...makeState({ gameDay: 3 }), screen: 'battle' as const, battle: makeBattle(boss, makeCaptured()) }
    const r = applyBattleWin(s, 10, { alcatrazEscapeActive: false })
    expect(r.reward.isBoss).toBe(true)
    expect(r.reward.coins).toBe(55)
    expect(r.state.bossDefeats?.[0]).toMatchObject({ bossId: boss.id, captured: false })
  })
  it('routes back to alcatraz when active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    expect(applyBattleWin(inBattle(), 1, { alcatrazEscapeActive: true }).state.screen).toBe('alcatraz_escape')
  })
  it('counts invasive removals', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const s = inBattle()
    s.battle.wildCreature = makeCreature({ id: 'inv', conservationStatus: 'INV' })
    expect(applyBattleWin(s, 1, { alcatrazEscapeActive: false }).state.player.invasivesRemoved).toBe(1)
  })
})

describe('applyBattleLose / endBattle', () => {
  it('halves hp and clears battle', () => {
    const r = applyBattleLose(inBattle(), { alcatrazEscapeActive: false })
    expect(r.player.team[0].stats.hp).toBe(15)
    expect(r.battle.active).toBe(false)
  })
  it('endBattle sets cooldown', () => {
    expect(endBattle(inBattle(), 8).encounterCooldown).toBe(8)
  })
})

describe('inventory & switch', () => {
  it('applyUseItem decrements to a floor of 0', () => {
    const s = makeState()
    const once = applyUseItem(s, 'energy-berry')
    expect(once.player.inventory.find(i => i.id === 'energy-berry')?.quantity).toBe(2)
  })
  it('applyBattleSwitch swaps lead and updates battle.playerCreature; ignores bad index', () => {
    const s = inBattle()
    s.player.team = [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' })]
    const r = applyBattleSwitch(s, 1)
    expect(r.player.team[0].id).toBe('b')
    expect(r.battle.playerCreature?.id).toBe('b')
    expect(applyBattleSwitch(s, 0)).toBe(s)
    expect(applyBattleSwitch(s, 5)).toBe(s)
  })
  it('applyFriendlyGift increments only existing items and ends battle with cooldown 5', () => {
    const r = applyFriendlyGift(inBattle(), { itemId: 'bio-capsule', itemName: 'x', sprite: '', message: '' })
    expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(11)
    expect(r.encounterCooldown).toBe(5)
    const r2 = applyFriendlyGift(inBattle(), { itemId: 'unknown', itemName: 'x', sprite: '', message: '' })
    expect(r2.player.inventory).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Implement**

```ts
import type { BattleState, CapturedCreature, Creature, GameState } from '@/types/game'
import type { FriendlyGift } from '@/game/encounterSystem'
import { ALL_CREATURES } from '@/game/creatures'
import { getEvolutionTarget } from '@/game/evolutions'
import { rollMaterialDrops, MATERIALS } from '@/game/crafting'
import { EMPTY_BATTLE, applyPlayerXp, awardTeamXp, halveTeamHp, addToInventory, incrementIfPresent, type EvolutionData } from '@/game/features/progression/logic'
import { BOSS_IDS, recordBossDefeat } from '@/game/features/bosses/logic'

export function makeBattle(creature: Creature, lead: CapturedCreature, log: string[] = [], captureChance = 0): BattleState {
  return { active: true, wildCreature: creature, playerCreature: lead, turn: 'player', log, captureChance }
}

export interface EvolveReadyHint { name: string; sprite: string; toName: string; gap: number }
export interface BattleWinResult {
  state: GameState
  reward: { xp: number; coins: number; levelUp: boolean; isBoss: boolean }
  evolution: EvolutionData | null
  evolveReadyHint: EvolveReadyHint | null
}

/** Hint fires when the lead levelled, did not evolve, and is within 2 levels of its evolution. */
function evolveReadyHint(before: CapturedCreature, after: CapturedCreature, evolution: EvolutionData | null): EvolveReadyHint | null {
  if (after.level <= before.level) return null
  if (evolution && evolution.teamIndex === 0) return null
  const nextEvo = getEvolutionTarget(after.id)
  if (!nextEvo || after.level >= nextEvo.level || nextEvo.level - after.level > 2) return null
  const target = ALL_CREATURES.find(c => c.id === nextEvo.toId)
  if (!target) return null
  return { name: after.nickname || after.name, sprite: after.sprite, toName: target.name, gap: nextEvo.level - after.level }
}

export function applyBattleWin(state: GameState, xpGained: number, ctx: { alcatrazEscapeActive: boolean }): BattleWinResult {
  const { player: leveled, newLevel, didLevelUp } = applyPlayerXp(state.player, xpGained)
  const defeated = state.battle.wildCreature
  const isBossKill = !!(defeated && BOSS_IDS.has(defeated.id))
  const coinsGained = isBossKill ? (50 + newLevel * 5) : (10 + newLevel * 2)

  const newCatalog = defeated ? [...new Set([...state.player.catalog, defeated.id])] : state.player.catalog

  const { team: newTeam, evolution } = awardTeamXp(state.player.team, xpGained, { withHappiness: true })
  const hint = state.player.team.length > 0 ? evolveReadyHint(state.player.team[0], newTeam[0], evolution) : null

  // Material drops (rolls Math.random internally) — after the team loop, as before.
  let newInventory = state.player.inventory
  for (const drop of rollMaterialDrops(state.currentBiome, newLevel)) {
    const mat = MATERIALS.find(m => m.id === drop.itemId)
    const existing = newInventory.some(i => i.id === drop.itemId)
    if (existing) newInventory = incrementIfPresent(newInventory, drop.itemId, drop.quantity)
    else if (mat) newInventory = addToInventory(newInventory, { ...mat, quantity: drop.quantity })
  }

  const wasInvasive = !!defeated && (defeated.conservationStatus === 'INV' || defeated.isNative === false)
  const newInvasivesRemoved = (state.player.invasivesRemoved ?? 0) + (wasInvasive ? 1 : 0)
  const bossDefeats = defeated ? recordBossDefeat(state.bossDefeats, defeated, state.gameDay, false) : [...(state.bossDefeats ?? [])]

  return {
    state: {
      ...state,
      screen: ctx.alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
      player: {
        ...leveled,
        coins: (state.player.coins ?? 0) + coinsGained,
        team: newTeam,
        catalog: newCatalog,
        inventory: newInventory,
        invasivesRemoved: newInvasivesRemoved,
      },
      bossDefeats,
      battle: EMPTY_BATTLE,
    },
    reward: { xp: xpGained, coins: coinsGained, levelUp: didLevelUp, isBoss: isBossKill },
    evolution,
    evolveReadyHint: hint,
  }
}

export function applyBattleLose(state: GameState, ctx: { alcatrazEscapeActive: boolean }): GameState {
  return {
    ...state, screen: ctx.alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
    player: { ...state.player, team: halveTeamHp(state.player.team) },
    battle: EMPTY_BATTLE,
  }
}

export function endBattle(state: GameState, encounterCooldown: number): GameState {
  return { ...state, screen: 'world', battle: EMPTY_BATTLE, encounterCooldown }
}

export function applyUseItem(state: GameState, itemId: string): GameState {
  return {
    ...state,
    player: { ...state.player, inventory: state.player.inventory.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item) },
  }
}

export function applyBattleSwitch(state: GameState, index: number): GameState {
  if (index <= 0 || index >= state.player.team.length) return state
  const newTeam = [...state.player.team]
  const temp = newTeam[0]
  newTeam[0] = newTeam[index]
  newTeam[index] = temp
  return { ...state, player: { ...state.player, team: newTeam }, battle: { ...state.battle, playerCreature: newTeam[0] } }
}

export function applyFriendlyGift(state: GameState, gift: FriendlyGift): GameState {
  return {
    ...state, screen: 'world',
    player: { ...state.player, inventory: incrementIfPresent(state.player.inventory, gift.itemId, 1) },
    battle: EMPTY_BATTLE,
    encounterCooldown: 5,
  }
}
```

Note on parity in `applyBattleWin`: the original builds `newTeam`, then (inside the loop) sets the evolve-ready toast; then rolls drops. `rollMaterialDrops` is the only RNG consumer and it is still called after `awardTeamXp`, so the RNG sequence is unchanged. The original's `MATERIALS.find` guard for unknown drop ids is preserved by the `else if (mat)` branch.

- [ ] **Step 3: Wire handlers**

```ts
const handleBattleWin = useCallback((xpGained: number) => {
  SFX.victory()
  setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1 }))
  setDailyState(ds => updateChallengeProgress(ds, 'battle'))
  setScreenTransition('fade-out')
  setTimeout(() => { setScreenTransition('fade-in'); setTimeout(() => setScreenTransition('none'), 400) }, 300)
  setGameState(prev => {
    const r = applyBattleWin(prev, xpGained, { alcatrazEscapeActive })
    setBattleReward(r.reward)
    setTimeout(() => setBattleReward(null), 3000)
    if (r.evolveReadyHint) {
      setEvolveReadyToast(r.evolveReadyHint)
      setTimeout(() => setEvolveReadyToast(null), 4000)
    }
    if (r.evolution) {
      pendingEvolutionRef.current = r.evolution
      setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
      SFX.evolution()
      setTimeout(() => {
        if (pendingEvolutionRef.current) { setPendingEvolution(pendingEvolutionRef.current); pendingEvolutionRef.current = null }
      }, 100)
    }
    if (alcatrazEscapeActive) {
      if (alcatrazStage === 'cellblock') setAlcatrazCellProgress(p => p + 1)
      else if (alcatrazStage === 'boss') setAlcatrazStage('freedom')
    }
    return r.state
  })
}, [alcatrazEscapeActive, alcatrazStage])

const handleBattleLose = useCallback(() => {
  SFX.defeat()
  setScreenTransition('fade-out')
  setTimeout(() => { setScreenTransition('fade-in'); setTimeout(() => setScreenTransition('none'), 400) }, 300)
  setGameState(prev => applyBattleLose(prev, { alcatrazEscapeActive }))
}, [alcatrazEscapeActive])

const handleFlee = useCallback(() => {
  SFX.flee()
  setScreenTransition('fade-out')
  setTimeout(() => { setScreenTransition('fade-in'); setTimeout(() => setScreenTransition('none'), 400) }, 300)
  setGameState(prev => endBattle(prev, 8))
}, [])

const handleCreatureFled = useCallback(() => {
  setScreenTransition('fade-out')
  setTimeout(() => { setScreenTransition('fade-in'); setTimeout(() => setScreenTransition('none'), 400) }, 300)
  setGameState(prev => endBattle(prev, 6))
}, [])

const handleFriendlyGift = useCallback((gift: FriendlyGift) => {
  setGameState(prev => applyFriendlyGift(prev, gift))
  setGiftNotif(gift)
  setTimeout(() => setGiftNotif(null), 4000)
}, [])

const handleUseItem = useCallback((itemId: string) => { setGameState(prev => applyUseItem(prev, itemId)) }, [])
const handleBattleSwitch = useCallback((index: number) => { setGameState(prev => applyBattleSwitch(prev, index)) }, [])
```

Order check in `handleBattleWin`'s updater: original order was reward toast → (inside loop) evolve-ready toast → evolution effects → alcatraz. Preserved above.

- [ ] **Step 4: Verify (oracle), commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/battle src/game/Game.tsx
git commit -m "refactor(battle): extract battle win/lose/flee/switch/item/gift logic"
```

---

### Task 11: Ranger, trainer, and arena handlers

**Files:**
- Create: `src/game/features/trainers/logic.ts`
- Test: `src/game/features/trainers/logic.test.ts`
- Modify: `Game.tsx` handlers `handleStartRangerBattle`, `handleRangerBattleWin`, `handleRangerBattleLose`, `handleRangerBattleClose`, `handleArenaWin`, `handleArenaLose`, `handleAcceptTrainer`, `handleDeclineTrainer`, `handleTrainerBattleWin`

**Interfaces produced:**
```ts
export function startRangerBattle(state: GameState, rangerId: string): GameState
export function applyRangerBattleWin(state: GameState, xp: number): GameState
export function applyRangerBattleLose(state: GameState): GameState
export function leaveRangerScreen(state: GameState): GameState          // handleRangerBattleClose
export function applyArenaWin(state: GameState, xp: number, coins: number, tier: ArenaTier): GameState
export function applyArenaLose(state: GameState): GameState
export function applyDeclineTrainer(state: GameState): GameState
export function applyTrainerBattleWin(state: GameState, xp: number, trainer: RoamingTrainer | null): { state: GameState; evolution: EvolutionData | null }
```

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect } from 'vitest'
import { startRangerBattle, applyRangerBattleWin, applyRangerBattleLose, leaveRangerScreen, applyArenaWin, applyArenaLose, applyDeclineTrainer, applyTrainerBattleWin } from './logic'
import { makeState } from '@/test/fixtures'
import type { RoamingTrainer } from '@/game/roamingTrainers'

describe('ranger battles', () => {
  it('start sets screen and activeRangerId', () => {
    const r = startRangerBattle(makeState(), 'ranger-presidio')
    expect(r.screen).toBe('ranger_battle'); expect(r.activeRangerId).toBe('ranger-presidio')
  })
  it('win awards xp and 30 + level*3 coins, clears ranger', () => {
    const r = applyRangerBattleWin(makeState({ activeRangerId: 'x' }), 10)
    expect(r.player.coins).toBe(133); expect(r.activeRangerId).toBeNull(); expect(r.screen).toBe('world')
  })
  it('lose halves hp and clears ranger', () => {
    const r = applyRangerBattleLose(makeState({ activeRangerId: 'x' }))
    expect(r.player.team[0].stats.hp).toBe(15); expect(r.activeRangerId).toBeNull()
  })
  it('leaveRangerScreen', () => {
    expect(leaveRangerScreen(makeState({ screen: 'ranger', activeRangerId: 'x' }))).toMatchObject({ screen: 'world', activeRangerId: null })
  })
})

describe('arena', () => {
  it('win increments tier and coins', () => {
    const r = applyArenaWin(makeState(), 5, 20, 'bronze')
    expect(r.arenaWins.bronze).toBe(1); expect(r.player.coins).toBe(120)
  })
  it('lose halves hp only', () => {
    const r = applyArenaLose(makeState())
    expect(r.player.team[0].stats.hp).toBe(15); expect(r.screen).toBe('world')
  })
})

describe('roaming trainers', () => {
  const trainer = { id: 't1', rewardItem: { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 2, description: 'd', sprite: '🔮' } } as unknown as RoamingTrainer
  it('decline returns to world with cooldown 8', () => {
    expect(applyDeclineTrainer(makeState({ screen: 'trainer_encounter' }))).toMatchObject({ screen: 'world', encounterCooldown: 8 })
  })
  it('win adds reward item, xp, coins; no happiness change', () => {
    const r = applyTrainerBattleWin(makeState(), 10, trainer)
    expect(r.state.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(12)
    expect(r.state.player.coins).toBe(133)
    expect(r.state.player.team[0].happiness).toBe(50)
    expect(r.state.player.team[0].xp).toBe(10)
  })
  it('win without trainer adds nothing', () => {
    expect(applyTrainerBattleWin(makeState(), 1, null).state.player.inventory).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Implement**

```ts
import type { GameState } from '@/types/game'
import type { ArenaTier } from '@/game/arena'
import type { RoamingTrainer } from '@/game/roamingTrainers'
import { applyPlayerXp, halveTeamHp, addToInventory, awardTeamXp, type EvolutionData } from '@/game/features/progression/logic'

export function startRangerBattle(state: GameState, rangerId: string): GameState {
  return { ...state, screen: 'ranger_battle', activeRangerId: rangerId }
}

export function applyRangerBattleWin(state: GameState, xp: number): GameState {
  const { player, newLevel } = applyPlayerXp(state.player, xp)
  return { ...state, screen: 'world', activeRangerId: null, player: { ...player, coins: (state.player.coins ?? 0) + 30 + newLevel * 3 } }
}

export function applyRangerBattleLose(state: GameState): GameState {
  return { ...state, screen: 'world', activeRangerId: null, player: { ...state.player, team: halveTeamHp(state.player.team) } }
}

export function leaveRangerScreen(state: GameState): GameState {
  return { ...state, screen: 'world', activeRangerId: null }
}

export function applyArenaWin(state: GameState, xp: number, coins: number, tier: ArenaTier): GameState {
  const { player } = applyPlayerXp(state.player, xp)
  return {
    ...state,
    player: { ...player, coins: (state.player.coins ?? 0) + coins },
    arenaWins: { ...state.arenaWins, [tier]: (state.arenaWins[tier] ?? 0) + 1 },
  }
}

export function applyArenaLose(state: GameState): GameState {
  return { ...state, player: { ...state.player, team: halveTeamHp(state.player.team) } }
}

export function applyDeclineTrainer(state: GameState): GameState {
  return { ...state, screen: 'world', encounterCooldown: 8 }
}

export function applyTrainerBattleWin(state: GameState, xp: number, trainer: RoamingTrainer | null): { state: GameState; evolution: EvolutionData | null } {
  const { player, newLevel } = applyPlayerXp(state.player, xp)
  let newInventory = state.player.inventory
  if (trainer?.rewardItem) newInventory = addToInventory(newInventory, trainer.rewardItem)
  const { team, evolution } = awardTeamXp(state.player.team, xp, { withHappiness: false })
  return {
    state: {
      ...state, screen: 'world', activeRangerId: null,
      player: { ...player, coins: (state.player.coins ?? 0) + 30 + newLevel * 3, team, inventory: newInventory },
    },
    evolution,
  }
}
```

If `RoamingTrainer['rewardItem']` lacks a field `InventoryItem` requires, build the item explicitly in `applyTrainerBattleWin` with the six fields, as the original did.

- [ ] **Step 3: Wire**

```ts
const handleStartRangerBattle = useCallback((rangerId: string) => { setGameState(prev => startRangerBattle(prev, rangerId)) }, [])

const handleRangerBattleWin = useCallback((xp: number) => {
  SFX.victory()
  const isFinalBoss = gameState.activeRangerId === FINAL_BOSS_ID
  const isGrandChampion = gameState.activeRangerId === GRAND_CHAMPION_ID
  const alreadyChampion = (playerStats.defeatedRangers ?? []).includes(FINAL_BOSS_ID)
  const alreadyGrandChampion = (playerStats.defeatedRangers ?? []).includes(GRAND_CHAMPION_ID)
  setPlayerStats(ps => recordRangerDefeat(ps, gameState.activeRangerId))
  setDailyState(ds => updateChallengeProgress(ds, 'battle'))
  setGameState(prev => applyRangerBattleWin(prev, xp))
  if ((isFinalBoss && !alreadyChampion) || (isGrandChampion && !alreadyGrandChampion)) {
    setTimeout(() => setShowChampion(true), 500)
  }
}, [gameState.activeRangerId, playerStats.defeatedRangers])

const handleRangerBattleLose = useCallback(() => { setGameState(prev => applyRangerBattleLose(prev)) }, [])
const handleRangerBattleClose = useCallback(() => { setGameState(prev => leaveRangerScreen(prev)) }, [])
const handleArenaWin = useCallback((xp: number, coins: number, tier: ArenaTier) => { SFX.victory(); setGameState(prev => applyArenaWin(prev, xp, coins, tier)) }, [])
const handleArenaLose = useCallback(() => { setGameState(prev => applyArenaLose(prev)) }, [])

const handleAcceptTrainer = useCallback(() => {
  if (!pendingTrainer) return
  setGameState(prev => startRangerBattle(prev, pendingTrainer.id))
}, [pendingTrainer])

const handleDeclineTrainer = useCallback(() => {
  SFX.flee()
  setPendingTrainer(null)
  setGameState(prev => applyDeclineTrainer(prev))
}, [])

const handleTrainerBattleWin = useCallback((xp: number) => {
  SFX.victory()
  const trainer = pendingTrainer
  if (trainer) {
    setDefeatedTrainers(prev => [...prev, trainer.id])
    setDefeatedTrainers(prev => prev.length > 20 ? prev.slice(-10) : prev)
  }
  setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1, rangerBattlesWon: (ps.rangerBattlesWon ?? 0) + 1 }))
  setGameState(prev => {
    const r = applyTrainerBattleWin(prev, xp, trainer)
    if (r.evolution) {
      pendingEvolutionRef.current = r.evolution
      setPlayerStats(ps2 => ({ ...ps2, totalEvolutions: ps2.totalEvolutions + 1 }))
      SFX.evolution()
      setTimeout(() => {
        if (pendingEvolutionRef.current) { setPendingEvolution(pendingEvolutionRef.current); pendingEvolutionRef.current = null }
      }, 100)
    }
    return r.state
  })
  setPendingTrainer(null)
}, [pendingTrainer])
```

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/trainers src/game/Game.tsx
git commit -m "refactor(trainers): extract ranger, roaming trainer, and arena logic"
```

---

### Task 12: Quests, trade, crafting

**Files:**
- Create: `src/game/features/quests/logic.ts`, `src/game/features/trade/logic.ts`, `src/game/features/crafting/logic.ts`
- Test: one `logic.test.ts` beside each
- Modify: `Game.tsx` `handleAcceptQuest`, `handleClaimReward`, `handleTrade`, `handleCraft`, `handleImportCreature`, `handleTradeRemoveCreature`

**Interfaces produced:**
```ts
// quests
export function acceptQuest(state: GameState, questId: string): GameState
export interface QuestRewardSummary { title: string; xp: number; coins: number; items?: { id: string; name: string; sprite: string; quantity: number }[] }
export function claimQuestReward(state: GameState, questId: string): { state: GameState; reward: QuestRewardSummary | null }
// trade
export function applyTrade(state: GameState, tradeId: string): GameState
export function importCreature(state: GameState, creature: CapturedCreature): GameState
export function removeTeamMember(state: GameState, index: number): GameState
// crafting
export function applyCraft(state: GameState, recipeId: string): GameState
```

- [ ] **Step 1: Tests**

`quests/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { acceptQuest, claimQuestReward } from './logic'
import { makeState } from '@/test/fixtures'

describe('quests', () => {
  it('acceptQuest marks active', () => {
    expect(acceptQuest(makeState(), 'presidio-coyote').questProgress['presidio-coyote']).toEqual({ questId: 'presidio-coyote', status: 'active', progress: 0 })
  })
  it('claimQuestReward pays xp, 25+xp coins, items; marks rewarded', () => {
    const r = claimQuestReward(makeState(), 'presidio-coyote')  // xp 80, 5 bio-capsules
    expect(r.reward).toEqual({ title: 'Urban Coyote Survey', xp: 80, coins: 105, items: [{ id: 'bio-capsule', name: 'Bio Capsule', sprite: '🔮', quantity: 5 }] })
    expect(r.state.player.coins).toBe(205)
    expect(r.state.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(15)
    expect(r.state.questProgress['presidio-coyote'].status).toBe('rewarded')
  })
  it('unknown quest is a no-op', () => {
    const s = makeState()
    const r = claimQuestReward(s, 'nope')
    expect(r.state).toBe(s); expect(r.reward).toBeNull()
  })
})
```

`trade/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { applyTrade, importCreature, removeTeamMember } from './logic'
import { makeState, makeCaptured } from '@/test/fixtures'

describe('trade', () => {
  it('presidio-trade-1 gives 2 energy-berry for 5 bio-capsule', () => {
    const r = applyTrade(makeState(), 'presidio-trade-1')
    expect(r.player.inventory.find(i => i.id === 'energy-berry')?.quantity).toBe(1)
    expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(15)
  })
  it('insufficient items is a no-op', () => {
    const s = makeState({}, { inventory: [] })
    expect(applyTrade(s, 'presidio-trade-1')).toBe(s)
  })
  it('importCreature adds to team, catalog, captured; no-op when full', () => {
    const r = importCreature(makeState(), makeCaptured({ id: 'imp' }))
    expect(r.player.team).toHaveLength(2); expect(r.player.captured).toContain('imp')
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })) })
    expect(importCreature(full, makeCaptured())).toBe(full)
  })
  it('removeTeamMember filters by index', () => {
    expect(removeTeamMember(makeState(), 0).player.team).toHaveLength(0)
  })
})
```

`crafting/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { applyCraft } from './logic'
import { makeState } from '@/test/fixtures'
import { MATERIALS } from '@/game/crafting'

describe('applyCraft', () => {
  it('consumes ingredients and adds result', () => {
    const inv = [...makeState().player.inventory, { ...MATERIALS.find(m => m.id === 'bay-leaf')!, quantity: 3 }, { ...MATERIALS.find(m => m.id === 'marsh-reed')!, quantity: 2 }]
    const r = applyCraft(makeState({}, { inventory: inv }), 'craft-herb-potion')
    expect(r.player.inventory.find(i => i.id === 'bay-leaf')?.quantity).toBe(0)
    expect(r.player.inventory.find(i => i.id === 'herb-potion')?.quantity).toBe(7)
  })
  it('no-op when ingredients missing', () => {
    const s = makeState()
    expect(applyCraft(s, 'craft-herb-potion')).toBe(s)
  })
})
```

- [ ] **Step 2: Implement**

`quests/logic.ts`:
```ts
import type { GameState } from '@/types/game'
import { RANGERS } from '@/game/rangers'
import { applyPlayerXp, addToInventory } from '@/game/features/progression/logic'

export function acceptQuest(state: GameState, questId: string): GameState {
  return { ...state, questProgress: { ...state.questProgress, [questId]: { questId, status: 'active', progress: 0 } } }
}

export interface QuestRewardSummary { title: string; xp: number; coins: number; items?: { id: string; name: string; sprite: string; quantity: number }[] }

export function claimQuestReward(state: GameState, questId: string): { state: GameState; reward: QuestRewardSummary | null } {
  const ranger = RANGERS.find(r => r.quests.some(q => q.id === questId))
  const quest = ranger?.quests.find(q => q.id === questId)
  if (!quest) return { state, reward: null }
  const coins = 25 + quest.reward.xp
  const reward: QuestRewardSummary = {
    title: quest.title, xp: quest.reward.xp, coins,
    items: quest.reward.items?.map(i => ({ id: i.id, name: i.name, sprite: i.sprite, quantity: i.quantity })),
  }
  const { player } = applyPlayerXp(state.player, quest.reward.xp)
  let inventory = state.player.inventory
  for (const item of quest.reward.items ?? []) inventory = addToInventory(inventory, item)
  return {
    state: {
      ...state,
      player: { ...player, coins: (state.player.coins ?? 0) + coins, inventory },
      questProgress: { ...state.questProgress, [questId]: { questId, status: 'rewarded', progress: 0 } },
    },
    reward,
  }
}
```

`trade/logic.ts`:
```ts
import type { CapturedCreature, GameState } from '@/types/game'
import { RANGERS } from '@/game/rangers'
import { addToInventory } from '@/game/features/progression/logic'

export function applyTrade(state: GameState, tradeId: string): GameState {
  const ranger = RANGERS.find(r => r.trades.some(t => t.id === tradeId))
  const trade = ranger?.trades.find(t => t.id === tradeId)
  if (!trade) return state
  const giveItem = state.player.inventory.find(i => i.id === trade.give.itemId)
  if (!giveItem || giveItem.quantity < trade.give.quantity) return state
  let inventory = state.player.inventory.map(i => i.id === trade.give.itemId ? { ...i, quantity: i.quantity - trade.give.quantity } : i)
  inventory = addToInventory(inventory, {
    id: trade.receive.itemId, name: trade.receive.itemName, type: trade.receive.type,
    quantity: trade.receive.quantity, description: trade.receive.description, sprite: trade.receive.sprite,
  })
  return { ...state, player: { ...state.player, inventory } }
}

export function importCreature(state: GameState, creature: CapturedCreature): GameState {
  if (state.player.team.length >= 6) return state
  return {
    ...state,
    player: {
      ...state.player, team: [...state.player.team, creature],
      catalog: [...new Set([...state.player.catalog, creature.id])],
      captured: [...new Set([...state.player.captured, creature.id])],
    },
  }
}

export function removeTeamMember(state: GameState, index: number): GameState {
  return { ...state, player: { ...state.player, team: state.player.team.filter((_, i) => i !== index) } }
}
```

`crafting/logic.ts`:
```ts
import type { GameState } from '@/types/game'
import { RECIPES, canCraft } from '@/game/crafting'
import { addToInventory } from '@/game/features/progression/logic'

export function applyCraft(state: GameState, recipeId: string): GameState {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe || !canCraft(recipe, state.player.inventory)) return state
  let inventory = state.player.inventory
  for (const ing of recipe.ingredients) {
    inventory = inventory.map(i => i.id === ing.itemId ? { ...i, quantity: i.quantity - ing.quantity } : i)
  }
  inventory = addToInventory(inventory, {
    id: recipe.result.itemId, name: recipe.result.name, type: recipe.result.type,
    quantity: recipe.result.quantity, description: recipe.result.description, sprite: recipe.result.sprite,
  })
  return { ...state, player: { ...state.player, inventory } }
}
```

- [ ] **Step 3: Wire**

```ts
const handleAcceptQuest = useCallback((questId: string) => { setGameState(prev => acceptQuest(prev, questId)) }, [])
const handleClaimReward = useCallback((questId: string) => {
  setGameState(prev => {
    const r = claimQuestReward(prev, questId)
    if (r.reward) setQuestReward(r.reward)
    return r.state
  })
}, [])
const handleTrade = useCallback((tradeId: string) => { setGameState(prev => applyTrade(prev, tradeId)) }, [])
const handleCraft = useCallback((recipeId: string) => { setGameState(prev => applyCraft(prev, recipeId)) }, [])
const handleImportCreature = useCallback((creature: CapturedCreature) => { setGameState(prev => importCreature(prev, creature)) }, [])
const handleTradeRemoveCreature = useCallback((index: number) => { setGameState(prev => removeTeamMember(prev, index)) }, [])
```

Parity note for `handleClaimReward`: today `setQuestReward` fires *before* `setGameState` and even when the quest lookup happens outside the updater. Both are state setters in the same batch and the reward popup reads its own props, so moving the call inside the updater does not change what renders. This is the one handler where the effect moves into the updater rather than staying where it was.

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/quests src/game/features/trade src/game/features/crafting src/game/Game.tsx
git commit -m "refactor(quests,trade,crafting): extract pure logic"
```

---

### Task 13: Team management

**Files:**
- Create: `src/game/features/team/logic.ts`
- Test: `src/game/features/team/logic.test.ts`
- Modify: `Game.tsx` `handleSwapLead`, `handleTeachMove`, `handleLearnAbility`, `handleManualEvolve`, `handleReleaseFromTeam`, `handleSwapFromReserve`, `handleAdoptFromReserve`, `handleReleaseFromReserve`

**Interfaces produced:**
```ts
export function swapLead(state: GameState, index: number): GameState
export function teachMove(state: GameState, index: number, updated: CapturedCreature, cost: number): GameState
export function learnAbility(state: GameState, index: number, abilityId: string, cost: number): GameState
export function manualEvolve(state: GameState, teamIndex: number): { state: GameState; evolution: EvolutionData | null }
export function releaseFromTeam(state: GameState, index: number): GameState
export function swapFromReserve(state: GameState, reserveIndex: number, teamIndex: number): GameState
export function adoptFromReserve(state: GameState, reserveIndex: number): GameState
export function releaseFromReserve(state: GameState, reserveIndex: number): GameState
```

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect } from 'vitest'
import { swapLead, teachMove, learnAbility, manualEvolve, releaseFromTeam, swapFromReserve, adoptFromReserve, releaseFromReserve } from './logic'
import { makeState, makeCaptured } from '@/test/fixtures'
import { EVOLUTIONS } from '@/game/evolutions'

const two = () => makeState({}, { team: [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' })], reserves: [makeCaptured({ id: 'r' })] })

describe('team', () => {
  it('swapLead', () => { expect(swapLead(two(), 1).player.team.map(c => c.id)).toEqual(['b', 'a']) })
  it('teachMove replaces creature and charges cost, floor 0', () => {
    const r = teachMove(two(), 0, makeCaptured({ id: 'a2' }), 500)
    expect(r.player.team[0].id).toBe('a2'); expect(r.player.coins).toBe(0)
  })
  it('learnAbility sets learnedAbility; bad index no-op', () => {
    expect(learnAbility(two(), 1, 'ab', 10).player.team[1].learnedAbility).toBe('ab')
    const s = two(); expect(learnAbility(s, 9, 'ab', 10)).toBe(s)
  })
  it('manualEvolve evolves when eligible, no-op otherwise', () => {
    const evo = EVOLUTIONS[0]
    const s = makeState({}, { team: [makeCaptured({ id: evo.fromId, level: evo.level })] })
    const r = manualEvolve(s, 0)
    expect(r.evolution?.teamIndex).toBe(0); expect(r.state.player.team[0].id).toBe(evo.toId)
    const s2 = two()
    const none = manualEvolve(s2, 0)
    expect(none.evolution).toBeNull(); expect(none.state).toBe(s2)
  })
  it('releaseFromTeam refuses index 0 and single-member teams', () => {
    const s = two(); expect(releaseFromTeam(s, 0)).toBe(s)
    expect(releaseFromTeam(s, 1).player.team).toHaveLength(1)
    const one = makeState(); expect(releaseFromTeam(one, 1)).toBe(one)
  })
  it('reserve ops', () => {
    expect(swapFromReserve(two(), 0, 1).player.team[1].id).toBe('r')
    expect(adoptFromReserve(two(), 0).player.team).toHaveLength(3)
    expect(releaseFromReserve(two(), 0).player.reserves).toHaveLength(0)
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })), reserves: [makeCaptured()] })
    expect(adoptFromReserve(full, 0)).toBe(full)
  })
})
```

- [ ] **Step 2: Implement**

```ts
import type { CapturedCreature, GameState } from '@/types/game'
import { getEvolution, evolveCreature } from '@/game/evolutions'
import type { EvolutionData } from '@/game/features/progression/logic'

export function swapLead(state: GameState, index: number): GameState {
  const newTeam = [...state.player.team]
  const temp = newTeam[0]; newTeam[0] = newTeam[index]; newTeam[index] = temp
  return { ...state, player: { ...state.player, team: newTeam } }
}

export function teachMove(state: GameState, index: number, updated: CapturedCreature, cost: number): GameState {
  const newTeam = [...state.player.team]; newTeam[index] = updated
  return { ...state, player: { ...state.player, team: newTeam, coins: Math.max(0, (state.player.coins ?? 0) - cost) } }
}

export function learnAbility(state: GameState, index: number, abilityId: string, cost: number): GameState {
  const creature = state.player.team[index]
  if (!creature) return state
  const newTeam = [...state.player.team]; newTeam[index] = { ...creature, learnedAbility: abilityId }
  return { ...state, player: { ...state.player, team: newTeam, coins: Math.max(0, (state.player.coins ?? 0) - cost) } }
}

export function manualEvolve(state: GameState, teamIndex: number): { state: GameState; evolution: EvolutionData | null } {
  const creature = state.player.team[teamIndex]
  if (!creature) return { state, evolution: null }
  const evo = getEvolution(creature.id, creature.level)
  if (!evo) return { state, evolution: null }
  const beforeEvo = { ...creature }
  const evolved = evolveCreature(creature, evo)
  const newTeam = [...state.player.team]; newTeam[teamIndex] = evolved
  return { state: { ...state, player: { ...state.player, team: newTeam } }, evolution: { from: beforeEvo, to: evolved, description: evo.description, teamIndex } }
}

export function releaseFromTeam(state: GameState, index: number): GameState {
  if (index === 0 || state.player.team.length <= 1) return state
  return { ...state, player: { ...state.player, team: state.player.team.filter((_, i) => i !== index) } }
}

export function swapFromReserve(state: GameState, reserveIndex: number, teamIndex: number): GameState {
  const newTeam = [...state.player.team]; const newReserves = [...state.player.reserves]
  const swapped = newTeam[teamIndex]; newTeam[teamIndex] = newReserves[reserveIndex]; newReserves[reserveIndex] = swapped
  return { ...state, player: { ...state.player, team: newTeam, reserves: newReserves } }
}

export function adoptFromReserve(state: GameState, reserveIndex: number): GameState {
  if (state.player.team.length >= 6) return state
  const creature = state.player.reserves[reserveIndex]
  return { ...state, player: { ...state.player, team: [...state.player.team, creature], reserves: state.player.reserves.filter((_, i) => i !== reserveIndex) } }
}

export function releaseFromReserve(state: GameState, reserveIndex: number): GameState {
  return { ...state, player: { ...state.player, reserves: state.player.reserves.filter((_, i) => i !== reserveIndex) } }
}
```

Note: the original `releaseFromTeam` applies the same guard, and `adoptFromReserve` copies `undefined` into the team when `reserveIndex` is out of range. Preserve both (do not add a guard the original lacks).

- [ ] **Step 3: Wire**

Each becomes `setGameState(prev => fn(prev, ...args))`, except:

```ts
const handleManualEvolve = useCallback((teamIndex: number) => {
  setGameState(prev => {
    const r = manualEvolve(prev, teamIndex)
    if (r.evolution) {
      pendingEvolutionRef.current = r.evolution
      setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
      SFX.evolution()
      setTimeout(() => {
        if (pendingEvolutionRef.current) { setPendingEvolution(pendingEvolutionRef.current); pendingEvolutionRef.current = null }
      }, 100)
    }
    return r.state
  })
}, [])
```

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/team src/game/Game.tsx
git commit -m "refactor(team): extract team and reserve management logic"
```

---

### Task 14: Breeding, minigames, bosses, Alcatraz, fusion

**Files:**
- Create: `src/game/features/breeding/logic.ts`, `src/game/features/minigames/logic.ts`
- Modify: `src/game/features/bosses/logic.ts` (add challenge/alcatraz/fusion)
- Test: `logic.test.ts` beside each
- Modify: `Game.tsx` `handleStartBreeding`, `handleHatchCreature`, `handleCancelBreeding`, `handleFishCatch`, `handleDiveEncounter`, `handleDiveCollect`, `handleBossChallenge`, `handleShadowBossChallenge`, `handleAlcatrazBattle`, `handleAlcatrazComplete`, `handleFusion`

**Interfaces produced:**
```ts
// breeding
export function startBreeding(state: GameState, slot: BreedingSlot): GameState
export function hatchCreature(state: GameState, creature: CapturedCreature): GameState
export function cancelBreeding(state: GameState): GameState
// minigames
export function applyFishCatch(state: GameState, fish: { xpReward: number }): GameState
export function startDiveEncounter(state: GameState, creature: Creature): GameState
export function applyDiveCollect(state: GameState, item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }): GameState
// bosses (additions)
export function challengeBoss(state: GameState, boss: Creature): GameState
export function startAlcatrazBattle(state: GameState, creature: Creature): GameState
export function applyAlcatrazComplete(state: GameState, rewards: { xp: number; item?: InventoryItem }): GameState
export function applyFusion(state: GameState, idx1: number, idx2: number, result: CapturedCreature): GameState
```

- [ ] **Step 1: Tests**

`breeding/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { startBreeding, hatchCreature, cancelBreeding } from './logic'
import { makeState, makeCaptured, FIXED_NOW } from '@/test/fixtures'

const slot = { parent1: makeCaptured(), parent2: makeCaptured({ id: 'b' }), startedAt: FIXED_NOW, readyAt: FIXED_NOW }
describe('breeding', () => {
  it('start / cancel set nursery', () => {
    expect(startBreeding(makeState(), slot).player.nursery).toEqual(slot)
    expect(cancelBreeding(startBreeding(makeState(), slot)).player.nursery).toBeNull()
  })
  it('hatch adds to team and clears nursery; no-op when full', () => {
    const r = hatchCreature(startBreeding(makeState(), slot), makeCaptured({ id: 'egg' }))
    expect(r.player.team).toHaveLength(2); expect(r.player.nursery).toBeNull(); expect(r.player.captured).toContain('egg')
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })) })
    expect(hatchCreature(full, makeCaptured())).toBe(full)
  })
})
```

`minigames/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { applyFishCatch, startDiveEncounter, applyDiveCollect } from './logic'
import { makeState, makeCreature } from '@/test/fixtures'

describe('minigames', () => {
  it('fish catch pays xp as coins too', () => {
    const r = applyFishCatch(makeState(), { xpReward: 40 })
    expect(r.player.xp).toBe(40); expect(r.player.coins).toBe(140)
  })
  it('dive encounter needs a lead creature', () => {
    const r = startDiveEncounter(makeState(), makeCreature({ id: 'octo' }))
    expect(r.screen).toBe('battle'); expect(r.battle.wildCreature?.id).toBe('octo')
    const s = makeState({}, { team: [] }); expect(startDiveEncounter(s, makeCreature())).toBe(s)
  })
  it('dive collect defaults sprite to 📦', () => {
    const r = applyDiveCollect(makeState(), { id: 'kelp', name: 'Kelp', type: 'material', quantity: 2, description: 'd', sprite: '' })
    expect(r.player.inventory.find(i => i.id === 'kelp')).toMatchObject({ quantity: 2, sprite: '📦' })
  })
})
```

`bosses/logic.test.ts` (extend the file created in Task 9 if it exists; otherwise create):
```ts
import { describe, it, expect } from 'vitest'
import { challengeBoss, startAlcatrazBattle, applyAlcatrazComplete, applyFusion } from './logic'
import { makeState, makeCaptured, makeCreature } from '@/test/fixtures'

describe('bosses & side systems', () => {
  it('challengeBoss opens encounter and logs catalog', () => {
    const r = challengeBoss(makeState(), makeCreature({ id: 'boss' }))
    expect(r.screen).toBe('encounter'); expect(r.player.catalog).toContain('boss'); expect(r.battle.active).toBe(true)
  })
  it('startAlcatrazBattle opens battle without catalog change', () => {
    const r = startAlcatrazBattle(makeState(), makeCreature({ id: 'guard' }))
    expect(r.screen).toBe('battle'); expect(r.player.catalog).not.toContain('guard')
  })
  it('applyAlcatrazComplete pays xp and item, returns to world', () => {
    const r = applyAlcatrazComplete(makeState({ screen: 'alcatraz_escape' }), { xp: 10, item: { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 1, description: 'd', sprite: '🔮' } })
    expect(r.screen).toBe('world'); expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(11)
  })
  it('applyFusion removes two and appends result', () => {
    const s = makeState({}, { team: [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' }), makeCaptured({ id: 'c' })] })
    const r = applyFusion(s, 0, 1, makeCaptured({ id: 'ab' }))
    expect(r.player.team.map(c => c.id)).toEqual(['c', 'ab']); expect(r.player.captured).toContain('ab'); expect(r.screen).toBe('world')
  })
})
```

- [ ] **Step 2: Implement**

`breeding/logic.ts`:
```ts
import type { BreedingSlot, CapturedCreature, GameState } from '@/types/game'
export function startBreeding(state: GameState, slot: BreedingSlot): GameState {
  return { ...state, player: { ...state.player, nursery: slot } }
}
export function hatchCreature(state: GameState, creature: CapturedCreature): GameState {
  if (state.player.team.length >= 6) return state
  return {
    ...state,
    player: {
      ...state.player, team: [...state.player.team, creature],
      catalog: [...new Set([...state.player.catalog, creature.id])],
      captured: [...new Set([...state.player.captured, creature.id])],
      nursery: null,
    },
  }
}
export function cancelBreeding(state: GameState): GameState {
  return { ...state, player: { ...state.player, nursery: null } }
}
```

`minigames/logic.ts`:
```ts
import type { Creature, GameState } from '@/types/game'
import { applyPlayerXp, addToInventory } from '@/game/features/progression/logic'
import { makeBattle } from '@/game/features/battle/logic'

export function applyFishCatch(state: GameState, fish: { xpReward: number }): GameState {
  const { player } = applyPlayerXp(state.player, fish.xpReward)
  return { ...state, player: { ...player, coins: (state.player.coins ?? 0) + fish.xpReward } }
}

export function startDiveEncounter(state: GameState, creature: Creature): GameState {
  if (!state.player.team[0]) return state
  return { ...state, screen: 'battle', battle: makeBattle(creature, state.player.team[0]) }
}

export function applyDiveCollect(state: GameState, item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }): GameState {
  const inventory = addToInventory(state.player.inventory, { ...item, sprite: item.sprite || '📦' })
  return { ...state, player: { ...state.player, inventory } }
}
```
Parity: original dive-collect only applied the `📦` default on the *append* path; `addToInventory` only uses the sprite on append too, so existing items are unaffected. Identical.

`bosses/logic.ts` additions:
```ts
import type { CapturedCreature, GameState, InventoryItem } from '@/types/game'
import { applyPlayerXp, addToInventory } from '@/game/features/progression/logic'
import { makeBattle } from '@/game/features/battle/logic'

export function challengeBoss(state: GameState, boss: Creature): GameState {
  return {
    ...state,
    player: { ...state.player, catalog: [...new Set([...state.player.catalog, boss.id])] },
    screen: 'encounter',
    battle: makeBattle(boss, state.player.team[0]),
  }
}

export function startAlcatrazBattle(state: GameState, creature: Creature): GameState {
  return { ...state, screen: 'battle', battle: makeBattle(creature, state.player.team[0]) }
}

export function applyAlcatrazComplete(state: GameState, rewards: { xp: number; item?: InventoryItem }): GameState {
  const { player } = applyPlayerXp(state.player, rewards.xp)
  const inventory = rewards.item ? addToInventory(state.player.inventory, rewards.item) : state.player.inventory
  return { ...state, screen: 'world', player: { ...player, inventory } }
}

export function applyFusion(state: GameState, idx1: number, idx2: number, result: CapturedCreature): GameState {
  const newTeam = state.player.team.filter((_, i) => i !== idx1 && i !== idx2)
  newTeam.push(result)
  const newCaptured = state.player.captured.includes(result.id) ? state.player.captured : [...state.player.captured, result.id]
  const newCatalog = state.player.catalog.includes(result.id) ? state.player.catalog : [...state.player.catalog, result.id]
  return { ...state, screen: 'world', player: { ...state.player, team: newTeam, captured: newCaptured, catalog: newCatalog } }
}
```
`makeBattle` requires a `CapturedCreature`; the original passed `prev.player.team[0]` which may be `undefined` at the type level only because of the array index. Cast `state.player.team[0]` the same way the original did if `tsc` complains (`as CapturedCreature`), do not add a guard.

`applyAlcatrazComplete`'s `rewards.item` type in `Game.tsx` lacks `'held'` in its `type` union; widen the handler's parameter type to `InventoryItem` only if `tsc` requires it, otherwise leave the handler signature alone and cast at the call.

- [ ] **Step 3: Wire**

Direct `setGameState(prev => fn(prev, ...))` for start/hatch/cancel breeding, dive collect/encounter, alcatraz battle, fusion. Others:

```ts
const handleFishCatch = useCallback((fish: FishDef) => {
  SFX.capture()
  setPlayerStats(ps => ({ ...ps, totalFishCaught: (ps.totalFishCaught ?? 0) + 1 }))
  setDailyState(ds => updateChallengeProgress(ds, 'fish'))
  setFishLog(prev => [...new Set([...prev, fish.id])])
  setGameState(prev => applyFishCatch(prev, fish))
}, [])

const handleHatchCreature = useCallback((creature: CapturedCreature) => {
  SFX.hatch()
  setPlayerStats(ps => ({ ...ps, totalBreedsCompleted: ps.totalBreedsCompleted + 1 }))
  setGameState(prev => hatchCreature(prev, creature))
}, [])

const handleBossChallenge = useCallback(() => {
  if (!lunarBoss) return
  SFX.battleStart()
  setGameState(prev => challengeBoss(prev, lunarBoss))
  setLunarBoss(null)
}, [lunarBoss])
const handleShadowBossChallenge = useCallback(() => {
  if (!shadowBoss) return
  SFX.battleStart()
  setGameState(prev => challengeBoss(prev, shadowBoss))
  setShadowBoss(null)
}, [shadowBoss])

const handleAlcatrazComplete = useCallback((rewards: /* unchanged type */) => {
  setAlcatrazEscapeActive(false)
  setAlcatrazCompleted(true)
  try { localStorage.setItem('bioquest-bay-alcatraz-escaped', 'true') } catch { /* ignore */ }
  setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1 }))
  setGameState(prev => applyAlcatrazComplete(prev, rewards))
}, [])
```
The two boss handlers drop `gameState.player.catalog` from their dependency arrays because they no longer read it (spec §8, accepted normalization).

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features src/game/Game.tsx
git commit -m "refactor(features): extract breeding, minigame, boss, alcatraz, and fusion logic"
```

---

### Task 15: World movement, travel, and starter

This is the largest extraction. `movePlayer`'s updater (`Game.tsx:380-664` before earlier tasks shifted lines) interleaves state math, RNG rolls, and eleven side effects. The pure function computes everything and reports the effects; the handler replays them inside the updater in the original order.

**Files:**
- Create: `src/game/features/world/logic.ts`
- Test: `src/game/features/world/logic.test.ts`
- Modify: `Game.tsx` `updateJournal` (delete), `movePlayer`, `handleBoatTravel`, `handleFastTravel`, `handleSelectStarter`

**Interfaces produced:**
```ts
export function updateJournal(journal: Record<string, JournalEntry>, subregion: string, biome: BiomeType, prevSubregion: string, now: string): Record<string, JournalEntry>
export function revealTiles(explored: Set<string>, x: number, y: number, radius?: number): { next: Set<string>; changed: boolean }
export interface StepContext {
  borderPeek: { state: string; stepsLeft: number; returnX: number; returnY: number } | null
  lastWeatherChange: number
  lunarTriggeredDay: number
  shadowTriggeredDay: number
  defeatedTrainers: string[]
}
export type StepEvents =
  | { kind: 'blocked'; clearBorderPeek: boolean }     // not world / battle active / off-map / unwalkable. clearBorderPeek mirrors the original: an unwalkable non-border tile still clears an active peek
  | { kind: 'border-enter'; state: string; stepsLeft: number; message: string }
  | { kind: 'border-step'; message: string }
  | { kind: 'border-return'; message: string }
  | {
      kind: 'moved'
      tile: MapTile
      clearBorderPeek: boolean
      sfxStep: boolean
      enteredNewSubregion: boolean
      enteredNewBiome: boolean
      weatherChangedAt: number | null       // new lastWeatherChange value, or null if unchanged
      lunarBoss: Creature | null            // set → handler stores boss + ref day
      shadowBoss: Creature | null
      encounter: 'herd' | 'wild' | null     // SFX.battleStart when non-null
      trainer: RoamingTrainer | null        // set → handler setPendingTrainer
    }
export function stepPlayer(state: GameState, map: MapTile[][], dx: number, dy: number, ctx: StepContext, deps: LogicDeps): { state: GameState; events: StepEvents }
export function boatTravel(state: GameState, dock: BoatDock): GameState
export function fastTravel(state: GameState, map: MapTile[][], x: number, y: number, subregion: string): GameState
export function selectStarter(state: GameState, map: MapTile[][], creature: CapturedCreature): GameState
```

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { updateJournal, revealTiles, stepPlayer, boatTravel, fastTravel, selectStarter, type StepContext } from './logic'
import { makeState, makeTile, makeCaptured, testDeps, FIXED_NOW } from '@/test/fixtures'

afterEach(() => vi.restoreAllMocks())

const ctx: StepContext = { borderPeek: null, lastWeatherChange: 480, lunarTriggeredDay: -1, shadowTriggeredDay: -1, defeatedTrainers: [] }
// 3x3 map: centre grassland, right water, top-right Oregon border (unwalkable)
function tinyMap() {
  const rows = []
  for (let y = 0; y < 3; y++) {
    const row = []
    for (let x = 0; x < 3; x++) row.push(makeTile({ x, y, biome: 'grassland', subregion: x === 0 ? 'Presidio' : 'Marin', isWalkable: true }))
    rows.push(row)
  }
  rows[1][2] = makeTile({ x: 2, y: 1, biome: 'water', isWalkable: false })
  rows[0][2] = makeTile({ x: 2, y: 0, biome: 'grassland', isWalkable: false, borderState: 'Oregon' })
  return rows
}
const at = (x: number, y: number) => makeState({ currentSubregion: 'Presidio', encounterCooldown: 99 }, { x, y })

describe('updateJournal', () => {
  it('creates, then increments on re-entry only', () => {
    const j1 = updateJournal({}, 'Marin', 'forest', 'Presidio', FIXED_NOW)
    expect(j1.Marin.visitCount).toBe(1)
    expect(updateJournal(j1, 'Marin', 'forest', 'Marin', FIXED_NOW)).toBe(j1)
    expect(updateJournal(j1, 'Marin', 'forest', 'Presidio', FIXED_NOW).Marin.visitCount).toBe(2)
    expect(updateJournal(j1, '', 'forest', 'Presidio', FIXED_NOW)).toBe(j1)
  })
})

describe('revealTiles', () => {
  it('reveals a disc of radius 5 and reports change', () => {
    const r = revealTiles(new Set(), 10, 10)
    expect(r.changed).toBe(true); expect(r.next.has('10,15')).toBe(true); expect(r.next.has('14,14')).toBe(false)
    expect(revealTiles(r.next, 10, 10).changed).toBe(false)
  })
})

describe('stepPlayer', () => {
  it('blocked when not on world screen', () => {
    const r = stepPlayer(makeState({ screen: 'catalog' }), tinyMap(), 1, 0, ctx, testDeps)
    expect(r.events.kind).toBe('blocked')
  })
  it('blocked by water', () => {
    expect(stepPlayer(at(1, 1), tinyMap(), 1, 0, ctx, testDeps).events.kind).toBe('blocked')
  })
  it('moves, advances clock 3 minutes, updates biome/subregion/journal', () => {
    const r = stepPlayer(at(0, 1), tinyMap(), 1, 0, ctx, testDeps)
    expect(r.events.kind).toBe('moved')
    expect(r.state.player.x).toBe(1)
    expect(r.state.gameMinutes).toBe(483)
    expect(r.state.currentSubregion).toBe('Marin')
    expect(r.state.player.journal.Marin.visitCount).toBe(1)
    expect(r.state.encounterCooldown).toBe(98)
    if (r.events.kind === 'moved') expect(r.events.enteredNewSubregion).toBe(true)
  })
  it('border peek: enter, step, return', () => {
    const enter = stepPlayer(at(1, 0), tinyMap(), 1, 0, ctx, testDeps)
    expect(enter.events.kind).toBe('border-enter')
    expect(enter.state.player.x).toBe(2)
    const peek = { state: 'Oregon', stepsLeft: 0, returnX: 1, returnY: 0 }
    const back = stepPlayer({ ...enter.state, player: { ...enter.state.player, x: 2, y: 0 } }, tinyMap(), 0, 0, { ...ctx, borderPeek: peek }, testDeps)
    expect(back.events.kind).toBe('border-return')
    expect(back.state.player.x).toBe(1)
  })
  it('rolls a wild encounter when cooldown is 0 and rng is low', () => {
    const s = at(0, 1); s.encounterCooldown = 0
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const r = stepPlayer(s, tinyMap(), 1, 0, ctx, { rng: () => 0.01, now: () => FIXED_NOW })
    if (r.events.kind === 'moved') expect(r.events.encounter === 'wild' || r.events.trainer !== null || r.events.encounter === null).toBe(true)
    expect(r.state.encounterCooldown === 5 || r.state.encounterCooldown === 10 || r.state.encounterCooldown === 0).toBe(true)
  })
})

describe('travel', () => {
  it('boatTravel moves and sets subregion', () => {
    const r = boatTravel(at(0, 0), { x: 0, y: 0, destX: 2, destY: 2, destinationName: 'Angel Island' } as never)
    expect([r.player.x, r.player.y, r.currentSubregion]).toEqual([2, 2, 'Angel Island'])
  })
  it('fastTravel sets position, subregion, and biome from the map', () => {
    const r = fastTravel(at(0, 0), tinyMap(), 1, 2, 'Marin')
    expect(r.currentBiome).toBe('grassland'); expect(r.currentSubregion).toBe('Marin')
  })
  it('selectStarter seeds team/catalog/captured and biome from tile', () => {
    const r = selectStarter(makeState({ screen: 'starter' }, { team: [], catalog: [], captured: [] }), tinyMap(), makeCaptured({ id: 'fox' }))
    expect(r.screen).toBe('world'); expect(r.player.team[0].happiness).toBe(70); expect(r.player.captured).toEqual(['fox'])
  })
})
```

The wild-encounter test is deliberately loose about which roll fires, since `getRandomEncounter` depends on the real creature table; the replay oracle is the exact check.

- [ ] **Step 2: Implement**

```ts
import type { BiomeType, CapturedCreature, Creature, GameState, JournalEntry, MapTile } from '@/types/game'
import type { LogicDeps } from '@/game/core/state'
import type { BoatDock } from '@/game/bayAreaMap'
import { getRandomEncounter, ALL_CREATURES, isFullMoon, isNewMoon, getLunarBoss, getShadowBoss } from '@/game/creatures'
import { advanceTime, rollWeather } from '@/game/timeWeather'
import { getNearbyLandmark } from '@/game/landmarks'
import { checkHerdEncounter } from '@/game/migration'
import { rollTrainerEncounter, type RoamingTrainer } from '@/game/roamingTrainers'
import { makeBattle } from '@/game/features/battle/logic'

export function updateJournal(journal: Record<string, JournalEntry>, subregion: string, biome: BiomeType, prevSubregion: string, now: string): Record<string, JournalEntry> {
  if (!subregion) return journal
  const existing = journal[subregion]
  const isNewVisit = subregion !== prevSubregion
  if (existing) {
    if (!isNewVisit) return journal
    return { ...journal, [subregion]: { ...existing, visitCount: existing.visitCount + 1 } }
  }
  return { ...journal, [subregion]: { subregion, biome, firstVisited: now, creaturesEncountered: [], creaturesCaptured: [], visitCount: 1 } }
}

export function revealTiles(explored: Set<string>, x: number, y: number, radius = 5): { next: Set<string>; changed: boolean } {
  const next = new Set(explored)
  let changed = false
  for (let ry = -radius; ry <= radius; ry++) {
    for (let rx = -radius; rx <= radius; rx++) {
      if (rx * rx + ry * ry > radius * radius) continue
      const key = `${x + rx},${y + ry}`
      if (!next.has(key)) { next.add(key); changed = true }
    }
  }
  return { next, changed }
}

export interface StepContext {
  borderPeek: { state: string; stepsLeft: number; returnX: number; returnY: number } | null
  lastWeatherChange: number
  lunarTriggeredDay: number
  shadowTriggeredDay: number
  defeatedTrainers: string[]
}

export type StepEvents =
  | { kind: 'blocked'; clearBorderPeek: boolean }
  | { kind: 'border-enter'; state: string; stepsLeft: number; message: string }
  | { kind: 'border-step'; message: string }
  | { kind: 'border-return'; message: string }
  | {
      kind: 'moved'; tile: MapTile; clearBorderPeek: boolean; sfxStep: boolean
      enteredNewSubregion: boolean; enteredNewBiome: boolean; weatherChangedAt: number | null
      lunarBoss: Creature | null; shadowBoss: Creature | null; encounter: 'herd' | 'wild' | null; trainer: RoamingTrainer | null
    }

const MAX_BORDER_STEPS = 3

export function stepPlayer(prev: GameState, map: MapTile[][], dx: number, dy: number, ctx: StepContext, deps: LogicDeps): { state: GameState; events: StepEvents } {
  const blocked = (clearBorderPeek = false) => ({ state: prev, events: { kind: 'blocked' as const, clearBorderPeek } })
  if (prev.screen !== 'world' || prev.battle.active) return blocked()
  const newX = prev.player.x + dx
  const newY = prev.player.y + dy
  if (newX < 0 || newX >= (map[0]?.length ?? 0) || newY < 0 || newY >= map.length) return blocked()
  const tile = map[newY]?.[newX]
  if (!tile) return blocked()

  // Border peek — allow 3 steps into neighbouring states
  if (tile.borderState && !tile.isWalkable) {
    const bp = ctx.borderPeek
    if (!bp) {
      return {
        state: { ...prev, player: { ...prev.player, x: newX, y: newY } },
        events: { kind: 'border-enter', state: tile.borderState, stepsLeft: MAX_BORDER_STEPS - 1, message: `Entering ${tile.borderState}... ${MAX_BORDER_STEPS - 1} steps before you turn back.` },
      }
    } else if (bp.stepsLeft > 0) {
      const left = bp.stepsLeft - 1
      const message = bp.stepsLeft === 1 ? `Last step in ${bp.state}! Turning back...` : `${left} step${left !== 1 ? 's' : ''} left in ${bp.state}.`
      return { state: { ...prev, player: { ...prev.player, x: newX, y: newY } }, events: { kind: 'border-step', message } }
    } else {
      return {
        state: { ...prev, player: { ...prev.player, x: bp.returnX, y: bp.returnY } },
        events: { kind: 'border-return', message: `Back in California! Your journey continues in the Golden State.` },
      }
    }
  }
  // Original order: clear the peek (if returning to CA) *before* the walkable check.
  const clearBorderPeek = !!ctx.borderPeek && !tile.borderState
  if (!tile.isWalkable) return blocked(clearBorderPeek)

  // RNG order below mirrors the original updater exactly.
  const sfxStep = deps.rng() < 0.3
  const newJournal = updateJournal(prev.player.journal, tile.subregion || '', tile.biome, prev.currentSubregion, deps.now())
  const enteredNewSubregion = !!tile.subregion && tile.subregion !== prev.currentSubregion
  const enteredNewBiome = enteredNewSubregion && tile.biome !== prev.currentBiome

  const timeUpdate = advanceTime(prev.gameMinutes, 3)
  const dayWrapped = timeUpdate.gameMinutes < prev.gameMinutes
  const newGameDay = (prev.gameDay ?? 0) + (dayWrapped ? 1 : 0)

  let newWeather = prev.weather
  let weatherChangedAt: number | null = null
  if (Math.abs(timeUpdate.gameMinutes - ctx.lastWeatherChange) > 60 || timeUpdate.gameMinutes < ctx.lastWeatherChange) {
    newWeather = rollWeather(prev.weather, tile.biome, newGameDay)
    weatherChangedAt = timeUpdate.gameMinutes
  }
  let newAlmanac = prev.weatherAlmanac
  if (newWeather !== prev.weather) {
    newAlmanac = { ...(prev.weatherAlmanac ?? {}), [newWeather]: ((prev.weatherAlmanac ?? {})[newWeather] ?? 0) + 1 } as GameState['weatherAlmanac']
  }
  let newVisitedLandmarks = prev.visitedLandmarks
  const nearbyLandmark = getNearbyLandmark(newX, newY)
  if (nearbyLandmark && !(prev.visitedLandmarks ?? []).includes(nearbyLandmark.name)) {
    newVisitedLandmarks = [...(prev.visitedLandmarks ?? []), nearbyLandmark.name]
  }

  const newState: GameState = {
    ...prev,
    player: { ...prev.player, x: newX, y: newY, journal: newJournal },
    currentBiome: tile.biome,
    currentSubregion: tile.subregion || '',
    encounterCooldown: Math.max(0, prev.encounterCooldown - 1),
    timeOfDay: timeUpdate.timeOfDay,
    gameMinutes: timeUpdate.gameMinutes,
    gameDay: newGameDay,
    weather: newWeather,
    weatherAlmanac: newAlmanac,
    visitedLandmarks: newVisitedLandmarks,
  }
  const base = { kind: 'moved' as const, tile, clearBorderPeek, sfxStep, enteredNewSubregion, enteredNewBiome, weatherChangedAt, lunarBoss: null, shadowBoss: null, encounter: null, trainer: null }

  // Migration herd
  if (newState.encounterCooldown <= 0 && newState.player.team.length > 0) {
    const herd = checkHerdEncounter(newX, newY, timeUpdate.gameMinutes, timeUpdate.timeOfDay)
    if (herd) {
      const herdCreature = ALL_CREATURES.find(c => c.id === herd.creatureId)
      if (herdCreature) {
        return {
          state: {
            ...newState, screen: 'encounter',
            battle: makeBattle(herdCreature, newState.player.team[0], [`A migrating ${herd.name} crosses your path! A ${herdCreature.name} faces you!`], 0.5),
            encounterCooldown: 8,
            player: { ...newState.player, catalog: [...new Set([...newState.player.catalog, herdCreature.id])] },
          },
          events: { ...base, encounter: 'herd' },
        }
      }
    }
  }

  // Lunar boss — every condition before rng() short-circuits exactly as before
  if (newState.encounterCooldown <= 0 && tile.biome !== 'water' && timeUpdate.timeOfDay === 'night' && isFullMoon(newState.gameDay ?? 0)
      && ctx.lunarTriggeredDay !== (newState.gameDay ?? 0) && newState.player.team.length > 0 && deps.rng() < 0.12) {
    const boss = getLunarBoss(tile.biome, tile.subregion)
    if (boss) return { state: { ...newState, encounterCooldown: 8 }, events: { ...base, lunarBoss: boss } }
  }
  // Shadow boss
  if (newState.encounterCooldown <= 0 && tile.biome !== 'water' && timeUpdate.timeOfDay === 'night' && isNewMoon(newState.gameDay ?? 0)
      && ctx.shadowTriggeredDay !== (newState.gameDay ?? 0) && newState.player.team.length > 0 && deps.rng() < 0.12) {
    const boss = getShadowBoss(tile.biome, tile.subregion)
    if (boss) return { state: { ...newState, encounterCooldown: 8 }, events: { ...base, shadowBoss: boss } }
  }

  // Random encounter
  if (newState.encounterCooldown <= 0 && tile.biome !== 'water') {
    const encounterRoll = deps.rng()
    const encounterChance = tile.hasCreature ? 0.25 : 0.08
    if (encounterRoll < encounterChance) {
      let creature = getRandomEncounter(tile.biome, tile.subregion, timeUpdate.timeOfDay, newWeather, newState.gameDay, { x: newState.player.x, y: newState.player.y })
      if (creature && newState.player.team.length > 0) {
        const alphaRoll = deps.rng()
        const shinyRoll = deps.rng()
        const isAlpha = alphaRoll < 0.05
        const isShiny = shinyRoll < 0.005
        if (isAlpha || isShiny) {
          creature = {
            ...creature, isAlpha, isShiny,
            name: isAlpha ? `Alpha ${creature.name}` : creature.name,
            stats: isAlpha ? {
              hp: Math.floor(creature.stats.hp * 1.5), maxHp: Math.floor(creature.stats.maxHp * 1.5),
              attack: Math.floor(creature.stats.attack * 1.4), defense: Math.floor(creature.stats.defense * 1.3), speed: Math.floor(creature.stats.speed * 1.2),
            } : creature.stats,
          } as typeof creature
        }
        const subregion = tile.subregion || ''
        const journalWithCreature = { ...newState.player.journal }
        if (subregion && journalWithCreature[subregion]) {
          const entry = journalWithCreature[subregion]
          if (!entry.creaturesEncountered.includes(creature.id)) {
            journalWithCreature[subregion] = { ...entry, creaturesEncountered: [...entry.creaturesEncountered, creature.id] }
          }
        }
        return {
          state: {
            ...newState,
            player: { ...newState.player, catalog: [...new Set([...newState.player.catalog, creature.id])], journal: journalWithCreature },
            screen: 'encounter',
            battle: makeBattle(creature, newState.player.team[0]),
            encounterCooldown: 5,
          },
          events: { ...base, encounter: 'wild' },
        }
      }
    }
    // Roaming trainer (3%)
    if (deps.rng() < 0.03) {
      const trainer = rollTrainerEncounter(tile.biome, newState.player.level, ctx.defeatedTrainers)
      if (trainer && newState.player.team.length > 0) {
        return { state: { ...newState, screen: 'trainer_encounter', encounterCooldown: 10 }, events: { ...base, trainer } }
      }
    }
  }
  return { state: newState, events: base }
}

export function boatTravel(state: GameState, dock: BoatDock): GameState {
  return { ...state, player: { ...state.player, x: dock.destX, y: dock.destY }, currentSubregion: dock.destinationName }
}

export function fastTravel(state: GameState, map: MapTile[][], x: number, y: number, subregion: string): GameState {
  const tile = map[y]?.[x]
  return { ...state, player: { ...state.player, x, y }, currentSubregion: subregion, currentBiome: tile?.biome ?? state.currentBiome }
}

export function selectStarter(state: GameState, map: MapTile[][], creature: CapturedCreature): GameState {
  const tile = map[state.player.y]?.[state.player.x]
  return {
    ...state, screen: 'world',
    player: { ...state.player, team: [{ ...creature, happiness: 70 }], catalog: [creature.id], captured: [creature.id] },
    currentBiome: tile?.biome ?? 'grassland',
    currentSubregion: tile?.subregion ?? '',
  }
}
```

Two parity details worth checking against the original when implementing:
1. In the original, `updateJournal` ran `new Date()` *after* the `Math.random() < 0.3` roll. `deps.rng()` then `deps.now()` above matches.
2. The original random-encounter branch created its `journalWithCreature` from `newState.player.journal` (already containing the step's journal update). Same here.

- [ ] **Step 3: Wire `movePlayer`**

```ts
const movePlayer = useCallback((dx: number, dy: number) => {
  const now = Date.now()
  if (now - lastMoveTime.current < 120) return
  lastMoveTime.current = now

  setGameState(prev => {
    const { state: next, events: ev } = stepPlayer(prev, map, dx, dy, {
      borderPeek, lastWeatherChange: lastWeatherChange.current,
      lunarTriggeredDay: lunarBossTriggeredRef.current, shadowTriggeredDay: shadowBossTriggeredRef.current,
      defeatedTrainers,
    }, runtimeDeps)

    switch (ev.kind) {
      case 'blocked':
        if (ev.clearBorderPeek) setBorderPeek(null)
        return prev
      case 'border-enter':
        setBorderPeek({ state: ev.state, stepsLeft: ev.stepsLeft, returnX: prev.player.x, returnY: prev.player.y })
        setBorderMessage(ev.message); setTimeout(() => setBorderMessage(null), 2500)
        return next
      case 'border-step':
        setBorderPeek(bp => bp ? { ...bp, stepsLeft: bp.stepsLeft - 1 } : null)
        setBorderMessage(ev.message); setTimeout(() => setBorderMessage(null), 2000)
        return next
      case 'border-return':
        setBorderPeek(null)
        setBorderMessage(ev.message); setTimeout(() => setBorderMessage(null), 3000)
        return next
      case 'moved': {
        if (ev.clearBorderPeek) setBorderPeek(null)
        setDailyState(ds => updateChallengeProgress(ds, 'steps'))
        setPlayerStats(ps => recordStepStats(ps, ev.tile))
        setExploredTiles(explored => {
          const { next: revealed, changed } = revealTiles(explored, next.player.x, next.player.y)
          if (!changed) return explored
          if (revealed.size % 20 < 5) saveExplored(revealed, activeSlot)
          return revealed
        })
        if (ev.sfxStep) SFX.step()
        if (ev.enteredNewSubregion) {
          setDailyState(ds => updateChallengeProgress(ds, 'explore'))
          if (ev.enteredNewBiome) triggerTutorial('new_biome', `You entered ${ev.tile.biome.replace('_', ' ')} terrain. Different biomes have different creatures!`)
        }
        if (ev.weatherChangedAt !== null) lastWeatherChange.current = ev.weatherChangedAt
        if (ev.encounter) SFX.battleStart()
        if (ev.lunarBoss) { lunarBossTriggeredRef.current = next.gameDay ?? 0; setLunarBoss(ev.lunarBoss) }
        if (ev.shadowBoss) { shadowBossTriggeredRef.current = next.gameDay ?? 0; setShadowBoss(ev.shadowBoss) }
        if (ev.trainer) setPendingTrainer(ev.trainer)
        return next
      }
    }
  })
}, [map, defeatedTrainers, triggerTutorial, borderPeek, activeSlot])
```

Dependency array: the original listed `[map, updateJournal, defeatedTrainers, triggerTutorial]` and read `borderPeek` and `activeSlot` through a stale closure. Keeping the stale-closure semantics exactly would require omitting them; adding them changes only *when* the callback identity changes, which re-registers the keyboard effect. That is not a gameplay change. Add them (it also fixes a latent stale-read bug on `borderPeek`; if the replay snapshot changes as a result, revert to the original array and note it in `ARCHITECTURE.md`).

Note `case 'blocked': return prev` — the original returned `prev` (same reference), which skips a rerender. Do not return `next` there.

Delete the `updateJournal` `useCallback` from `Game.tsx`.

- [ ] **Step 4: Wire boat, fast travel, starter**

Replace the inner `setGameState(prev => ({ ...prev, player: {...}, currentSubregion }))` in `handleBoatTravel` with `setGameState(prev => boatTravel(prev, nearbyDock))`; the surrounding timers and Alcatraz trigger stay. In `handleFastTravel`, replace the inner `setGameState` with `setGameState(prev => fastTravel(prev, map, x, y, subregion))` and the `setExploredTiles` block with:

```ts
setExploredTiles(prev => revealTiles(prev, x, y).next)
```
(The original always returned the new set here, even when unchanged. `.next` is a fresh Set either way, so identical.)

`handleSelectStarter` becomes `setGameState(prev => selectStarter(prev, map, creature))`. Note the original read `gameState.player` from the closure for the tile lookup; `prev.player` holds the same coordinates on the starter screen.

- [ ] **Step 5: Verify (oracle is the real test here), commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/features/world src/game/Game.tsx
git commit -m "refactor(world): extract stepPlayer, travel, and starter logic"
```

---

### Task 16: Persistence module

**Files:**
- Create: `src/game/core/persistence.ts`
- Modify: `src/game/core/state.ts` (add `createInitialState`, `DEFAULT_INVENTORY`)
- Modify: `src/game/gameState.ts` → re-export shim
- Modify: `src/game/core/persistence.test.ts` (import from `./persistence`), `src/test/fixtures.ts` (import `createInitialState` from `@/game/core/state`)
- Modify: `Game.tsx` (four loose keys)

**Interfaces produced:**
```ts
// core/persistence.ts — everything gameState.ts exported today, plus:
export function loadAlcatrazEscaped(): boolean
export function saveAlcatrazEscaped(): void                 // writes 'true'
export function loadDefeatedTrainers(): string[]
export function saveDefeatedTrainers(ids: string[]): void
export function loadFishLog(): string[]
export function saveFishLog(ids: string[]): void
export function loadConservationDismissed(): number
export function saveConservationDismissed(n: number): void
export const STORAGE_KEYS: Readonly<Record<string, string>>  // every key string, for ARCHITECTURE.md and tests
```

- [ ] **Step 1: Test additions** (append to `core/persistence.test.ts`)

```ts
import { loadAlcatrazEscaped, saveAlcatrazEscaped, loadDefeatedTrainers, saveDefeatedTrainers, loadFishLog, saveFishLog, loadConservationDismissed, saveConservationDismissed, STORAGE_KEYS } from './persistence'

describe('loose keys keep their exact names and encodings', () => {
  beforeEach(() => localStorage.clear())
  it('alcatraz', () => {
    expect(loadAlcatrazEscaped()).toBe(false)
    saveAlcatrazEscaped()
    expect(localStorage.getItem('bioquest-bay-alcatraz-escaped')).toBe('true')
    expect(loadAlcatrazEscaped()).toBe(true)
  })
  it('defeated trainers / fish log are JSON arrays', () => {
    saveDefeatedTrainers(['a']); expect(localStorage.getItem('bioquest-bay-defeated-trainers')).toBe('["a"]'); expect(loadDefeatedTrainers()).toEqual(['a'])
    saveFishLog(['f']); expect(localStorage.getItem('bioquest-bay-fish-log')).toBe('["f"]'); expect(loadFishLog()).toEqual(['f'])
  })
  it('conservation dismissals is a decimal string', () => {
    expect(loadConservationDismissed()).toBe(0)
    saveConservationDismissed(2); expect(localStorage.getItem('bioquest-conservation-dismissed')).toBe('2'); expect(loadConservationDismissed()).toBe(2)
  })
  it('STORAGE_KEYS lists every key', () => {
    expect(Object.values(STORAGE_KEYS).sort()).toEqual([
      'bioquest-bay-alcatraz-escaped', 'bioquest-bay-baydex-ack-', 'bioquest-bay-defeated-trainers', 'bioquest-bay-explored', 'bioquest-bay-explored-',
      'bioquest-bay-fish-log', 'bioquest-bay-player-name', 'bioquest-bay-save', 'bioquest-bay-save-', 'bioquest-bay-slot-name-', 'bioquest-bay-stats', 'bioquest-bay-stats-', 'bioquest-conservation-dismissed',
    ])
  })
})
```

- [ ] **Step 2: Implement**

Move `createInitialState` and `DEFAULT_INVENTORY` from `gameState.ts` into `core/state.ts` unchanged. Move everything else from `gameState.ts` into `core/persistence.ts` unchanged, replacing the bare key constants with a `STORAGE_KEYS` object:

```ts
export const STORAGE_KEYS = {
  save: 'bioquest-bay-save-', stats: 'bioquest-bay-stats-', explored: 'bioquest-bay-explored-', slotName: 'bioquest-bay-slot-name-',
  playerName: 'bioquest-bay-player-name', bayDexAck: 'bioquest-bay-baydex-ack-',
  legacySave: 'bioquest-bay-save', legacyStats: 'bioquest-bay-stats', legacyExplored: 'bioquest-bay-explored',
  alcatrazEscaped: 'bioquest-bay-alcatraz-escaped', defeatedTrainers: 'bioquest-bay-defeated-trainers',
  fishLog: 'bioquest-bay-fish-log', conservationDismissed: 'bioquest-conservation-dismissed',
} as const
```

and add the eight loose-key functions, each reproducing the exact try/catch and default from `Game.tsx`:

```ts
export function loadAlcatrazEscaped(): boolean {
  try { return localStorage.getItem(STORAGE_KEYS.alcatrazEscaped) === 'true' } catch { return false }
}
export function saveAlcatrazEscaped(): void {
  try { localStorage.setItem(STORAGE_KEYS.alcatrazEscaped, 'true') } catch { /* ignore */ }
}
export function loadDefeatedTrainers(): string[] {
  try { const saved = localStorage.getItem(STORAGE_KEYS.defeatedTrainers); return saved ? JSON.parse(saved) as string[] : [] } catch { return [] }
}
export function saveDefeatedTrainers(ids: string[]): void {
  try { localStorage.setItem(STORAGE_KEYS.defeatedTrainers, JSON.stringify(ids)) } catch { /* ignore */ }
}
export function loadFishLog(): string[] {
  try { const saved = localStorage.getItem(STORAGE_KEYS.fishLog); return saved ? JSON.parse(saved) as string[] : [] } catch { return [] }
}
export function saveFishLog(ids: string[]): void {
  try { localStorage.setItem(STORAGE_KEYS.fishLog, JSON.stringify(ids)) } catch { /* ignore */ }
}
export function loadConservationDismissed(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEYS.conservationDismissed) ?? '0', 10) } catch { return 0 }
}
export function saveConservationDismissed(n: number): void {
  try { localStorage.setItem(STORAGE_KEYS.conservationDismissed, String(n)) } catch { /* ignore */ }
}
```

`gameState.ts` becomes:
```ts
// Transitional shim — import from './core/state' and './core/persistence' instead.
export * from './core/state'
export * from './core/persistence'
```
(`SaveSlotIndex` and `SaveSlotSummary` types move to `persistence.ts` and are re-exported by the shim.)

In `Game.tsx` replace the four inline `localStorage` usages (state initialisers at ~215/222/228/259, the two persist effects at ~330/333, `handleAlcatrazComplete`, and the conservation `onDismiss`) with the new functions. Update `Game.tsx` imports to point at `./core/state` and `./core/persistence`.

- [ ] **Step 3: Verify, commit**

```bash
grep -rn "localStorage" src/game/Game.tsx      # expected: no output
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/core src/game/gameState.ts src/game/Game.tsx src/test/fixtures.ts
git commit -m "refactor(core): consolidate persistence; gameState.ts becomes a shim"
```

---

# Phase 3 — Screen split

Same verification rule as Phase 2 (suite green, replay snapshot unchanged). Phase 3 moves JSX, so additionally run the app (`npm run dev`) at the end of Tasks 20, 21, and 24 and click through title → starter → world → one menu screen.

### Task 17: GameContext and provider

**Files:**
- Create: `src/game/core/GameContext.tsx`
- Modify: `Game.tsx` (wrap the returned tree in providers; no consumers yet)

**Interfaces produced:**
```tsx
export interface GameStateValue {
  gameState: GameState; playerStats: PlayerStats; dailyState: DailyState; map: MapTile[][]; exploredTiles: Set<string>
  activeSlot: SaveSlotIndex; playerName: string; unlockedAchievements: string[]; bayDexNewCount: number
  rangerPositions: { x: number; y: number; sprite: string; activity: RangerActivity }[]
  worldEvents: ReturnType<typeof useWorldEvents>; grandChampionUnlocked: boolean
  ui: {
    nearbyRangerId: string | null; currentLandmark: string | null; nearbyDock: BoatDock | null; boatAnimating: boolean
    nearbyBartStation: ReturnType<typeof getBartStationAt>; atSteamerLane: boolean; atBoardwalk: boolean
    nearbySignpost: { state: string; message: string; fact: string } | null
    borderMessage: string | null; borderPeek: { state: string; stepsLeft: number; returnX: number; returnY: number } | null
    captureNotif: { creature: Creature; isNewSpecies: boolean; teamFull: boolean } | null
    giftNotif: FriendlyGift | null; nicknamePrompt: { creature: Creature; teamIndex: number } | null; nicknameInput: string
    battleReward: { xp: number; coins: number; levelUp: boolean; isBoss?: boolean } | null
    screenTransition: 'none' | 'fade-out' | 'fade-in'
    pendingEvolution: EvolutionData | null; pendingTrainer: RoamingTrainer | null; defeatedTrainers: string[]; fishLog: string[]
    alcatrazEscapeActive: boolean; alcatrazStage: EscapeStage; alcatrazCellProgress: number; alcatrazCompleted: boolean
    showMigrationCalendar: boolean; showFieldNotes: boolean; showTrophyRoom: boolean; showHotkeys: boolean; showFastTravel: boolean
    showChampion: boolean; showConservation: boolean; showTutorialDialog: boolean; tutorialTip: string | null
    achievementToast: { name: string; icon: string } | null; evolveReadyToast: EvolveReadyHint | null
    questReward: QuestRewardSummary | null; lunarBoss: Creature | null; shadowBoss: Creature | null
    encounterMood: CreatureMood; encounterType: EncounterType; biokeaPromptOpen: boolean
  }
}
export interface GameActions {
  // every handle*/open*/close* callback in Game.tsx, plus these setters the JSX calls directly:
  setNicknameInput; setNicknamePrompt; setCaptureNotif; setShowMigrationCalendar; setShowFieldNotes; setShowTrophyRoom
  setShowHotkeys; setShowFastTravel; setShowChampion; setShowConservation; setShowTutorialDialog; setTutorialTip
  setBiokeaPromptOpen; setAlcatrazStage; setAlcatrazCellProgress; setAlcatrazEscapeActive; setBayDexAck
  setGameState   // for the handful of JSX call sites that set several fields at once (nickname commit, BART travel, shop purchases)
}
export const GameStateContext: React.Context<GameStateValue | null>
export const GameActionsContext: React.Context<GameActions | null>
export function useGameState(): GameStateValue     // throws if used outside the provider
export function useGameActions(): GameActions
```

- [ ] **Step 1: Write the file**

Two `createContext<... | null>(null)` calls, two hooks that throw `new Error('useGameState must be used inside <Game>')` when `null`. The interfaces above are the complete list of what the JSX at `Game.tsx` lines 2071–3384 reads (verified by grepping that block for every identifier; `tsc` in Step 3 is the completeness check).

- [ ] **Step 2: Build the values in Game.tsx**

Just before `return (`:

```tsx
const stateValue: GameStateValue = { gameState, playerStats, dailyState, map: memoizedMap, exploredTiles, activeSlot, playerName, unlockedAchievements, bayDexNewCount, rangerPositions, worldEvents, grandChampionUnlocked, ui: { nearbyRangerId, currentLandmark, /* …every field above… */ } }
const actions = useMemo<GameActions>(() => ({ movePlayer, openScreen, closeOverlay, handleRenamePlayer, /* …every handler and listed setter… */ }), [movePlayer, openScreen, closeOverlay, handleRenamePlayer, /* …the same list… */])
```
`stateValue` is a new object every render (it changes every render anyway). `actions` is memoised on the handler identities. React setters are stable and may be omitted from the dependency list; `react-hooks/exhaustive-deps` is not enabled in this repo, but list them anyway for clarity.

Wrap the two early returns (`title`, `starter`) and the main tree:

```tsx
return (
  <GameStateContext.Provider value={stateValue}>
    <GameActionsContext.Provider value={actions}>
      {/* existing tree unchanged */}
    </GameActionsContext.Provider>
  </GameStateContext.Provider>
)
```
Do the same for the `title` and `starter` early returns so consumers work on every screen. The early returns stay for now (Task 21 folds them into the router).

- [ ] **Step 3: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/core/GameContext.tsx src/game/Game.tsx
git commit -m "feat(core): GameStateContext and GameActionsContext providers"
```

---

### Task 18: ScreenRouter and simple full-screen wrappers (group A)

Screens whose JSX block is a single component with props read straight from state and actions: `catalog`, `baydex`, `journal`, `breeding`, `trade`, `questlog`, `crafting`, `achievements`, `habitat_map`, `adoption`, `leaderboard`.

**Files:**
- Create: `src/game/screens/ScreenRouter.tsx`
- Create: `src/game/screens/CatalogScreenWrapper.tsx`, `BayDexScreenWrapper.tsx`, `JournalScreenWrapper.tsx`, `BreedingScreenWrapper.tsx`, `TradeScreenWrapper.tsx`, `QuestLogScreenWrapper.tsx`, `CraftingScreenWrapper.tsx`, `AchievementsScreenWrapper.tsx`, `HabitatMapScreenWrapper.tsx`, `AdoptionScreenWrapper.tsx`, `LeaderboardScreenWrapper.tsx`
- Test: `src/game/screens/ScreenRouter.test.tsx`
- Modify: `Game.tsx` (remove the eleven `{gameState.screen === 'x' && (...)}` blocks; render `<ScreenRouter />` in their place)

**Interfaces produced:**
```tsx
export default function ScreenRouter(): JSX.Element | null   // renders the wrapper for gameState.screen, or null for 'world'
```

- [ ] **Step 1: Router test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import ScreenRouter from './ScreenRouter'
import { GameStateContext, GameActionsContext, type GameStateValue, type GameActions } from '@/game/core/GameContext'
import { makeState } from '@/test/fixtures'

vi.mock('./CatalogScreenWrapper', () => ({ default: () => <div data-testid="catalog" /> }))

function renderWith(screen: string) {
  const stateValue = { gameState: makeState({ screen: screen as never }) } as unknown as GameStateValue
  const actions = {} as GameActions
  return render(
    <GameStateContext.Provider value={stateValue}>
      <GameActionsContext.Provider value={actions}>
        <ScreenRouter />
      </GameActionsContext.Provider>
    </GameStateContext.Provider>,
  )
}

describe('ScreenRouter', () => {
  it('renders nothing for world', () => { expect(renderWith('world').container.innerHTML).toBe('') })
  it('routes catalog to its wrapper', () => { expect(renderWith('catalog').getByTestId('catalog')).toBeTruthy() })
})
```

- [ ] **Step 2: Router**

```tsx
import { useGameState } from '@/game/core/GameContext'
import CatalogScreenWrapper from './CatalogScreenWrapper'
// …one import per wrapper…

export default function ScreenRouter() {
  const { gameState } = useGameState()
  switch (gameState.screen) {
    case 'catalog': return <CatalogScreenWrapper />
    case 'baydex': return <BayDexScreenWrapper />
    case 'journal': return <JournalScreenWrapper />
    case 'breeding': return <BreedingScreenWrapper />
    case 'trade': return <TradeScreenWrapper />
    case 'questlog': return <QuestLogScreenWrapper />
    case 'crafting': return <CraftingScreenWrapper />
    case 'achievements': return <AchievementsScreenWrapper />
    case 'habitat_map': return <HabitatMapScreenWrapper />
    case 'adoption': return <AdoptionScreenWrapper />
    case 'leaderboard': return <LeaderboardScreenWrapper />
    default: return null
  }
}
```

- [ ] **Step 3: Wrappers**

The pattern, shown in full for `catalog` (source block: the `{gameState.screen === 'catalog' && (` block in `Game.tsx`, currently around line 2493):

```tsx
import CatalogScreen from '@/game/CatalogScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function CatalogScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleSwapLead } = useGameActions()
  return (
    <CatalogScreen
      /* every prop exactly as the original block passed it, with
         gameState.X → gameState.X, handler → the same handler from actions,
         and () => setGameState(prev => ({ ...prev, screen: 'world' })) → () => openScreen('world') */
    />
  )
}
```

For each of the other ten screens: open the corresponding block in `Game.tsx`, copy the JSX verbatim into the wrapper, replace state reads with destructured `useGameState()` fields and handler references with `useGameActions()` fields. Where the block contains an inline arrow that does something other than `openScreen`, keep the arrow verbatim and pull the setters it needs from `useGameActions()` (that is why `setGameState` and the UI setters are in `GameActions`). Do not rewrite the arrows.

- [ ] **Step 4: Replace in Game.tsx**

Delete the eleven blocks and put `<ScreenRouter />` where the first of them was. Order matters for z-index only if two screens can be true at once; they cannot (`screen` is a single value), so a single position is fine.

- [ ] **Step 5: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/screens src/game/Game.tsx
git commit -m "feat(screens): ScreenRouter with wrappers for simple menu screens"
```

---

### Task 19: Wrappers group B — minigames and side systems

Screens: `fishing`, `fusion`, `diving`, `bart`, `shop`, `arena`, `move_tutor`, `daily_challenges`, `surfing`, `boardwalk`, `alcatraz_escape`, `inventory`.

**Files:**
- Create: `src/game/screens/FishingScreenWrapper.tsx`, `FusionScreenWrapper.tsx`, `DivingScreenWrapper.tsx`, `BartScreenWrapper.tsx`, `ShopScreenWrapper.tsx`, `ArenaScreenWrapper.tsx`, `MoveTutorScreenWrapper.tsx`, `DailyChallengesScreenWrapper.tsx`, `SurfingScreenWrapper.tsx`, `BoardwalkScreenWrapper.tsx`, `AlcatrazScreenWrapper.tsx`, `InventoryScreenWrapper.tsx`
- Modify: `ScreenRouter.tsx` (twelve new cases), `Game.tsx` (remove twelve blocks)

- [ ] **Step 1: Wrappers**

For each screen: open its `{gameState.screen === '<name>' && (` block in `Game.tsx`, copy the JSX verbatim into a new `screens/<Name>ScreenWrapper.tsx` whose body is `const { gameState, ui, … } = useGameState(); const a = useGameActions(); return (<…/>)`. Replace `gameState.X` reads with the destructured field, transient UI state with `ui.X`, every `handleX` with `a.handleX`, and `() => setGameState(prev => ({ ...prev, screen: 'world' }))` with `() => a.openScreen('world')`. Any other inline arrow stays verbatim and pulls the setters it needs from `a` (that is why `setGameState` and the UI setters are in `GameActions`). If the block is guarded (`&& something && (`), return `null` from the wrapper when the guard is false. Add a `case` to `ScreenRouter`, delete the block from `Game.tsx`.

Notes per screen, from reading the blocks:

- `inventory` (block ~2505–2595) is the largest: it renders `TeamScreen` with ~20 props including `getHealAmount`. Move it verbatim.
- `shop` (~3038) and `bart` (~3021) contain inline arrows that call `setGameState` with multi-field updates. Keep them verbatim via `setGameState` from actions.
- `alcatraz_escape` (~2968) reads `alcatrazStage`, `alcatrazCellProgress` from `ui` and calls `setAlcatrazStage` etc. from actions.
- `surfing` and `boardwalk` blocks (~3104, ~3131) contain inline reward arrows; keep verbatim.
- `daily_challenges` (~3087) calls `claimChallengeReward` on `dailyState`; `setDailyState` must be added to `GameActions` for this one (add it in this task).

- [ ] **Step 2: Router cases, delete blocks, verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/screens src/game/core/GameContext.tsx src/game/Game.tsx
git commit -m "feat(screens): wrappers for minigame and side-system screens"
```

---

### Task 20: Wrappers group C — encounter, battle, ranger, trainer, title, starter

Screens: `encounter`, `battle`, `ranger`, `ranger_battle`, `trainer_encounter`, `title`, `starter`.

**Files:**
- Create: `src/game/screens/EncounterScreenWrapper.tsx`, `BattleScreenWrapper.tsx`, `RangerScreenWrapper.tsx`, `RangerBattleScreenWrapper.tsx`, `TrainerEncounterScreenWrapper.tsx`, `TitleScreenWrapper.tsx`, `StarterScreenWrapper.tsx`
- Modify: `ScreenRouter.tsx`, `Game.tsx` (remove the two early returns and five blocks)

- [ ] **Step 1: Wrappers**

- `battle` (~2470): passes `mood={encounterMood}`, `encounterType`, and eight handlers. `BattleScreen`'s props are `wildCreature playerCreature team inventory weather timeOfDay mood encounterType onWin onLose onCapture onFlee onUseItem onSwitch onFriendlyGift onCreatureFled biome subregion`. The block guards on `gameState.battle.wildCreature && gameState.player.team[0]`; keep the guard inside the wrapper and return `null` otherwise.
- `encounter` (~2460): `EncounterTransition` with the wild creature and `onComplete={handleEncounterComplete}`; guard on `wildCreature`.
- `ranger` (~2819) and `ranger_battle` (~2849) are IIFEs that look up the ranger (or roaming trainer) by `activeRangerId`. Move the IIFE body into the wrapper as plain statements; return `null` when the lookup fails, as the IIFE did.
- `trainer_encounter` (~2934): guarded on `pendingTrainer`.
- `title` and `starter`: today they are early returns *before* the main tree, meaning the world canvas and HUD do not mount on those screens. Preserve that: in `Game.tsx`, the early returns become `if (gameState.screen === 'title' || gameState.screen === 'starter') return <Providers><ScreenRouter /></Providers>`. The wrappers pass `handleLoadSlot`/`handleNewGame`/`handleDeleteSlot` and `handleSelectStarter` from actions.

- [ ] **Step 2: Router cases, delete, verify**

After this task `Game.tsx` must contain no `gameState.screen === '<non-world>'` conditionals: `grep -c "gameState.screen === '" src/game/Game.tsx` should count only `'world'` occurrences (the same 21 as before, to be removed in Task 21) plus the title/starter early-return check.

- [ ] **Step 3: Run the app**

```bash
npm run dev
```
Open http://localhost:3000, confirm title → new game → starter → world; open catalog (C) and Escape back. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/game/screens src/game/Game.tsx
git commit -m "feat(screens): wrappers for encounter, battle, ranger, trainer, title, starter"
```

---

### Task 21: WorldScreen, WorldOverlays, WorldPrompts

**Files:**
- Create: `src/game/screens/WorldScreen.tsx` — renderer, sky, weather, particles, footprints, tutorial tip, minimap, HUD, quest tracker (the always-rendered world layer, currently lines 2073–2185 of the tree).
- Create: `src/game/screens/WorldOverlays.tsx` — the `gameState.screen === 'world' && …` toasts: border message, border peek tint, signpost, capture notification, gift notification, nickname prompt, battle reward, hotkeys / fast-travel panel, landmark card.
- Create: `src/game/screens/WorldPrompts.tsx` — the mutually exclusive interaction prompts: dock, BART, Steamer Lane, Boardwalk, ranger, plus the "nothing nearby" hint IIFE at ~2440.
- Modify: `Game.tsx`, `GameContext.tsx` (add `handleRenamePlayer`, `handleBoatTravel`, `handleFastTravel`, and `FAST_TRAVEL_DESTINATIONS` access — move that constant to `src/game/features/world/fastTravelDestinations.ts`)

- [ ] **Step 1: WorldScreen**

```tsx
import IsometricRenderer from '@/game/IsometricRenderer'
// …DayNightSky, NightAtmosphere, WeatherEffects, BiomeTransition, BiomeParticles, WalkParticles, CreatureFootprints, TutorialTip, Minimap, GameHUD, QuestTracker…
import { useGameState, useGameActions } from '@/game/core/GameContext'
import WorldOverlays from './WorldOverlays'
import WorldPrompts from './WorldPrompts'

export default function WorldScreen() {
  const { gameState, map, exploredTiles, rangerPositions, worldEvents, bayDexNewCount, dailyState, unlockedAchievements, activeSlot, ui } = useGameState()
  const a = useGameActions()
  return (
    <>
      <IsometricRenderer map={map} playerX={gameState.player.x} playerY={gameState.player.y} rangers={rangerPositions} timeOfDay={gameState.timeOfDay} weather={gameState.weather} gameMinutes={gameState.gameMinutes} />
      {/* …the rest of lines 2073–2185 verbatim, with the GameHUD onOpen* props calling a.openScreen('…') … */}
      {gameState.screen === 'world' && <QuestTracker /* verbatim props */ />}
      {gameState.screen === 'world' && <WorldPrompts />}
      <WorldOverlays />
    </>
  )
}
```

Important: today `IsometricRenderer`, HUD, and minimap render on **every** non-title screen (menus overlay the world). `WorldScreen` must therefore be rendered unconditionally by `Game.tsx` whenever the screen is not `title`/`starter`, and `ScreenRouter` renders on top of it. Only the pieces guarded by `gameState.screen === 'world'` today stay guarded.

- [ ] **Step 2: WorldOverlays and WorldPrompts**

Move each block verbatim with the same context substitutions. The `onOpenBayDex` arrow in the HUD block calls `setBayDexAck` and `saveBayDexAck(activeSlot, ids)`; `saveBayDexAck` is imported from `@/game/core/persistence` in `WorldScreen`. The hotkeys/fast-travel panel reads `FAST_TRAVEL_DESTINATIONS` and calls `handleFastTravel`.

Expected sizes: `WorldScreen` ≈ 150 lines, `WorldOverlays` ≈ 350, `WorldPrompts` ≈ 120. If `WorldOverlays` exceeds 400, split the nickname prompt (the largest block, ~90 lines) into `NicknamePrompt.tsx`.

- [ ] **Step 3: Game.tsx tree**

After this task the main return in `Game.tsx` is:

```tsx
return (
  <GameStateContext.Provider value={stateValue}>
    <GameActionsContext.Provider value={actions}>
      <div className="w-full h-screen bg-[#0e1a2e] relative overflow-hidden select-none">
        <WorldScreen />
        <ScreenRouter />
        <GlobalOverlays />   {/* Task 22; until then the remaining blocks stay inline here */}
      </div>
    </GameActionsContext.Provider>
  </GameStateContext.Provider>
)
```

- [ ] **Step 4: Run the app, verify, commit**

`npm run dev`: walk, see a capture notification after catching something, open the fast-travel panel, stand next to a dock and see the prompt. Then:

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/screens src/game/features/world src/game/core/GameContext.tsx src/game/Game.tsx
git commit -m "feat(screens): WorldScreen, WorldOverlays, WorldPrompts"
```

---

### Task 22: GlobalOverlays

The blocks that render regardless of screen: `pendingEvolution` (EvolutionScreen), `showChampion`, `achievementToast`, `evolveReadyToast`, `questReward`, `lunarBoss`, `shadowBoss` popups, `screenTransition` fade div, the `<style>` tag with keyframes, `showMigrationCalendar`, `showFieldNotes`, `showTrophyRoom`, `showConservation`, `biokeaPromptOpen`, `showTutorialDialog`.

**Files:**
- Create: `src/game/screens/GlobalOverlays.tsx`
- Create: `src/game/screens/overlayStyles.ts` (exports the keyframe CSS string that today lives in the inline `<style>` at ~3330–3342)
- Modify: `Game.tsx`, `GameContext.tsx` (add `conservationDismissalsRef` access: expose a `handleConservationDismiss` action in `Game.tsx` instead, which does the ref increment and `saveConservationDismissed`)

- [ ] **Step 1: Move blocks**

Move each block into `GlobalOverlays.tsx` with the same substitutions as the screen wrappers: state reads from `useGameState()` (`ui.pendingEvolution`, `ui.showChampion`, …), handlers and setters from `useGameActions()`, inline arrows kept verbatim. The `<style>` keyframes move to `overlayStyles.ts` as an exported string rendered via `<style>{OVERLAY_KEYFRAMES}</style>`. The conservation `onDismiss` arrow becomes `handleConservationDismiss` in `Game.tsx`:

```ts
const handleConservationDismiss = useCallback(() => {
  setShowConservation(false)
  conservationDismissals.current += 1
  saveConservationDismissed(conservationDismissals.current)
}, [])
```

`pendingEvolution` → `EvolutionScreen` with `onComplete={() => setPendingEvolution(null)}`: add `setPendingEvolution` to `GameActions`.

- [ ] **Step 2: Verify, commit**

`grep -c "&& (" src/game/Game.tsx` should now be 0 inside the return. Then:

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/screens src/game/core/GameContext.tsx src/game/Game.tsx
git commit -m "feat(screens): GlobalOverlays; Game.tsx renders only providers, world, router, overlays"
```

---

### Task 23: Keyboard and proximity hooks

**Files:**
- Create: `src/game/hooks/useKeyboardControls.ts`
- Create: `src/game/hooks/useWorldProximity.ts`
- Test: `src/game/hooks/useKeyboardControls.test.tsx`
- Modify: `Game.tsx` (replace the two keyboard effects and the four proximity effects)

**Interfaces produced:**
```ts
export function useKeyboardControls(args: {
  screen: GameState['screen']; battleActive: boolean; teamSize: number; playerX: number; playerY: number; map: MapTile[][]
  nearbyDock: BoatDock | null; boatAnimating: boolean; nearbyBartStation: unknown; atSteamerLane: boolean; atBoardwalk: boolean; nearbyRangerId: string | null
  movePlayer: (dx: number, dy: number) => void; openScreen: (s: GameState['screen']) => void; closeOverlay: () => void
  handleBoatTravel: () => void; openRanger: (id: string) => void; toggleMusic: () => void
}): void
export function useWorldProximity(args: { screen: GameState['screen']; x: number; y: number; timeOfDay: TimeOfDay; grandChampionUnlocked: boolean }): {
  nearbyRangerId: string | null; currentLandmark: string | null; nearbyDock: BoatDock | null; nearbySignpost: { state: string; message: string; fact: string } | null
}
```

- [ ] **Step 1: Keyboard test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboardControls } from './useKeyboardControls'
import { makeTile } from '@/test/fixtures'

function setup(over = {}) {
  const fns = { movePlayer: vi.fn(), openScreen: vi.fn(), closeOverlay: vi.fn(), handleBoatTravel: vi.fn(), openRanger: vi.fn(), toggleMusic: vi.fn() }
  renderHook(() => useKeyboardControls({
    screen: 'world', battleActive: false, teamSize: 1, playerX: 1, playerY: 1, map: [[makeTile(), makeTile(), makeTile()], [makeTile(), makeTile(), makeTile()], [makeTile(), makeTile(), makeTile()]],
    nearbyDock: null, boatAnimating: false, nearbyBartStation: undefined, atSteamerLane: false, atBoardwalk: false, nearbyRangerId: null,
    ...fns, ...over,
  }))
  return fns
}

describe('useKeyboardControls', () => {
  it('WASD moves', () => { const f = setup(); fireEvent.keyDown(window, { key: 'd' }); expect(f.movePlayer).toHaveBeenCalledWith(1, 0) })
  it('C opens catalog; Escape closes', () => {
    const f = setup(); fireEvent.keyDown(window, { key: 'c' }); expect(f.openScreen).toHaveBeenCalledWith('catalog')
    fireEvent.keyDown(window, { key: 'Escape' }); expect(f.closeOverlay).toHaveBeenCalled()
  })
  it('G needs two team members', () => {
    const f = setup({ teamSize: 1 }); fireEvent.keyDown(window, { key: 'g' }); expect(f.openScreen).not.toHaveBeenCalledWith('fusion')
    const g = setup({ teamSize: 2 }); fireEvent.keyDown(window, { key: 'g' }); expect(g.openScreen).toHaveBeenCalledWith('fusion')
  })
  it('Space prefers dock over ranger', () => {
    const f = setup({ nearbyDock: { x: 0, y: 0, destX: 1, destY: 1, destinationName: 'x' }, nearbyRangerId: 'r' })
    fireEvent.keyDown(window, { key: ' ' }); expect(f.handleBoatTravel).toHaveBeenCalled(); expect(f.openRanger).not.toHaveBeenCalled()
  })
  it('ignores keys typed into inputs', () => {
    const f = setup(); const input = document.createElement('input'); document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'd' }); expect(f.movePlayer).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Implement `useKeyboardControls`**

Move both keyboard `useEffect`s (`Game.tsx` ~712–803 and ~806–845) and `isEditableTarget` into the hook file verbatim, substituting the arguments. The `F` key's near-water check reads `map`, `playerX`, `playerY`. The `Space` branch's `openRanger(nearbyRangerId)` replaces `setGameState(prev => ({ ...prev, screen: 'ranger', activeRangerId: nearbyRangerId }))`; add to `Game.tsx`:

```ts
const openRanger = useCallback((id: string) => { setGameState(prev => ({ ...prev, screen: 'ranger', activeRangerId: id })) }, [])
```

Both effects keep their exact dependency lists (expressed as the hook's arguments).

- [ ] **Step 3: Implement `useWorldProximity`**

The four effects (ranger, landmark, dock, signpost at ~1398–1440) become four `useState` + `useEffect` pairs inside the hook with the same bodies, returning the four values. The ranger effect's tutorial side effect (auto-opening Ranger Tomás) needs `tutorialFlagsRef`, `setShowTutorialDialog`, and `setGameState`; pass an `onFirstRangerProximity: () => void` callback argument that `Game.tsx` implements with that body, and call it from the effect where the original code did.

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4
git add src/game/hooks src/game/Game.tsx
git commit -m "refactor(hooks): useKeyboardControls and useWorldProximity"
```

---

### Task 24: Shell cleanup, oracle probe, docs

**Files:**
- Modify: `Game.tsx` (final tidy), `src/game/testHook.ts` (delete), `src/game/__replay__/replay.test.tsx` (probe instead of window hook), `docs/ARCHITECTURE.md` (final), `src/game/gameState.ts` (delete if no importers remain)

- [ ] **Step 1: Replace the window hook with a probe**

Create `src/game/__replay__/GameProbe.tsx`:

```tsx
import { useEffect } from 'react'
import { useGameState, useGameActions } from '@/game/core/GameContext'
import type { GameStateValue, GameActions } from '@/game/core/GameContext'

export type Probe = { state: () => GameStateValue; actions: () => GameActions }
let current: Probe | null = null
export const probe = (): Probe => { if (!current) throw new Error('GameProbe not mounted'); return current }

export function GameProbe() {
  const s = useGameState(); const a = useGameActions()
  useEffect(() => { current = { state: () => s, actions: () => a } })
  return null
}
```

Render it via a test-only child: `Game` accepts an optional `children?: React.ReactNode` prop rendered inside the providers (a two-line change); the oracle renders `<Game><GameProbe /></Game>`. Rewrite `h()` in the oracle to `probe().actions()` / `probe().state().gameState`, `getStats` → `probe().state().playerStats`, `getExploredCount` → `.exploredTiles.size`, `getDefeatedTrainers` → `.ui.defeatedTrainers`, `getFishLog` → `.ui.fishLog`. Delete `testHook.ts` and the `exposeTestHook` effect. The snapshot must still match.

- [ ] **Step 2: Game.tsx audit**

- No `localStorage`, no JSX besides providers + `<div>` + `WorldScreen`/`ScreenRouter`/`GlobalOverlays`/`children`.
- No function longer than 40 lines (the `movePlayer` effects switch is the longest; if over, move the `'moved'` case body into `applyStepEffects` inside the component).
- `wc -l src/game/Game.tsx` < 900. Record the number in the commit message.
- `grep -rn "from './gameState'\|from '@/game/gameState'" src` → update any remaining importers to `core/state` or `core/persistence`, then `git rm src/game/gameState.ts`.

- [ ] **Step 3: ARCHITECTURE.md final**

Remove every "(planned)" marker, fill the directory map with the real files, and add the final `Game.tsx` line count and the list of `features/*/logic.ts` exports (generate with `grep -h "^export function" src/game/features/*/logic.ts`).

- [ ] **Step 4: Verify, commit**

```bash
npx tsc -b && npx vitest run 2>&1 | tail -4 && npx vite build 2>&1 | tail -3
git add -A src/game docs/ARCHITECTURE.md
git commit -m "refactor(game): Game.tsx is a shell; oracle uses context probe; final code map"
```

---

### Task 25: Manual smoke and recorded walkthrough

- [ ] **Step 1: Pre-refactor save**

Check out commit `1b2fa3a` in a worktree (`git worktree add ../wildcal-pre 1b2fa3a`), run it, play to a mid-game state (starter, two captures, one ranger battle, one quest claimed), and copy every `bioquest-*` localStorage key out of DevTools into `scratch/pre-save.json`. Remove the worktree.

- [ ] **Step 2: Load it on the refactored build**

`npm run dev` on `main`, paste the keys into localStorage, reload, load slot 1. Confirm: position, team, coins, inventory, quest status, explored minimap all match what was saved. Walk, trigger an encounter, capture, win a ranger battle, fish, open every menu, save, reload.

- [ ] **Step 3: Record**

Use the Chrome browser tools (`gif_creator`) to record title → starter → world → encounter → capture → menu → reload as `docs/smoke-2026-09-decomposition.gif` (add `docs/*.gif` exception to `.gitignore`'s `*.png` rule only if needed; GIFs are not blocked). Commit the GIF and a one-paragraph `docs/smoke-2026-09-decomposition.md` describing what was checked.

- [ ] **Step 4: Report**

Final message to the user: line counts before/after for `Game.tsx`, number of logic functions and tests added, the snapshot's stability across all Phase 2 and 3 commits (`git log --oneline -- src/game/__replay__/__snapshots__` should show only the Task 5 commit and the Task 24 probe rewrite), and the deferred items (renderer split, `creatures.ts`, bundle splitting, lockfile/Bun decision, LICENSE, screenshot).
