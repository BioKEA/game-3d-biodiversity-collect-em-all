import { describe, it, expect } from 'vitest'
import { acceptQuest, claimQuestReward } from './logic'
import { makeState } from '@/test/fixtures'

describe('quests', () => {
  it('acceptQuest marks active', () => {
    expect(acceptQuest(makeState(), 'presidio-coyote').questProgress['presidio-coyote']).toEqual({ questId: 'presidio-coyote', status: 'active', progress: 0 })
  })
  it('claimQuestReward pays xp, 25+xp coins, items; marks rewarded', () => {
    const r = claimQuestReward(makeState(), 'presidio-coyote')  // xp 80, 5 bio-capsules
    expect(r.reward).toEqual({ title: 'Urban Coyote Survey', xp: 80, coins: 105, items: [{ id: 'bio-capsule', name: 'Bio Capsule', sprite: '🔮', quantity: 5 }] })
    expect(r.state.player.coins).toBe(205)
    expect(r.state.player.inventory.find(i => i.id === 'bio-capsule')?.quantity).toBe(15)
    expect(r.state.questProgress['presidio-coyote'].status).toBe('rewarded')
  })
  it('unknown quest is a no-op', () => {
    const s = makeState()
    const r = claimQuestReward(s, 'nope')
    expect(r.state).toBe(s); expect(r.reward).toBeNull()
  })
})
