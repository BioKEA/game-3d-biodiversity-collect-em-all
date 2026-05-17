import { describe, expect, it } from 'vitest'
import { generateMap } from './bayAreaMap'
import type { BiomeType } from '@/types/game'

const WATERLIKE_BIOMES = new Set<BiomeType>(['water', 'kelp_forest'])

describe('California map shape', () => {
  const map = generateMap()

  it('limits inaccessible northwest Pacific water to a narrow edge buffer', () => {
    for (let y = 5; y <= 60; y++) {
      const leadingWaterTiles = map[y].findIndex(tile => !WATERLIKE_BIOMES.has(tile.biome))
      expect(leadingWaterTiles).toBeGreaterThanOrEqual(0)
      expect(leadingWaterTiles).toBeLessThanOrEqual(5)
      expect(map[y][5].isWalkable).toBe(true)
    }
  })

  it('keeps the Pacific cut into the north side of Monterey Bay', () => {
    for (let y = 245; y <= 250; y++) {
      for (let x = 42; x <= 48; x++) {
        expect(WATERLIKE_BIOMES.has(map[y][x].biome)).toBe(true)
      }
    }
  })

  it('keeps Santa Cruz and Monterey on the mainland after the coastline cut', () => {
    expect(WATERLIKE_BIOMES.has(map[252][52].biome)).toBe(false)
    expect(map[252][52].isWalkable).toBe(true)
    expect(WATERLIKE_BIOMES.has(map[268][60].biome)).toBe(false)
    expect(map[268][60].isWalkable).toBe(true)
  })
})
