import type { Creature, CreatureType } from '@/types/game'

// === CREATURE MOODS ===
export type CreatureMood = 'aggressive' | 'neutral' | 'scared' | 'friendly'

export function rollMood(creature: Creature): CreatureMood {
  const r = Math.random()
  // Rarity affects mood distribution
  if (creature.rarity === 'legendary') {
    return r < 0.6 ? 'aggressive' : 'neutral'
  }
  if (creature.rarity === 'rare') {
    return r < 0.3 ? 'aggressive' : r < 0.6 ? 'neutral' : r < 0.85 ? 'scared' : 'friendly'
  }
  // Creature type tendencies
  if (creature.type === 'beast') {
    return r < 0.25 ? 'aggressive' : r < 0.60 ? 'neutral' : r < 0.85 ? 'scared' : 'friendly'
  }
  if (creature.type === 'bird' || creature.type === 'insect') {
    return r < 0.10 ? 'aggressive' : r < 0.35 ? 'neutral' : r < 0.75 ? 'scared' : 'friendly'
  }
  if (creature.type === 'mystic') {
    return r < 0.35 ? 'aggressive' : r < 0.65 ? 'neutral' : r < 0.80 ? 'scared' : 'friendly'
  }
  // Default (marine, amphibian)
  return r < 0.15 ? 'aggressive' : r < 0.50 ? 'neutral' : r < 0.80 ? 'scared' : 'friendly'
}

export function getMoodInfo(mood: CreatureMood): { icon: string; label: string; color: string; description: string } {
  switch (mood) {
    case 'aggressive': return { icon: '😤', label: 'Aggressive', color: '#ef4444', description: 'Attacks first and hits harder!' }
    case 'neutral': return { icon: '😐', label: 'Neutral', color: '#9ca3af', description: 'A standard encounter.' }
    case 'scared': return { icon: '😰', label: 'Scared', color: '#eab308', description: 'Might flee! Easier to catch.' }
    case 'friendly': return { icon: '😊', label: 'Friendly', color: '#22c55e', description: 'Doesn\'t want to fight!' }
  }
}

/** Scared creatures have a chance to flee each turn */
export function willCreatureFlee(mood: CreatureMood, hpRatio: number): boolean {
  if (mood !== 'scared') return false
  // Higher chance to flee when HP is high (hasn't committed to battle)
  const fleeChance = hpRatio > 0.8 ? 0.20 : hpRatio > 0.5 ? 0.10 : 0.05
  return Math.random() < fleeChance
}

/** Mood affects catch rate */
export function getMoodCatchModifier(mood: CreatureMood): number {
  switch (mood) {
    case 'aggressive': return 0.7  // Harder to catch
    case 'neutral': return 1.0
    case 'scared': return 1.4      // Easier to catch
    case 'friendly': return 1.8    // Much easier
  }
}

/** Mood affects damage dealt */
export function getMoodDamageModifier(mood: CreatureMood): number {
  switch (mood) {
    case 'aggressive': return 1.25
    case 'neutral': return 1.0
    case 'scared': return 0.85
    case 'friendly': return 0.7
  }
}

// === FRIENDLY ENCOUNTER GIFTS ===
export interface FriendlyGift {
  itemId: string
  itemName: string
  sprite: string
  message: string
}

const FRIENDLY_GIFTS: FriendlyGift[] = [
  { itemId: 'herb-potion', itemName: 'Herb Potion', sprite: '🧪', message: 'found a healing herb and nudged it toward you!' },
  { itemId: 'energy-berry', itemName: 'Energy Berry', sprite: '🫐', message: 'dropped a shiny berry at your feet!' },
  { itemId: 'bio-capsule', itemName: 'Bio Capsule', sprite: '🔮', message: 'unearthed something shiny from the ground!' },
]

export function rollFriendlyGift(creature: Creature): FriendlyGift {
  const gift = FRIENDLY_GIFTS[Math.floor(Math.random() * FRIENDLY_GIFTS.length)]
  return {
    ...gift,
    message: `${creature.name} ${gift.message}`,
  }
}

// === TYPE EFFECTIVENESS ===
// Extended chart with reptiles (lizards/snakes) and plants (poppies/kelp)
// Symmetric: every "X beats Y" has a matching "Y weak to X"
const TYPE_CHART: Record<CreatureType, CreatureType[]> = {
  bird:      ['insect', 'reptile'],       // raptors hunt bugs and lizards
  insect:    ['amphibian', 'plant'],      // bugs eat frogs(eggs) and plants
  amphibian: ['marine'],                  // freshwater ambush predators
  marine:    ['beast'],                   // tide & current overpower beasts in water
  beast:     ['bird', 'plant'],           // mammals catch birds and graze plants
  reptile:   ['insect', 'amphibian'],     // snakes eat both
  plant:     ['marine'],                  // kelp/algae dominate marine ecosystems
  mystic:    ['bird', 'insect', 'amphibian', 'marine', 'beast', 'reptile', 'plant'],
}

const WEAK_TO: Record<CreatureType, CreatureType[]> = {
  bird:      ['beast'],
  insect:    ['bird', 'reptile'],
  amphibian: ['insect', 'reptile'],
  marine:    ['amphibian', 'plant'],
  beast:     ['marine'],
  reptile:   ['bird'],
  plant:     ['insect', 'beast'],
  mystic:    ['mystic'],
}

export function getTypeEffectiveness(attackerType: CreatureType, defenderType: CreatureType): { multiplier: number; label: string } {
  if (attackerType === defenderType && attackerType !== 'mystic') {
    return { multiplier: 1.0, label: '' }
  }
  if (TYPE_CHART[attackerType]?.includes(defenderType)) {
    return { multiplier: 1.5, label: 'Super effective!' }
  }
  if (WEAK_TO[attackerType]?.includes(defenderType)) {
    return { multiplier: 0.65, label: 'Not very effective...' }
  }
  return { multiplier: 1.0, label: '' }
}

// === STATUS EFFECTS ===
export type StatusEffect = 'poison' | 'stun' | 'slow' | 'burn' | 'freeze' | 'confuse' | 'atkUp' | 'defUp' | null

export interface StatusState {
  effect: StatusEffect
  turnsLeft: number
}

/** Some moves have a chance to inflict status effects */
export function rollStatusEffect(moveName: string): StatusState | null {
  // Map certain move keywords to status effects
  const lower = moveName.toLowerCase()
  if (lower.includes('toxic') || lower.includes('acid') || lower.includes('slime') || lower.includes('poison')) {
    if (Math.random() < 0.30) return { effect: 'poison', turnsLeft: 3 }
  }
  if (lower.includes('screech') || lower.includes('stun') || lower.includes('flash') || lower.includes('bark') || lower.includes('bell') || lower.includes('blue screen')) {
    if (Math.random() < 0.20) return { effect: 'stun', turnsLeft: 1 }
  }
  if (lower.includes('slime') || lower.includes('root') || lower.includes('tidal') || lower.includes('fog') || lower.includes('slow')) {
    if (Math.random() < 0.25) return { effect: 'slow', turnsLeft: 2 }
  }
  if (lower.includes('lava') || lower.includes('fire') || lower.includes('ember') || lower.includes('eruption') || lower.includes('burn')) {
    if (Math.random() < 0.25) return { effect: 'burn', turnsLeft: 3 }
  }
  if (lower.includes('freeze') || lower.includes('frost') || lower.includes('ice') || lower.includes('chill') || lower.includes('cold') || lower.includes('blizzard')) {
    if (Math.random() < 0.20) return { effect: 'freeze', turnsLeft: 2 }
  }
  if (lower.includes('confus') || lower.includes('dizz') || lower.includes('hypno') || lower.includes('wisp') || lower.includes('eerie') || lower.includes('gaze')) {
    if (Math.random() < 0.20) return { effect: 'confuse', turnsLeft: 3 }
  }
  return null
}

/** Roll a self-buff when using a defend move */
export function rollDefendBuff(moveName: string): StatusState | null {
  const lower = moveName.toLowerCase()
  if (lower.includes('howl') || lower.includes('call') || lower.includes('charge') || lower.includes('boost') || lower.includes('bugle')) {
    return { effect: 'atkUp', turnsLeft: 3 }
  }
  if (lower.includes('shield') || lower.includes('armor') || lower.includes('curl') || lower.includes('bark') || lower.includes('hide')) {
    return { effect: 'defUp', turnsLeft: 3 }
  }
  return null
}

export function getStatusInfo(effect: StatusEffect): { icon: string; label: string; color: string } | null {
  if (!effect) return null
  switch (effect) {
    case 'poison': return { icon: '☠️', label: 'Poisoned', color: '#a855f7' }
    case 'stun': return { icon: '⚡', label: 'Stunned', color: '#eab308' }
    case 'slow': return { icon: '🐌', label: 'Slowed', color: '#60a5fa' }
    case 'burn': return { icon: '🔥', label: 'Burned', color: '#ef4444' }
    case 'freeze': return { icon: '❄️', label: 'Frozen', color: '#22d3ee' }
    case 'confuse': return { icon: '💫', label: 'Confused', color: '#f472b6' }
    case 'atkUp': return { icon: '⚔️', label: 'ATK Up', color: '#f97316' }
    case 'defUp': return { icon: '🛡️', label: 'DEF Up', color: '#3b82f6' }
  }
}

export function applyPoisonDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp * 0.08)) // 8% max HP per turn
}

export function applyBurnDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp * 0.06)) // 6% max HP per turn
}

// === CREATURE PERSONALITIES ===
export type Personality = 'brave' | 'timid' | 'curious' | 'playful' | 'stoic' | 'mischievous'

export function rollPersonality(): Personality {
  const personalities: Personality[] = ['brave', 'timid', 'curious', 'playful', 'stoic', 'mischievous']
  return personalities[Math.floor(Math.random() * personalities.length)]
}

export function getPersonalityReaction(name: string, personality: Personality): string {
  switch (personality) {
    case 'brave': return `${name} puffs up proudly and stares you down! A brave one.`
    case 'timid': return `${name} seems nervous but slowly inches closer... a timid soul.`
    case 'curious': return `${name} tilts its head and examines you with bright eyes. So curious!`
    case 'playful': return `${name} bounces around excitedly! It seems to love adventure.`
    case 'stoic': return `${name} sits perfectly still and regards you calmly. Very composed.`
    case 'mischievous': return `${name} snatches a berry from your pack and grins. Trouble!`
  }
}

// === MULTI-CREATURE ENCOUNTERS ===
export type EncounterType = 'single' | 'pair' | 'pack'

export function rollEncounterType(creature: Creature): EncounterType {
  const r = Math.random()
  // Certain creatures are more social
  if (creature.id === 'coyote' || creature.id === 'raccoon') {
    return r < 0.60 ? 'single' : r < 0.85 ? 'pair' : 'pack'
  }
  if (creature.type === 'bird' || creature.type === 'insect') {
    return r < 0.70 ? 'single' : r < 0.92 ? 'pair' : 'pack'
  }
  if (creature.rarity === 'legendary') {
    return 'single' // Legendaries always alone
  }
  return r < 0.80 ? 'single' : r < 0.95 ? 'pair' : 'pack'
}

export function getEncounterTypeInfo(type: EncounterType): { label: string; xpMultiplier: number; description: string } {
  switch (type) {
    case 'single': return { label: '', xpMultiplier: 1.0, description: '' }
    case 'pair': return { label: '×2', xpMultiplier: 1.5, description: 'A bonded pair! Extra XP.' }
    case 'pack': return { label: '×3', xpMultiplier: 2.0, description: 'A whole group! Extra XP and tougher fight.' }
  }
}

/** Pack/pair encounters have boosted stats */
export function getEncounterStatBoost(encounterType: EncounterType): number {
  switch (encounterType) {
    case 'single': return 1.0
    case 'pair': return 1.2
    case 'pack': return 1.4
  }
}
