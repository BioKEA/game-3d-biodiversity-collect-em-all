// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, fireEvent, cleanup } from '@testing-library/react'
import { useKeyboardControls, type KeyboardControlsArgs } from './useKeyboardControls'
import { makeTile } from '@/test/fixtures'
import type { MapTile } from '@/types/game'

function grid(rows: MapTile[][]): MapTile[][] { return rows }
const land = (x: number, y: number) => makeTile({ x, y, biome: 'grassland' })
const water = (x: number, y: number) => makeTile({ x, y, biome: 'water', isWalkable: false })

const DOCK = { name: 'Pier', x: 1, y: 1, destX: 5, destY: 5, destinationName: 'Angel Island' }

function setup(over: Partial<KeyboardControlsArgs> = {}) {
  const fns = {
    movePlayer: vi.fn(), openScreen: vi.fn(), closeOverlay: vi.fn(),
    handleBoatTravel: vi.fn(), openRanger: vi.fn(), toggleMusic: vi.fn(),
  }
  const view = renderHook(() => useKeyboardControls({
    screen: 'world', battleActive: false, teamSize: 1, playerX: 1, playerY: 1,
    map: grid([[land(0, 0), land(1, 0), land(2, 0)], [land(0, 1), land(1, 1), land(2, 1)], [land(0, 2), land(1, 2), land(2, 2)]]),
    nearbyDock: null, boatAnimating: false, nearbyBartStation: undefined,
    atSteamerLane: false, atBoardwalk: false, nearbyRangerId: null,
    ...fns, ...over,
  }))
  return { ...fns, unmount: view.unmount }
}

const key = (k: string, target: EventTarget = window) => fireEvent.keyDown(target, { key: k })

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('useKeyboardControls — shortcuts', () => {
  it('WASD and arrows move', () => {
    const f = setup()
    key('d'); expect(f.movePlayer).toHaveBeenLastCalledWith(1, 0)
    key('ArrowUp'); expect(f.movePlayer).toHaveBeenLastCalledWith(0, -1)
  })

  it('C opens catalog; Escape closes any overlay', () => {
    const f = setup()
    key('c'); expect(f.openScreen).toHaveBeenCalledWith('catalog')
    key('Escape'); expect(f.closeOverlay).toHaveBeenCalled()
  })

  it('Escape still closes when not on the world screen; other keys are ignored there', () => {
    const f = setup({ screen: 'catalog' })
    key('d'); expect(f.movePlayer).not.toHaveBeenCalled()
    key('Escape'); expect(f.closeOverlay).toHaveBeenCalled()
  })

  it('G needs two team members', () => {
    const one = setup({ teamSize: 1 })
    key('g'); expect(one.openScreen).not.toHaveBeenCalledWith('fusion')
    one.unmount()
    const two = setup({ teamSize: 2 })
    key('g'); expect(two.openScreen).toHaveBeenCalledWith('fusion')
  })

  it('M toggles music', () => {
    const f = setup()
    key('m'); expect(f.toggleMusic).toHaveBeenCalledTimes(1)
  })

  it('ignores keys typed into inputs', () => {
    const f = setup()
    const input = document.createElement('input'); document.body.appendChild(input)
    key('d', input); expect(f.movePlayer).not.toHaveBeenCalled()
    input.remove()
  })
})

describe('useKeyboardControls — F (fishing) water check', () => {
  it('opens fishing when an orthogonal neighbour is water', () => {
    const f = setup({ map: grid([[land(0, 0), land(1, 0), land(2, 0)], [land(0, 1), land(1, 1), water(2, 1)], [land(0, 2), land(1, 2), land(2, 2)]]) })
    key('f'); expect(f.openScreen).toHaveBeenCalledWith('fishing')
  })
  it('opens fishing when standing on beach or marsh', () => {
    const f = setup({ map: grid([[land(0, 0), land(1, 0), land(2, 0)], [land(0, 1), makeTile({ x: 1, y: 1, biome: 'marsh' }), land(2, 1)], [land(0, 2), land(1, 2), land(2, 2)]]) })
    key('f'); expect(f.openScreen).toHaveBeenCalledWith('fishing')
  })
  it('does nothing inland', () => {
    const f = setup()
    key('f'); expect(f.openScreen).not.toHaveBeenCalled()
  })
})

describe('useKeyboardControls — Space precedence', () => {
  it('dock beats everything', () => {
    const f = setup({ nearbyDock: DOCK, nearbyBartStation: { name: 'Embarcadero' } as never, atSteamerLane: true, atBoardwalk: true, nearbyRangerId: 'r' })
    key(' ')
    expect(f.handleBoatTravel).toHaveBeenCalledTimes(1)
    expect(f.openScreen).not.toHaveBeenCalled(); expect(f.openRanger).not.toHaveBeenCalled()
  })
  it('a dock mid-animation is skipped and BART wins next', () => {
    const f = setup({ nearbyDock: DOCK, boatAnimating: true, nearbyBartStation: { name: 'Embarcadero' } as never, atSteamerLane: true })
    key('Enter')
    expect(f.handleBoatTravel).not.toHaveBeenCalled()
    expect(f.openScreen).toHaveBeenCalledWith('bart')
  })
  it('Steamer Lane beats Boardwalk beats ranger', () => {
    const a = setup({ atSteamerLane: true, atBoardwalk: true, nearbyRangerId: 'r' })
    key(' '); expect(a.openScreen).toHaveBeenCalledWith('surfing'); expect(a.openRanger).not.toHaveBeenCalled()
    a.unmount()
    const b = setup({ atBoardwalk: true, nearbyRangerId: 'r' })
    key(' '); expect(b.openScreen).toHaveBeenCalledWith('boardwalk'); expect(b.openRanger).not.toHaveBeenCalled()
    b.unmount()
    const c = setup({ nearbyRangerId: 'ranger-presidio' })
    key(' '); expect(c.openRanger).toHaveBeenCalledWith('ranger-presidio')
  })
  it('does nothing with nothing nearby', () => {
    const f = setup()
    key(' ')
    expect(f.handleBoatTravel).not.toHaveBeenCalled(); expect(f.openScreen).not.toHaveBeenCalled(); expect(f.openRanger).not.toHaveBeenCalled()
  })
})

describe('useKeyboardControls — hold to move', () => {
  it('repeats every 130 ms while held and stops on keyup', () => {
    vi.useFakeTimers()
    const f = setup()
    // The shortcut effect fires movePlayer once, the hold-to-move effect once more immediately.
    key('ArrowRight')
    const afterPress = f.movePlayer.mock.calls.length
    expect(afterPress).toBe(2)
    vi.advanceTimersByTime(130)
    expect(f.movePlayer).toHaveBeenCalledTimes(afterPress + 1)
    vi.advanceTimersByTime(260)
    expect(f.movePlayer).toHaveBeenCalledTimes(afterPress + 3)
    fireEvent.keyUp(window, { key: 'ArrowRight' })
    vi.advanceTimersByTime(1000)
    expect(f.movePlayer).toHaveBeenCalledTimes(afterPress + 3)
    expect(f.movePlayer.mock.calls.every(c => c[0] === 1 && c[1] === 0)).toBe(true)
  })
  it('is inert during battle', () => {
    vi.useFakeTimers()
    const f = setup({ battleActive: true })
    key('ArrowRight')
    vi.advanceTimersByTime(500)
    expect(f.movePlayer).not.toHaveBeenCalled()
  })
})
