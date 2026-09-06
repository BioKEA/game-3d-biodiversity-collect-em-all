// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import Game from '../Game'
import { STARTERS } from '../StarterSelect'
import { GameProbe, probe } from './GameProbe'

// Same presentation-only mock set as replay.test.tsx (see the notes there).
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
vi.mock('../Leaderboard', nullComponent)
vi.mock('../StarterSelect', async (orig) => ({ ...(await orig<typeof import('../StarterSelect')>()), default: () => null }))
vi.mock('../sounds', () => {
  const noop = new Proxy({}, { get: () => () => {} })
  return { SFX: noop, Music: noop }
})
vi.mock('@/lib/golden-sample', () => ({ reportCreatureEncountered: async () => {} }))
vi.mock('@/components/BiokeaLeaderboardPrompt', () => ({ BiokeaLeaderboardPrompt: () => null }))

// Oregon border tiles sit directly above walkable California at (30,3):
// (30,2), (30,1), (30,0) are all `borderState: 'Oregon'` and unwalkable, and
// (31,0) is Oregon too. Row -1 is off-map, so the fourth step goes east.
const CA_X = 30
const CA_Y = 3

const pos = () => { const p = probe().state().gameState.player; return [p.x, p.y] }
const peek = () => probe().state().ui.borderPeek

function step(dx: number, dy: number) {
  act(() => { vi.advanceTimersByTime(130); probe().actions().movePlayer(dx, dy) })
}

describe('border peek cap', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // no encounters, no sfx roll
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

  it('allows three steps into a neighbouring state, then bounces back', () => {
    render(<Game><GameProbe /></Game>)
    act(() => probe().actions().handleNewGame(1))
    act(() => probe().actions().handleSelectStarter(STARTERS[0].creature))
    act(() => probe().actions().closeOverlay()) // one-time Ranger Tomás tutorial
    expect(probe().state().gameState.screen).toBe('world')

    act(() => probe().actions().setGameState(prev => ({
      ...prev,
      player: { ...prev.player, x: CA_X, y: CA_Y },
      currentSubregion: '',
    })))
    expect(pos()).toEqual([CA_X, CA_Y])
    expect(peek()).toBeNull()

    step(0, -1)
    expect(pos()).toEqual([CA_X, 2])
    expect(peek()).toMatchObject({ state: 'Oregon', stepsLeft: 2, returnX: CA_X, returnY: CA_Y })

    step(0, -1)
    expect(pos()).toEqual([CA_X, 1])
    expect(peek()).toMatchObject({ stepsLeft: 1 })

    step(0, -1)
    expect(pos()).toEqual([CA_X, 0])
    expect(peek()).toMatchObject({ stepsLeft: 0 })

    // Out of steps: the next border step teleports back to where the peek began.
    step(1, 0)
    expect(pos()).toEqual([CA_X, CA_Y])
    expect(peek()).toBeNull()
  })
})
