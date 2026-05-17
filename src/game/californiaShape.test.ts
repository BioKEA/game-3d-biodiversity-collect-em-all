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

  it('extends North Bay water inland through Suisun and the Sacramento Delta', () => {
    expect(map[199][58].biome).toBe('water')
    expect(map[199][58].subregion).toBe('San Pablo Bay')
    expect(map[191][78].biome).toBe('water')
    expect(map[191][78].subregion).toBe('Suisun Bay')
    expect(map[151][80].biome).toBe('water')
    expect(map[151][80].subregion).toBe('Sacramento River')
    expect(map[177][82].biome).toBe('marsh')
  })

  it('keeps Sacramento and Stockton playable beside the delta waterways', () => {
    expect(map[140][82].biome).toBe('urban')
    expect(map[140][82].isWalkable).toBe(true)
    expect(map[170][88].biome).toBe('urban')
    expect(map[170][88].isWalkable).toBe(true)
  })

  it('marks the southern edge as Mexico while leaving San Diego inside California', () => {
    for (const x of [145, 160, 176, 190]) {
      expect(map[491][x].borderState).toBeUndefined()
      expect(map[491][x].isWalkable).toBe(true)
      expect(map[492][x].borderState).toBe('Mexico')
      expect(map[492][x].isWalkable).toBe(false)
    }
  })

  it('keeps the southeast Colorado River edge as Arizona until the Mexico border', () => {
    expect(map[470][196].borderState).toBeUndefined()
    expect(map[470][196].isWalkable).toBe(true)
    expect(map[470][197].borderState).toBe('Arizona')
    expect(map[470][197].isWalkable).toBe(false)
    expect(map[493][197].borderState).toBe('Mexico')
    expect(map[493][197].isWalkable).toBe(false)
  })
})
