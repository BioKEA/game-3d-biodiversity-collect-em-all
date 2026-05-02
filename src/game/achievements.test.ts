import { describe, it, expect } from 'vitest'
import { createInitialStats, getUnlockedAchievements, getNewAchievements } from './achievements'
import type { GameState } from '@/types/game'

const mockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  screen: 'world',
  player: {
    x: 15,
    y: 20,
    level: 1,
    xp: 0,
    maxXp: 50,
    hp: 50,
    maxHp: 50,
    captured: [],
    catalog: [],
    team: [],
    inventory: [],
    journal: {},
    nursery: null,
  },
  currentBiome: 'forest',
  currentSubregion: '',
  timeOfDay: 'day',
  weather: 'clear',
  gameMinutes: 720,
  questProgress: {},
  encounterCooldown: 0,
  activeRangerId: null,
  battle: {
    wildCreature: null as any,
    mood: 'neutral',
    encounterType: 'single',
  },
  ...overrides,
})

describe('Achievements', () => {
  it('createInitialStats returns zero counts', () => {
    const stats = createInitialStats()
    expect(stats.totalBattlesWon).toBe(0)
    expect(stats.totalCreaturesCaught).toBe(0)
    expect(stats.totalStepsWalked).toBe(0)
  })

  it('getUnlockedAchievements returns empty for fresh game', () => {
    const unlocked = getUnlockedAchievements(mockGameState(), createInitialStats())
    expect(unlocked).toEqual([])
  })

  it('first-capture achievement unlocks when player has captured 1 creature', () => {
    const state = mockGameState({ player: { ...mockGameState().player, captured: ['coyote'], catalog: ['coyote'] } })
    const stats = { ...createInitialStats(), totalCreaturesCaught: 1 }
    const unlocked = getUnlockedAchievements(state, stats)
    expect(unlocked).toContain('first-catch')
  })

  it('getNewAchievements returns only new ones', () => {
    const state = mockGameState({ player: { ...mockGameState().player, captured: ['coyote'], catalog: ['coyote'] } })
    const stats = { ...createInitialStats(), totalCreaturesCaught: 1 }
    const prev: string[] = []
    const newOnes = getNewAchievements(state, stats, prev)
    expect(newOnes.length).toBeGreaterThan(0)
    expect(newOnes[0].id).toBe('first-catch')
  })

  it('getNewAchievements returns empty when already seen', () => {
    const state = mockGameState({ player: { ...mockGameState().player, captured: ['coyote'], catalog: ['coyote'] } })
    const stats = { ...createInitialStats(), totalCreaturesCaught: 1 }
    const prev = ['first-catch']
    const newOnes = getNewAchievements(state, stats, prev)
    expect(newOnes).toEqual([])
  })
})
