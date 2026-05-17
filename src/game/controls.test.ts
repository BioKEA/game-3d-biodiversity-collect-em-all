import { describe, expect, it } from 'vitest'
import { facingFromDelta, resolveControlMove } from './controls'

describe('control modes', () => {
  it('keeps raw input unchanged in map-locked mode', () => {
    expect(resolveControlMove(0, -1, 'south', 'map')).toEqual({ dx: 0, dy: -1 })
    expect(resolveControlMove(1, 0, 'west', 'map')).toEqual({ dx: 1, dy: 0 })
  })

  it('moves forward relative to player facing in perspective mode', () => {
    expect(resolveControlMove(0, -1, 'north', 'perspective')).toEqual({ dx: 0, dy: -1 })
    expect(resolveControlMove(0, -1, 'east', 'perspective')).toEqual({ dx: 1, dy: 0 })
    expect(resolveControlMove(0, -1, 'south', 'perspective')).toEqual({ dx: 0, dy: 1 })
    expect(resolveControlMove(0, -1, 'west', 'perspective')).toEqual({ dx: -1, dy: 0 })
  })

  it('maps lateral inputs around the current facing in perspective mode', () => {
    expect(resolveControlMove(-1, 0, 'south', 'perspective')).toEqual({ dx: 1, dy: 0 })
    expect(resolveControlMove(1, 0, 'south', 'perspective')).toEqual({ dx: -1, dy: 0 })
    expect(resolveControlMove(0, 1, 'east', 'perspective')).toEqual({ dx: -1, dy: 0 })
  })

  it('derives cardinal facing from successful movement deltas', () => {
    expect(facingFromDelta(0, -1)).toBe('north')
    expect(facingFromDelta(1, 0)).toBe('east')
    expect(facingFromDelta(0, 1)).toBe('south')
    expect(facingFromDelta(-1, 0)).toBe('west')
    expect(facingFromDelta(0, 0)).toBeNull()
  })
})
