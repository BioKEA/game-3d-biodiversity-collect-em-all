import { describe, it, expect, vi } from 'vitest'
import {
  rollMood, getMoodInfo, willCreatureFlee, getMoodCatchModifier, getMoodDamageModifier,
  getTypeEffectiveness, rollStatusEffect, rollDefendBuff, getStatusInfo,
  applyPoisonDamage, applyBurnDamage, rollPersonality, getPersonalityReaction,
  rollEncounterType, getEncounterTypeInfo, getEncounterStatBoost,
  rollFriendlyGift,
} from './encounterSystem'
import type { Creature } from '@/types/game'

const mockCreature = (overrides: Partial<Creature> = {}): Creature => ({
  id: 'test-creature',
  name: 'Test Creature',
  scientificName: 'Testus creaturius',
  description: 'A test creature',
  lore: 'Test lore',
  type: 'beast',
  rarity: 'common',
  biomes: ['forest'],
  subregions: [],
  stats: { hp: 50, attack: 20, defense: 15, speed: 10, maxHp: 50 },
  isFantasy: false,
  sprite: '🐾',
  color: '#888',
  activeTime: 'day',
  moves: [],
  ...overrides,
})

describe('Creature Moods', () => {
  it('rollMood returns valid mood types', () => {
    const moods = new Set<string>()
    for (let i = 0; i < 200; i++) {
      moods.add(rollMood(mockCreature()))
    }
    expect(moods.size).toBeGreaterThanOrEqual(2)
    for (const m of moods) {
      expect(['aggressive', 'neutral', 'scared', 'friendly']).toContain(m)
    }
  })

  it('legendary creatures are more aggressive', () => {
    let aggressiveCount = 0
    const total = 1000
    for (let i = 0; i < total; i++) {
      if (rollMood(mockCreature({ rarity: 'legendary' })) === 'aggressive') aggressiveCount++
    }
    // Legendary: 60% aggressive chance
    expect(aggressiveCount / total).toBeGreaterThan(0.45)
    expect(aggressiveCount / total).toBeLessThan(0.75)
  })

  it('getMoodInfo returns correct structure for all moods', () => {
    const moods = ['aggressive', 'neutral', 'scared', 'friendly'] as const
    for (const mood of moods) {
      const info = getMoodInfo(mood)
      expect(info).toHaveProperty('icon')
      expect(info).toHaveProperty('label')
      expect(info).toHaveProperty('color')
      expect(info).toHaveProperty('description')
      expect(info.label.length).toBeGreaterThan(0)
    }
  })

  it('getMoodCatchModifier scales correctly', () => {
    expect(getMoodCatchModifier('aggressive')).toBe(0.7)
    expect(getMoodCatchModifier('neutral')).toBe(1.0)
    expect(getMoodCatchModifier('scared')).toBe(1.4)
    expect(getMoodCatchModifier('friendly')).toBe(1.8)
  })

  it('getMoodDamageModifier scales correctly', () => {
    expect(getMoodDamageModifier('aggressive')).toBe(1.25)
    expect(getMoodDamageModifier('neutral')).toBe(1.0)
    expect(getMoodDamageModifier('scared')).toBe(0.85)
    expect(getMoodDamageModifier('friendly')).toBe(0.7)
  })
})

describe('Creature Flee', () => {
  it('non-scared creatures never flee', () => {
    for (let i = 0; i < 100; i++) {
      expect(willCreatureFlee('aggressive', 1.0)).toBe(false)
      expect(willCreatureFlee('neutral', 1.0)).toBe(false)
      expect(willCreatureFlee('friendly', 1.0)).toBe(false)
    }
  })

  it('scared creatures can flee', () => {
    let fleeCount = 0
    for (let i = 0; i < 500; i++) {
      if (willCreatureFlee('scared', 1.0)) fleeCount++
    }
    // High HP: 20% flee chance
    expect(fleeCount).toBeGreaterThan(0)
    expect(fleeCount / 500).toBeLessThan(0.4)
  })

  it('scared creatures flee less at low HP', () => {
    let highHpFlees = 0
    let lowHpFlees = 0
    const trials = 2000
    for (let i = 0; i < trials; i++) {
      if (willCreatureFlee('scared', 0.9)) highHpFlees++
      if (willCreatureFlee('scared', 0.3)) lowHpFlees++
    }
    expect(highHpFlees).toBeGreaterThan(lowHpFlees)
  })
})

describe('Type Effectiveness', () => {
  it('bird beats insect (super effective)', () => {
    const result = getTypeEffectiveness('bird', 'insect')
    expect(result.multiplier).toBe(1.5)
    expect(result.label).toBe('Super effective!')
  })

  it('insect loses to bird (not very effective)', () => {
    const result = getTypeEffectiveness('insect', 'bird')
    expect(result.multiplier).toBe(0.65)
    expect(result.label).toBe('Not very effective...')
  })

  it('same type is neutral (except mystic)', () => {
    const result = getTypeEffectiveness('beast', 'beast')
    expect(result.multiplier).toBe(1.0)
    expect(result.label).toBe('')
  })

  it('mystic beats all non-mystic types', () => {
    for (const type of ['bird', 'insect', 'amphibian', 'marine', 'beast'] as const) {
      const result = getTypeEffectiveness('mystic', type)
      expect(result.multiplier).toBe(1.5)
    }
  })

  it('mystic is weak to mystic', () => {
    const result = getTypeEffectiveness('mystic', 'mystic')
    expect(result.multiplier).toBe(0.65)
  })

  it('full type cycle works correctly', () => {
    const cycle: [string, string][] = [
      ['bird', 'insect'], ['insect', 'amphibian'], ['amphibian', 'marine'],
      ['marine', 'beast'], ['beast', 'bird'],
    ]
    for (const [atk, def] of cycle) {
      const result = getTypeEffectiveness(atk as any, def as any)
      expect(result.multiplier).toBe(1.5)
    }
  })
})

describe('Status Effects', () => {
  it('rollStatusEffect returns null for non-matching moves', () => {
    const result = rollStatusEffect('basic attack')
    expect(result).toBeNull()
  })

  it('rollStatusEffect can return poison for toxic moves', () => {
    let poisoned = false
    for (let i = 0; i < 100; i++) {
      const result = rollStatusEffect('Toxic Spit')
      if (result?.effect === 'poison') { poisoned = true; break }
    }
    expect(poisoned).toBe(true)
  })

  it('rollStatusEffect can return burn for fire moves', () => {
    let burned = false
    for (let i = 0; i < 100; i++) {
      const result = rollStatusEffect('Lava Breath')
      if (result?.effect === 'burn') { burned = true; break }
    }
    expect(burned).toBe(true)
  })

  it('rollStatusEffect can return stun for screech moves', () => {
    let stunned = false
    for (let i = 0; i < 100; i++) {
      const result = rollStatusEffect('Screech')
      if (result?.effect === 'stun') { stunned = true; break }
    }
    expect(stunned).toBe(true)
  })

  it('getStatusInfo returns correct data for all effects', () => {
    const effects = ['poison', 'stun', 'slow', 'burn', 'atkUp', 'defUp'] as const
    for (const effect of effects) {
      const info = getStatusInfo(effect)
      expect(info).not.toBeNull()
      expect(info!.icon.length).toBeGreaterThan(0)
      expect(info!.label.length).toBeGreaterThan(0)
    }
  })

  it('getStatusInfo returns null for null effect', () => {
    expect(getStatusInfo(null)).toBeNull()
  })

  it('applyPoisonDamage is 8% of max HP, minimum 1', () => {
    expect(applyPoisonDamage(100)).toBe(8)
    expect(applyPoisonDamage(50)).toBe(4)
    expect(applyPoisonDamage(5)).toBe(1)
  })

  it('applyBurnDamage is 6% of max HP, minimum 1', () => {
    expect(applyBurnDamage(100)).toBe(6)
    expect(applyBurnDamage(50)).toBe(3)
    expect(applyBurnDamage(5)).toBe(1)
  })
})

describe('Defend Buffs', () => {
  it('rollDefendBuff returns atkUp for howl-type moves', () => {
    const result = rollDefendBuff('Battle Howl')
    expect(result).not.toBeNull()
    expect(result!.effect).toBe('atkUp')
    expect(result!.turnsLeft).toBe(3)
  })

  it('rollDefendBuff returns defUp for shield-type moves', () => {
    const result = rollDefendBuff('Iron Shield')
    expect(result).not.toBeNull()
    expect(result!.effect).toBe('defUp')
    expect(result!.turnsLeft).toBe(3)
  })

  it('rollDefendBuff returns null for generic defend moves', () => {
    const result = rollDefendBuff('Rest')
    expect(result).toBeNull()
  })
})

describe('Personalities', () => {
  it('rollPersonality returns valid personality', () => {
    const valid = ['brave', 'timid', 'curious', 'playful', 'stoic', 'mischievous']
    for (let i = 0; i < 50; i++) {
      expect(valid).toContain(rollPersonality())
    }
  })

  it('getPersonalityReaction includes creature name', () => {
    const reaction = getPersonalityReaction('Buddy', 'brave')
    expect(reaction).toContain('Buddy')
  })
})

describe('Encounter Types', () => {
  it('legendary creatures always encounter alone', () => {
    for (let i = 0; i < 50; i++) {
      expect(rollEncounterType(mockCreature({ rarity: 'legendary' }))).toBe('single')
    }
  })

  it('getEncounterTypeInfo returns increasing XP multipliers', () => {
    expect(getEncounterTypeInfo('single').xpMultiplier).toBe(1.0)
    expect(getEncounterTypeInfo('pair').xpMultiplier).toBe(1.5)
    expect(getEncounterTypeInfo('pack').xpMultiplier).toBe(2.0)
  })

  it('getEncounterStatBoost increases with group size', () => {
    expect(getEncounterStatBoost('single')).toBe(1.0)
    expect(getEncounterStatBoost('pair')).toBe(1.2)
    expect(getEncounterStatBoost('pack')).toBe(1.4)
  })
})

describe('Friendly Gifts', () => {
  it('rollFriendlyGift returns a valid gift with creature name', () => {
    const gift = rollFriendlyGift(mockCreature({ name: 'Buddy' }))
    expect(gift.itemId).toBeTruthy()
    expect(gift.itemName).toBeTruthy()
    expect(gift.sprite).toBeTruthy()
    expect(gift.message).toContain('Buddy')
  })
})
