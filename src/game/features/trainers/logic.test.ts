import { describe, it, expect } from 'vitest'
import { startRangerBattle, applyRangerBattleWin, applyRangerBattleLose, leaveRangerScreen, applyArenaWin, applyArenaLose, applyDeclineTrainer, applyTrainerBattleWin } from './logic'
import { makeState } from '@/test/fixtures'
import type { RoamingTrainer } from '@/game/roamingTrainers'

describe('ranger battles', () => {
  it('start sets screen and activeRangerId', () => {
    const r = startRangerBattle(makeState(), 'ranger-presidio')
    expect(r.screen).toBe('ranger_battle'); expect(r.activeRangerId).toBe('ranger-presidio')
  })
  it('win awards xp and 30 + level*3 coins, clears ranger', () => {
    const r = applyRangerBattleWin(makeState({ activeRangerId: 'x' }), 10)
    expect(r.player.coins).toBe(133); expect(r.activeRangerId).toBeNull(); expect(r.screen).toBe('world')
  })
  it('lose halves hp and clears ranger', () => {
    const r = applyRangerBattleLose(makeState({ activeRangerId: 'x' }))
    expect(r.player.team[0].stats.hp).toBe(15); expect(r.activeRangerId).toBeNull()
  })
  it('leaveRangerScreen', () => {
    expect(leaveRangerScreen(makeState({ screen: 'ranger', activeRangerId: 'x' }))).toMatchObject({ screen: 'world', activeRangerId: null })
  })
})

describe('arena', () => {
  it('win increments tier and coins', () => {
    const r = applyArenaWin(makeState(), 5, 20, 'bronze')
    expect(r.arenaWins.bronze).toBe(1); expect(r.player.coins).toBe(120)
  })
  it('lose halves hp only', () => {
    const r = applyArenaLose(makeState())
    expect(r.player.team[0].stats.hp).toBe(15); expect(r.screen).toBe('world')
  })
})

describe('roaming trainers', () => {
  const trainer = { id: 't1', rewardItem: { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 2, description: 'd', sprite: '🔮' } } as unknown as RoamingTrainer
  it('decline returns to world with cooldown 8', () => {
    expect(applyDeclineTrainer(makeState({ screen: 'trainer_encounter' }))).toMatchObject({ screen: 'world', encounterCooldown: 8 })
  })
  it('win adds reward item, xp, coins; no happiness change', () => {
    const r = applyTrainerBattleWin(makeState(), 10, trainer)
    expect(r.state.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(12)
    expect(r.state.player.coins).toBe(133)
    expect(r.state.player.team[0].happiness).toBe(50)
    expect(r.state.player.team[0].xp).toBe(10)
  })
  it('win without trainer adds nothing', () => {
    expect(applyTrainerBattleWin(makeState(), 1, null).state.player.inventory).toHaveLength(3)
  })
})
