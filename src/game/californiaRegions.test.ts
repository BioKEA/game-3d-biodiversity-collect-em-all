import { describe, expect, it } from 'vitest'
import { generateMap } from './bayAreaMap'
import {
  getCaliforniaRegionAt,
  getCaliforniaRegionForSubregion,
  getCaliforniaRegionForTile,
  getCaliforniaRegionsInOrder,
} from './californiaRegions'

describe('California region identity', () => {
  const map = generateMap()

  it('keeps the region atlas broad enough to cover the major play provinces', () => {
    expect(getCaliforniaRegionsInOrder()).toHaveLength(10)
    expect(new Set(getCaliforniaRegionsInOrder().map(region => region.id)).size).toBe(10)
  })

  it('classifies major coordinate anchors into their expected California regions', () => {
    expect(getCaliforniaRegionAt(52, 219, map[219][52].subregion).id).toBe('bay-area')
    expect(getCaliforniaRegionAt(78, 35, map[35][78].subregion).id).toBe('klamath-cascades')
    expect(getCaliforniaRegionAt(115, 200, map[200][115].subregion).id).toBe('sierra-nevada')
    expect(getCaliforniaRegionAt(82, 180, map[180][82].subregion).id).toBe('sacramento-delta')
    expect(getCaliforniaRegionAt(126, 418, map[418][126].subregion).id).toBe('south-coast')
    expect(getCaliforniaRegionAt(166, 296, map[296][166].subregion).id).toBe('deserts')
    expect(getCaliforniaRegionAt(96, 402, map[402][96].subregion).id).toBe('channel-islands')
  })

  it('uses subregion names for battle and journal surfaces that lack coordinates', () => {
    expect(getCaliforniaRegionForSubregion('Financial District').id).toBe('bay-area')
    expect(getCaliforniaRegionForSubregion('Yosemite Valley').id).toBe('sierra-nevada')
    expect(getCaliforniaRegionForSubregion('Santa Monica Pier').id).toBe('south-coast')
    expect(getCaliforniaRegionForSubregion('Death Valley').id).toBe('deserts')
  })

  it('resolves full map tiles with the same region identity as coordinate lookup', () => {
    const tile = map[220][74]
    expect(getCaliforniaRegionForTile(tile).id).toBe(getCaliforniaRegionAt(tile.x, tile.y, tile.subregion).id)
  })
})
