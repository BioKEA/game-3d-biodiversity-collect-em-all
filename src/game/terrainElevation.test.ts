import { describe, expect, it } from 'vitest'
import { generateMap } from './bayAreaMap'

describe('terrain elevation', () => {
  const map = generateMap()

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

  it('keeps Death Valley lower than its surrounding desert ranges', () => {
    const basin = map[295][165]
    const westRange = map[292][154]
    const eastRange = map[292][176]

    expect(basin.elevation).toBeLessThan(0.5)
    expect(westRange.elevation).toBeGreaterThan(basin.elevation + 2.5)
    expect(eastRange.elevation).toBeGreaterThan(basin.elevation + 2.5)
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
