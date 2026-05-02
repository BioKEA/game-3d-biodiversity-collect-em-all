import type { CapturedCreature, CreatureStats, InventoryItem } from '@/types/game'

export interface HeldItem {
  id: string
  name: string
  sprite: string
  description: string
  price: number
  atkMul?: number
  defMul?: number
  spdMul?: number
  hpMul?: number
}

export const HELD_ITEMS: Record<string, HeldItem> = {
  'power-stone': {
    id: 'power-stone',
    name: 'Power Stone',
    sprite: '💎',
    description: '+25% Attack in battle',
    price: 200,
    atkMul: 1.25,
  },
  'iron-plate': {
    id: 'iron-plate',
    name: 'Iron Plate',
    sprite: '🛡️',
    description: '+25% Defense in battle',
    price: 200,
    defMul: 1.25,
  },
  'swift-feather': {
    id: 'swift-feather',
    name: 'Swift Feather',
    sprite: '🪶',
    description: '+25% Speed in battle',
    price: 200,
    spdMul: 1.25,
  },
  'vitality-charm': {
    id: 'vitality-charm',
    name: 'Vitality Charm',
    sprite: '❤️‍🔥',
    description: '+20% Max HP in battle',
    price: 250,
    hpMul: 1.20,
  },
  'focus-band': {
    id: 'focus-band',
    name: 'Focus Band',
    sprite: '🎯',
    description: '+15% Attack and Defense',
    price: 350,
    atkMul: 1.15,
    defMul: 1.15,
  },
}

export const HELD_ITEM_LIST: HeldItem[] = Object.values(HELD_ITEMS)

/** Returns stats with held item modifiers applied. Pass-through if no item. */
export function getEffectiveStats(creature: CapturedCreature): CreatureStats {
  const itemId = creature.heldItem
  if (!itemId) return creature.stats
  const item = HELD_ITEMS[itemId]
  if (!item) return creature.stats
  return {
    hp: creature.stats.hp,
    maxHp: Math.floor(creature.stats.maxHp * (item.hpMul ?? 1)),
    attack: Math.floor(creature.stats.attack * (item.atkMul ?? 1)),
    defense: Math.floor(creature.stats.defense * (item.defMul ?? 1)),
    speed: Math.floor(creature.stats.speed * (item.spdMul ?? 1)),
  }
}

/** Get the held item object for a creature, if any */
export function getHeldItem(creature: CapturedCreature): HeldItem | null {
  if (!creature.heldItem) return null
  return HELD_ITEMS[creature.heldItem] ?? null
}

/** Check if an inventory item is a held item type */
export function isHeldItem(item: InventoryItem): boolean {
  return item.type === 'held'
}
