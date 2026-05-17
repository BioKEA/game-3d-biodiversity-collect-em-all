import { describe, expect, it } from 'vitest'
import { ALL_CREATURES } from './creatures'
import {
  compareCreatureArtEvolution,
  CURATED_CREATURE_ART_IDS,
  getActiveCreatureAdaptations,
  getCreatureArtProfile,
  getCreatureArtSpec,
  hasCuratedCreatureArtSpec,
} from './creatureArt'

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

  it('summarizes anatomy with readable labels for guide surfaces', () => {
    const frog = ALL_CREATURES.find(creature => creature.id === 'pacific-tree-frog')
    expect(frog).toBeTruthy()
    const profile = getCreatureArtProfile(frog!)

    expect(profile.bodyPlanLabel).toContain('Amphibious')
    expect(profile.stageLabel).toContain('Base')
    expect(profile.dominantAdaptations.map(adaptation => adaptation.label)).toContain('Legs')
  })

  it('previews evolution silhouette changes without losing adaptation metadata', () => {
    const from = ALL_CREATURES.find(creature => creature.id === 'pacific-tree-frog')
    const to = ALL_CREATURES.find(creature => creature.id === 'california-newt')
    expect(from).toBeTruthy()
    expect(to).toBeTruthy()

    const preview = compareCreatureArtEvolution(from!, to!)
    expect(preview.toProfile.stageLabel).not.toContain('Base')
    expect(preview.silhouetteShift).not.toBe('steady')
    expect([
      ...preview.gainedAdaptations,
      ...preview.intensifiedAdaptations,
      ...getActiveCreatureAdaptations(to!),
    ].length).toBeGreaterThan(0)
  })

  it('keeps marquee starters and evolution chains on curated art specs', () => {
    const starterIds = [
      'pacific-tree-frog',
      'gray-fox',
      'scrub-jay',
      'mission-blue-butterfly',
      'harbor-seal',
      'bay-wisp',
    ]

    for (const id of starterIds) {
      expect(hasCuratedCreatureArtSpec(id)).toBe(true)
    }
    expect(CURATED_CREATURE_ART_IDS.length).toBeGreaterThanOrEqual(12)

    const monarch = getCreatureArtSpec({ id: 'monarch-butterfly', name: 'Monarch Butterfly', type: 'insect' })
    expect(monarch.bodyPlan).toBe('insect')
    expect(monarch.adaptations.wings).toBe(1)
    expect(monarch.adaptations.stripes).toBeGreaterThan(0.5)
  })
})
