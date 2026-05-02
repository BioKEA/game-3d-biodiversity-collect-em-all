import type { Move, CapturedCreature, CreatureType } from '@/types/game'

export interface AbilityStone {
  id: string
  name: string
  sprite: string
  move: Move
  cost: number
  compatibleTypes: CreatureType[]
  description: string
}

export const ABILITY_STONES: AbilityStone[] = [
  {
    id: 'stone-flame-burst',
    name: 'Flame Stone',
    sprite: '🔥',
    move: { name: 'Flame Burst', power: 35, type: 'special', description: 'A fiery explosion. May burn.' },
    cost: 80,
    compatibleTypes: ['beast', 'mystic'],
    description: 'Teaches Flame Burst. Compatible with beast & mystic types.',
  },
  {
    id: 'stone-frost-bite',
    name: 'Frost Stone',
    sprite: '❄️',
    move: { name: 'Frost Bite', power: 30, type: 'special', description: 'A chilling bite. May freeze.' },
    cost: 80,
    compatibleTypes: ['marine', 'amphibian'],
    description: 'Teaches Frost Bite. Compatible with marine & amphibian types.',
  },
  {
    id: 'stone-thunder-strike',
    name: 'Storm Stone',
    sprite: '⚡',
    move: { name: 'Thunder Strike', power: 40, type: 'special', description: 'A bolt of lightning. May stun.' },
    cost: 100,
    compatibleTypes: ['bird', 'mystic'],
    description: 'Teaches Thunder Strike. Compatible with bird & mystic types.',
  },
  {
    id: 'stone-vine-whip',
    name: 'Nature Stone',
    sprite: '🌿',
    move: { name: 'Vine Whip', power: 25, type: 'attack', description: 'A lashing vine. May slow.' },
    cost: 60,
    compatibleTypes: ['insect', 'amphibian'],
    description: 'Teaches Vine Whip. Compatible with insect & amphibian types.',
  },
  {
    id: 'stone-shadow-claw',
    name: 'Shadow Stone',
    sprite: '🌑',
    move: { name: 'Shadow Claw', power: 35, type: 'attack', description: 'A slash from the shadows. May poison.' },
    cost: 90,
    compatibleTypes: ['beast', 'insect', 'mystic'],
    description: 'Teaches Shadow Claw. Compatible with beast, insect & mystic types.',
  },
  {
    id: 'stone-tidal-wave',
    name: 'Ocean Stone',
    sprite: '🌊',
    move: { name: 'Tidal Wave', power: 38, type: 'special', description: 'A crashing wave. May confuse.' },
    cost: 90,
    compatibleTypes: ['marine', 'amphibian', 'mystic'],
    description: 'Teaches Tidal Wave. Compatible with marine, amphibian & mystic types.',
  },
  {
    id: 'stone-iron-guard',
    name: 'Iron Stone',
    sprite: '🛡️',
    move: { name: 'Iron Guard', power: 0, type: 'defend', description: 'Raises defense sharply for 3 turns.' },
    cost: 70,
    compatibleTypes: ['beast', 'marine', 'insect', 'bird', 'amphibian', 'mystic'],
    description: 'Teaches Iron Guard. Compatible with all types.',
  },
  {
    id: 'stone-psychic-pulse',
    name: 'Mind Stone',
    sprite: '💎',
    move: { name: 'Psychic Pulse', power: 42, type: 'special', description: 'A wave of psychic energy. May confuse.' },
    cost: 120,
    compatibleTypes: ['mystic'],
    description: 'Teaches Psychic Pulse. Mystic-only.',
  },
]

export function canLearnMove(creature: CapturedCreature, stone: AbilityStone): { canLearn: boolean; reason?: string } {
  if (!stone.compatibleTypes.includes(creature.type)) {
    return { canLearn: false, reason: `${creature.name} is a ${creature.type} type — not compatible` }
  }
  if (creature.moves.some(m => m.name === stone.move.name)) {
    return { canLearn: false, reason: `${creature.name} already knows ${stone.move.name}` }
  }
  return { canLearn: true }
}

export function getMaxMoves(): number {
  return 4
}

export function teachMove(creature: CapturedCreature, stone: AbilityStone, replaceIndex?: number): CapturedCreature {
  const newMoves = [...creature.moves]
  if (newMoves.length < 4) {
    newMoves.push(stone.move)
  } else if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < newMoves.length) {
    newMoves[replaceIndex] = stone.move
  }
  return { ...creature, moves: newMoves }
}
