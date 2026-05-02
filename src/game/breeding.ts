import type { CapturedCreature, BreedingSlot, CreatureType, Move } from '@/types/game'
import { ALL_CREATURES } from './creatures'

/** How long breeding takes in real milliseconds (2 minutes for demo-friendliness) */
const BREEDING_TIME_MS = 2 * 60 * 1000

/** Check if two creatures are compatible for breeding */
export function canBreed(a: CapturedCreature, b: CapturedCreature): { ok: boolean; reason?: string } {
  if (a.id === b.id && a.capturedAt === b.capturedAt) {
    return { ok: false, reason: 'Cannot breed a creature with itself' }
  }
  if (a.level < 5 || b.level < 5) {
    return { ok: false, reason: 'Both creatures must be at least level 5' }
  }
  // Same type or one is mystic (mystics can cross-breed with anything)
  if (a.type !== b.type && a.type !== 'mystic' && b.type !== 'mystic') {
    return { ok: false, reason: 'Creatures must share a type (or one must be mystic)' }
  }
  return { ok: true }
}

/** Start a breeding session */
export function startBreeding(parent1: CapturedCreature, parent2: CapturedCreature): BreedingSlot {
  const now = new Date()
  const ready = new Date(now.getTime() + BREEDING_TIME_MS)

  // Pre-determine offspring
  const offspringId = determineOffspring(parent1, parent2)

  return {
    parent1,
    parent2,
    startedAt: now.toISOString(),
    readyAt: ready.toISOString(),
    offspringId,
  }
}

/** Determine what creature the offspring will be */
function determineOffspring(a: CapturedCreature, b: CapturedCreature): string {
  // Combine both parents' biomes and type to find possible offspring
  const parentIds = new Set([a.id, b.id])
  const parentBiomes = new Set([...a.biomes, ...b.biomes])
  const parentTypes = new Set([a.type, b.type])

  // Find creatures that share biome AND type with the parents (but aren't the parents)
  const candidates = ALL_CREATURES.filter(c => {
    if (parentIds.has(c.id)) return false
    const sharesBiome = c.biomes.some(b => parentBiomes.has(b))
    const sharesType = parentTypes.has(c.type)
    return sharesBiome && sharesType
  })

  if (candidates.length === 0) {
    // Fallback: pick randomly from same type
    const fallback = ALL_CREATURES.filter(c => parentTypes.has(c.type) && !parentIds.has(c.id))
    if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)].id
    // Ultimate fallback: random parent's species
    return Math.random() < 0.5 ? a.id : b.id
  }

  // Weighted towards rarer creatures based on parent levels
  const avgLevel = (a.level + b.level) / 2
  const weighted: string[] = []
  for (const c of candidates) {
    // Higher-level parents have better chance at rarer offspring
    let weight = c.rarity === 'common' ? 6 : c.rarity === 'uncommon' ? 4 : c.rarity === 'rare' ? 2 : 1
    if (avgLevel >= 15 && c.rarity === 'uncommon') weight += 2
    if (avgLevel >= 20 && c.rarity === 'rare') weight += 2
    for (let i = 0; i < weight; i++) weighted.push(c.id)
  }

  return weighted[Math.floor(Math.random() * weighted.length)]
}

/** Check if breeding is complete */
export function isBreedingReady(slot: BreedingSlot): boolean {
  return new Date() >= new Date(slot.readyAt)
}

/** Get time remaining in seconds */
export function getBreedingTimeLeft(slot: BreedingSlot): number {
  const remaining = new Date(slot.readyAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(remaining / 1000))
}

/** Hatch the offspring creature */
export function hatchOffspring(slot: BreedingSlot): CapturedCreature | null {
  if (!slot.offspringId) return null

  const base = ALL_CREATURES.find(c => c.id === slot.offspringId)
  if (!base) return null

  // Offspring starts at a level based on parents
  const parentAvgLevel = Math.floor((slot.parent1.level + slot.parent2.level) / 2)
  const offspringLevel = Math.max(1, Math.min(parentAvgLevel - 2, 10))

  // Inherit one move from each parent (if compatible) + base moves
  const inheritedMoves = pickInheritedMoves(slot.parent1, slot.parent2, base.moves)

  // Slight stat bonus from breeding
  const breedBonus = 2

  return {
    ...base,
    level: offspringLevel,
    xp: 0,
    capturedAt: new Date().toISOString(),
    capturedBiome: slot.parent1.capturedBiome,
    parentIds: [slot.parent1.id, slot.parent2.id],
    happiness: 70, // Hatched creatures start loved
    stats: {
      hp: base.stats.hp + breedBonus,
      maxHp: base.stats.maxHp + breedBonus,
      attack: base.stats.attack + breedBonus,
      defense: base.stats.defense + breedBonus,
      speed: base.stats.speed + breedBonus,
    },
    moves: inheritedMoves,
  }
}

function pickInheritedMoves(p1: CapturedCreature, p2: CapturedCreature, baseMoves: Move[]): Move[] {
  const allParentMoves = [...p1.moves, ...p2.moves]
  // Pick one unique parent move not in base set
  const uniqueParentMove = allParentMoves.find(m =>
    !baseMoves.some(bm => bm.name === m.name) && m.type === 'attack'
  )

  const result = [...baseMoves]
  if (uniqueParentMove && result.length < 4) {
    result.push(uniqueParentMove)
  } else if (uniqueParentMove) {
    // Replace weakest base move
    const weakest = result.reduce((min, m, i) => m.power < result[min].power ? i : min, 0)
    if (uniqueParentMove.power > result[weakest].power) {
      result[weakest] = uniqueParentMove
    }
  }

  return result.slice(0, 4)
}

/** Get compatible breeding partners for a given creature from a team */
export function getCompatiblePartners(creature: CapturedCreature, team: CapturedCreature[]): CapturedCreature[] {
  return team.filter(t => {
    if (t.capturedAt === creature.capturedAt && t.id === creature.id) return false
    return canBreed(creature, t).ok
  })
}

/** Get the type combo label for breeding */
export function getBreedingTypeLabel(type1: CreatureType, type2: CreatureType): string {
  if (type1 === type2) return `Pure ${type1}`
  return `${type1} × ${type2}`
}
