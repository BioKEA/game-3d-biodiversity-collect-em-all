import { describe, expect, it } from 'vitest'
import { LANDMARKS } from './landmarks'
import {
  CURATED_LANDMARK_ART_NAMES,
  getLandmarkArtSpec,
  hasCuratedLandmarkArtSpec,
  inferLandmarkKind,
} from './landmarkArt'

describe('landmark art specs', () => {
  it('resolves every landmark to a custom pixel-art structure', () => {
    for (const landmark of LANDMARKS) {
      const spec = getLandmarkArtSpec(landmark)
      expect(spec.kind).toBeTruthy()
      expect(spec.base).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.side).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.shadow).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.accent).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.seed).toBeGreaterThanOrEqual(0)
    }
  })

  it('classifies marquee California forms into distinct silhouettes', () => {
    expect(inferLandmarkKind({ name: 'Golden Gate Bridge' })).toBe('bridge')
    expect(inferLandmarkKind({ name: 'Muir Woods' })).toBe('forest')
    expect(inferLandmarkKind({ name: 'Mt. Shasta' })).toBe('mountain')
    expect(inferLandmarkKind({ name: 'Griffith Observatory' })).toBe('observatory')
    expect(inferLandmarkKind({ name: 'Mission San Juan Capistrano' })).toBe('mission')
  })

  it('keeps marquee California landmarks on curated pixel specs', () => {
    expect(CURATED_LANDMARK_ART_NAMES.length).toBeGreaterThanOrEqual(20)
    for (const name of CURATED_LANDMARK_ART_NAMES) {
      expect(hasCuratedLandmarkArtSpec(name)).toBe(true)
      expect(getLandmarkArtSpec({ name }).glow).toMatch(/^#[0-9a-f]{6}$/i)
    }

    expect(getLandmarkArtSpec({ name: 'Golden Gate Bridge' }).kind).toBe('bridge')
    expect(getLandmarkArtSpec({ name: 'Griffith Observatory' }).kind).toBe('observatory')
    expect(getLandmarkArtSpec({ name: 'Death Valley' }).kind).toBe('desert')
  })
})
