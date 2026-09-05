import type { Creature, CapturedCreature, GameState, MapTile, PlayerState } from '@/types/game'
import { createInitialState } from '@/game/core/state'
import type { LogicDeps } from '@/game/core/state'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const FIXED_NOW = '2026-03-15T12:00:00.000Z'
export const testDeps: LogicDeps = { rng: () => 0.5, now: () => FIXED_NOW }

export function makeCreature(over: Partial<Creature> = {}): Creature {
  return {
    id: 'test-coyote',
    name: 'Coyote',
    scientificName: 'Canis latrans',
    description: 'test',
    type: 'beast',
    rarity: 'common',
    biomes: ['grassland'],
    subregions: [],
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 6, speed: 7 },
    isFantasy: false,
    sprite: '🐺',
    color: '#888888',
    moves: [{ name: 'Bite', power: 10, type: 'attack', description: '' }],
    ...over,
  }
}

export function makeCaptured(over: Partial<CapturedCreature> = {}): CapturedCreature {
  return {
    ...makeCreature(),
    level: 3,
    xp: 0,
    capturedAt: FIXED_NOW,
    capturedBiome: 'grassland',
    happiness: 50,
    ...over,
  }
}

export function makeState(over: Partial<GameState> = {}, playerOver: Partial<PlayerState> = {}): GameState {
  const base = createInitialState()
  return {
    ...base,
    screen: 'world',
    currentSubregion: 'Presidio',
    player: { ...base.player, team: [makeCaptured()], catalog: ['test-coyote'], captured: ['test-coyote'], ...playerOver },
    ...over,
  }
}

export function makeTile(over: Partial<MapTile> = {}): MapTile {
  return { x: 52, y: 219, biome: 'grassland', subregion: 'Presidio', elevation: 0, hasCreature: false, isWalkable: true, ...over }
}
