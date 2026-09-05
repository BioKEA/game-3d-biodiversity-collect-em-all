import { describe, it, expect } from 'vitest'
import { applyTrade, importCreature, removeTeamMember } from './logic'
import { makeState, makeCaptured } from '@/test/fixtures'

describe('trade', () => {
  it('presidio-trade-1 gives 2 energy-berry for 5 bio-capsule', () => {
    const r = applyTrade(makeState(), 'presidio-trade-1')
    expect(r.player.inventory.find(i => i.id === 'energy-berry')?.quantity).toBe(1)
    expect(r.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(15)
  })
  it('insufficient items is a no-op', () => {
    const s = makeState({}, { inventory: [] })
    expect(applyTrade(s, 'presidio-trade-1')).toBe(s)
  })
  it('importCreature adds to team, catalog, captured; no-op when full', () => {
    const r = importCreature(makeState(), makeCaptured({ id: 'imp' }))
    expect(r.player.team).toHaveLength(2); expect(r.player.captured).toContain('imp')
    const full = makeState({}, { team: Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` })) })
    expect(importCreature(full, makeCaptured())).toBe(full)
  })
  it('removeTeamMember filters by index', () => {
    expect(removeTeamMember(makeState(), 0).player.team).toHaveLength(0)
  })
})
