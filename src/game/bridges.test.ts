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
    expect(bridgeCount).toBeGreaterThan(20) // Should have lots of bridge tiles across 5 bridges
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
