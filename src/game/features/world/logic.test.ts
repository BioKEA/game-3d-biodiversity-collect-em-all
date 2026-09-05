import { describe, it, expect, vi, afterEach } from 'vitest'
import { updateJournal, revealTiles, stepPlayer, boatTravel, fastTravel, selectStarter, type StepContext } from './logic'
import { makeState, makeTile, makeCaptured, testDeps, FIXED_NOW } from '@/test/fixtures'

afterEach(() => vi.restoreAllMocks())

const ctx: StepContext = { borderPeek: null, lastWeatherChange: 480, lunarTriggeredDay: -1, shadowTriggeredDay: -1, defeatedTrainers: [] }
// 3x3 map: centre grassland, right water, top-right Oregon border (unwalkable)
function tinyMap() {
  const rows = []
  for (let y = 0; y < 3; y++) {
    const row = []
    for (let x = 0; x < 3; x++) row.push(makeTile({ x, y, biome: 'grassland', subregion: x === 0 ? 'Presidio' : 'Marin', isWalkable: true }))
    rows.push(row)
  }
  rows[1][2] = makeTile({ x: 2, y: 1, biome: 'water', isWalkable: false })
  rows[0][2] = makeTile({ x: 2, y: 0, biome: 'grassland', isWalkable: false, borderState: 'Oregon' })
  return rows
}
const at = (x: number, y: number) => makeState({ currentSubregion: 'Presidio', encounterCooldown: 99 }, { x, y })

describe('updateJournal', () => {
  it('creates, then increments on re-entry only', () => {
    const j1 = updateJournal({}, 'Marin', 'forest', 'Presidio', FIXED_NOW)
    expect(j1.Marin.visitCount).toBe(1)
    expect(updateJournal(j1, 'Marin', 'forest', 'Marin', FIXED_NOW)).toBe(j1)
    expect(updateJournal(j1, 'Marin', 'forest', 'Presidio', FIXED_NOW).Marin.visitCount).toBe(2)
    expect(updateJournal(j1, '', 'forest', 'Presidio', FIXED_NOW)).toBe(j1)
  })
})

describe('revealTiles', () => {
  it('reveals a disc of radius 5 and reports change', () => {
    const r = revealTiles(new Set(), 10, 10)
    expect(r.changed).toBe(true); expect(r.next.has('10,15')).toBe(true); expect(r.next.has('14,14')).toBe(false)
    expect(revealTiles(r.next, 10, 10).changed).toBe(false)
  })
})

describe('stepPlayer', () => {
  it('blocked when not on world screen', () => {
    const r = stepPlayer(makeState({ screen: 'catalog' }), tinyMap(), 1, 0, ctx, testDeps)
    expect(r.events.kind).toBe('blocked')
  })
  it('blocked by water', () => {
    expect(stepPlayer(at(1, 1), tinyMap(), 1, 0, ctx, testDeps).events.kind).toBe('blocked')
  })
  it('moves, advances clock 3 minutes, updates biome/subregion/journal', () => {
    const r = stepPlayer(at(0, 1), tinyMap(), 1, 0, ctx, testDeps)
    expect(r.events.kind).toBe('moved')
    expect(r.state.player.x).toBe(1)
    expect(r.state.gameMinutes).toBe(483)
    expect(r.state.currentSubregion).toBe('Marin')
    expect(r.state.player.journal.Marin.visitCount).toBe(1)
    expect(r.state.encounterCooldown).toBe(98)
    if (r.events.kind === 'moved') expect(r.events.enteredNewSubregion).toBe(true)
  })
  it('border peek: enter, step, return', () => {
    const enter = stepPlayer(at(1, 0), tinyMap(), 1, 0, ctx, testDeps)
    expect(enter.events.kind).toBe('border-enter')
    expect(enter.state.player.x).toBe(2)
    const peek = { state: 'Oregon', stepsLeft: 0, returnX: 1, returnY: 0 }
    const back = stepPlayer({ ...enter.state, player: { ...enter.state.player, x: 2, y: 0 } }, tinyMap(), 0, 0, { ...ctx, borderPeek: peek }, testDeps)
    expect(back.events.kind).toBe('border-return')
    expect(back.state.player.x).toBe(1)
  })
  it('rolls a wild encounter when cooldown is 0 and rng is low', () => {
    // 'Marin Headlands' is a real Bay Area subregion with grassland creatures
    // (see the `subregions` arrays in creatures.ts), so getRandomEncounter
    // returns a creature for daytime/clear rather than null.
    const map = tinyMap()
    map[1][1] = makeTile({ x: 1, y: 1, biome: 'grassland', subregion: 'Marin Headlands', isWalkable: true })
    const s = makeState({ currentSubregion: 'Presidio', encounterCooldown: 0 }, { x: 0, y: 1 })
    // Math.random drives getRandomEncounter's pick out of the weighted pool.
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const r = stepPlayer(s, map, 1, 0, ctx, { rng: () => 0.01, now: () => FIXED_NOW })
    expect(r.events.kind).toBe('moved')
    if (r.events.kind !== 'moved') throw new Error('expected a moved event')
    expect(r.events.encounter).toBe('wild')
    expect(r.events.trainer).toBeNull()
    expect(r.state.screen).toBe('encounter')
    expect(r.state.battle.wildCreature).not.toBeNull()
    expect(r.state.encounterCooldown).toBe(5)
  })
})

describe('travel', () => {
  it('boatTravel moves and sets subregion', () => {
    const r = boatTravel(at(0, 0), { x: 0, y: 0, destX: 2, destY: 2, destinationName: 'Angel Island' } as never)
    expect([r.player.x, r.player.y, r.currentSubregion]).toEqual([2, 2, 'Angel Island'])
  })
  it('fastTravel sets position, subregion, and biome from the map', () => {
    const r = fastTravel(at(0, 0), tinyMap(), 1, 2, 'Marin')
    expect(r.currentBiome).toBe('grassland'); expect(r.currentSubregion).toBe('Marin')
  })
  it('selectStarter seeds team/catalog/captured and biome from tile', () => {
    const r = selectStarter(makeState({ screen: 'starter' }, { team: [], catalog: [], captured: [] }), tinyMap(), makeCaptured({ id: 'fox' }))
    expect(r.screen).toBe('world'); expect(r.player.team[0].happiness).toBe(70); expect(r.player.captured).toEqual(['fox'])
  })
})
