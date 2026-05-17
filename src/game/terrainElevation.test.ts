import { describe, expect, it } from 'vitest'
import { generateMap } from './bayAreaMap'

describe('terrain elevation', () => {
  const map = generateMap()
  const mountainGradeBiomes = new Set(['mountain', 'alpine', 'snow', 'volcanic', 'canyon'])

  it('raises major California mountain regions above nearby lowlands', () => {
    const shasta = map[35][78]
    const sacramentoValley = map[140][82]
    const yosemite = map[200][115]
    const sanJoaquinValley = map[250][88]
    const mtDiablo = map[220][74]
    const bayLowland = map[218][64]

    expect(shasta.elevation).toBeGreaterThan(sacramentoValley.elevation + 3.5)
    expect(yosemite.elevation).toBeGreaterThan(sanJoaquinValley.elevation + 4)
    expect(mtDiablo.elevation).toBeGreaterThan(bayLowland.elevation + 2)
  })

  it('exaggerates the highest California summits for readable game terrain', () => {
    const whitney = map[248][138]
    const shasta = map[35][78]
    const whiteMountain = map[218][145]
    const palisades = map[232][132]
    const deathValley = map[295][165]

    expect(whitney.elevation).toBeGreaterThan(10)
    expect(shasta.elevation).toBeGreaterThan(9)
    expect(whiteMountain.elevation).toBeGreaterThan(9)
    expect(palisades.elevation).toBeGreaterThan(8.5)
    expect(whitney.elevation).toBeGreaterThan(deathValley.elevation + 9.5)
  })

  it('places mountain biomes across California mountain provinces', () => {
    const rangeSamples = [
      map[42][58],   // Klamath / Trinity Alps
      map[78][85],   // Lassen and southern Cascades
      map[140][62],  // North Coast Ranges
      map[220][74],  // Mt. Diablo
      map[290][70],  // Santa Lucia Range
      map[285][84],  // Diablo Range
      map[218][145], // White Mountains
      map[240][150], // Inyo Mountains
      map[360][112], // Tehachapi Mountains
      map[410][138], // San Gabriel Mountains
      map[412][152], // San Bernardino Mountains
      map[374][176], // Providence / Mojave ranges
      map[445][155], // San Jacinto Mountains
      map[478][146], // Cuyamaca Mountains
    ]

    for (const tile of rangeSamples) {
      expect(mountainGradeBiomes.has(tile.biome)).toBe(true)
      expect(tile.elevation).toBeGreaterThan(3.5)
    }
  })

  it('keeps Death Valley lower than its surrounding desert ranges', () => {
    const basin = map[295][165]
    const westRange = map[292][154]
    const panamintShoulder = map[292][158]

    expect(basin.elevation).toBeLessThan(0.5)
    expect(westRange.elevation).toBeGreaterThan(basin.elevation + 2.5)
    expect(panamintShoulder.elevation).toBeGreaterThan(basin.elevation + 2.5)
  })

  it('keeps the Central Valley visibly flatter than the Sierra crest', () => {
    const centralValley = map[180][82]
    const tahoeCrest = map[156][125]
    const sequoiaHighCountry = map[255][118]

    expect(centralValley.elevation).toBeLessThan(0.7)
    expect(tahoeCrest.elevation).toBeGreaterThan(centralValley.elevation + 4)
    expect(sequoiaHighCountry.elevation).toBeGreaterThan(centralValley.elevation + 4)
  })
})
