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
