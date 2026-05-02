import type { InventoryItem } from '@/types/game'

export interface CraftingRecipe {
  id: string
  name: string
  description: string
  sprite: string
  ingredients: { itemId: string; quantity: number }[]
  result: { itemId: string; name: string; type: InventoryItem['type']; quantity: number; description: string; sprite: string }
  unlockLevel: number
}

// Material definitions — these are items players collect from battles, foraging, etc.
export const MATERIALS: InventoryItem[] = [
  { id: 'bay-leaf', name: 'Bay Leaf', type: 'material', quantity: 0, description: 'A fragrant leaf from the Bay laurel tree. Common in forests.', sprite: '🍃' },
  { id: 'fog-dew', name: 'Fog Dew', type: 'material', quantity: 0, description: 'Morning moisture collected from coastal fog. Shimmers faintly.', sprite: '💧' },
  { id: 'tide-crystal', name: 'Tide Crystal', type: 'material', quantity: 0, description: 'A salt crystal formed in tidal pools along the beach.', sprite: '💎' },
  { id: 'ember-moss', name: 'Ember Moss', type: 'material', quantity: 0, description: 'Warm moss from volcanic soil on mountain slopes.', sprite: '🔥' },
  { id: 'redwood-bark', name: 'Redwood Bark', type: 'material', quantity: 0, description: 'Thick, fibrous bark shed by ancient redwoods.', sprite: '🪵' },
  { id: 'marsh-reed', name: 'Marsh Reed', type: 'material', quantity: 0, description: 'A tough reed from wetland marshes. Surprisingly versatile.', sprite: '🌾' },
  { id: 'quartz-shard', name: 'Quartz Shard', type: 'material', quantity: 0, description: 'A glinting piece of quartz found in hills and mountains.', sprite: '✨' },
  { id: 'mystic-spore', name: 'Mystic Spore', type: 'material', quantity: 0, description: 'A glowing spore from a creature encounter. Rare and valuable.', sprite: '🍄' },
]

export const RECIPES: CraftingRecipe[] = [
  // Basic recipes
  {
    id: 'craft-herb-potion',
    name: 'Herb Potion',
    description: 'Brew a healing potion from bay leaves and marsh reeds.',
    sprite: '🧪',
    ingredients: [
      { itemId: 'bay-leaf', quantity: 3 },
      { itemId: 'marsh-reed', quantity: 2 },
    ],
    result: { itemId: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 2, description: 'Restores 30 HP to one creature.', sprite: '🧪' },
    unlockLevel: 1,
  },
  {
    id: 'craft-bio-capsule',
    name: 'Bio Capsule',
    description: 'Shape tide crystals and redwood bark into a capture device.',
    sprite: '🔮',
    ingredients: [
      { itemId: 'tide-crystal', quantity: 2 },
      { itemId: 'redwood-bark', quantity: 2 },
    ],
    result: { itemId: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 3, description: 'A standard capture device for creatures.', sprite: '🔮' },
    unlockLevel: 1,
  },
  {
    id: 'craft-energy-berry',
    name: 'Energy Berry',
    description: 'Infuse ember moss with fog dew to create a potent berry.',
    sprite: '🫐',
    ingredients: [
      { itemId: 'ember-moss', quantity: 2 },
      { itemId: 'fog-dew', quantity: 3 },
    ],
    result: { itemId: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 2, description: 'Boosts attack for the next battle.', sprite: '🫐' },
    unlockLevel: 2,
  },
  // Intermediate recipes
  {
    id: 'craft-super-potion',
    name: 'Super Potion',
    description: 'A powerful healing mixture using mystic spores.',
    sprite: '💊',
    ingredients: [
      { itemId: 'bay-leaf', quantity: 4 },
      { itemId: 'mystic-spore', quantity: 1 },
      { itemId: 'fog-dew', quantity: 2 },
    ],
    result: { itemId: 'super-potion', name: 'Super Potion', type: 'heal', quantity: 1, description: 'Restores 80 HP to one creature.', sprite: '💊' },
    unlockLevel: 5,
  },
  {
    id: 'craft-golden-capsule',
    name: 'Golden Capsule',
    description: 'A premium capture device with quartz amplification.',
    sprite: '✨',
    ingredients: [
      { itemId: 'quartz-shard', quantity: 3 },
      { itemId: 'tide-crystal', quantity: 2 },
      { itemId: 'redwood-bark', quantity: 3 },
    ],
    result: { itemId: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
    unlockLevel: 5,
  },
  // Advanced recipes
  {
    id: 'craft-max-potion',
    name: 'Max Potion',
    description: 'The ultimate healing potion. Requires rare ingredients.',
    sprite: '🏆',
    ingredients: [
      { itemId: 'mystic-spore', quantity: 2 },
      { itemId: 'bay-leaf', quantity: 5 },
      { itemId: 'ember-moss', quantity: 3 },
      { itemId: 'fog-dew', quantity: 3 },
    ],
    result: { itemId: 'max-potion', name: 'Max Potion', type: 'heal', quantity: 1, description: 'Fully restores HP to one creature.', sprite: '🏆' },
    unlockLevel: 10,
  },
  {
    id: 'craft-mega-capsule',
    name: 'Mega Capsule',
    description: 'The most effective capture device. Nearly guaranteed catch.',
    sprite: '🌟',
    ingredients: [
      { itemId: 'quartz-shard', quantity: 5 },
      { itemId: 'mystic-spore', quantity: 2 },
      { itemId: 'tide-crystal', quantity: 3 },
    ],
    result: { itemId: 'mega-capsule', name: 'Mega Capsule', type: 'capture', quantity: 1, description: 'An extremely effective capture device. Very high success rate.', sprite: '🌟' },
    unlockLevel: 10,
  },
  {
    id: 'craft-power-crystal',
    name: 'Power Crystal',
    description: 'A concentrated energy crystal that greatly boosts attack.',
    sprite: '⚡',
    ingredients: [
      { itemId: 'quartz-shard', quantity: 4 },
      { itemId: 'ember-moss', quantity: 3 },
      { itemId: 'mystic-spore', quantity: 1 },
    ],
    result: { itemId: 'power-crystal', name: 'Power Crystal', type: 'boost', quantity: 1, description: 'Greatly boosts attack for the next 3 battles.', sprite: '⚡' },
    unlockLevel: 8,
  },
]

/** Check if player has enough materials for a recipe */
export function canCraft(recipe: CraftingRecipe, inventory: InventoryItem[]): boolean {
  return recipe.ingredients.every(ing => {
    const item = inventory.find(i => i.id === ing.itemId)
    return item && item.quantity >= ing.quantity
  })
}

/** Get the material drop table for a given biome */
export function getMaterialDrops(biome: string): { itemId: string; weight: number }[] {
  const drops: { itemId: string; weight: number }[] = []

  // Universal drops
  drops.push({ itemId: 'bay-leaf', weight: 30 })

  // Biome-specific drops
  switch (biome) {
    case 'forest': case 'redwood':
      drops.push({ itemId: 'redwood-bark', weight: 35 })
      drops.push({ itemId: 'bay-leaf', weight: 20 })
      drops.push({ itemId: 'mystic-spore', weight: 5 })
      break
    case 'beach': case 'water':
      drops.push({ itemId: 'tide-crystal', weight: 35 })
      drops.push({ itemId: 'fog-dew', weight: 25 })
      break
    case 'marsh':
      drops.push({ itemId: 'marsh-reed', weight: 40 })
      drops.push({ itemId: 'fog-dew', weight: 20 })
      break
    case 'mountain':
      drops.push({ itemId: 'quartz-shard', weight: 30 })
      drops.push({ itemId: 'ember-moss', weight: 30 })
      break
    case 'grassland': case 'urban':
      drops.push({ itemId: 'bay-leaf', weight: 20 })
      drops.push({ itemId: 'fog-dew', weight: 20 })
      drops.push({ itemId: 'marsh-reed', weight: 15 })
      break
    default:
      drops.push({ itemId: 'fog-dew', weight: 25 })
      break
  }

  return drops
}

/** Roll for material drops after a battle victory */
export function rollMaterialDrops(biome: string, playerLevel: number): { itemId: string; name: string; quantity: number; sprite: string }[] {
  const dropTable = getMaterialDrops(biome)
  const totalWeight = dropTable.reduce((sum, d) => sum + d.weight, 0)
  const drops: { itemId: string; name: string; quantity: number; sprite: string }[] = []

  // Number of drop rolls: 1-3 based on level
  const numRolls = Math.min(3, 1 + Math.floor(playerLevel / 5))

  for (let i = 0; i < numRolls; i++) {
    let roll = Math.random() * totalWeight
    for (const drop of dropTable) {
      roll -= drop.weight
      if (roll <= 0) {
        const mat = MATERIALS.find(m => m.id === drop.itemId)
        if (mat) {
          const existing = drops.find(d => d.itemId === drop.itemId)
          if (existing) {
            existing.quantity++
          } else {
            drops.push({ itemId: drop.itemId, name: mat.name, quantity: 1, sprite: mat.sprite })
          }
        }
        break
      }
    }
  }

  return drops
}

/** Get a material by ID */
export function getMaterial(id: string): InventoryItem | undefined {
  return MATERIALS.find(m => m.id === id)
}
