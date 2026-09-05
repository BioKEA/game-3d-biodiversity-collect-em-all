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
