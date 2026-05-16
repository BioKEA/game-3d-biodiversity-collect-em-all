import type { Ranger } from '@/types/game'

export const EXPANDED_RANGERS: Ranger[] = [
  {
    id: 'ranger-yosemite',
    name: 'Ranger Sierra',
    title: 'Yosemite Valley Naturalist',
    greeting: 'Welcome to Yosemite! Half Dome watches over us — and so do creatures you won\'t find anywhere else. The Sierra is a world apart.',
    sprite: '🏔️',
    x: 120, y: 180,
    subregion: 'Yosemite',
    quests: [
      {
        id: 'yosemite-alpine',
        title: 'High Sierra Survey',
        description: 'We need data on alpine species. Catch 2 creatures above the treeline.',
        rangerId: 'ranger-yosemite',
        objective: { type: 'catch_any', count: 2 },
        reward: {
          xp: 150,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 3, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
      {
        id: 'yosemite-endangered',
        title: 'Endangered Species Census',
        description: 'Document an endangered species in Yosemite for our conservation records.',
        rangerId: 'ranger-yosemite',
        objective: { type: 'catch_conservation', status: 'EN', count: 1 },
        reward: {
          xp: 200,
          items: [{ id: 'full-restore', name: 'Full Restore', type: 'heal', quantity: 2, description: 'Fully restores HP.', sprite: '💊' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'black-bear', level: 14 },
      { creatureId: 'black-tailed-deer', level: 12 },
      { creatureId: 'peregrine-falcon', level: 13 },
    ],
    battleQuote: 'The Sierra breeds strong creatures. Let\'s see if yours can match them!',
    defeatQuote: 'Impressive — you\'ve earned the respect of the mountains.',
    battleReward: { xp: 350 },
    trades: [
      {
        id: 'yosemite-trade-1',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 3 },
        receive: { itemId: 'full-restore', itemName: 'Full Restore', type: 'heal', quantity: 1, description: 'Fully restores HP.', sprite: '💊' },
      },
    ],
  },
  {
    id: 'ranger-death-valley',
    name: 'Ranger Dusty',
    title: 'Death Valley Desert Guide',
    greeting: 'You made it to the hottest place on Earth! Most people don\'t think anything lives here — but the desert is full of survivors.',
    sprite: '🤠',
    x: 160, y: 310,
    subregion: 'Death Valley',
    quests: [
      {
        id: 'death-valley-reptiles',
        title: 'Desert Reptile Survey',
        description: 'The desert is reptile country. Catch 2 reptile species for our herpetology database.',
        rangerId: 'ranger-death-valley',
        objective: { type: 'catch_type', creatureType: 'reptile', count: 2 },
        reward: {
          xp: 130,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 8, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'sidewinder', level: 11 },
      { creatureId: 'kit-fox', level: 12 },
      { creatureId: 'gila-monster', level: 13 },
    ],
    battleQuote: 'My desert team has survived worse heat than your hottest attack!',
    defeatQuote: 'Well I\'ll be — you\'ve got grit. The desert respects that.',
    battleReward: { xp: 300 },
    trades: [
      {
        id: 'death-valley-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 2 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 1, description: 'Premium capture device.', sprite: '✨' },
      },
    ],
  },
  {
    id: 'ranger-redwood',
    name: 'Ranger Fern',
    title: 'Redwood Forest Keeper',
    greeting: 'Shh... listen. The redwoods are the tallest trees on Earth, and they shelter creatures found nowhere else. Walk softly here.',
    sprite: '🌲',
    x: 35, y: 80,
    subregion: 'Redwood National Park',
    quests: [
      {
        id: 'redwood-amphibians',
        title: 'Fog Belt Amphibians',
        description: 'The redwood fog belt harbors unique amphibians. Catch 2 for our survey.',
        rangerId: 'ranger-redwood',
        objective: { type: 'catch_type', creatureType: 'amphibian', count: 2 },
        reward: {
          xp: 140,
          items: [{ id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 5, description: 'Restores 30 HP.', sprite: '🧪' }],
        },
      },
      {
        id: 'redwood-rare',
        title: 'Old Growth Mystery',
        description: 'Something rare has been spotted deep in the old growth. Find and catch a rare creature.',
        rangerId: 'ranger-redwood',
        objective: { type: 'catch_rarity', rarity: 'rare', count: 1 },
        reward: {
          xp: 200,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'banana-slug', level: 10 },
      { creatureId: 'northern-spotted-owl', level: 13 },
      { creatureId: 'black-bear', level: 11 },
    ],
    battleQuote: 'The ancient forest lends its strength to my team. Can you match 1000 years of wisdom?',
    defeatQuote: 'The forest approves. You move through it like you belong.',
    battleReward: { xp: 320 },
    trades: [
      {
        id: 'redwood-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 5 },
        receive: { itemId: 'energy-berry', itemName: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack.', sprite: '🫐' },
      },
    ],
  },
  {
    id: 'ranger-monterey',
    name: 'Ranger Marina',
    title: 'Monterey Bay Marine Biologist',
    greeting: 'Monterey Bay is one of the most biodiverse marine environments on the planet. The kelp forests here are like underwater cathedrals.',
    sprite: '🧑‍🔬',
    x: 60, y: 268,
    subregion: 'Monterey',
    quests: [
      {
        id: 'monterey-marine',
        title: 'Kelp Forest Census',
        description: 'Help me catalog the kelp forest ecosystem. Catch 3 marine creatures near Monterey.',
        rangerId: 'ranger-monterey',
        objective: { type: 'catch_type', creatureType: 'marine', count: 3 },
        reward: {
          xp: 180,
          items: [{ id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 2, description: 'A premium capture device with higher success rate.', sprite: '✨' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'southern-sea-otter', level: 14 },
      { creatureId: 'harbor-seal', level: 12 },
      { creatureId: 'brown-pelican', level: 13 },
    ],
    battleQuote: 'The ocean depths have forged my team. Prepare for a tidal wave of power!',
    defeatQuote: 'You navigate these waters well. The kelp forest welcomes you.',
    battleReward: { xp: 340 },
    trades: [
      {
        id: 'monterey-trade-1',
        give: { itemId: 'herb-potion', itemName: 'Herb Potion', quantity: 2 },
        receive: { itemId: 'bio-capsule', itemName: 'Bio Capsule', type: 'capture', quantity: 6, description: 'A standard capture device.', sprite: '🔮' },
      },
    ],
  },
  {
    id: 'ranger-joshua-tree',
    name: 'Ranger Soleil',
    title: 'Joshua Tree Desert Ecologist',
    greeting: 'Welcome to Joshua Tree! These twisted trees are actually giant yuccas. The creatures here are adapted to a world of extremes.',
    sprite: '🌵',
    x: 155, y: 380,
    subregion: 'Joshua Tree',
    quests: [
      {
        id: 'joshua-night-survey',
        title: 'Nocturnal Desert Survey',
        description: 'Most desert creatures are active at night. Catch 2 creatures after dark.',
        rangerId: 'ranger-joshua-tree',
        objective: { type: 'catch_any', count: 2 },
        reward: {
          xp: 120,
          items: [{ id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack.', sprite: '🫐' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'sidewinder', level: 11 },
      { creatureId: 'coyote', level: 12 },
      { creatureId: 'red-tailed-hawk', level: 10 },
    ],
    battleQuote: 'In the desert, only the tough survive. My team knows this well!',
    defeatQuote: 'You burned bright out here. The desert stars shine for you tonight.',
    battleReward: { xp: 280 },
    trades: [
      {
        id: 'joshua-trade-1',
        give: { itemId: 'bio-capsule', itemName: 'Bio Capsule', quantity: 4 },
        receive: { itemId: 'shield-fern', itemName: 'Shield Fern', type: 'boost', quantity: 2, description: 'Boosts defense.', sprite: '🌿' },
      },
    ],
  },
  {
    id: 'ranger-tahoe',
    name: 'Ranger Aspen',
    title: 'Lake Tahoe Alpine Ranger',
    greeting: 'Lake Tahoe is the crown jewel of the Sierra — the water is so clear you can see 70 feet down. The creatures up here are hardy mountain folk.',
    sprite: '⛷️',
    x: 126, y: 155,
    subregion: 'Lake Tahoe',
    quests: [
      {
        id: 'tahoe-beasts',
        title: 'Mountain Beasts',
        description: 'The high Sierra is home to incredible mammals. Catch 2 beast-type creatures.',
        rangerId: 'ranger-tahoe',
        objective: { type: 'catch_type', creatureType: 'beast', count: 2 },
        reward: {
          xp: 160,
          items: [{ id: 'full-restore', name: 'Full Restore', type: 'heal', quantity: 1, description: 'Fully restores HP.', sprite: '💊' }],
        },
      },
      {
        id: 'tahoe-visit',
        title: 'Alpine Expedition',
        description: 'Visit Mammoth Lakes to study the volcanic alpine ecosystem.',
        rangerId: 'ranger-tahoe',
        objective: { type: 'visit', subregion: 'Mammoth Lakes' },
        reward: {
          xp: 100,
          items: [{ id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 5, description: 'A standard capture device.', sprite: '🔮' }],
        },
      },
    ],
    battleTeam: [
      { creatureId: 'mountain-lion', level: 15 },
      { creatureId: 'golden-eagle', level: 14 },
      { creatureId: 'black-bear', level: 13 },
    ],
    battleQuote: 'At 6,000 feet, the air is thin but my team hits hard. Ready for altitude?',
    defeatQuote: 'You conquered the summit! The mountains acknowledge your strength.',
    battleReward: { xp: 380 },
    trades: [
      {
        id: 'tahoe-trade-1',
        give: { itemId: 'energy-berry', itemName: 'Energy Berry', quantity: 3 },
        receive: { itemId: 'golden-capsule', itemName: 'Golden Capsule', type: 'capture', quantity: 2, description: 'Premium capture device.', sprite: '✨' },
      },
    ],
  },
]
