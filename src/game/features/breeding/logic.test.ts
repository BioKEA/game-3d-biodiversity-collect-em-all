import { describe, it, expect } from 'vitest'
import { startBreeding, hatchCreature, cancelBreeding } from './logic'
import { makeState, makeCaptured, FIXED_NOW } from '@/test/fixtures'

const slot = { parent1: makeCaptured(), parent2: makeCaptured({ id: 'b' }), startedAt: FIXED_NOW, readyAt: FIXED_NOW }
describe('breeding', () => {
  it('start / cancel set nursery', () => {
    expect(startBreeding(makeState(), slot).player.nursery).toEqual(slot)
    expect(cancelBreeding(startBreeding(makeState(), slot)).player.nursery).toBeNull()
  })
  it('hatch adds to team and clears nursery; no-op when full', () => {
    const r = hatchCreature(startBreeding(makeState(), slot), makeCaptured({ id: 'egg' }))
    expect(r.player.team).toHaveLength(2); expect(r.player.nursery).toBeNull(); expect(r.player.captured).toContain('egg')
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })) })
    expect(hatchCreature(full, makeCaptured())).toBe(full)
  })
})
