import type { BiomeType, RangerTeamMember } from '@/types/game'

export interface RoamingTrainer {
  id: string
  name: string
  title: string
  sprite: string
  quote: string
  defeatQuote: string
  biomes: BiomeType[]  // where they can appear
  teamLevel: number    // base level of their team
  team: RangerTeamMember[]
  rewardXp: number
  rewardItem?: { id: string; name: string; sprite: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string }
  // One-line strategy hint shown in the encounter overlay. Player
  // feedback: "When you encounter joggers and battle, can you
  // provide tips on strategies to the player?"
  strategyTip?: string
}

// Pool of roaming trainers that appear randomly in the world
export const ROAMING_TRAINERS: RoamingTrainer[] = [
  {
    id: 'hiker-sam',
    name: 'Hiker Sam',
    title: 'Trail Runner',
    sprite: '🧗',
    quote: 'I train while I hike! Let\'s see who\'s tougher!',
    defeatQuote: 'Whew! You\'re faster than me on the trail!',
    biomes: ['mountain', 'forest', 'grassland'],
    teamLevel: 5,
    team: [
      { creatureId: 'western-fence-lizard', level: 5 },
      { creatureId: 'gray-fox', level: 6 },
    ],
    rewardXp: 80,
    strategyTip: 'Lizard + fox lineup — lead with a fast water- or bird-type to break their reptile core.',
  },
  {
    id: 'birder-mei',
    name: 'Birder Mei',
    title: 'Avid Birdwatcher',
    sprite: '🧑‍🔬',
    quote: 'My feathered friends are stronger than they look!',
    defeatQuote: 'Your team is really something! Maybe I should branch out from birds.',
    biomes: ['grassland', 'marsh', 'beach'],
    teamLevel: 7,
    team: [
      { creatureId: 'scrub-jay', level: 7 },
      { creatureId: 'red-tailed-hawk', level: 8 },
      { creatureId: 'great-blue-heron', level: 7 },
    ],
    rewardXp: 120,
    strategyTip: 'All-bird team — high evasion and speed. Reptiles + ground creatures hit them where it counts.',
  },
  {
    id: 'surfer-kai',
    name: 'Surfer Kai',
    title: 'Wave Chaser',
    sprite: '🏄',
    quote: 'Dude, my water crew is gnarly! Bring it!',
    defeatQuote: 'Totally wiped out, bro. Respect!',
    biomes: ['beach', 'water'],
    teamLevel: 9,
    team: [
      { creatureId: 'harbor-seal', level: 9 },
      { creatureId: 'brown-pelican', level: 8 },
      { creatureId: 'sea-lion', level: 10 },
    ],
    rewardXp: 150,
    rewardItem: { id: 'bio-capsule', name: 'Bio Capsule', sprite: '🔮', type: 'capture', quantity: 3, description: 'A standard capture device.' },
    strategyTip: 'Heavy water lineup — bring an electric- or grass-type lead. Heal between rounds; the seal hits hard.',
  },
  {
    id: 'jogger-priya',
    name: 'Jogger Priya',
    title: 'Park Runner',
    sprite: '🏃‍♀️',
    quote: 'I caught all my creatures mid-jog. They\'re fast like me!',
    defeatQuote: 'You outpaced me! Great battle!',
    biomes: ['urban', 'grassland'],
    teamLevel: 6,
    team: [
      { creatureId: 'raccoon', level: 6 },
      { creatureId: 'mission-blue-butterfly', level: 5 },
    ],
    rewardXp: 70,
    strategyTip: 'Quick mammal + a fragile butterfly — heavy hitters end this fast. Watch for evasion turns from the butterfly.',
  },
  {
    id: 'mycologist-finn',
    name: 'Mycologist Finn',
    title: 'Mushroom Hunter',
    sprite: '🍄',
    quote: 'The forest floor hides many secrets. My team is one of them!',
    defeatQuote: 'You\'ve unearthed my defeat. Well played!',
    biomes: ['redwood', 'forest'],
    teamLevel: 10,
    team: [
      { creatureId: 'banana-slug', level: 10 },
      { creatureId: 'california-newt', level: 11 },
      { creatureId: 'bay-wisp', level: 12 },
    ],
    rewardXp: 180,
    rewardItem: { id: 'herb-potion', name: 'Herb Potion', sprite: '🧪', type: 'heal', quantity: 3, description: 'Restores 30 HP.' },
    strategyTip: 'Slug + amphibian lineup — slow but tanky. Burst damage works; long fights wear you down via toxin chip.',
  },
  {
    id: 'photographer-luna',
    name: 'Luna Chen',
    title: 'Wildlife Photographer',
    sprite: '📸',
    quote: 'I\'ve photographed every creature on my team. Now let me capture yours in action!',
    defeatQuote: 'That was picture-perfect battling! Can I get a photo of your team?',
    biomes: ['marsh', 'forest', 'beach', 'mountain'],
    teamLevel: 12,
    team: [
      { creatureId: 'golden-eagle', level: 12 },
      { creatureId: 'bobcat', level: 13 },
      { creatureId: 'river-otter', level: 11 },
    ],
    rewardXp: 200,
    rewardItem: { id: 'golden-capsule', name: 'Golden Capsule', sprite: '✨', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.' },
    strategyTip: 'Mixed apex predators — no single type beats all three. Keep a balanced team and heal aggressively.',
  },
  {
    id: 'night-owl-raven',
    name: 'Night Owl Raven',
    title: 'Nocturnal Researcher',
    sprite: '🦉',
    quote: 'The creatures of the night are my domain. Ready for a challenge?',
    defeatQuote: 'The darkness couldn\'t save me this time!',
    biomes: ['forest', 'marsh', 'urban', 'redwood'],
    teamLevel: 14,
    team: [
      { creatureId: 'nightjar', level: 14 },
      { creatureId: 'bay-firefly', level: 13 },
      { creatureId: 'midnight-coyote', level: 15 },
    ],
    rewardXp: 250,
    strategyTip: 'Nocturnals hit hard but have low defense. Lead aggressive; keep a heal queued for the coyote burst.',
  },
  {
    id: 'marine-biologist-ocean',
    name: 'Dr. Ocean Park',
    title: 'Marine Biologist',
    sprite: '🐬',
    quote: 'The Bay\'s ecosystem is my laboratory. Prepare for a tidal wave of power!',
    defeatQuote: 'Your currents were too strong for my marine team!',
    biomes: ['water', 'beach', 'marsh'],
    teamLevel: 16,
    team: [
      { creatureId: 'sea-lion', level: 16 },
      { creatureId: 'river-otter', level: 15 },
      { creatureId: 'tide-phantom', level: 17, nickname: 'Tsunami' },
    ],
    rewardXp: 300,
    rewardItem: { id: 'golden-capsule', name: 'Golden Capsule', sprite: '✨', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.' },
    strategyTip: 'Late-game marine boss. Tide Phantom is the threat — bring electric- or storm-type with high speed.',
  },
]

export interface ActiveTrainer {
  trainer: RoamingTrainer
  x: number
  y: number
  defeated: boolean
}

/** Roll a random trainer encounter based on biome and player level */
export function rollTrainerEncounter(biome: BiomeType, playerLevel: number, defeatedTrainerIds: string[]): RoamingTrainer | null {
  // Filter trainers that can appear in this biome and haven't been defeated recently
  const available = ROAMING_TRAINERS.filter(t =>
    t.biomes.includes(biome) &&
    !defeatedTrainerIds.includes(t.id) &&
    t.teamLevel <= playerLevel + 5 && // Don't spawn trainers way above player level
    t.teamLevel >= Math.max(1, playerLevel - 8)  // Don't spawn very weak trainers
  )

  if (available.length === 0) return null

  return available[Math.floor(Math.random() * available.length)]
}
