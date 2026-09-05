import { describe, it, expect } from 'vitest'
import { applyFishCatch, startDiveEncounter, applyDiveCollect } from './logic'
import { makeState, makeCreature } from '@/test/fixtures'

describe('minigames', () => {
  it('fish catch pays xp as coins too', () => {
    const r = applyFishCatch(makeState(), { xpReward: 40 })
    expect(r.player.xp).toBe(40); expect(r.player.coins).toBe(140)
  })
  it('dive encounter needs a lead creature', () => {
    const r = startDiveEncounter(makeState(), makeCreature({ id: 'octo' }))
    expect(r.screen).toBe('battle'); expect(r.battle.wildCreature?.id).toBe('octo')
    const s = makeState({}, { team: [] }); expect(startDiveEncounter(s, makeCreature())).toBe(s)
  })
  it('dive collect defaults sprite to 📦', () => {
    const r = applyDiveCollect(makeState(), { id: 'kelp', name: 'Kelp', type: 'material', quantity: 2, description: 'd', sprite: '' })
    expect(r.player.inventory.find(i => i.id === 'kelp')).toMatchObject({ quantity: 2, sprite: '📦' })
  })
})
