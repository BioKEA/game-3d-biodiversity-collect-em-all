import { describe, it, expect } from 'vitest'
import { challengeBoss, startAlcatrazBattle, applyAlcatrazComplete, applyFusion } from './logic'
import { makeState, makeCaptured, makeCreature } from '@/test/fixtures'

describe('bosses & side systems', () => {
  it('challengeBoss opens encounter and logs catalog', () => {
    const r = challengeBoss(makeState(), makeCreature({ id: 'boss' }))
    expect(r.screen).toBe('encounter'); expect(r.player.catalog).toContain('boss'); expect(r.battle.active).toBe(true)
  })
  it('startAlcatrazBattle opens battle without catalog change', () => {
    const r = startAlcatrazBattle(makeState(), makeCreature({ id: 'guard' }))
    expect(r.screen).toBe('battle'); expect(r.player.catalog).not.toContain('guard')
  })
  it('applyAlcatrazComplete pays xp and item, returns to world', () => {
    const r = applyAlcatrazComplete(makeState({ screen: 'alcatraz_escape' }), { xp: 10, item: { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 1, description: 'd', sprite: '🔮' } })
    expect(r.screen).toBe('world'); expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(11)
  })
  it('applyFusion removes two and appends result', () => {
    const s = makeState({}, { team: [makeCaptured({ id: 'a' }), makeCaptured({ id: 'b' }), makeCaptured({ id: 'c' })] })
    const r = applyFusion(s, 0, 1, makeCaptured({ id: 'ab' }))
    expect(r.player.team.map(c => c.id)).toEqual(['c', 'ab']); expect(r.player.captured).toContain('ab'); expect(r.screen).toBe('world')
  })
})
