// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import Game from '../Game'
import { STARTERS } from '../StarterSelect'
import { mulberry32 } from '@/test/fixtures'
import { GameProbe, probe } from './GameProbe'
import type { GameActions } from '../core/GameContext'
import type { GameState } from '@/types/game'

// Presentation-only components that touch canvas / rAF / audio. The oracle
// drives handlers, not UI, so mocking these cannot affect the state produced.
// NB: a function *declaration* — vi.mock factories are hoisted above the
// imports, so a `const` arrow would be in its TDZ when the factory first runs.
function nullComponent() { return { default: () => null } }
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
// Pulls in @biokea/leaderboard, whose dist/index.js has extensionless relative
// imports that Node's ESM resolver rejects. Display-only screen.
vi.mock('../Leaderboard', nullComponent)
vi.mock('../StarterSelect', async (orig) => ({ ...(await orig<typeof import('../StarterSelect')>()), default: () => null }))
vi.mock('../sounds', () => {
  const noop = new Proxy({}, { get: () => () => {} })
  return { SFX: noop, Music: noop }
})
vi.mock('@/lib/golden-sample', () => ({ reportCreatureEncountered: async () => {} }))
vi.mock('@/components/BiokeaLeaderboardPrompt', () => ({ BiokeaLeaderboardPrompt: () => null }))

// The oracle drives the same context the screens consume: `<GameProbe />` is
// passed to `Game` as `children` and republishes the live context values after
// every commit. `h()` keeps the old call shape — `h().handleCapture(...)`.
const h = (): GameActions => probe().actions()
const state = (): GameState => probe().state().gameState

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
    render(<Game><GameProbe /></Game>)
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
    // Run until every wild policy has executed at least once (a fixed count of
    // 8 stops leaves 'lose' unreached whenever one of them is a trainer), with
    // a hard cap so a divergent walk fails loudly instead of hanging.
    let encounters = 0
    while (wildIdx < wildPolicy.length && encounters < 12) {
      encounters++
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
    // Documents the shape of the replay under seed 12345. Every wild policy —
    // capture/win/flee/capture/win/fled/gift/lose — runs exactly once.
    // A change here means the walk diverged.
    expect(seen).toEqual({ wild: 8, trainer: 1 })
    expect(wildIdx).toBe(wildPolicy.length)
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

    // highestLevel tracks the player's level (it was stuck at 1 before Sept 2026).
    expect(probe().state().playerStats.highestLevel).toBe(state().player.level)
    expect(state().player.level).toBeGreaterThan(1)

    const result = {
      gameState: state(),
      playerStats: probe().state().playerStats,
      exploredCount: probe().state().exploredTiles.size,
      defeatedTrainers: probe().state().ui.defeatedTrainers,
      fishLog: probe().state().ui.fishLog,
      savedSlot1: JSON.parse(localStorage.getItem('bioquest-bay-save-1') ?? 'null'),
      savedStats1: JSON.parse(localStorage.getItem('bioquest-bay-stats-1') ?? 'null'),
      savedExplored1: JSON.parse(localStorage.getItem('bioquest-bay-explored-1') ?? 'null'),
    }
    expect(result).toMatchSnapshot()
  })
})
