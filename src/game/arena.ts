import type { Ranger, RangerTeamMember } from '@/types/game'
import { ALL_CREATURES } from './creatures'

export type ArenaTier = 'bronze' | 'silver' | 'gold'

export interface ArenaChallenger {
  ranger: Ranger
  tier: ArenaTier
  reward: { xp: number; coins: number }
}

const TIER_CONFIG: Record<ArenaTier, { levelRange: [number, number]; teamSize: number; xpBase: number; coinBase: number; label: string; icon: string; color: string }> = {
  bronze: { levelRange: [3, 8], teamSize: 2, xpBase: 80, coinBase: 30, label: 'Bronze', icon: '🥉', color: '#cd7f32' },
  silver: { levelRange: [8, 15], teamSize: 3, xpBase: 150, coinBase: 60, label: 'Silver', icon: '🥈', color: '#c0c0c0' },
  gold:   { levelRange: [14, 22], teamSize: 3, xpBase: 250, coinBase: 100, label: 'Gold', icon: '🏆', color: '#ffd700' },
}

const ARENA_NAMES = [
  'Shadow', 'Blaze', 'Storm', 'Frost', 'Echo', 'Drift', 'Sage', 'Ember',
  'Thorn', 'Dusk', 'Mist', 'Flint', 'Coral', 'Raven', 'Ivy', 'Pike',
]

const ARENA_TITLES = [
  'Arena Rookie', 'Challenger', 'Contender', 'Champion', 'Rising Star',
  'Battle Ace', 'Arena Veteran', 'Elite Trainer',
]

export function getTierConfig(tier: ArenaTier) {
  return TIER_CONFIG[tier]
}

export function generateArenaChallenger(tier: ArenaTier, round: number): ArenaChallenger {
  const config = TIER_CONFIG[tier]
  const seed = Date.now() + round * 137
  const rng = (n: number) => {
    const x = Math.sin(seed + n * 9973) * 43758.5453
    return x - Math.floor(x)
  }

  // Pick random creatures for the opponent team
  const pool = ALL_CREATURES.filter(c => c.rarity !== 'legendary' || tier === 'gold')
  const team: RangerTeamMember[] = []
  const used = new Set<string>()

  for (let i = 0; i < config.teamSize; i++) {
    let attempts = 0
    let creature = pool[Math.floor(rng(i * 100 + attempts) * pool.length)]
    while (used.has(creature.id) && attempts < 20) {
      attempts++
      creature = pool[Math.floor(rng(i * 100 + attempts) * pool.length)]
    }
    used.add(creature.id)
    const level = Math.floor(config.levelRange[0] + rng(i * 50) * (config.levelRange[1] - config.levelRange[0]))
    team.push({ creatureId: creature.id, level, nickname: undefined })
  }

  const nameIdx = Math.floor(rng(42) * ARENA_NAMES.length)
  const titleIdx = Math.floor(rng(99) * ARENA_TITLES.length)

  const ranger: Ranger = {
    id: `arena-${tier}-${round}-${seed}`,
    name: ARENA_NAMES[nameIdx],
    title: ARENA_TITLES[titleIdx],
    greeting: `You've entered the ${config.label} Arena!`,
    sprite: tier === 'gold' ? '👑' : tier === 'silver' ? '⚔️' : '🥊',
    x: 0, y: 0,
    subregion: 'Arena',
    quests: [],
    trades: [],
    battleTeam: team,
    battleQuote: `Let's battle in the ${config.label} tier!`,
    defeatQuote: round >= 2 ? `Incredible! You've conquered the ${config.label} Arena!` : 'Great fight! Can you keep going?',
    battleReward: { xp: config.xpBase + round * 30 },
  }

  return {
    ranger,
    tier,
    reward: { xp: config.xpBase + round * 30, coins: config.coinBase + round * 15 },
  }
}
