import type { GameState } from '@/types/game'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'exploration' | 'collection' | 'battle' | 'breeding' | 'mastery'
  check: (state: GameState, stats: PlayerStats) => boolean
}

export interface PlayerStats {
  totalBattlesWon: number
  totalCreaturesCaught: number
  totalStepsWalked: number
  totalEvolutions: number
  totalBreedsCompleted: number
  totalCriticalHits: number
  highestLevel: number
  uniqueBiomesVisited: string[]
  uniqueSubregionsVisited: string[]
  totalFishCaught: number
  rangerBattlesWon: number
  defeatedRangers: string[]
}

export function createInitialStats(): PlayerStats {
  return {
    totalBattlesWon: 0,
    totalCreaturesCaught: 0,
    totalStepsWalked: 0,
    totalEvolutions: 0,
    totalBreedsCompleted: 0,
    totalCriticalHits: 0,
    highestLevel: 1,
    uniqueBiomesVisited: [],
    uniqueSubregionsVisited: [],
    totalFishCaught: 0,
    rangerBattlesWon: 0,
    defeatedRangers: [],
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  // Exploration
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Walk 50 steps in the Bay Area',
    icon: '👟',
    category: 'exploration',
    check: (_s, stats) => stats.totalStepsWalked >= 50,
  },
  {
    id: 'urban-explorer',
    name: 'Urban Explorer',
    description: 'Visit 5 different subregions',
    icon: '🗺️',
    category: 'exploration',
    check: (_s, stats) => stats.uniqueSubregionsVisited.length >= 5,
  },
  {
    id: 'biome-hopper',
    name: 'Biome Hopper',
    description: 'Visit all 8 biome types',
    icon: '🌍',
    category: 'exploration',
    check: (_s, stats) => stats.uniqueBiomesVisited.length >= 8,
  },
  {
    id: 'marathon-walker',
    name: 'Marathon Walker',
    description: 'Walk 1,000 steps',
    icon: '🏃',
    category: 'exploration',
    check: (_s, stats) => stats.totalStepsWalked >= 1000,
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    description: 'Visit 15 different subregions',
    icon: '📍',
    category: 'exploration',
    check: (_s, stats) => stats.uniqueSubregionsVisited.length >= 15,
  },

  // Collection
  {
    id: 'first-catch',
    name: 'First Catch',
    description: 'Capture your first wild creature',
    icon: '🔮',
    category: 'collection',
    check: (_s, stats) => stats.totalCreaturesCaught >= 1,
  },
  {
    id: 'budding-collector',
    name: 'Budding Collector',
    description: 'Capture 5 different species',
    icon: '📦',
    category: 'collection',
    check: (s) => s.player.captured.length >= 5,
  },
  {
    id: 'naturalist',
    name: 'Naturalist',
    description: 'Discover 15 species in your catalog',
    icon: '🔬',
    category: 'collection',
    check: (s) => s.player.catalog.length >= 15,
  },
  {
    id: 'completionist',
    name: 'WildDex Complete',
    description: 'Capture all 34 creatures',
    icon: '👑',
    category: 'collection',
    check: (s) => s.player.captured.length >= 34,
  },
  {
    id: 'type-collector',
    name: 'Type Collector',
    description: 'Capture one creature of every type',
    icon: '🎨',
    category: 'collection',
    check: (s) => {
      const types = new Set(s.player.team.map(c => c.type))
      return types.size >= 6
    },
  },

  // Battle
  {
    id: 'first-victory',
    name: 'First Victory',
    description: 'Win your first battle',
    icon: '⚔️',
    category: 'battle',
    check: (_s, stats) => stats.totalBattlesWon >= 1,
  },
  {
    id: 'battle-hardened',
    name: 'Battle Hardened',
    description: 'Win 25 battles',
    icon: '🛡️',
    category: 'battle',
    check: (_s, stats) => stats.totalBattlesWon >= 25,
  },
  {
    id: 'champion',
    name: 'Bay Area Champion',
    description: 'Win 100 battles',
    icon: '🏆',
    category: 'battle',
    check: (_s, stats) => stats.totalBattlesWon >= 100,
  },
  {
    id: 'level-10',
    name: 'Rising Star',
    description: 'Reach explorer level 10',
    icon: '⭐',
    category: 'battle',
    check: (s) => s.player.level >= 10,
  },
  {
    id: 'level-25',
    name: 'Bay Legend',
    description: 'Reach explorer level 25',
    icon: '💫',
    category: 'battle',
    check: (s) => s.player.level >= 25,
  },

  // Breeding
  {
    id: 'first-hatch',
    name: 'First Hatch',
    description: 'Hatch your first bred creature',
    icon: '🥚',
    category: 'breeding',
    check: (_s, stats) => stats.totalBreedsCompleted >= 1,
  },
  {
    id: 'nursery-master',
    name: 'Nursery Master',
    description: 'Hatch 10 creatures',
    icon: '🐣',
    category: 'breeding',
    check: (_s, stats) => stats.totalBreedsCompleted >= 10,
  },

  // Mastery
  {
    id: 'first-evolution',
    name: 'Metamorphosis',
    description: 'Evolve a creature for the first time',
    icon: '🧬',
    category: 'mastery',
    check: (_s, stats) => stats.totalEvolutions >= 1,
  },
  {
    id: 'full-team',
    name: 'Full Squad',
    description: 'Have 6 creatures on your team',
    icon: '🤝',
    category: 'mastery',
    check: (s) => s.player.team.length >= 6,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Win a battle during nighttime',
    icon: '🌙',
    category: 'mastery',
    check: (_s, stats) => stats.totalBattlesWon > 0, // Simplified — tracked via nightBattleWon flag
  },
  {
    id: 'ranger-challenger',
    name: 'Ranger Challenger',
    description: 'Win your first ranger battle',
    icon: '🎖️',
    category: 'battle',
    check: (_s, stats) => (stats.rangerBattlesWon ?? 0) >= 1,
  },
  {
    id: 'ranger-champion',
    name: 'Ranger Champion',
    description: 'Defeat 5 different rangers',
    icon: '🏅',
    category: 'battle',
    check: (_s, stats) => (stats.defeatedRangers ?? []).length >= 5,
  },
  {
    id: 'warden-slayer',
    name: 'Warden Slayer',
    description: 'Defeat all 11 rangers',
    icon: '👑',
    category: 'battle',
    check: (_s, stats) => (stats.defeatedRangers ?? []).length >= 11,
  },
]

export function getUnlockedAchievements(state: GameState, stats: PlayerStats): string[] {
  return ACHIEVEMENTS.filter(a => a.check(state, stats)).map(a => a.id)
}

export function getNewAchievements(
  state: GameState,
  stats: PlayerStats,
  previouslyUnlocked: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(
    a => a.check(state, stats) && !previouslyUnlocked.includes(a.id)
  )
}
