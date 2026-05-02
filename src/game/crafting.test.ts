import { describe, it, expect } from 'vitest'
import { RECIPES, MATERIALS, canCraft, getMaterialDrops, rollMaterialDrops, getMaterial } from './crafting'
import type { InventoryItem } from '@/types/game'

describe('Crafting Materials', () => {
  it('all materials have unique IDs', () => {
    const ids = MATERIALS.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all materials are type material', () => {
    for (const mat of MATERIALS) {
      expect(mat.type).toBe('material')
    }
  })

  it('all materials start with quantity 0', () => {
    for (const mat of MATERIALS) {
      expect(mat.quantity).toBe(0)
    }
  })

  it('getMaterial returns correct material', () => {
    const leaf = getMaterial('bay-leaf')
    expect(leaf).toBeDefined()
    expect(leaf!.name).toBe('Bay Leaf')
  })

  it('getMaterial returns undefined for invalid ID', () => {
    expect(getMaterial('nonexistent')).toBeUndefined()
  })
})

describe('Crafting Recipes', () => {
  it('all recipes have unique IDs', () => {
    const ids = RECIPES.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all recipe ingredients reference valid materials', () => {
    const materialIds = new Set(MATERIALS.map(m => m.id))
    for (const recipe of RECIPES) {
      for (const ing of recipe.ingredients) {
        expect(materialIds.has(ing.itemId)).toBe(true)
      }
    }
  })

  it('all recipes have positive unlock levels', () => {
    for (const recipe of RECIPES) {
      expect(recipe.unlockLevel).toBeGreaterThan(0)
    }
  })

  it('all recipes produce at least 1 item', () => {
    for (const recipe of RECIPES) {
      expect(recipe.result.quantity).toBeGreaterThan(0)
    }
  })

  it('all ingredient quantities are positive', () => {
    for (const recipe of RECIPES) {
      for (const ing of recipe.ingredients) {
        expect(ing.quantity).toBeGreaterThan(0)
      }
    }
  })
})

describe('canCraft', () => {
  const makeInventory = (items: [string, number][]): InventoryItem[] =>
    items.map(([id, qty]) => {
      const mat = MATERIALS.find(m => m.id === id)
      return {
        id,
        name: mat?.name ?? id,
        type: 'material' as const,
        quantity: qty,
        description: '',
        sprite: '',
      }
    })

  it('returns true when player has enough materials', () => {
    const recipe = RECIPES.find(r => r.id === 'craft-herb-potion')!
    const inv = makeInventory([['bay-leaf', 5], ['marsh-reed', 3]])
    expect(canCraft(recipe, inv)).toBe(true)
  })

  it('returns false when missing an ingredient entirely', () => {
    const recipe = RECIPES.find(r => r.id === 'craft-herb-potion')!
    const inv = makeInventory([['bay-leaf', 5]])
    expect(canCraft(recipe, inv)).toBe(false)
  })

  it('returns false when ingredient quantity is insufficient', () => {
    const recipe = RECIPES.find(r => r.id === 'craft-herb-potion')!
    const inv = makeInventory([['bay-leaf', 2], ['marsh-reed', 2]])
    expect(canCraft(recipe, inv)).toBe(false)
  })

  it('returns true with exact quantities', () => {
    const recipe = RECIPES.find(r => r.id === 'craft-herb-potion')!
    const inv = makeInventory([['bay-leaf', 3], ['marsh-reed', 2]])
    expect(canCraft(recipe, inv)).toBe(true)
  })
})

describe('Material Drops', () => {
  it('getMaterialDrops returns drops for all biome types', () => {
    for (const biome of ['forest', 'redwood', 'beach', 'water', 'marsh', 'mountain', 'grassland', 'urban']) {
      const drops = getMaterialDrops(biome)
      expect(drops.length).toBeGreaterThan(0)
      for (const drop of drops) {
        expect(drop.weight).toBeGreaterThan(0)
        expect(getMaterial(drop.itemId)).toBeDefined()
      }
    }
  })

  it('rollMaterialDrops returns valid drops', () => {
    for (let i = 0; i < 50; i++) {
      const drops = rollMaterialDrops('forest', 5)
      for (const drop of drops) {
        expect(drop.itemId).toBeTruthy()
        expect(drop.quantity).toBeGreaterThan(0)
        expect(drop.name).toBeTruthy()
        expect(drop.sprite).toBeTruthy()
      }
    }
  })

  it('higher level gets more drop rolls', () => {
    let lowLevelTotal = 0
    let highLevelTotal = 0
    const trials = 500
    for (let i = 0; i < trials; i++) {
      lowLevelTotal += rollMaterialDrops('forest', 1).reduce((s, d) => s + d.quantity, 0)
      highLevelTotal += rollMaterialDrops('forest', 15).reduce((s, d) => s + d.quantity, 0)
    }
    expect(highLevelTotal / trials).toBeGreaterThan(lowLevelTotal / trials)
  })

  it('forest drops include redwood-bark', () => {
    const drops = getMaterialDrops('forest')
    expect(drops.some(d => d.itemId === 'redwood-bark')).toBe(true)
  })

  it('beach drops include tide-crystal', () => {
    const drops = getMaterialDrops('beach')
    expect(drops.some(d => d.itemId === 'tide-crystal')).toBe(true)
  })

  it('mountain drops include quartz-shard and ember-moss', () => {
    const drops = getMaterialDrops('mountain')
    expect(drops.some(d => d.itemId === 'quartz-shard')).toBe(true)
    expect(drops.some(d => d.itemId === 'ember-moss')).toBe(true)
  })
})
