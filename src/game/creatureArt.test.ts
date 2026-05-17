import { describe, expect, it } from 'vitest'
import { ALL_CREATURES } from './creatures'
import { getCreatureArtSpec } from './creatureArt'

describe('creature art specs', () => {
  it('resolves every creature to a custom pixel-art body plan', () => {
    for (const creature of ALL_CREATURES) {
      const spec = getCreatureArtSpec(creature)
      expect(spec.bodyPlan).toBeTruthy()
      expect(spec.palette.base).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.palette.shadow).toMatch(/^#[0-9a-f]{6}$/i)
      expect(spec.seed).toBeGreaterThanOrEqual(0)
      expect(spec.scale).toBeGreaterThan(0)
    }
  })

  it('marks known evolved species as later-stage silhouettes', () => {
    expect(getCreatureArtSpec({ id: 'pacific-tree-frog', name: 'Pacific Tree Frog', type: 'amphibian' }).stage).toBe(0)
    expect(getCreatureArtSpec({ id: 'california-newt', name: 'California Newt', type: 'amphibian' }).stage).toBeGreaterThan(0)
  })
})
