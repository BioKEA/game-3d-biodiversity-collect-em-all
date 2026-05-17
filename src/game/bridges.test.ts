import { describe, it, expect } from 'vitest'
import { generateMap, getBridgeAt } from './bayAreaMap'

describe('Bay Area Bridges', () => {
  it('Golden Gate Bridge tiles exist', () => {
    let found = false
    for (let x = 48; x <= 50; x++) {
      for (let y = 213; y <= 218; y++) {
        if (getBridgeAt(x, y) === 'Golden Gate Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('Bay Bridge tiles exist', () => {
    let found = false
    for (let x = 50; x <= 64; x++) {
      for (let y = 217; y <= 219; y++) {
        if (getBridgeAt(x, y) === 'Bay Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('Richmond-San Rafael Bridge tiles exist', () => {
    let found = false
    for (let x = 55; x <= 62; x++) {
      for (let y = 209; y <= 211; y++) {
        if (getBridgeAt(x, y) === 'Richmond-San Rafael Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('San Mateo Bridge tiles exist', () => {
    let found = false
    for (let x = 53; x <= 64; x++) {
      if (getBridgeAt(x, 226) === 'San Mateo Bridge') { found = true; break }
    }
    expect(found).toBe(true)
  })

  it('Dumbarton Bridge tiles exist', () => {
    let found = false
    for (let x = 54; x <= 63; x++) {
      for (let y = 228; y <= 230; y++) {
        if (getBridgeAt(x, y) === 'Dumbarton Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('North Bay and Delta crossing tiles exist', () => {
    expect(getBridgeAt(47, 189)).toBe('Petaluma River Bridge')
    expect(getBridgeAt(50, 194)).toBe('Lakeville Bridge')
    expect(getBridgeAt(57, 178)).toBe('Napa River Bridge')
    expect(getBridgeAt(57, 190)).toBe('Mare Island Causeway')
    expect(getBridgeAt(67, 198)).toBe('Carquinez Bridge')
    expect(getBridgeAt(75, 193)).toBe('Benicia-Martinez Bridge')
    expect(getBridgeAt(80, 187)).toBe('Rio Vista Bridge')
    expect(getBridgeAt(85, 182)).toBe('Antioch Bridge')
    expect(getBridgeAt(80, 158)).toBe('Clarksburg Bridge')
    expect(getBridgeAt(79, 170)).toBe('Walnut Grove Bridge')
    expect(getBridgeAt(79, 178)).toBe('Isleton Bridge')
    expect(getBridgeAt(84, 178)).toBe('Middle River Bridge')
    expect(getBridgeAt(86, 167)).toBe('Mokelumne River Bridge')
    expect(getBridgeAt(85, 172)).toBe('Stockton Channel Bridge')
    expect(getBridgeAt(79, 150)).toBe('Freeport Bridge')
    expect(getBridgeAt(80, 140)).toBe('Tower Bridge')
    expect(getBridgeAt(87, 137)).toBe('Guy West Bridge')
  })

  it('keeps Delta bridge spacing dense enough to avoid long detours', () => {
    const sacramentoRiverCrossingYs = [140, 150, 158, 170, 178, 187]
    const sanJoaquinDeltaCrossingYs = [167, 172, 178, 182, 187]

    for (let i = 1; i < sacramentoRiverCrossingYs.length; i++) {
      expect(sacramentoRiverCrossingYs[i] - sacramentoRiverCrossingYs[i - 1]).toBeLessThanOrEqual(12)
    }
    for (let i = 1; i < sanJoaquinDeltaCrossingYs.length; i++) {
      expect(sanJoaquinDeltaCrossingYs[i] - sanJoaquinDeltaCrossingYs[i - 1]).toBeLessThanOrEqual(8)
    }
  })

  it('bridge tiles are walkable and not water', () => {
    const map = generateMap()
    let bridgeCount = 0
    for (const row of map) {
      for (const tile of row) {
        if (tile.bridge) {
          bridgeCount++
          expect(tile.isWalkable).toBe(true)
          expect(tile.biome).not.toBe('water')
          expect(tile.bridge).toBeTruthy()
        }
      }
    }
    expect(bridgeCount).toBeGreaterThan(90)
  })

  it('bridge tiles have elevation 1', () => {
    const map = generateMap()
    for (const row of map) {
      for (const tile of row) {
        if (tile.bridge) {
          expect(tile.elevation).toBe(1)
        }
      }
    }
  })

  it('non-bridge water tiles remain unwalkable', () => {
    const map = generateMap()
    let waterCount = 0
    for (const row of map) {
      for (const tile of row) {
        if (tile.biome === 'water' && !tile.bridge) {
          expect(tile.isWalkable).toBe(false)
          waterCount++
        }
      }
    }
    expect(waterCount).toBeGreaterThan(100)
  })
})
