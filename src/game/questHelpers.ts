import type { QuestObjective, PlayerState, ConservationStatus } from '@/types/game'
import { ALL_CREATURES } from './creatures'

const CONSERVATION_LABEL: Record<ConservationStatus, string> = {
  LC: 'Least Concern',
  NT: 'Near Threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically Endangered',
  EX: 'Extinct',
  INV: 'Invasive',
  NA: 'Naturalized',
  fantasy: 'Mythical',
}

export function describeObjective(obj: QuestObjective): string {
  switch (obj.type) {
    case 'catch': {
      const creature = ALL_CREATURES.find(c => c.id === obj.creatureId)
      return `Catch ${obj.count} ${creature?.name ?? obj.creatureId}`
    }
    case 'catch_any':
      return `Catch ${obj.count} wild creature${obj.count > 1 ? 's' : ''}`
    case 'visit':
      return `Visit ${obj.subregion}`
    case 'catch_type':
      return `Catch ${obj.count} ${obj.creatureType} species`
    case 'catch_rarity':
      return `Catch ${obj.count} ${obj.rarity} creature`
    case 'catch_conservation':
      return `Document ${obj.count} ${CONSERVATION_LABEL[obj.status]} species`
    case 'remove_invasive':
      return `Remove ${obj.count} invasive creatures`
  }
}

export function getQuestProgress(obj: QuestObjective, player: PlayerState): number {
  switch (obj.type) {
    case 'catch':
      return player.captured.filter(id => id === obj.creatureId).length > 0 ? 1 : 0
    case 'catch_any':
      return Math.min(player.captured.length, obj.count)
    case 'visit':
      return player.journal[obj.subregion] ? 1 : 0
    case 'catch_type': {
      const matching = new Set<string>()
      for (const id of player.captured) {
        const c = ALL_CREATURES.find(cr => cr.id === id)
        if (c?.type === obj.creatureType) matching.add(id)
      }
      return Math.min(matching.size, obj.count)
    }
    case 'catch_rarity': {
      const matching = new Set<string>()
      for (const id of player.captured) {
        const c = ALL_CREATURES.find(cr => cr.id === id)
        if (c?.rarity === obj.rarity) matching.add(id)
      }
      return Math.min(matching.size, obj.count)
    }
    case 'catch_conservation': {
      const matching = new Set<string>()
      for (const id of player.captured) {
        const c = ALL_CREATURES.find(cr => cr.id === id)
        if (c?.conservationStatus === obj.status) matching.add(id)
      }
      return Math.min(matching.size, obj.count)
    }
    case 'remove_invasive':
      return Math.min(player.invasivesRemoved ?? 0, obj.count)
  }
}

export function getObjectiveTarget(obj: QuestObjective): number {
  switch (obj.type) {
    case 'catch': return obj.count
    case 'catch_any': return obj.count
    case 'visit': return 1
    case 'catch_type': return obj.count
    case 'catch_rarity': return obj.count
    case 'catch_conservation': return obj.count
    case 'remove_invasive': return obj.count
  }
}
