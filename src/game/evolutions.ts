import type { CapturedCreature, Move } from '@/types/game'
import { ALL_CREATURES } from './creatures'

export interface Evolution {
  fromId: string
  toId: string
  level: number
  description: string
}

// Evolution chains — creature transforms into a new form at the specified level
// Some real species get "adult" or "alpha" forms, fantasy ones get powered-up versions
export const EVOLUTIONS: Evolution[] = [
  // Real species evolutions (juvenile → mature forms)
  {
    fromId: 'pacific-tree-frog',
    toId: 'california-newt',
    level: 12,
    description: 'The tiny frog has absorbed enough Bay Area moisture to transform into a toxic newt!',
  },
  {
    fromId: 'western-fence-lizard',
    toId: 'gopher-snake',
    level: 14,
    description: 'The lizard has shed its skin so many times it emerged as a powerful serpent!',
  },
  {
    fromId: 'gray-fox',
    toId: 'bobcat',
    level: 18,
    description: 'Years of hunting in the Marin hills have forged this fox into a fierce bobcat!',
  },
  {
    fromId: 'red-tailed-hawk',
    toId: 'golden-eagle',
    level: 20,
    description: 'Riding thermals to ever greater heights, the hawk has become a majestic Golden Eagle!',
  },
  {
    fromId: 'scrub-jay',
    toId: 'red-tailed-hawk',
    level: 15,
    description: 'This clever jay has grown bold enough to join the raptors soaring over the Bay!',
  },
  {
    fromId: 'raccoon',
    toId: 'coyote',
    level: 13,
    description: 'Street-smart and fearless, the raccoon has become a full urban predator!',
  },
  {
    fromId: 'harbor-seal',
    toId: 'river-otter',
    level: 14,
    description: 'Trading the open bay for creeks and marshes, the seal has become a nimble otter!',
  },

  // Fantasy species evolutions (power-ups)
  {
    fromId: 'bay-wisp',
    toId: 'fog-serpent',
    level: 16,
    description: 'The tiny wisp has gathered enough Bay fog to coalesce into a mighty Fog Serpent!',
  },
  {
    fromId: 'fog-serpent',
    toId: 'tide-phantom',
    level: 25,
    description: 'The serpent has merged with the tides themselves, becoming a spectral force of nature!',
  },
  {
    fromId: 'ember-salamander',
    toId: 'redwood-guardian',
    level: 28,
    description: 'Volcanic fire met ancient wood — the salamander has become a living Redwood Guardian!',
  },
  {
    fromId: 'silicon-sprite',
    toId: 'mission-phantom',
    level: 22,
    description: 'The digital spirit absorbed the soul of old San Francisco and became a legendary phantom!',
  },

  // Extended chains — give every creature an evolution path
  {
    fromId: 'mission-blue-butterfly',
    toId: 'painted-lady-swarm',
    level: 14,
    description: 'The butterfly\'s hillside call drew thousands of painted ladies into a coordinated swarm!',
  },
  {
    fromId: 'black-tailed-deer',
    toId: 'tule-elk',
    level: 18,
    description: 'Seasons of foraging on the coastal hills have transformed the deer into a mighty Tule Elk!',
  },
  {
    fromId: 'great-blue-heron',
    toId: 'sandhill-crane',
    level: 16,
    description: 'Patient hunting in the marshes has honed this heron into an ancient, powerful crane!',
  },
  {
    fromId: 'brown-pelican',
    toId: 'california-condor',
    level: 18,
    description: 'Endless soaring over the coast has forged the pelican into North America\'s largest flyer!',
  },
  {
    fromId: 'banana-slug',
    toId: 'ancient-gastropod',
    level: 14,
    description: 'Centuries of feeding on redwood duff have made this slug ancient and nearly indestructible!',
  },
  {
    fromId: 'coyote',
    toId: 'mountain-lion',
    level: 22,
    description: 'The coyote\'s cunning has evolved into raw predatory power — a Mountain Lion stalks the hills!',
  },
  {
    fromId: 'california-newt',
    toId: 'giant-salamander',
    level: 20,
    description: 'The toxic newt has grown massive in the deep forest pools, becoming a Giant Salamander!',
  },
  {
    fromId: 'river-otter',
    toId: 'sea-lion',
    level: 20,
    description: 'The playful otter has grown bold and powerful, commanding the Bay as a California Sea Lion!',
  },

  // Alcatraz evolution chains
  {
    fromId: 'phantom-crab',
    toId: 'rock-wraith',
    level: 18,
    description: 'The Phantom Crab absorbed the ancient stone of Alcatraz itself, becoming a living Rock Wraith!',
  },
  {
    fromId: 'fog-gull',
    toId: 'alcatraz-night-heron',
    level: 14,
    description: 'The ghostly gull has roosted so long on the island it transformed into the silent Alcatraz Night Heron!',
  },
  {
    fromId: 'cell-block-specter',
    toId: 'warden-of-the-rock',
    level: 25,
    description: 'The Specter has merged with the tides and moonlight — it is now the legendary Warden of the Rock!',
  },
  // Nocturnal evolutions
  {
    fromId: 'nightjar',
    toId: 'western-screech-owl',
    level: 14,
    description: 'The nightbird has mastered silent flight and transformed into a fearsome owl!',
  },
  {
    fromId: 'bay-firefly',
    toId: 'ghost-moth',
    level: 16,
    description: 'The firefly\'s glow has intensified into ethereal luminescence — a Ghost Moth emerges!',
  },
  {
    fromId: 'midnight-coyote',
    toId: 'fog-serpent',
    level: 30,
    description: 'Decades of prowling through Karl the Fog have merged this coyote with the mist itself!',
  },

  // Santa Cruz surfing evolutions
  {
    fromId: 'surf-otter',
    toId: 'wave-spirit',
    level: 22,
    description: 'Riding countless perfect waves, the Surf Otter has merged with the ocean itself — becoming the legendary Wave Spirit!',
  },
  {
    fromId: 'harbor-seal',
    toId: 'surf-otter',
    level: 16,
    description: 'Spending its days bodysurfing the swells of Steamer Lane, the seal has become a wave-riding Surf Otter!',
  },

  // Weather creature evolutions
  {
    fromId: 'fog-wraith',
    toId: 'tide-phantom',
    level: 24,
    description: 'The Fog Wraith drifted over the Bay until the tides claimed it — now it commands both mist and sea!',
  },
  {
    fromId: 'storm-petrel',
    toId: 'wind-hawk',
    level: 18,
    description: 'Riding gales across the Pacific forged this storm bird into a fearsome Wind Hawk!',
  },
  {
    fromId: 'rain-salamander',
    toId: 'giant-salamander',
    level: 20,
    description: 'Years of downpours fed this salamander\'s growth until it became a colossal Giant Salamander!',
  },

  // New species evolution chains
  {
    fromId: 'joshua-tree-lizard',
    toId: 'coast-horned-lizard',
    level: 14,
    description: 'Basking in desert heat for so long, the lizard has grown armored spines and a fearsome blood-squirting defense!',
  },
  {
    fromId: 'coast-horned-lizard',
    toId: 'desert-iguana',
    level: 20,
    description: 'Years of desert survival have forged this horned lizard into a heat-resistant Desert Iguana!',
  },
  {
    fromId: 'rough-skinned-newt',
    toId: 'mountain-yellow-legged-frog',
    level: 18,
    description: 'The toxic newt climbed to high Sierra lakes and evolved into the rare Mountain Yellow-legged Frog!',
  },
  {
    fromId: 'mountain-yellow-legged-frog',
    toId: 'yosemite-toad',
    level: 24,
    description: 'Surviving in alpine meadows against all odds, the frog has become the legendary Yosemite Toad!',
  },
  {
    fromId: 'giant-kangaroo-rat',
    toId: 'channel-island-fox',
    level: 20,
    description: 'This nocturnal survivor has grown bold and cunning enough to become a rare Channel Island Fox!',
  },
  {
    fromId: 'purple-sea-urchin',
    toId: 'garibaldi-fish',
    level: 15,
    description: 'The urchin shed its spines and transformed into a brilliant orange Garibaldi — California\'s state marine fish!',
  },
  {
    fromId: 'garibaldi-fish',
    toId: 'kelp-wraith',
    level: 22,
    description: 'The Garibaldi\'s territorial fury merged with the kelp forest itself, birthing a ghostly Kelp Wraith!',
  },
  {
    fromId: 'california-poppy-sprite',
    toId: 'manzanita-sprite',
    level: 18,
    description: 'The golden Poppy Sprite drifted into chaparral and its magic fused with twisted manzanita bark!',
  },
  {
    fromId: 'manzanita-sprite',
    toId: 'sequoia-guardian',
    level: 28,
    description: 'Centuries of growth have transformed the mischievous sprite into an ancient Sequoia Guardian!',
  },
  {
    fromId: 'mojave-phantom',
    toId: 'sierra-glow',
    level: 26,
    description: 'The desert mirage drifted into the high Sierra, where starlight transformed it into the luminous Sierra Glow!',
  },
]

/** Get the evolution available for a creature at its current level */
export function getEvolution(creatureId: string, level: number): Evolution | null {
  return EVOLUTIONS.find(e => e.fromId === creatureId && level >= e.level) ?? null
}

/** Get what a creature evolves into (for display, regardless of level) */
export function getEvolutionTarget(creatureId: string): Evolution | null {
  return EVOLUTIONS.find(e => e.fromId === creatureId) ?? null
}

/** Get what evolves INTO this creature */
export function getPreEvolution(creatureId: string): Evolution | null {
  return EVOLUTIONS.find(e => e.toId === creatureId) ?? null
}

/** Apply evolution to a captured creature, returning the evolved form */
export function evolveCreature(creature: CapturedCreature, evolution: Evolution): CapturedCreature {
  const target = ALL_CREATURES.find(c => c.id === evolution.toId)
  if (!target) return creature

  // Keep level, xp, nickname, capture info — replace species data
  // Stats get a boost on top of the target's base stats scaled to level
  const levelBonus = creature.level - 1
  const newMoves: Move[] = [
    // Keep one move from the old form (first attack move), add new form's moves
    ...creature.moves.filter(m => m.type === 'attack').slice(0, 1),
    ...target.moves,
  ].slice(0, 4) // Max 4 moves

  return {
    ...target,
    level: creature.level,
    xp: creature.xp,
    nickname: creature.nickname,
    capturedAt: creature.capturedAt,
    capturedBiome: creature.capturedBiome,
    heldItem: creature.heldItem,
    happiness: creature.happiness, // Evolution preserves the bond
    stats: {
      hp: target.stats.maxHp + levelBonus * 3,
      maxHp: target.stats.maxHp + levelBonus * 3,
      attack: target.stats.attack + levelBonus * 2,
      defense: target.stats.defense + levelBonus,
      speed: target.stats.speed + levelBonus,
    },
    moves: newMoves,
  }
}
