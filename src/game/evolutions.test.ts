import { describe, it, expect } from 'vitest'
import { getEvolution, getEvolutionTarget, getPreEvolution, evolveCreature, EVOLUTIONS } from './evolutions'
import { ALL_CREATURES } from './creatures'
import type { CapturedCreature } from '@/types/game'

describe('Evolution Chains', () => {
  it('all evolutions reference valid creature IDs', () => {
    const creatureIds = new Set(ALL_CREATURES.map(c => c.id))
    for (const evo of EVOLUTIONS) {
      expect(creatureIds.has(evo.fromId)).toBe(true)
      expect(creatureIds.has(evo.toId)).toBe(true)
    }
  })

  it('no creature evolves into itself', () => {
    for (const evo of EVOLUTIONS) {
      expect(evo.fromId).not.toBe(evo.toId)
    }
  })

  it('evolution level requirements are positive', () => {
    for (const evo of EVOLUTIONS) {
      expect(evo.level).toBeGreaterThan(0)
    }
  })

  it('all evolutions have descriptions', () => {
    for (const evo of EVOLUTIONS) {
      expect(evo.description.length).toBeGreaterThan(0)
    }
  })

  it('getEvolutionTarget returns evolution for base creatures', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')
    expect(evo).not.toBeNull()
    expect(evo!.toId).toBe('california-newt')
  })

  it('getEvolution checks level requirement', () => {
    // Pacific tree frog evolves at level 12
    expect(getEvolution('pacific-tree-frog', 5)).toBeNull()
    expect(getEvolution('pacific-tree-frog', 12)).not.toBeNull()
    expect(getEvolution('pacific-tree-frog', 20)).not.toBeNull()
  })

  it('getEvolutionTarget returns null for fully evolved creatures', () => {
    // california-newt is a toId, so it should not have a further evolution
    // unless it also evolves — check if it does
    const evo = getEvolutionTarget('golden-eagle')
    expect(evo).toBeNull()
  })

  it('getPreEvolution returns the pre-evolution', () => {
    const pre = getPreEvolution('california-newt')
    expect(pre).not.toBeNull()
    expect(pre!.fromId).toBe('pacific-tree-frog')
  })

  it('getPreEvolution returns null for base creatures', () => {
    expect(getPreEvolution('pacific-tree-frog')).toBeNull()
  })
})

describe('evolveCreature', () => {
  it('evolves creature with correct species data', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')!
    const baseCaptured: CapturedCreature = {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      sprite: '🐸',
      type: 'amphibian',
      rarity: 'common',
      stats: { hp: 25, maxHp: 25, attack: 10, defense: 8, speed: 12 },
      level: 15,
      xp: 50,
      maxXp: 100,
      moves: [{ name: 'Tackle', type: 'attack', power: 15 }],
      personality: 'curious',
      capturedBiome: 'marsh',
    }

    const evolved = evolveCreature(baseCaptured, evo)
    expect(evolved.id).toBe('california-newt')
    expect(evolved.name).toBe('California Newt')
    expect(evolved.level).toBe(15)
  })

  it('preserves personality and biome', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')!
    const baseCaptured: CapturedCreature = {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      sprite: '🐸',
      type: 'amphibian',
      rarity: 'common',
      stats: { hp: 25, maxHp: 25, attack: 10, defense: 8, speed: 12 },
      level: 15,
      xp: 50,
      maxXp: 100,
      moves: [{ name: 'Tackle', type: 'attack', power: 15 }],
      personality: 'curious',
      capturedBiome: 'marsh',
    }

    const evolved = evolveCreature(baseCaptured, evo)
    expect(evolved.capturedBiome).toBe('marsh')
  })

  it('preserves nickname if set', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')!
    const baseCaptured: CapturedCreature = {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      sprite: '🐸',
      type: 'amphibian',
      rarity: 'common',
      stats: { hp: 25, maxHp: 25, attack: 10, defense: 8, speed: 12 },
      level: 15,
      xp: 50,
      maxXp: 100,
      moves: [{ name: 'Tackle', type: 'attack', power: 15 }],
      personality: 'curious',
      capturedBiome: 'marsh',
      nickname: 'Froggy',
    }

    const evolved = evolveCreature(baseCaptured, evo)
    expect(evolved.nickname).toBe('Froggy')
  })

  it('heals HP to full on evolution', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')!
    const baseCaptured: CapturedCreature = {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      sprite: '🐸',
      type: 'amphibian',
      rarity: 'common',
      stats: { hp: 5, maxHp: 25, attack: 10, defense: 8, speed: 12 },
      level: 15,
      xp: 50,
      maxXp: 100,
      moves: [{ name: 'Tackle', type: 'attack', power: 15 }],
      personality: 'curious',
      capturedBiome: 'marsh',
    }

    const evolved = evolveCreature(baseCaptured, evo)
    expect(evolved.stats.hp).toBe(evolved.stats.maxHp)
  })

  it('stats are boosted based on level', () => {
    const evo = getEvolutionTarget('pacific-tree-frog')!
    const target = ALL_CREATURES.find(c => c.id === 'california-newt')!
    const baseCaptured: CapturedCreature = {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      sprite: '🐸',
      type: 'amphibian',
      rarity: 'common',
      stats: { hp: 25, maxHp: 25, attack: 10, defense: 8, speed: 12 },
      level: 20,
      xp: 50,
      maxXp: 100,
      moves: [{ name: 'Tackle', type: 'attack', power: 15 }],
      personality: 'curious',
      capturedBiome: 'marsh',
    }

    const evolved = evolveCreature(baseCaptured, evo)
    // At level 20, bonus = 19 * 3 for HP, should be greater than base
    expect(evolved.stats.maxHp).toBeGreaterThan(target.stats.maxHp)
    expect(evolved.stats.attack).toBeGreaterThan(target.stats.attack)
  })
})
