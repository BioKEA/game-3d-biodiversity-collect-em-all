import { describe, it, expect } from 'vitest'
import { RANGERS, getRangerAt, getNearbyRanger } from './rangers'
import { ALL_CREATURES } from './creatures'

describe('Rangers', () => {
  it('has at least 8 rangers', () => {
    expect(RANGERS.length).toBeGreaterThanOrEqual(8)
  })

  it('all rangers have unique IDs', () => {
    const ids = RANGERS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all rangers have required fields', () => {
    for (const ranger of RANGERS) {
      expect(ranger.id).toBeTruthy()
      expect(ranger.name).toBeTruthy()
      expect(ranger.title).toBeTruthy()
      expect(ranger.greeting).toBeTruthy()
      expect(ranger.sprite).toBeTruthy()
      expect(ranger.subregion).toBeTruthy()
      expect(ranger.quests.length).toBeGreaterThan(0)
      expect(typeof ranger.x).toBe('number')
      expect(typeof ranger.y).toBe('number')
    }
  })

  it('all quest creature IDs reference valid creatures', () => {
    const creatureIds = new Set(ALL_CREATURES.map(c => c.id))
    for (const ranger of RANGERS) {
      for (const quest of ranger.quests) {
        if (quest.objective.type === 'catch') {
          expect(creatureIds.has(quest.objective.creatureId)).toBe(true)
        }
      }
    }
  })

  it('all quests have unique IDs across all rangers', () => {
    const questIds: string[] = []
    for (const ranger of RANGERS) {
      for (const quest of ranger.quests) {
        questIds.push(quest.id)
      }
    }
    expect(new Set(questIds).size).toBe(questIds.length)
  })

  it('all quests have positive XP rewards', () => {
    for (const ranger of RANGERS) {
      for (const quest of ranger.quests) {
        expect(quest.reward.xp).toBeGreaterThan(0)
      }
    }
  })

  it('all trade items have required fields', () => {
    for (const ranger of RANGERS) {
      for (const trade of ranger.trades) {
        expect(trade.give.itemId).toBeTruthy()
        expect(trade.give.quantity).toBeGreaterThan(0)
        expect(trade.receive.itemId).toBeTruthy()
        expect(trade.receive.quantity).toBeGreaterThan(0)
      }
    }
  })
})

describe('getRangerAt', () => {
  it('returns ranger at exact coordinates', () => {
    const ranger = RANGERS[0]
    const found = getRangerAt(ranger.x, ranger.y)
    expect(found).toBeDefined()
    expect(found!.id).toBe(ranger.id)
  })

  it('returns undefined for empty coordinates', () => {
    expect(getRangerAt(0, 0)).toBeUndefined()
  })
})

describe('getNearbyRanger', () => {
  it('finds ranger within 1 tile', () => {
    const ranger = RANGERS[0]
    const found = getNearbyRanger(ranger.x + 1, ranger.y)
    expect(found).toBeDefined()
    expect(found!.id).toBe(ranger.id)
  })

  it('does not find ranger far away', () => {
    const found = getNearbyRanger(55, 55)
    expect(found).toBeUndefined()
  })
})
