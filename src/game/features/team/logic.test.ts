import { describe, it, expect } from 'vitest'
import {
  swapLead, teachMove, learnAbility, manualEvolve, releaseFromTeam, swapFromReserve, adoptFromReserve, releaseFromReserve,
  setNickname, healAllTeam, assignHeldItem, petCreature, useHealItem,
} from './logic'
import { makeState, makeCaptured } from '@/test/fixtures'
import { EVOLUTIONS } from '@/game/evolutions'
import { HELD_ITEMS } from '@/game/heldItems'
import type { InventoryItem } from '@/types/game'

const two = () => makeState({}, { team: [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' })], reserves: [makeCaptured({ id: 'r' })] })

describe('team', () => {
  it('swapLead', () => { expect(swapLead(two(), 1).player.team.map(c => c.id)).toEqual(['b', 'a']) })
  it('teachMove replaces creature and charges cost, floor 0', () => {
    const r = teachMove(two(), 0, makeCaptured({ id: 'a2' }), 500)
    expect(r.player.team[0].id).toBe('a2'); expect(r.player.coins).toBe(0)
  })
  it('learnAbility sets learnedAbility; bad index no-op', () => {
    expect(learnAbility(two(), 1, 'ab', 10).player.team[1].learnedAbility).toBe('ab')
    const s = two(); expect(learnAbility(s, 9, 'ab', 10)).toBe(s)
  })
  it('manualEvolve evolves when eligible, no-op otherwise', () => {
    const evo = EVOLUTIONS[0]
    const s = makeState({}, { team: [makeCaptured({ id: evo.fromId, level: evo.level })] })
    const r = manualEvolve(s, 0)
    expect(r.evolution?.teamIndex).toBe(0); expect(r.state.player.team[0].id).toBe(evo.toId)
    const s2 = two()
    const none = manualEvolve(s2, 0)
    expect(none.evolution).toBeNull(); expect(none.state).toBe(s2)
  })
  it('releaseFromTeam refuses index 0 and single-member teams', () => {
    const s = two(); expect(releaseFromTeam(s, 0)).toBe(s)
    expect(releaseFromTeam(s, 1).player.team).toHaveLength(1)
    const one = makeState(); expect(releaseFromTeam(one, 1)).toBe(one)
  })
  it('reserve ops', () => {
    expect(swapFromReserve(two(), 0, 1).player.team[1].id).toBe('r')
    expect(adoptFromReserve(two(), 0).player.team).toHaveLength(3)
    expect(releaseFromReserve(two(), 0).player.reserves).toHaveLength(0)
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })), reserves: [makeCaptured()] })
    expect(adoptFromReserve(full, 0)).toBe(full)
  })
})

// --- The five transitions lifted out of InventoryScreenWrapper's inline updaters ---
// The replay oracle never opens the inventory screen, so these tests are the
// parity evidence: every expected number below is derived from the original
// arrow bodies in screens/InventoryScreenWrapper.tsx.

const held = (id: string, quantity: number): InventoryItem => ({
  id, name: HELD_ITEMS[id].name, type: 'held', quantity,
  description: HELD_ITEMS[id].description, sprite: HELD_ITEMS[id].sprite,
})
const potion = (quantity: number): InventoryItem => ({
  id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity,
  description: 'Restores 30 HP to one creature.', sprite: '🧪',
})

describe('setNickname', () => {
  it('renames only the given index', () => {
    const r = setNickname(two(), 1, 'Sparky')
    expect(r.player.team[1].nickname).toBe('Sparky')
    expect(r.player.team[0].nickname).toBeUndefined()
  })
})

describe('healAllTeam', () => {
  it('charges 50 coins and refills every member to maxHp', () => {
    const s = makeState({}, {
      coins: 100,
      team: [
        makeCaptured({ id: 'a', stats: { hp: 1, maxHp: 30, attack: 8, defense: 6, speed: 7 } }),
        makeCaptured({ id: 'b', stats: { hp: 12, maxHp: 40, attack: 8, defense: 6, speed: 7 } }),
      ],
    })
    const r = healAllTeam(s)
    expect(r.player.coins).toBe(50)
    expect(r.player.team.map(c => c.stats.hp)).toEqual([30, 40])
  })
  it('no-ops below 50 coins', () => {
    const s = makeState({}, { coins: 49 })
    expect(healAllTeam(s)).toBe(s)
  })
})

describe('assignHeldItem', () => {
  it('refunds the previously held item, consumes the new one, and drops emptied held slots', () => {
    const s = makeState({}, {
      inventory: [held('power-stone', 1), held('iron-plate', 1)],
      team: [makeCaptured({ id: 'a', heldItem: 'iron-plate' }), makeCaptured({ id: 'b' })],
    })
    const r = assignHeldItem(s, 0, 'power-stone')
    // iron-plate refunded 1 -> 1, power-stone consumed 1 -> 0 and filtered out
    expect(r.player.inventory.map(i => [i.id, i.quantity])).toEqual([['iron-plate', 2]])
    expect(r.player.team[0].heldItem).toBe('power-stone')
    expect(r.player.team[1].heldItem).toBeUndefined()
  })
  it('recreates the inventory entry when the refunded slot was already filtered away', () => {
    const s = makeState({}, {
      inventory: [potion(2)],
      team: [makeCaptured({ id: 'a', heldItem: 'power-stone' })],
    })
    const r = assignHeldItem(s, 0, null)
    expect(r.player.inventory.map(i => [i.id, i.quantity])).toEqual([['herb-potion', 2], ['power-stone', 1]])
    expect(r.player.inventory[1]).toEqual(held('power-stone', 1))
    expect(r.player.team[0].heldItem).toBeUndefined()
  })
  it('no-ops on a missing creature and on an item the player does not have', () => {
    const s = makeState({}, { inventory: [held('power-stone', 1)], team: [makeCaptured({ id: 'a' })] })
    expect(assignHeldItem(s, 9, 'power-stone')).toBe(s)
    expect(assignHeldItem(s, 0, 'iron-plate')).toBe(s)
  })
  it('non-held items are never filtered out even at quantity 0', () => {
    const s = makeState({}, { inventory: [potion(0), held('power-stone', 1)], team: [makeCaptured({ id: 'a' })] })
    const r = assignHeldItem(s, 0, 'power-stone')
    expect(r.player.inventory.map(i => [i.id, i.quantity])).toEqual([['herb-potion', 0]])
  })
})

describe('petCreature', () => {
  it('adds PET_GAIN (5) happiness to the given index only', () => {
    const s = makeState({}, { team: [makeCaptured({ id: 'a', happiness: 50 }), makeCaptured({ id: 'b', happiness: 50 })] })
    const r = petCreature(s, 1)
    expect(r.player.team.map(c => c.happiness)).toEqual([50, 55])
  })
})

describe('useHealItem', () => {
  it('heals capped at maxHp and decrements the item', () => {
    const s = makeState({}, {
      inventory: [potion(5)],
      team: [makeCaptured({ id: 'a', stats: { hp: 10, maxHp: 30, attack: 8, defense: 6, speed: 7 } })],
    })
    const r = useHealItem(s, 'herb-potion', 0)
    // herb-potion heals 30; min(maxHp 30, hp 10 + 30) === 30
    expect(r.player.team[0].stats.hp).toBe(30)
    expect(r.player.inventory.map(i => [i.id, i.quantity])).toEqual([['herb-potion', 4]])
  })
  it('drops the slot when the last non-held copy is used', () => {
    const s = makeState({}, {
      inventory: [potion(1)],
      team: [makeCaptured({ id: 'a', stats: { hp: 10, maxHp: 30, attack: 8, defense: 6, speed: 7 } })],
    })
    expect(useHealItem(s, 'herb-potion', 0).player.inventory).toEqual([])
  })
  it('no-ops for a missing item, an empty stack, a missing creature, and a full-HP creature', () => {
    const base = makeState({}, {
      inventory: [potion(0)],
      team: [makeCaptured({ id: 'a', stats: { hp: 10, maxHp: 30, attack: 8, defense: 6, speed: 7 } })],
    })
    expect(useHealItem(base, 'super-potion', 0)).toBe(base)
    expect(useHealItem(base, 'herb-potion', 0)).toBe(base)
    const stocked = { ...base, player: { ...base.player, inventory: [potion(5)] } }
    expect(useHealItem(stocked, 'herb-potion', 9)).toBe(stocked)
    const fullHp = makeState({}, { inventory: [potion(5)], team: [makeCaptured({ id: 'a' })] })
    expect(useHealItem(fullHp, 'herb-potion', 0)).toBe(fullHp)
  })
})
