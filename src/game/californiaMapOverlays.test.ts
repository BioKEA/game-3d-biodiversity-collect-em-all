import { describe, expect, it } from 'vitest'
import {
  CALIFORNIA_MAP_OVERLAYS,
  getCaliforniaMapOverlayKindCounts,
  type CaliforniaMapOverlayKind,
} from './californiaMapOverlays'

describe('California map overlays', () => {
  it('covers the major route and terrain overlay families', () => {
    const counts = getCaliforniaMapOverlayKindCounts()
    const requiredKinds: CaliforniaMapOverlayKind[] = ['road', 'rail', 'ferry', 'river', 'range', 'coast']

    for (const kind of requiredKinds) {
      expect(counts[kind]).toBeGreaterThan(0)
    }
  })

  it('keeps every overlay drawable and tied to the overhaul program', () => {
    for (const overlay of CALIFORNIA_MAP_OVERLAYS) {
      expect(overlay.points.length).toBeGreaterThanOrEqual(2)
      expect(overlay.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(overlay.width).toBeGreaterThan(0)
      expect(overlay.alpha).toBeGreaterThan(0)
      expect(overlay.alpha).toBeLessThanOrEqual(1)
      expect(overlay.trackIds.length).toBeGreaterThan(0)

      for (const point of overlay.points) {
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(200)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(500)
      }
    }
  })
})
