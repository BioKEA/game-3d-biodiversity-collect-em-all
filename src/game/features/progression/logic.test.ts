import { describe, it, expect } from 'vitest'
import { applyPlayerXp, addToInventory, incrementIfPresent, halveTeamHp, awardTeamXp, recordStepStats, recordRangerDefeat, EMPTY_BATTLE } from './logic'
import { makeCaptured, makeState, makeTile } from '@/test/fixtures'
import { createInitialStats } from '@/game/achievements'

describe('applyPlayerXp', () => {
  it('levels up repeatedly with maxXp * 1.3 floor', () => {
    const p = makeState().player // level 1, xp 0, maxXp 100
    const r = applyPlayerXp(p, 250)
    // 250 → -100 (L2, max 130) → 150-130=20 (L3, max 169)
    expect(r.newLevel).toBe(3)
    expect(r.player.xp).toBe(20)
    expect(r.player.maxXp).toBe(169)
    expect(r.didLevelUp).toBe(true)
  })
  it('no level up below threshold', () => {
    const r = applyPlayerXp(makeState().player, 10)
    expect(r.didLevelUp).toBe(false)
    expect(r.player.xp).toBe(10)
  })
})

describe('inventory helpers', () => {
  const inv = makeState().player.inventory
  it('addToInventory merges by id without mutating input', () => {
    const before = inv[0].quantity
    const out = addToInventory(inv, { ...inv[0], quantity: 2 })
    expect(out[0].quantity).toBe(before + 2)
    expect(inv[0].quantity).toBe(before)
    expect(out[0]).not.toBe(inv[0])
  })
  it('addToInventory appends unknown ids', () => {
    const out = addToInventory(inv, { id: 'new', name: 'New', type: 'material', quantity: 1, description: '', sprite: '' })
    expect(out).toHaveLength(inv.length + 1)
  })
  it('incrementIfPresent ignores unknown ids', () => {
    expect(incrementIfPresent(inv, 'nope', 1)).toEqual(inv)
  })
})

describe('team helpers', () => {
  it('halveTeamHp floors maxHp/2', () => {
    const t = halveTeamHp([makeCaptured({ stats: { hp: 30, maxHp: 31, attack: 1, defense: 1, speed: 1 } })])
    expect(t[0].stats.hp).toBe(15)
  })
  it('awardTeamXp gives lead full xp and bench half, levels at level*50', () => {
    const lead = makeCaptured({ level: 1, xp: 45 })
    const bench = makeCaptured({ id: 'b', level: 1, xp: 0 })
    const r = awardTeamXp([lead, bench], 10, { withHappiness: false })
    expect(r.team[0].level).toBe(2)          // 45+10 >= 50
    expect(r.team[0].xp).toBe(0)
    expect(r.team[0].stats.maxHp).toBe(33)   // +3
    expect(r.team[1].xp).toBe(5)
    expect(r.evolution).toBeNull()
  })
  it('awardTeamXp with happiness adds 5 lead / 2 bench, +3 on level up', () => {
    const r = awardTeamXp([makeCaptured({ level: 1, xp: 45, happiness: 50 }), makeCaptured({ id: 'b', happiness: 50 })], 10, { withHappiness: true })
    expect(r.team[0].happiness).toBe(58)
    expect(r.team[1].happiness).toBe(52)
  })
})

describe('stats helpers', () => {
  it('recordStepStats counts steps and unique biomes/subregions', () => {
    const s = recordStepStats(createInitialStats(), makeTile({ biome: 'forest', subregion: 'Muir Woods' }))
    expect(s.totalStepsWalked).toBe(1)
    expect(s.uniqueBiomesVisited).toEqual(['forest'])
    expect(s.uniqueSubregionsVisited).toEqual(['Muir Woods'])
    const s2 = recordStepStats(s, makeTile({ biome: 'forest', subregion: '' }))
    expect(s2.uniqueSubregionsVisited).toEqual(['Muir Woods'])
  })
  it('recordRangerDefeat is idempotent and counts wins', () => {
    const a = recordRangerDefeat(createInitialStats(), 'r1')
    const b = recordRangerDefeat(a, 'r1')
    expect(b.defeatedRangers).toEqual(['r1'])
    expect(b.rangerBattlesWon).toBe(2)
  })
})

it('EMPTY_BATTLE matches the literal used across Game.tsx', () => {
  expect(EMPTY_BATTLE).toEqual({ active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 })
})
