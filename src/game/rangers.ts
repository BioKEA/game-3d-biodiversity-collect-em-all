import type { Ranger, TimeOfDay } from '@/types/game'
import { EXPANDED_RANGERS } from './rangersExpanded'
import { getRangerPosition as getSchedulePos } from './npcSchedules'

// Rangers are placed at specific map coordinates in park/nature subregions
// Map is 200x500, coordinates are tile positions on the California-wide grid

export const RANGERS: Ranger[] = [
  {
    id: 'ranger-presidio',
    name: 'Ranger Elena',
    title: 'Presidio Naturalist',
    greeting: 'Welcome to the Presidio! This old military post is now one of SF\'s wildest parks. I study the creatures that have reclaimed these grounds.',
    sprite: '🧑‍🌾',
    x: 50, y: 218, // Presidio area
    subregion: 'The Presidio',
    quests: [
      {
        id: 'presidio-coyote',
        title: 'Urban Coyote Survey',
        description: 'Coyotes have returned to the Presidio. Catch one so I can tag it for our population study.',
        rangerId: 'ranger-presidio',
        objective: { type: 'catch', creatureId: 'coyote', count: 1 },
        reward: {
          xp: 80,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'presidio-birds',
        title: 'Birding the Presidio',
        description: 'The Presidio is a birding hotspot. Catch 2 bird species here to help our migration records.',
        rangerId: 'ranger-presidio',
        objective: { type: 'catch_type', creatureType: 'bird', count: 2 },
        reward: {
          xp: 120,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'coyote', level: 8 },
      { creatureId: 'red-tailed-hawk', level: 7 },
      { creatureId: 'scrub-jay', level: 6 },
    ],
    battleQuote: 'The Presidio animals are tougher than they look. Let\'s see what your team can do!',
    defeatQuote: 'Well fought! The Presidio creatures would approve of your bond with your team.',
    battleReward: { xp: 200 },
    trades: [
      {
        id: 'presidio-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 2 },
        receive: { itemId: 'bio-capsule', itemName: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' },
      },
      {
        id: 'presidio-trade-2',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 3 },
        receive: { itemId: 'herb-potion', itemName: 'Herb Potion', type: 'heal', quantity: 2, description: 'Restores 30 HP.', sprite: '🧪' },
      },
    ],
  },
  {
    id: 'ranger-muir',
    name: 'Ranger Kenji',
    title: 'Muir Woods Guardian',
    greeting: 'These ancient redwoods have stood for over a thousand years. Tread carefully — the forest spirits watch over this place.',
    sprite: '🧔',
    x: 49, y: 212, // Muir Woods area
    subregion: 'Muir Woods',
    quests: [
      {
        id: 'muir-slug',
        title: 'Banana Slug Census',
        description: 'It\'s that time of year — catch a Banana Slug for our annual census. They\'re all over the forest floor.',
        rangerId: 'ranger-muir',
        objective: { type: 'catch', creatureId: 'banana-slug', count: 1 },
        reward: {
          xp: 60,
          items: [{ id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' }],
        },
      },
      {
        id: 'muir-mystic',
        title: 'Legend of the Redwood Guardian',
        description: 'Legends speak of an ancient tree spirit deep in the grove. If you ever encounter a legendary creature here, catch it and bring proof.',
        rangerId: 'ranger-muir',
        objective: { type: 'catch_rarity', rarity: 'legendary', count: 1 },
        reward: {
          xp: 300,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 5, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'banana-slug', level: 10 },
      { creatureId: 'california-newt', level: 12 },
      { creatureId: 'bay-wisp', level: 11, nickname: 'Muir Spirit' },
    ],
    battleQuote: 'The ancient forest has taught my creatures patience and power. En garde!',
    defeatQuote: 'The redwoods bow to a worthy challenger. You\'ve earned the forest\'s respect.',
    battleReward: { xp: 300 },
    trades: [
      {
        id: 'muir-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 5 },
        receive: { itemId: 'energy-berry', itemName: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' },
      },
    ],
  },
  {
    id: 'ranger-diablo',
    name: 'Ranger Sofia',
    title: 'Mt. Diablo Fire Watcher',
    greeting: 'You made it all the way up here? Not many explorers reach Mt. Diablo. The views — and creatures — are worth it.',
    sprite: '👩‍🚒',
    x: 74, y: 220, // Mt. Diablo foothills
    subregion: 'Mt. Diablo',
    quests: [
      {
        id: 'diablo-eagle',
        title: 'Eagle\'s Nest',
        description: 'A Golden Eagle has been spotted near the summit. Catch one for our raptor monitoring program.',
        rangerId: 'ranger-diablo',
        objective: { type: 'catch', creatureId: 'golden-eagle', count: 1 },
        reward: {
          xp: 200,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 5, description: 'Boosts attack for the next battle.', sprite: '🫐' },
          ],
        },
      },
      {
        id: 'diablo-snake',
        title: 'Snake Survey',
        description: 'Gopher Snakes are important for controlling rodent populations. Catch one for our reptile database.',
        rangerId: 'ranger-diablo',
        objective: { type: 'catch', creatureId: 'gopher-snake', count: 1 },
        reward: {
          xp: 100,
          items: [{ id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 4, description: 'Restores 30 HP.', sprite: '🧪' }],
        },
      },
      {
        id: 'diablo-save-condor',
        title: 'Find the Condor',
        description: 'The California Condor dropped to 22 birds in 1982. Document one for our recovery program — she\'s the most critically endangered raptor in the western hemisphere.',
        rangerId: 'ranger-diablo',
        objective: { type: 'catch_conservation', status: 'CR', count: 1 },
        reward: {
          xp: 500,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 5, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
      {
        id: 'diablo-endangered-watch',
        title: 'Endangered Watch',
        description: 'Beyond the condor, several species are on the brink. Document 2 endangered creatures — the Mission Blue Butterfly survives on just a handful of Bay Area hilltops, and the Southern Sea Otter barely hangs on.',
        rangerId: 'ranger-diablo',
        objective: { type: 'catch_conservation', status: 'EN', count: 2 },
        reward: {
          xp: 300,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 5, description: 'Restores 30 HP.', sprite: '🧪' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'golden-eagle', level: 15 },
      { creatureId: 'gopher-snake', level: 13 },
      { creatureId: 'bobcat', level: 14 },
    ],
    battleQuote: 'At the summit, only the strongest survive. My team is forged by fire and wind!',
    defeatQuote: 'I haven\'t been beaten like that since the last wildfire season. Impressive!',
    battleReward: { xp: 400 },
    trades: [
      {
        id: 'diablo-trade-1',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 2 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-tilden',
    name: 'Ranger Marcus',
    title: 'Tilden Park Biologist',
    greeting: 'Tilden is Berkeley\'s backyard wilderness. We\'ve got newts in the creeks, hawks on the ridges, and foxes in the canyons.',
    sprite: '🧑‍🔬',
    x: 65, y: 214, // Tilden Regional Park forest
    subregion: 'Tilden Regional Park',
    quests: [
      {
        id: 'tilden-newt',
        title: 'Newt Crossing',
        description: 'California Newts migrate across our trails every spring. Catch one so we can track their routes.',
        rangerId: 'ranger-tilden',
        objective: { type: 'catch', creatureId: 'california-newt', count: 1 },
        reward: {
          xp: 80,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'tilden-explore',
        title: 'East Bay Expedition',
        description: 'I\'ve heard the Oakland Hills have some interesting sightings. Visit there and report back to me.',
        rangerId: 'ranger-tilden',
        objective: { type: 'visit', subregion: 'Oakland Hills' },
        reward: {
          xp: 100,
          items: [{ id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'california-newt', level: 9 },
      { creatureId: 'gray-fox', level: 10 },
      { creatureId: 'western-fence-lizard', level: 8 },
    ],
    battleQuote: 'Tilden creatures are clever and quick. Think you can keep up?',
    defeatQuote: 'You and your team move like the wind through Wildcat Canyon!',
    battleReward: { xp: 250 },
    trades: [
      {
        id: 'tilden-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 1 },
        receive: { itemId: 'herb-potion', itemName: 'Herb Potion', type: 'heal', quantity: 2, description: 'Restores 30 HP.', sprite: '🧪' },
      },
      {
        id: 'tilden-trade-2',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 3 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-don-edwards',
    name: 'Ranger Priya',
    title: 'Wetlands Conservationist',
    greeting: 'The Don Edwards refuge is one of the last great Bay Area wetlands. Herons, otters, and wisps all call this home.',
    sprite: '👩‍🌾',
    x: 63, y: 230, // Don Edwards marsh (east bay shore)
    subregion: 'Don Edwards Wildlife Refuge',
    quests: [
      {
        id: 'don-edwards-heron',
        title: 'Heron Watch',
        description: 'Great Blue Herons nest here every season. Catch one for our banding study.',
        rangerId: 'ranger-don-edwards',
        objective: { type: 'catch', creatureId: 'great-blue-heron', count: 1 },
        reward: {
          xp: 80,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'don-edwards-otter',
        title: 'Otter Return',
        description: 'River otters are returning! Catch one to prove they\'ve established in these waterways.',
        rangerId: 'ranger-don-edwards',
        objective: { type: 'catch', creatureId: 'river-otter', count: 1 },
        reward: {
          xp: 120,
          items: [
            { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' },
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 2, description: 'Boosts attack for the next battle.', sprite: '🫐' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'great-blue-heron', level: 11 },
      { creatureId: 'river-otter', level: 12 },
      { creatureId: 'brown-pelican', level: 10 },
    ],
    battleQuote: 'The wetlands are calm, but my team is anything but!',
    defeatQuote: 'You\'re as adaptable as the otters themselves. Well done, explorer.',
    battleReward: { xp: 300 },
    trades: [
      {
        id: 'don-edwards-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 4 },
        receive: { itemId: 'herb-potion', itemName: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' },
      },
    ],
  },
  {
    id: 'ranger-golden-gate',
    name: 'Ranger Tomás',
    title: 'Golden Gate Park Ranger',
    greeting: 'Golden Gate Park stretches from the Haight all the way to the ocean. You\'d be surprised what lives in here.',
    sprite: '👨‍🌾',
    x: 51, y: 220, // Golden Gate Park area
    subregion: 'Golden Gate Park',
    quests: [
      {
        id: 'tutorial-first-catch',
        title: 'First Catch',
        description: 'Every explorer starts somewhere. Catch a wild creature to begin building your team.',
        rangerId: 'ranger-golden-gate',
        objective: { type: 'catch_any', count: 2 },
        reward: {
          xp: 50,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'ggp-raccoon',
        title: 'Trash Panda Patrol',
        description: 'Raccoons are getting into the picnic areas again. Catch one so we can relocate it deeper into the park.',
        rangerId: 'ranger-golden-gate',
        objective: { type: 'catch', creatureId: 'raccoon', count: 1 },
        reward: {
          xp: 60,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 4, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'ggp-amphibians',
        title: 'Amphibian Audit',
        description: 'Our wetland areas should have amphibians. Catch 2 amphibian species anywhere in the Bay Area and log them.',
        rangerId: 'ranger-golden-gate',
        objective: { type: 'catch_type', creatureType: 'amphibian', count: 2 },
        reward: {
          xp: 150,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'raccoon', level: 6 },
      { creatureId: 'mission-blue-butterfly', level: 7 },
    ],
    battleQuote: 'Golden Gate Park is tougher than it looks. Let\'s go!',
    defeatQuote: 'Not bad! The park creatures would be proud to run with your team.',
    battleReward: { xp: 150 },
    trades: [
      {
        id: 'ggp-trade-1',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 1 },
        receive: { itemId: 'bio-capsule', itemName: 'Bio Capsule', type: 'capture', quantity: 3, description: 'A standard capture device.', sprite: '🔮' },
      },
      {
        id: 'ggp-trade-2',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 3 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-ocean-beach',
    name: 'Ranger Marina',
    title: 'Coastal Marine Biologist',
    greeting: 'The Pacific coastline is rougher than the Bay side — stronger currents, bigger waves, and wilder creatures. Keep an eye on the tide!',
    sprite: '🧜‍♀️',
    x: 49, y: 222, // Sunset District, just inland from Ocean Beach
    subregion: 'Sunset District',
    quests: [
      {
        id: 'ocean-seal',
        title: 'Seal Population Count',
        description: 'Harbor Seals haul out on the rocks below the cliffs. Catch one for our annual census.',
        rangerId: 'ranger-ocean-beach',
        objective: { type: 'catch', creatureId: 'harbor-seal', count: 1 },
        reward: {
          xp: 100,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'ocean-marine',
        title: 'Deep Bay Survey',
        description: 'We need data on marine species along the coast. Catch 2 marine creatures anywhere in the Bay.',
        rangerId: 'ranger-ocean-beach',
        objective: { type: 'catch_type', creatureType: 'marine', count: 2 },
        reward: {
          xp: 150,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'harbor-seal', level: 12 },
      { creatureId: 'sea-lion', level: 14 },
      { creatureId: 'brown-pelican', level: 11 },
    ],
    battleQuote: 'The Pacific doesn\'t pull punches, and neither do we!',
    defeatQuote: 'You navigated that battle like a seasoned mariner. Respect.',
    battleReward: { xp: 350 },
    trades: [
      {
        id: 'ocean-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 2 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-tamalpais',
    name: 'Ranger Akira',
    title: 'Mt. Tamalpais Summit Guide',
    greeting: 'From up here you can see the whole Bay on a clear day. The mountain creatures are hardy and brave — just like you if you made it this far.',
    sprite: '🧗',
    x: 51, y: 210, // Mt. Tamalpais area
    subregion: 'Mt. Tamalpais',
    quests: [
      {
        id: 'tam-fox',
        title: 'Mountain Fox Tracking',
        description: 'Gray Foxes are one of the few canines that climb trees. Catch one on the mountain trails.',
        rangerId: 'ranger-tamalpais',
        objective: { type: 'catch', creatureId: 'gray-fox', count: 1 },
        reward: {
          xp: 80,
          items: [{ id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 4, description: 'Restores 30 HP.', sprite: '🧪' }],
        },
      },
      {
        id: 'tam-beasts',
        title: 'Beast Master Challenge',
        description: 'The hills are teeming with beasts. Catch 3 beast-type creatures to prove your skill.',
        rangerId: 'ranger-tamalpais',
        objective: { type: 'catch_type', creatureType: 'beast', count: 3 },
        reward: {
          xp: 200,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'gray-fox', level: 13 },
      { creatureId: 'bobcat', level: 15 },
      { creatureId: 'midnight-coyote', level: 16, nickname: 'Shadow' },
    ],
    battleQuote: 'The mountain breeds warriors. My team has never backed down!',
    defeatQuote: 'You climbed to the top — literally and figuratively. Take this as your reward.',
    battleReward: { xp: 400 },
    trades: [
      {
        id: 'tam-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 6 },
        receive: { itemId: 'energy-berry', itemName: 'Energy Berry', type: 'boost', quantity: 4, description: 'Boosts attack for the next battle.', sprite: '🫐' },
      },
    ],
  },
  {
    id: 'ranger-downtown',
    name: 'Ranger Dev',
    title: 'Urban Wildlife Specialist',
    greeting: 'Don\'t let the skyscrapers fool you — the city is alive with creatures. Raccoons in the alleys, hawks on the rooftops, and if you\'re lucky... something stranger.',
    sprite: '🕵️',
    x: 53, y: 219, // Downtown SF / Financial District
    subregion: 'Financial District',
    quests: [
      {
        id: 'downtown-sprite',
        title: 'Silicon Ghost',
        description: 'Tech workers report flickering lights and strange energy readings downtown. Find and catch the Silicon Sprite.',
        rangerId: 'ranger-downtown',
        objective: { type: 'catch', creatureId: 'silicon-sprite', count: 1 },
        reward: {
          xp: 180,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' },
          ],
        },
      },
      {
        id: 'downtown-rare',
        title: 'Rare Sighting Report',
        description: 'My contacts say rare creatures have been spotted across the Bay Area. Catch 2 rare creatures for our database.',
        rangerId: 'ranger-downtown',
        objective: { type: 'catch_rarity', rarity: 'rare', count: 2 },
        reward: {
          xp: 250,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 4, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
      {
        id: 'downtown-invasive-cleanup',
        title: 'Invasive Cleanup',
        description: 'Non-native species like roof rats are crowding out natives. Remove 3 invasives from the ecosystem — tap any invasive creature on the field and choose Remove.',
        rangerId: 'ranger-downtown',
        objective: { type: 'remove_invasive', count: 3 },
        reward: {
          xp: 220,
          items: [
            { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 8, description: 'A standard capture device for creatures.', sprite: '🔮' },
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'silicon-sprite', level: 14 },
      { creatureId: 'raccoon', level: 12 },
      { creatureId: 'bay-wisp', level: 15, nickname: 'Neon' },
    ],
    battleQuote: 'In this city, the creatures are as unpredictable as the tech market. Ready?',
    defeatQuote: 'That was a disruption-level performance. I\'m adding you to my field report.',
    battleReward: { xp: 350 },
    trades: [
      {
        id: 'downtown-trade-1',
        give: { itemId: 'golden-capsule', itemName: 'Golden Capsule', quantity: 1 },
        receive: { itemId: 'herb-potion', itemName: 'Herb Potion', type: 'heal', quantity: 5, description: 'Restores 30 HP.', sprite: '🧪' },
      },
      {
        id: 'downtown-trade-2',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 4 },
        receive: { itemId: 'energy-berry', itemName: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' },
      },
    ],
  },
  {
    id: 'ranger-coyote-hills',
    name: 'Ranger Jasmine',
    title: 'Coyote Hills Ecologist',
    greeting: 'The Coyote Hills are an ancient shellmound site — thousands of years of life right under your feet. The creatures here sense that history.',
    sprite: '👩‍🔬',
    x: 62, y: 232, // Coyote Hills area
    subregion: 'Coyote Hills',
    quests: [
      {
        id: 'coyote-hills-pelican',
        title: 'Pelican Flyway',
        description: 'Brown Pelicans dive-bomb for fish along the South Bay. Catch one so we can fit a GPS tracker.',
        rangerId: 'ranger-coyote-hills',
        objective: { type: 'catch', creatureId: 'brown-pelican', count: 1 },
        reward: {
          xp: 100,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 6, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
      {
        id: 'coyote-hills-visit',
        title: 'South Bay Explorer',
        description: 'I need field notes from different ecosystems. Visit the Alviso Marsh and report what you find.',
        rangerId: 'ranger-coyote-hills',
        objective: { type: 'visit', subregion: 'Milpitas' },
        reward: {
          xp: 120,
          items: [
            { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' },
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 2, description: 'Boosts attack for the next battle.', sprite: '🫐' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'brown-pelican', level: 10 },
      { creatureId: 'bay-firefly', level: 9, nickname: 'Sparkle' },
      { creatureId: 'great-blue-heron', level: 11 },
    ],
    battleQuote: 'The shellmounds hold ancient power. My team channels it!',
    defeatQuote: 'The ancestors would be impressed. You\'ve earned a place in the hills\' story.',
    battleReward: { xp: 280 },
    trades: [
      {
        id: 'coyote-hills-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 3 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-alcatraz',
    name: 'Ranger Ghost',
    title: 'Alcatraz Warden',
    greeting: 'Welcome to The Rock. Most visitors come for the history... but the creatures here have their own stories. Some say the island itself is alive after dark.',
    sprite: '🏴‍☠️',
    x: 53, y: 212,
    subregion: 'Alcatraz Island',
    quests: [
      {
        id: 'alcatraz-phantom-hunt',
        title: 'The Phantom of D-Block',
        description: 'Guards reported cold spots in the isolation cells again. Find and catch the Cell Block Specter so I can document it.',
        rangerId: 'ranger-alcatraz',
        objective: { type: 'catch', creatureId: 'cell-block-specter', count: 1 },
        reward: {
          xp: 200,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
      {
        id: 'alcatraz-night-patrol',
        title: 'Night Patrol',
        description: 'I need someone brave enough to catalog what\'s out there after dark. Catch 3 different Alcatraz creatures.',
        rangerId: 'ranger-alcatraz',
        objective: { type: 'catch_rarity', rarity: 'uncommon', count: 3 },
        reward: {
          xp: 250,
          items: [
            { id: 'spectral-capsule', name: 'Spectral Capsule', type: 'capture', quantity: 2, description: 'A ghostly capsule that works better on mystic creatures.', sprite: '👻' },
            { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 5, description: 'Restores 30 HP.', sprite: '🧪' },
          ],
        },
      },
      {
        id: 'alcatraz-warden-legend',
        title: 'The Warden of the Rock',
        description: 'Legends say a legendary creature guards the island during the highest tides. Can you find the Warden of the Rock? Come at night.',
        rangerId: 'ranger-alcatraz',
        objective: { type: 'catch', creatureId: 'warden-of-the-rock', count: 1 },
        reward: {
          xp: 500,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 5, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'phantom-crab', level: 14 },
      { creatureId: 'cell-block-specter', level: 16 },
      { creatureId: 'rock-wraith', level: 18 },
      { creatureId: 'warden-of-the-rock', level: 22, nickname: 'The Warden' },
    ],
    battleQuote: 'No one escapes The Rock... or beats my team. Think you\'re the exception?',
    defeatQuote: 'Well I\'ll be... First breakout in history. You\'ve got real guts, explorer.',
    battleReward: { xp: 600 },
    trades: [
      {
        id: 'alcatraz-trade-1',
        give: { itemId: 'quartz-shard', itemName: 'Quartz Shard', quantity: 3 },
        receive: { itemId: 'spectral-capsule', itemName: 'Spectral Capsule', type: 'capture', quantity: 2, description: 'A ghostly capsule that works better on mystic creatures.', sprite: '👻' },
      },
      {
        id: 'alcatraz-trade-2',
        give: { itemId: 'fog-dew', itemName: 'Fog Dew', quantity: 5 },
        receive: { itemId: 'mystic-elixir', itemName: 'Mystic Elixir', type: 'heal', quantity: 1, description: 'Fully restores HP and cures status effects.', sprite: '🌟' },
      },
    ],
  },

  // === LANDMARK RANGERS ===

  {
    id: 'ranger-coit',
    name: 'Ranger Lena',
    title: 'Telegraph Hill Lookout',
    greeting: 'Coit Tower was built in 1933 to honor the city\'s firefighters. But up here, the real show is the parrots — and the peregrines.',
    sprite: '🧑‍🎨',
    x: 52, y: 218, // Coit Tower / North Beach
    subregion: 'North Beach / Fishermans Wharf',
    quests: [
      {
        id: 'coit-birds',
        title: 'Tower Birdwatch',
        description: 'The wild parrots of Telegraph Hill are famous. Catch 2 bird species near the tower so I can band them.',
        rangerId: 'ranger-coit',
        objective: { type: 'catch_type', creatureType: 'bird', count: 2 },
        reward: {
          xp: 120,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'scrub-jay', level: 10 },
      { creatureId: 'red-tailed-hawk', level: 12 },
    ],
    battleQuote: 'My birds have the high ground — literally. Let\'s see how your team handles altitude!',
    defeatQuote: 'You\'ve earned the view from the top. Well fought!',
    battleReward: { xp: 200 },
    trades: [
      {
        id: 'coit-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 3 },
        receive: { itemId: 'energy-berry', itemName: 'Energy Berry', type: 'boost', quantity: 2, description: 'Boosts attack for the next battle.', sprite: '🫐' },
      },
    ],
  },
  {
    id: 'ranger-oracle',
    name: 'Ranger Casey',
    title: 'McCovey Cove Guide',
    greeting: 'Welcome to Oracle Park! During home games, you can see seals swimming right up to the ballpark. The splash hits are their favorite.',
    sprite: '⚾',
    x: 53, y: 221, // SoMa / Mission District
    subregion: 'SoMa / Mission District',
    quests: [
      {
        id: 'oracle-seal',
        title: 'McCovey Cove Patrol',
        description: 'A group of seals has taken over McCovey Cove. Catch one so we can check if it\'s tagged — we track the regulars.',
        rangerId: 'ranger-oracle',
        objective: { type: 'catch', creatureId: 'harbor-seal', count: 1 },
        reward: {
          xp: 100,
          items: [{ id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 3, description: 'Restores 30 HP.', sprite: '🧪' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'harbor-seal', level: 11, nickname: 'Splash' },
      { creatureId: 'great-blue-heron', level: 10 },
    ],
    battleQuote: 'My team\'s been catching home runs all season. Batter up!',
    defeatQuote: 'Grand slam! Your team really knocked it out of the park.',
    battleReward: { xp: 180 },
    trades: [],
  },
  {
    id: 'ranger-twinpeaks',
    name: 'Ranger Nadia',
    title: 'Twin Peaks Observer',
    greeting: 'The fog rolls over these peaks like a living thing. On a clear day you can see from the Farallon Islands to Mt. Diablo. On a foggy night... things get strange.',
    sprite: '🔭',
    x: 51, y: 221,
    subregion: 'Twin Peaks',
    quests: [
      {
        id: 'twinpeaks-mystic',
        title: 'Fog Watch',
        description: 'Something prowls the peaks when the fog rolls in. Visit Twin Peaks at dusk or night and catch whatever is lurking out there.',
        rangerId: 'ranger-twinpeaks',
        objective: { type: 'catch_rarity', rarity: 'rare', count: 1 },
        reward: {
          xp: 200,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'coyote', level: 13 },
      { creatureId: 'bay-wisp', level: 14, nickname: 'Fogwalker' },
    ],
    battleQuote: 'The fog is my ally. Can your team see through it?',
    defeatQuote: 'The fog parts for the worthy. You\'ve earned the summit.',
    battleReward: { xp: 250 },
    trades: [
      {
        id: 'twinpeaks-trade-1',
        give: { itemId: 'fog-dew', itemName: 'Fog Dew', quantity: 3 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' },
      },
    ],
  },

  // === Santa Cruz — Steamer Lane ===
  {
    id: 'ranger-steamer',
    name: 'Ranger Kai',
    title: 'Steamer Lane Wavekeeper',
    greeting: 'Welcome to the Lane, grom! This is hallowed ground for surfers — the waves here have been ridden since the 1930s. The creatures of Santa Cruz respect the ocean. Do you?',
    sprite: '🏄',
    x: 51, y: 253, // Steamer Lane
    subregion: 'Santa Cruz Beach Boardwalk',
    quests: [
      {
        id: 'steamer-otter',
        title: 'The Board-Stealing Otter',
        description: 'A Surf Otter has been swiping boards from locals at Steamer Lane. Catch it so we can relocate it — carefully. These otters are protected!',
        rangerId: 'ranger-steamer',
        objective: { type: 'catch', creatureId: 'surf-otter', count: 1 },
        reward: {
          xp: 150,
          items: [
            { id: 'surf-wax', name: 'Surf Wax', type: 'boost', quantity: 3, description: 'Boosts speed by 20% for the next battle.', sprite: '🧴' },
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
      {
        id: 'steamer-wave-spirit',
        title: 'The Perfect Wave',
        description: 'Locals speak of a glowing spirit that rides inside the barrels at dawn and dusk. I need proof it exists. Find and catch the Wave Spirit.',
        rangerId: 'ranger-steamer',
        objective: { type: 'catch', creatureId: 'wave-spirit', count: 1 },
        reward: {
          xp: 300,
          items: [
            { id: 'wave-crest', name: 'Wave Crest Medallion', type: 'boost', quantity: 1, description: 'All water/marine creatures gain +10 to all stats permanently.', sprite: '🏅' },
          ],
        },
      },
      {
        id: 'steamer-marine-survey',
        title: 'Monterey Bay Census',
        description: 'Monterey Bay is one of the richest marine habitats on Earth. Catch 3 marine creatures along the Santa Cruz coast for our research database.',
        rangerId: 'ranger-steamer',
        objective: { type: 'catch_type', creatureType: 'marine', count: 3 },
        reward: {
          xp: 200,
          items: [
            { id: 'kelp-wrap', name: 'Kelp Wrap', type: 'heal', quantity: 5, description: 'Restores 40 HP. Made from giant kelp.', sprite: '🌿' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'surf-otter', level: 14, nickname: 'Otter 841' },
      { creatureId: 'pelican-diver', level: 12 },
      { creatureId: 'harbor-seal', level: 13, nickname: 'Barrels' },
    ],
    battleQuote: 'Out here, the ocean decides who wins. My team was forged in the waves of the Lane!',
    defeatQuote: 'Gnarly run! You ride these battles like a pro surfs Mavericks. The coast is yours.',
    battleReward: { xp: 300 },
    trades: [
      {
        id: 'steamer-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 3 },
        receive: { itemId: 'surf-wax', itemName: 'Surf Wax', type: 'boost', quantity: 2, description: 'Boosts speed by 20% for the next battle.', sprite: '🧴' },
      },
      {
        id: 'steamer-trade-2',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 5 },
        receive: { itemId: 'kelp-wrap', itemName: 'Kelp Wrap', type: 'heal', quantity: 3, description: 'Restores 40 HP. Made from giant kelp.', sprite: '🌿' },
      },
    ],
  },

  // === MINI-BOSS 1: Salesforce Tower ===
  {
    id: 'boss-salesforce',
    name: 'Director Hayes',
    title: 'Salesforce Tower Overseer',
    greeting: 'You\'ve made it to the crown of the city. I manage the rarest data in the Bay — creature migration patterns from the tower\'s sensors. Few challengers make it this far.',
    sprite: '🏢',
    x: 54, y: 219,
    subregion: 'SoMa / Mission District',
    quests: [
      {
        id: 'salesforce-survey',
        title: 'Skyline Survey',
        description: 'From up here I can see every biome in the Bay. Prove you know the region — catch 3 different creature types.',
        rangerId: 'boss-salesforce',
        objective: { type: 'catch_type', creatureType: 'bird', count: 3 },
        reward: {
          xp: 300,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 5, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'mystic-elixir', name: 'Mystic Elixir', type: 'heal', quantity: 2, description: 'Fully restores HP and cures status effects.', sprite: '🌟' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'golden-eagle', level: 20 },
      { creatureId: 'fog-serpent', level: 22, nickname: 'Nimbus' },
      { creatureId: 'bobcat', level: 18 },
      { creatureId: 'bay-wisp', level: 21, nickname: 'Tower Light' },
    ],
    battleQuote: 'The view from the top is earned, not given. My team was forged in the clouds above this city.',
    defeatQuote: 'Incredible... You\'ve cleared the first trial. The path to Anthropic is half open. Seek the Tesla Guardian next.',
    battleReward: { xp: 500 },
    trades: [],
  },

  // === MINI-BOSS 2: Tesla Fremont ===
  {
    id: 'boss-tesla',
    name: 'Engineer Volta',
    title: 'Tesla Factory Guardian',
    greeting: 'The factory runs day and night. The electromagnetic fields have drawn... unusual creatures. I study them. And I\'ve trained the strongest of them.',
    sprite: '⚡',
    x: 64, y: 228,
    subregion: 'Fremont',
    quests: [
      {
        id: 'tesla-electric',
        title: 'Electromagnetic Survey',
        description: 'The factory\'s EM fields attract electric and mystic creatures from miles around. Catch a rare creature here so I can study the field effects.',
        rangerId: 'boss-tesla',
        objective: { type: 'catch_rarity', rarity: 'rare', count: 1 },
        reward: {
          xp: 300,
          items: [
            { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 5, description: 'Boosts attack for the next battle.', sprite: '🫐' },
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'fog-serpent', level: 22 },
      { creatureId: 'gopher-snake', level: 20 },
      { creatureId: 'golden-eagle', level: 21 },
      { creatureId: 'coyote', level: 23, nickname: 'Dynamo' },
    ],
    battleQuote: 'High voltage, high stakes. My team runs on pure energy — can yours keep up?',
    defeatQuote: 'The circuit is complete. You\'ve passed both trials. The final challenge awaits at Anthropic HQ. Are you ready?',
    battleReward: { xp: 500 },
    trades: [],
  },

  // === FINAL BOSS: Anthropic HQ ===
  {
    id: 'boss-anthropic',
    name: 'Dr. Claude',
    title: 'Anthropic Research Lead',
    greeting: 'So you\'ve defeated both guardians... I\'ve been monitoring your journey across the Bay. Your bond with your creatures is remarkable. But I\'ve spent years studying the deepest patterns of creature behavior. This will be the ultimate test.',
    sprite: '🧠',
    x: 52, y: 219,
    subregion: 'Financial District',
    quests: [
      {
        id: 'anthropic-final',
        title: 'The Bay Area Champion',
        description: 'Defeat Dr. Claude in the ultimate battle to become the Bay Area Champion. You must first defeat the Salesforce and Tesla guardians.',
        rangerId: 'boss-anthropic',
        objective: { type: 'catch_rarity', rarity: 'legendary', count: 1 },
        reward: {
          xp: 1000,
          items: [
            { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 10, description: 'A premium capture device with higher success rate.', sprite: '✨' },
            { id: 'mystic-elixir', name: 'Mystic Elixir', type: 'heal', quantity: 5, description: 'Fully restores HP and cures status effects.', sprite: '🌟' },
          ],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'warden-of-the-rock', level: 28, nickname: 'Sentinel' },
      { creatureId: 'fog-serpent', level: 30, nickname: 'Karl' },
      { creatureId: 'redwood-guardian', level: 27, nickname: 'Ancient One' },
      { creatureId: 'golden-eagle', level: 26, nickname: 'Apex' },
      { creatureId: 'bay-wisp', level: 29, nickname: 'Prometheus' },
    ],
    battleQuote: 'I\'ve studied every creature in this Bay. My team represents the pinnacle of the ecosystem. Show me what you\'ve learned on your journey.',
    defeatQuote: 'Extraordinary. You didn\'t just beat me — you showed a connection with the Bay\'s creatures I\'ve never seen before. You are the true Bay Area Champion.',
    battleReward: { xp: 1000 },
    trades: [],
  },

  // === BORDER RANGER STATIONS ===
  {
    id: 'ranger-oregon-border',
    name: 'Ranger Sequoia',
    title: 'Oregon Border Warden',
    greeting: 'You made it to the far north! I patrol the Oregon border — wolves have been crossing over from the Rogue Valley. Rare creatures roam these woods that you won\'t find anywhere else in California.',
    sprite: '🧑‍🌾',
    x: 75, y: 4,
    subregion: 'California Wilderness',
    quests: [
      {
        id: 'border-oregon-wolf',
        title: 'The Wolf at the Door',
        description: 'Oregon gray wolves have been spotted crossing into California. Find and document one — this would be a historic sighting.',
        rangerId: 'ranger-oregon-border',
        objective: { type: 'catch', creatureId: 'oregon-gray-wolf', count: 1 },
        reward: {
          xp: 300,
          items: [{ id: 'border-badge-or', name: 'Oregon Border Badge', type: 'held', quantity: 1, description: 'Proof you tracked a wolf at the Oregon border.', sprite: '🏅' }],
        },
      },
      {
        id: 'border-oregon-survey',
        title: 'Northern Frontier Survey',
        description: 'Catch 3 different creatures near the border to complete my wildlife census of the northern frontier.',
        rangerId: 'ranger-oregon-border',
        objective: { type: 'catch_any', count: 3 },
        reward: { xp: 150 },
      },
      {
        id: 'border-patrol-master',
        title: 'Border Patrol: Complete Census',
        description: 'The ultimate challenge — catch all 6 rare border species: Oregon Gray Wolf, Pronghorn, Great Basin Rattlesnake, Nevada Horned Lizard, Arizona Condor, and Gila Monster. Visit all three border stations to find them.',
        rangerId: 'ranger-oregon-border',
        objective: { type: 'catch_rarity', rarity: 'legendary', count: 3 },
        reward: {
          xp: 500,
          items: [{ id: 'border-ranger-badge', name: 'Border Ranger Badge', type: 'held', quantity: 1, description: 'Awarded to those who surveyed every border of California. The rarest badge in the ranger corps.', sprite: '🎖️' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'oregon-gray-wolf', level: 18 },
      { creatureId: 'red-tailed-hawk', level: 16 },
    ],
    battleQuote: 'The north breeds tough creatures. Let\'s see if you can handle what the border throws at you.',
    defeatQuote: 'You\'ve got the heart of a wolf yourself. Welcome to the frontier.',
    battleReward: { xp: 250 },
    trades: [
      {
        id: 'trade-border-or-capsule',
        give: { itemId: 'golden-capsule', itemName: 'Golden Capsule', quantity: 1 },
        receive: { itemId: 'frontier-lure', itemName: 'Frontier Lure', type: 'material', quantity: 3, description: 'Attracts rare border creatures.', sprite: '🪤' },
      },
    ],
  },
  {
    id: 'ranger-nevada-border',
    name: 'Ranger Dusty',
    title: 'Modoc Outpost Ranger',
    greeting: 'Welcome to the Modoc Outpost — the most remote ranger station in California. The Nevada border is right there. Pronghorn and rattlesnakes cross back and forth like the line doesn\'t exist.',
    sprite: '🤠',
    x: 126, y: 50,
    subregion: 'Modoc Plateau',
    quests: [
      {
        id: 'border-nevada-pronghorn',
        title: 'Speed of the Basin',
        description: 'A pronghorn herd crosses from Nevada at dawn. They\'re the fastest land animal in the hemisphere — catch one if you can.',
        rangerId: 'ranger-nevada-border',
        objective: { type: 'catch', creatureId: 'pronghorn-antelope', count: 1 },
        reward: {
          xp: 250,
          items: [{ id: 'border-badge-nv', name: 'Nevada Border Badge', type: 'held', quantity: 1, description: 'Proof you caught a pronghorn at the Nevada border.', sprite: '🏅' }],
        },
      },
      {
        id: 'border-nevada-reptiles',
        title: 'Basin Reptile Census',
        description: 'The Great Basin has incredible reptile diversity. Catch 2 reptile species near the border.',
        rangerId: 'ranger-nevada-border',
        objective: { type: 'catch_type', creatureType: 'reptile', count: 2 },
        reward: { xp: 200 },
      },
    ],
    battleTeam: [
      { creatureId: 'great-basin-rattlesnake', level: 16 },
      { creatureId: 'pronghorn-antelope', level: 17 },
    ],
    battleQuote: 'Out here, only the fast and the venomous survive. My team embodies both.',
    defeatQuote: 'Well I\'ll be. You\'d survive just fine out in the Basin.',
    battleReward: { xp: 200 },
    trades: [],
  },
  {
    id: 'ranger-arizona-border',
    name: 'Ranger Solana',
    title: 'Mojave Basecamp Ranger',
    greeting: 'You\'ve come a long way to reach the Mojave Basecamp. Arizona is just over that ridge. The condors circle overhead, the Gila monsters hide by day... this is the wildest corner of California.',
    sprite: '👩‍🔬',
    x: 188, y: 420,
    subregion: 'California Wilderness',
    quests: [
      {
        id: 'border-arizona-condor',
        title: 'Wings Over the Border',
        description: 'California condors from Arizona\'s reintroduction program have been spotted here. Photograph one — it would prove they\'re expanding their range.',
        rangerId: 'ranger-arizona-border',
        objective: { type: 'catch', creatureId: 'arizona-condor', count: 1 },
        reward: {
          xp: 350,
          items: [{ id: 'border-badge-az', name: 'Arizona Border Badge', type: 'held', quantity: 1, description: 'Proof you documented a condor at the Arizona border.', sprite: '🏅' }],
        },
      },
      {
        id: 'border-arizona-gila',
        title: 'The Venomous One',
        description: 'Gila monsters are incredibly rare this far north. Find one after dark — they only emerge at night.',
        rangerId: 'ranger-arizona-border',
        objective: { type: 'catch', creatureId: 'gila-monster', count: 1 },
        reward: {
          xp: 300,
          items: [{ id: 'border-badge-mx', name: 'Desert Explorer Badge', type: 'held', quantity: 1, description: 'Proof you found a Gila monster in the Mojave.', sprite: '🏅' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'arizona-condor', level: 20 },
      { creatureId: 'gila-monster', level: 19 },
      { creatureId: 'nevada-horned-lizard', level: 17 },
    ],
    battleQuote: 'The desert demands respect. My creatures have survived its worst — can yours?',
    defeatQuote: 'The desert recognizes strength. You\'ve earned your place here.',
    battleReward: { xp: 300 },
    trades: [],
  },
]

// Mini-boss and final boss IDs for quest line gating
export const MINI_BOSS_IDS = ['boss-salesforce', 'boss-tesla'] as const
export const FINAL_BOSS_ID = 'boss-anthropic'
export const GRAND_CHAMPION_ID = 'boss-grand-champion'

export function canChallengeFinalBoss(defeatedRangers: string[]): boolean {
  return MINI_BOSS_IDS.every(id => defeatedRangers.includes(id))
}

// Grand Champion requires defeating ALL other rangers (not counting the grand champion itself)
export function canChallengeGrandChampion(defeatedRangers: string[], subregionsVisited: string[]): boolean {
  const requiredRangers = RANGERS.filter(r => r.id !== GRAND_CHAMPION_ID)
  const allRangersDefeated = requiredRangers.every(r => defeatedRangers.includes(r.id))
  const minSubregions = 20
  return allRangersDefeated && subregionsVisited.length >= minSubregions
}

export function getGrandChampionProgress(defeatedRangers: string[], subregionsVisited: string[]): {
  rangersDefeated: number; rangersTotal: number; subregions: number; subregionsRequired: number
} {
  const requiredRangers = RANGERS.filter(r => r.id !== GRAND_CHAMPION_ID)
  return {
    rangersDefeated: requiredRangers.filter(r => defeatedRangers.includes(r.id)).length,
    rangersTotal: requiredRangers.length,
    subregions: subregionsVisited.length,
    subregionsRequired: 20,
  }
}

RANGERS.push(...EXPANDED_RANGERS)

// Grand Champion — post-game ultimate challenge
RANGERS.push({
  id: GRAND_CHAMPION_ID,
  name: 'The Conservator',
  title: 'Grand Champion of California',
  greeting: 'You\'ve walked every trail, met every ranger, and earned their respect. I\'ve watched your journey from the very beginning. I am the voice of this land — the spirit of California\'s wild places. One final challenge remains: prove you\'re worthy of the title Grand Champion.',
  sprite: '🦅',
  x: 95, y: 200,
  subregion: 'San Francisco',
  quests: [
    {
      id: 'grand-champion-quest',
      title: 'The Grand Champion Challenge',
      description: 'Defeat The Conservator to earn the ultimate title. Only those who have defeated every ranger and explored the full map may challenge.',
      rangerId: GRAND_CHAMPION_ID,
      objective: { type: 'catch_rarity', rarity: 'legendary', count: 2 },
      reward: {
        xp: 2000,
        items: [
          { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 20, description: 'A premium capture device with higher success rate.', sprite: '✨' },
          { id: 'champion-crown', name: 'Champion Crown', type: 'held', quantity: 1, description: 'The ultimate symbol of mastery over California\'s wilderness.', sprite: '👑' },
        ],
      },
    },
  ],
  battleTeam: [
    { creatureId: 'sequoia-guardian', level: 35, nickname: 'Millennial' },
    { creatureId: 'sierra-glow', level: 34, nickname: 'Polaris' },
    { creatureId: 'warden-of-the-rock', level: 33, nickname: 'Alcatraz' },
    { creatureId: 'golden-eagle', level: 35, nickname: 'Sovereignty' },
    { creatureId: 'tide-phantom', level: 34, nickname: 'Pacific' },
    { creatureId: 'mountain-lion', level: 32, nickname: 'Apex' },
  ],
  battleQuote: 'I carry the strength of every biome, every mountain, every tide pool. My team IS California. Show me you are its champion.',
  defeatQuote: 'In all my years guarding these lands... I have never seen a bond like yours. You are not just a champion — you are California\'s guardian now. The title is yours.',
  battleReward: { xp: 2000 },
  trades: [],
})

export function getRangerAt(x: number, y: number): Ranger | undefined {
  return RANGERS.find(r => r.x === x && r.y === y)
}

export function getNearbyRanger(playerX: number, playerY: number, timeOfDay?: TimeOfDay): Ranger | undefined {
  const tod = timeOfDay ?? 'day'
  return RANGERS.find(r => {
    const pos = getSchedulePos(r.id, r.x, r.y, tod)
    return Math.abs(pos.x - playerX) <= 1 && Math.abs(pos.y - playerY) <= 1
  })
}
