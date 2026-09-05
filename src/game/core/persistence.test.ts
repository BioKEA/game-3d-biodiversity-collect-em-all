import { describe, it, expect, beforeEach } from 'vitest'
import { loadGame, saveGame } from './persistence'
import { createInitialState } from './state'
import { applyBackwardCompat } from '@/game/core/state'
import { loadAlcatrazEscaped, saveAlcatrazEscaped, loadDefeatedTrainers, saveDefeatedTrainers, loadFishLog, saveFishLog, loadConservationDismissed, saveConservationDismissed, STORAGE_KEYS } from './persistence'
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
