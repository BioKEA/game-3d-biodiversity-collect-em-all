import { describe, it, expect } from 'vitest'
import { swapLead, teachMove, learnAbility, manualEvolve, releaseFromTeam, swapFromReserve, adoptFromReserve, releaseFromReserve } from './logic'
import { makeState, makeCaptured } from '@/test/fixtures'
import { EVOLUTIONS } from '@/game/evolutions'

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
