import { describe, it, expect } from 'vitest'
import { generateMap, getBridgeAt } from './bayAreaMap'

describe('Bay Area Bridges', () => {
  it('Golden Gate Bridge tiles exist', () => {
    let found = false
    for (let x = 12; x <= 15; x++) {
      for (let y = 13; y <= 17; y++) {
        if (getBridgeAt(x, y) === 'Golden Gate Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('Bay Bridge tiles exist', () => {
    let found = false
    for (let x = 16; x <= 32; x++) {
      for (let y = 13; y <= 16; y++) {
        if (getBridgeAt(x, y) === 'Bay Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('Richmond-San Rafael Bridge tiles exist', () => {
    let found = false
    for (let x = 21; x <= 31; x++) {
      for (let y = 6; y <= 9; y++) {
        if (getBridgeAt(x, y) === 'Richmond-San Rafael Bridge') { found = true; break }
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('San Mateo Bridge tiles exist', () => {
    let found = false
    for (let x = 22; x <= 30; x++) {
      if (getBridgeAt(x, 24) === 'San Mateo Bridge') { found = true; break }
    }
    expect(found).toBe(true)
  })

  it('Dumbarton Bridge tiles exist', () => {
    let found = false
    for (let x = 22; x <= 30; x++) {
      for (let y = 31; y <= 33; y++) {
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
          expect(tile.subregion).toBe(tile.bridge)
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
