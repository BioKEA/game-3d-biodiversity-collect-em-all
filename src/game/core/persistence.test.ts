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
    // Fixture places the player at (20, 0), a water/unwalkable tile near
    // the coastline at y=0 (map[0][0] is also water but too far from land
    // for the rescue's radius-10 spiral search to find a walkable tile).
    expect(map[0][20].biome).toBe('water')
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
