import { describe, it, expect } from 'vitest'
import { captureCreature } from './logic'
import { makeState, makeCreature, makeCaptured, testDeps, FIXED_NOW } from '@/test/fixtures'
import { LUNAR_BOSSES } from '@/game/creatures'

describe('captureCreature', () => {
  it('adds to team when not full, records catalog/captured/journal, ends battle', () => {
    const s = makeState({}, { journal: { Presidio: { subregion: 'Presidio', biome: 'grassland', firstVisited: FIXED_NOW, creaturesEncountered: [], creaturesCaptured: [], visitCount: 1 } } })
    const r = captureCreature(s, makeCreature({ id: 'newt' }), testDeps)
    expect(r.isNewSpecies).toBe(true)
    expect(r.teamFull).toBe(false)
    expect(r.teamIndex).toBe(1)
    expect(r.state.player.team).toHaveLength(2)
    expect(r.state.player.team[1].capturedAt).toBe(FIXED_NOW)
    expect(r.state.player.team[1].level).toBe(1)      // max(1, 1-1+floor(0.5*3)=1)
    expect(r.state.player.captured).toContain('newt')
    expect(r.state.player.journal.Presidio.creaturesCaptured).toEqual(['newt'])
    expect(r.state.screen).toBe('world')
    expect(r.state.battle.active).toBe(false)
  })
  it('routes to reserves when team is full', () => {
    const team = Array.from({ length: 6 }, (_, i) => makeCaptured({ id: `c${i}` }))
    const r = captureCreature(makeState({}, { team }), makeCreature({ id: 'x' }), testDeps)
    expect(r.teamFull).toBe(true)
    expect(r.teamIndex).toBeNull()
    expect(r.state.player.reserves).toHaveLength(1)
    expect(r.state.player.team).toHaveLength(6)
  })
  it('marks repeat species as not new', () => {
    const r = captureCreature(makeState(), makeCreature({ id: 'test-coyote' }), testDeps)
    expect(r.isNewSpecies).toBe(false)
  })
  it('records a boss capture', () => {
    const boss = LUNAR_BOSSES[0]
    const r = captureCreature(makeState({ gameDay: 12 }), boss, testDeps)
    expect(r.state.bossDefeats).toEqual([{ bossId: boss.id, bossName: boss.name, bossSprite: boss.sprite, bossType: 'lunar', gameDay: 12, captured: true }])
  })
})
