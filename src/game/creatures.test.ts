import { describe, it, expect } from 'vitest'
import { ALL_CREATURES } from './creatures'

describe('Creature Database', () => {
  it('has at least 30 creatures', () => {
    expect(ALL_CREATURES.length).toBeGreaterThanOrEqual(30)
  })

  it('all creatures have unique IDs', () => {
    const ids = ALL_CREATURES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all creatures have required fields', () => {
    for (const creature of ALL_CREATURES) {
      expect(creature.id).toBeTruthy()
      expect(creature.name).toBeTruthy()
      expect(creature.type).toBeTruthy()
      expect(creature.rarity).toBeTruthy()
      expect(creature.sprite).toBeTruthy()
      expect(creature.biomes.length).toBeGreaterThan(0)
      expect(creature.stats.hp).toBeGreaterThan(0)
      expect(creature.stats.maxHp).toBeGreaterThan(0)
      expect(creature.stats.attack).toBeGreaterThan(0)
      expect(creature.stats.defense).toBeGreaterThan(0)
      expect(creature.stats.speed).toBeGreaterThan(0)
      expect(creature.moves.length).toBeGreaterThan(0)
    }
  })

  it('hp equals maxHp for all base creatures', () => {
    for (const creature of ALL_CREATURES) {
      expect(creature.stats.hp).toBe(creature.stats.maxHp)
    }
  })

  it('all creatures have valid types', () => {
    const validTypes = ['bird', 'insect', 'amphibian', 'marine', 'beast', 'mystic']
    for (const creature of ALL_CREATURES) {
      expect(validTypes).toContain(creature.type)
    }
  })

  it('all creatures have valid rarities', () => {
    const validRarities = ['common', 'uncommon', 'rare', 'legendary']
    for (const creature of ALL_CREATURES) {
      expect(validRarities).toContain(creature.rarity)
    }
  })

  it('all creatures have valid active times', () => {
    const validTimes = ['dawn', 'day', 'dusk', 'night']
    for (const creature of ALL_CREATURES) {
      expect(Array.isArray(creature.activeTime)).toBe(true)
      expect(creature.activeTime.length).toBeGreaterThan(0)
      for (const t of creature.activeTime) {
        expect(validTimes).toContain(t)
      }
    }
  })

  it('all creatures have at least one attack move', () => {
    for (const creature of ALL_CREATURES) {
      const attackMoves = creature.moves.filter(m => m.type === 'attack' || m.type === 'special')
      expect(attackMoves.length).toBeGreaterThan(0)
    }
  })

  it('has at least one legendary creature', () => {
    const legendaries = ALL_CREATURES.filter(c => c.rarity === 'legendary')
    expect(legendaries.length).toBeGreaterThan(0)
  })

  it('has creatures across all biome types', () => {
    const biomeSet = new Set<string>()
    for (const creature of ALL_CREATURES) {
      creature.biomes.forEach(b => biomeSet.add(b))
    }
    expect(biomeSet.has('forest')).toBe(true)
    expect(biomeSet.has('marsh')).toBe(true)
    expect(biomeSet.has('beach')).toBe(true)
    expect(biomeSet.has('mountain')).toBe(true)
  })
})
