import { describe, expect, it } from 'vitest'
import { WILDCAL_OVERHAUL_TRACKS, getOverhaulTrackById } from './overhaulRoadmap'

describe('WildCal overhaul roadmap', () => {
  it('keeps the ten major improvement tracks explicit and uniquely identified', () => {
    expect(WILDCAL_OVERHAUL_TRACKS).toHaveLength(10)
    expect(new Set(WILDCAL_OVERHAUL_TRACKS.map(track => track.id)).size).toBe(10)
    expect(WILDCAL_OVERHAUL_TRACKS.map(track => track.number)).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    ])
  })

  it('can resolve each track by stable id', () => {
    for (const track of WILDCAL_OVERHAUL_TRACKS) {
      expect(getOverhaulTrackById(track.id)).toBe(track)
    }
  })
})
