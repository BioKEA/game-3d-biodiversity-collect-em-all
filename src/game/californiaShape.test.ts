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

  it('keeps San Francisco downtown on the mainland while Bay water starts east of the waterfront', () => {
    const mainlandTiles = [
      map[219][53], // Financial District
      map[221][53], // SoMa / Oracle Park
      map[218][52], // North Beach
      map[217][53], // Fishermans Wharf
      map[222][54], // Mission Bay
      map[217][50], // Presidio
      map[220][50], // Golden Gate Park
    ]

    for (const tile of mainlandTiles) {
      expect(WATERLIKE_BIOMES.has(tile.biome)).toBe(false)
      expect(tile.isWalkable).toBe(true)
    }

    expect(map[221][51].biome).toBe('mountain')
    expect(map[218][52].bridge).toBeUndefined()
    expect(map[219][54].bridge).toBe('Bay Bridge')
    expect(WATERLIKE_BIOMES.has(map[220][55].biome)).toBe(true)
    expect(map[220][55].isWalkable).toBe(false)
    expect(WATERLIKE_BIOMES.has(map[220][58].biome)).toBe(true)
    expect(map[220][58].isWalkable).toBe(false)
  })

  it('places Alcatraz as a distinct island surrounded by San Francisco Bay water', () => {
    const alcatrazTiles = [[54,215], [55,215], [55,216]]
    const surroundingWaterTiles = [
      [53,214], [54,214], [55,214], [56,214],
      [53,215], [56,215],
      [53,216], [54,216], [56,216],
      [54,217], [55,217], [56,217],
    ]

    for (const [x, y] of alcatrazTiles) {
      expect(map[y][x].subregion).toBe('Alcatraz Island')
      expect(map[y][x].biome).toBe('urban')
      expect(map[y][x].isWalkable).toBe(true)
    }

    for (const [x, y] of surroundingWaterTiles) {
      expect(WATERLIKE_BIOMES.has(map[y][x].biome)).toBe(true)
      expect(map[y][x].isWalkable).toBe(false)
      expect(map[y][x].bridge).toBeUndefined()
    }

    expect(map[216][55].boatDock).toBe(true)
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
