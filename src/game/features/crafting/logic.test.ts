import { describe, it, expect } from 'vitest'
import { applyCraft } from './logic'
import { makeState } from '@/test/fixtures'
import { MATERIALS } from '@/game/crafting'

describe('applyCraft', () => {
  it('consumes ingredients and adds result', () => {
    const inv = [...makeState().player.inventory, { ...MATERIALS.find(m => m.id === 'bay-leaf')!, quantity: 3 }, { ...MATERIALS.find(m => m.id === 'marsh-reed')!, quantity: 2 }]
    const r = applyCraft(makeState({}, { inventory: inv }), 'craft-herb-potion')
    expect(r.player.inventory.find(i => i.id === 'bay-leaf')?.quantity).toBe(0)
    expect(r.player.inventory.find(i => i.id === 'herb-potion')?.quantity).toBe(7)
  })
  it('no-op when ingredients missing', () => {
    const s = makeState()
    expect(applyCraft(s, 'craft-herb-potion')).toBe(s)
  })
})
