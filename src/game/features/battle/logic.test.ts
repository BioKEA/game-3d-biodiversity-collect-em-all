import { describe, it, expect, vi, afterEach } from 'vitest'
import { applyBattleWin, applyBattleLose, endBattle, applyUseItem, applyBattleSwitch, applyFriendlyGift } from './logic'
import { makeBattle } from '@/game/features/progression/logic'
import { makeState, makeCaptured, makeCreature } from '@/test/fixtures'
import { ALL_CREATURES, LUNAR_BOSSES } from '@/game/creatures'
import { EVOLUTIONS } from '@/game/evolutions'

afterEach(() => vi.restoreAllMocks())

function inBattle(over = {}) {
  const wild = makeCreature({ id: 'wild' })
  const s = makeState(over)
  return { ...s, screen: 'battle' as const, battle: makeBattle(wild, s.player.team[0]) }
}

describe('applyBattleWin', () => {
  it('awards xp/coins, adds material drops, returns to world', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const r = applyBattleWin(inBattle(), 30, { alcatrazEscapeActive: false })
    expect(r.state.screen).toBe('world')
    expect(r.reward).toEqual({ xp: 30, coins: 12, levelUp: false, isBoss: false }) // 10 + level(1)*2
    expect(r.state.player.coins).toBe(112)
    expect(r.state.player.catalog).toContain('wild')
    expect(r.state.player.inventory.length).toBeGreaterThan(3) // at least one material drop
    expect(r.state.battle.active).toBe(false)
  })
  it('boss kill pays 50 + level*5 and records defeat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const boss = LUNAR_BOSSES[0]
    const s = { ...makeState({ gameDay: 3 }), screen: 'battle' as const, battle: makeBattle(boss, makeCaptured()) }
    const r = applyBattleWin(s, 10, { alcatrazEscapeActive: false })
    expect(r.reward.isBoss).toBe(true)
    expect(r.reward.coins).toBe(55)
    expect(r.state.bossDefeats?.[0]).toMatchObject({ bossId: boss.id, captured: false })
  })
  it('routes back to alcatraz when active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    expect(applyBattleWin(inBattle(), 1, { alcatrazEscapeActive: true }).state.screen).toBe('alcatraz_escape')
  })
  it('counts invasive removals', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const s = inBattle()
    s.battle.wildCreature = makeCreature({ id: 'inv', conservationStatus: 'INV' })
    expect(applyBattleWin(s, 1, { alcatrazEscapeActive: false }).state.player.invasivesRemoved).toBe(1)
  })

  describe('evolveReadyHint', () => {
    const evo = EVOLUTIONS[0]
    // A lead that levels up to one level below its evolution target.
    const nearlyThere = (level: number) => {
      const s = makeState({}, { team: [makeCaptured({ id: evo.fromId, level, xp: level * 50 - 1 })] })
      return { ...s, screen: 'battle' as const, battle: makeBattle(makeCreature({ id: 'wild' }), s.player.team[0]) }
    }

    it('fires when the lead levels up to within 2 levels of its evolution without evolving', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01)
      const r = applyBattleWin(nearlyThere(evo.level - 2), 1, { alcatrazEscapeActive: false })
      expect(r.evolution).toBeNull()
      expect(r.state.player.team[0].level).toBe(evo.level - 1)
      expect(r.state.player.team[0].id).toBe(evo.fromId)
      expect(r.evolveReadyHint).not.toBeNull()
      expect(r.evolveReadyHint?.gap).toBe(1)
      expect(r.evolveReadyHint?.toName).toBe(ALL_CREATURES.find(c => c.id === evo.toId)?.name)
    })

    it('does not fire when the lead evolves in the same call', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01)
      const r = applyBattleWin(nearlyThere(evo.level - 1), 1, { alcatrazEscapeActive: false })
      expect(r.evolution?.teamIndex).toBe(0)
      expect(r.state.player.team[0].id).toBe(evo.toId)
      expect(r.evolveReadyHint).toBeNull()
    })
  })
})

describe('applyBattleLose / endBattle', () => {
  it('halves hp and clears battle', () => {
    const r = applyBattleLose(inBattle(), { alcatrazEscapeActive: false })
    expect(r.player.team[0].stats.hp).toBe(15)
    expect(r.battle.active).toBe(false)
  })
  it('endBattle sets cooldown', () => {
    expect(endBattle(inBattle(), 8).encounterCooldown).toBe(8)
  })
})

describe('inventory & switch', () => {
  it('applyUseItem decrements the matching item and floors it at 0', () => {
    const s = makeState()
    const once = applyUseItem(s, 'energy-berry')
    expect(once.player.inventory.find(i => i.id === 'energy-berry')?.quantity).toBe(2)
    // An already-empty stack stays at 0 rather than going negative.
    const empty = makeState({}, { inventory: [{ id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 0, description: '', sprite: '🫐' }] })
    expect(applyUseItem(empty, 'energy-berry').player.inventory[0].quantity).toBe(0)
  })
  it('applyBattleSwitch swaps lead and updates battle.playerCreature; ignores bad index', () => {
    const s = inBattle()
    s.player.team = [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' })]
    const r = applyBattleSwitch(s, 1)
    expect(r.player.team[0].id).toBe('b')
    expect(r.battle.playerCreature?.id).toBe('b')
    expect(applyBattleSwitch(s, 0)).toBe(s)
    expect(applyBattleSwitch(s, 5)).toBe(s)
  })
  it('applyFriendlyGift increments only existing items and ends battle with cooldown 5', () => {
    const r = applyFriendlyGift(inBattle(), { itemId: 'bio-capsule', itemName: 'x', sprite: '', message: '' })
    expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(11)
    expect(r.encounterCooldown).toBe(5)
    const r2 = applyFriendlyGift(inBattle(), { itemId: 'unknown', itemName: 'x', sprite: '', message: '' })
    expect(r2.player.inventory).toHaveLength(3)
  })
})
