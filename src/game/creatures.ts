import type { Creature, ConservationStatus } from '@/types/game'
import { EXTENDED_CREATURES } from './creaturesExtended'
import { CALIFORNIA_CREATURES } from './creaturesCaliforniaExpanded'
import { NEW_SPECIES } from './creaturesNewSpecies'
import { LANDMARKS } from './landmarks'

export const ALL_CREATURES: Creature[] = [
  // === REAL SPECIES ===
  {
    id: 'red-tailed-hawk',
    name: 'Red-tailed Hawk',
    scientificName: 'Buteo jamaicensis',
    description: 'A majestic raptor soaring above the Bay Area hills. Its piercing cry echoes across the grasslands.',
    lore: 'Red-tailed hawks are the most common raptor in North America. In the Bay Area, they nest on power poles and in tall trees along ridgelines. Their raspy "kree-eee-ar" cry is so iconic it\'s used as a sound effect for bald eagles in movies. Watch for them riding thermals above Hawk Hill in the Marin Headlands during fall migration — thousands pass through each season.',
    type: 'bird',
    rarity: 'common',
    biomes: ['grassland', 'mountain'],
    subregions: ['Marin Headlands', 'Mt. Tamalpais', 'Oakland Hills', 'Mt. Diablo', 'Rancho San Antonio', 'Tilden Regional Park'],
    stats: { hp: 45, maxHp: 45, attack: 38, defense: 25, speed: 42 },
    isFantasy: false,
    sprite: '🦅',
    color: '#b45309',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Dive Strike', power: 35, type: 'attack', description: 'Swoops down from above' },
      { name: 'Thermal Ride', power: 0, type: 'defend', description: 'Rides updrafts to dodge' },
      { name: 'Screech', power: 20, type: 'special', description: 'A piercing cry that startles' },
    ],
  },
  {
    id: 'california-newt',
    name: 'California Newt',
    scientificName: 'Taricha torosa',
    description: 'A small orange-bellied amphibian found near creeks. Toxic skin deters predators.',
    lore: 'California newts produce tetrodotoxin, the same potent neurotoxin found in pufferfish. During winter rains, they migrate en masse to breeding ponds — some Bay Area roads close temporarily to protect them. The only known predator resistant to their toxin is the common garter snake, which has co-evolved immunity over millennia.',
    type: 'amphibian',
    rarity: 'uncommon',
    biomes: ['forest', 'marsh', 'redwood'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Redwood Regional Park', 'Tilden Regional Park'],
    stats: { hp: 35, maxHp: 35, attack: 20, defense: 40, speed: 15 },
    isFantasy: false,
    sprite: '🦎',
    color: '#ea580c',
    activeTime: ['dawn', 'dusk', 'night'],
    moves: [
      { name: 'Toxic Touch', power: 30, type: 'attack', description: 'Secretes neurotoxin on contact' },
      { name: 'Creek Splash', power: 15, type: 'attack', description: 'Splashes water at the foe' },
      { name: 'Curl Defense', power: 0, type: 'defend', description: 'Curls up to show orange belly' },
    ],
  },
  {
    id: 'mission-blue-butterfly',
    name: 'Mission Blue Butterfly',
    scientificName: 'Icaricia icarioides missionensis',
    description: 'A flash of iridescent blue on the lupine-covered hills of the Bay Area.',
    lore: 'The Mission Blue is one of the most endangered butterflies in North America, found only on a handful of serpentine grassland hilltops in the San Francisco Bay Area — including Twin Peaks, San Bruno Mountain, and the Marin Headlands. Its survival is tied entirely to native lupine, the only plant its caterpillars can eat. Recovery efforts by the Golden Gate National Recreation Area have slowly brought populations back from the brink.',
    type: 'insect',
    rarity: 'uncommon',
    biomes: ['forest', 'grassland', 'beach'],
    subregions: ['Half Moon Bay', 'Pacifica', 'Golden Gate Park', 'The Presidio', 'Muir Beach', 'Santa Cruz Beach Boardwalk', 'Santa Cruz', 'UC Santa Cruz'],
    stats: { hp: 20, maxHp: 20, attack: 15, defense: 10, speed: 50 },
    isFantasy: false,
    sprite: '🦋',
    color: '#3b82f6',
    activeTime: ['day', 'dusk'],
    moves: [
      { name: 'Wing Dust', power: 20, type: 'special', description: 'Scatters blinding wing scales' },
      { name: 'Flutter Away', power: 0, type: 'defend', description: 'Erratic flight dodges attacks' },
      { name: 'Nectar Drain', power: 15, type: 'attack', description: 'Siphons energy like nectar' },
    ],
  },
  {
    id: 'monarch-butterfly',
    name: 'Monarch Butterfly',
    scientificName: 'Danaus plexippus',
    description: 'Migrating through the Bay on ancient routes. Their bold orange-and-black wings light up the coastal groves.',
    lore: 'Each fall, thousands of monarchs cluster in eucalyptus and Monterey pine groves along the California coast. The Natural Bridges grove in Santa Cruz and the Pacific Grove sanctuary are among the most famous overwintering sites. Bay Area populations have declined sharply since the 1990s, making every sighting a small miracle.',
    type: 'insect',
    rarity: 'uncommon',
    biomes: ['forest', 'grassland', 'beach'],
    subregions: ['Half Moon Bay', 'Pacifica', 'Golden Gate Park', 'The Presidio', 'Muir Beach', 'Santa Cruz Beach Boardwalk', 'Santa Cruz', 'UC Santa Cruz'],
    stats: { hp: 20, maxHp: 20, attack: 15, defense: 10, speed: 50 },
    isFantasy: false,
    sprite: '🦋',
    color: '#f97316',
    activeTime: ['day', 'dusk'],
    moves: [
      { name: 'Wing Dust', power: 20, type: 'special', description: 'Scatters blinding wing scales' },
      { name: 'Flutter Away', power: 0, type: 'defend', description: 'Erratic flight dodges attacks' },
      { name: 'Monarch Gust', power: 15, type: 'attack', description: 'Whips up a swirling wind' },
    ],
  },
  {
    id: 'harbor-seal',
    name: 'Harbor Seal',
    scientificName: 'Phoca vitulina',
    description: 'Lounging on the rocks at Pier 39 or diving through the cold Bay waters hunting fish.',
    lore: 'Harbor seals first colonized the Pier 39 docks in 1989 shortly after the Loma Prieta earthquake. The Marine Mammal Center in Sausalito rescues and rehabilitates hundreds of seals and sea lions each year. Harbor seals can dive to depths of 1,500 feet and hold their breath for nearly 30 minutes.',
    type: 'marine',
    rarity: 'common',
    biomes: ['beach', 'water'],
    subregions: ['North Beach / Fishermans Wharf', 'Sausalito', 'Half Moon Bay', 'Pacifica'],
    stats: { hp: 55, maxHp: 55, attack: 30, defense: 35, speed: 28 },
    isFantasy: false,
    sprite: '🦭',
    color: '#6b7280',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Body Slam', power: 30, type: 'attack', description: 'Flops onto the opponent' },
      { name: 'Deep Dive', power: 0, type: 'defend', description: 'Dives deep to avoid attacks' },
      { name: 'Bark Blast', power: 25, type: 'special', description: 'An echoing bark that stuns' },
    ],
  },
  {
    // The id stays 'gray-fox' for save-compat with players who already
    // picked the fox starter. Display + lore + scientific name update
    // to a Sierra Nevada Red Fox per BioKEA's preference for spotlighting
    // genuinely-rare species — there are fewer than 50 of these in the
    // wild, making any encounter in-game feel meaningful.
    id: 'gray-fox',
    name: 'Sierra Nevada Red Fox',
    scientificName: 'Vulpes vulpes necator',
    description: 'A critically endangered Sierra Nevada subspecies — fewer than 50 are thought to remain. Active at dusk and dawn.',
    lore: 'The Sierra Nevada red fox is one of the rarest mammals in North America. Once thought extinct, surviving populations were rediscovered in the high Sierra and southern Cascades. They favor high-elevation mountain meadows, conifer forests, and alpine ridgelines, surviving on rodents, birds, berries, and carrion. Genetic work suggests the lineage has been isolated in the Sierra for ~10,000 years — every individual matters.',
    type: 'beast',
    rarity: 'uncommon',
    biomes: ['forest', 'grassland', 'mountain'],
    subregions: ['Marin Headlands', 'Mt. Tamalpais', 'Tilden Regional Park', 'Oakland Hills', 'Rancho San Antonio'],
    stats: { hp: 40, maxHp: 40, attack: 35, defense: 22, speed: 45 },
    isFantasy: false,
    sprite: '🦊',
    color: '#c2410c',
    activeTime: ['dawn', 'dusk'],
    moves: [
      { name: 'Quick Pounce', power: 30, type: 'attack', description: 'Lightning-fast tackle' },
      { name: 'Snow Burrow', power: 0, type: 'defend', description: 'Burrows into the snow to evade' },
      { name: 'Alpine Howl', power: 25, type: 'special', description: 'A piercing howl across the ridgeline' },
    ],
  },
  {
    id: 'banana-slug',
    name: 'Banana Slug',
    scientificName: 'Ariolimax californicus',
    description: 'The iconic bright yellow slug of the redwood forest floor. Slow but surprisingly tough.',
    lore: 'The banana slug is the mascot of UC Santa Cruz and the second-largest terrestrial slug in the world, reaching up to 10 inches long. Their slime contains an anesthetic that numbs the tongue of any predator foolish enough to taste them. They play a vital role in the redwood ecosystem by recycling leaf litter and spreading seeds and spores.',
    type: 'beast',
    rarity: 'common',
    biomes: ['redwood', 'forest'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Redwood Regional Park'],
    stats: { hp: 50, maxHp: 50, attack: 12, defense: 50, speed: 5 },
    isFantasy: false,
    sprite: '🐌',
    color: '#eab308',
    activeTime: ['day', 'dusk'],
    moves: [
      { name: 'Slime Trail', power: 15, type: 'special', description: 'Leaves sticky slime that slows' },
      { name: 'Mucus Shield', power: 0, type: 'defend', description: 'Coats body in thick protective slime' },
      { name: 'Acid Drip', power: 25, type: 'attack', description: 'Drips acidic mucus on the foe' },
    ],
  },
  {
    id: 'great-blue-heron',
    name: 'Great Blue Heron',
    scientificName: 'Ardea herodias',
    description: 'A tall, patient hunter standing motionless in the shallows before striking with precision.',
    lore: 'Great blue herons maintain a large nesting colony on Alcatraz Island, one of the most visible rookeries in the Bay Area. They stand up to four feet tall and can strike prey in the water with lightning speed. The herons at Stow Lake in Golden Gate Park are famously unbothered by humans, making them a favorite of Bay Area birdwatchers.',
    type: 'bird',
    rarity: 'common',
    biomes: ['marsh', 'beach', 'water'],
    subregions: ['Don Edwards Wildlife Refuge', 'The Presidio', 'Richardson Bay', 'Baylands Nature Preserve'],
    stats: { hp: 42, maxHp: 42, attack: 40, defense: 20, speed: 30 },
    isFantasy: false,
    sprite: '🪿',
    color: '#64748b',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Spear Beak', power: 40, type: 'attack', description: 'Strikes with razor-sharp beak' },
      { name: 'Stillness', power: 0, type: 'defend', description: 'Stands perfectly still to blend in' },
      { name: 'Wing Gust', power: 20, type: 'special', description: 'Powerful wingbeat pushes foe back' },
    ],
  },
  {
    id: 'coyote',
    name: 'Coyote',
    scientificName: 'Canis latrans',
    description: 'Resourceful and bold, Bay Area coyotes thrive in parks and urban edges alike.',
    lore: 'Coyotes have thrived in San Francisco since recolonizing the Presidio in 2002. They now roam Golden Gate Park, Bernal Heights, and even downtown streets at night. The SF coyote population helps control rodents and Canada geese, and wildlife officials urge residents to "haze" them with noise rather than feed them.',
    type: 'beast',
    rarity: 'common',
    biomes: ['grassland', 'urban', 'mountain'],
    subregions: ['Golden Gate Park', 'The Presidio', 'Twin Peaks', 'Marin Headlands', 'Rancho San Antonio', 'Mt. Diablo'],
    stats: { hp: 48, maxHp: 48, attack: 33, defense: 28, speed: 40 },
    isFantasy: false,
    sprite: '🐺',
    color: '#a8a29e',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Pack Howl', power: 25, type: 'special', description: 'Calls for backup, boosting attack' },
      { name: 'Snap Bite', power: 35, type: 'attack', description: 'Quick, sharp bite' },
      { name: 'Slink Away', power: 0, type: 'defend', description: 'Dodges nimbly into brush' },
    ],
  },
  {
    id: 'pacific-tree-frog',
    name: 'Pacific Tree Frog',
    scientificName: 'Pseudacris regilla',
    description: 'Tiny but loud! Their chorus fills Bay Area wetlands every spring evening.',
    lore: 'Despite being barely an inch long, the Pacific tree frog produces the classic "ribbit" sound used in Hollywood movies worldwide. They can change color from green to brown over hours to match their surroundings. In the Bay Area, their spring chorus at ponds in Tilden and Don Edwards is so loud it can be heard from a quarter mile away.',
    type: 'amphibian',
    rarity: 'common',
    biomes: ['marsh', 'forest', 'redwood'],
    subregions: ['Muir Woods', 'Don Edwards Wildlife Refuge', 'Tilden Regional Park', 'Redwood Regional Park', 'Baylands Nature Preserve'],
    stats: { hp: 25, maxHp: 25, attack: 18, defense: 15, speed: 38 },
    isFantasy: false,
    sprite: '🐸',
    color: '#22c55e',
    activeTime: ['dawn', 'dusk', 'night'],
    moves: [
      { name: 'Tongue Lash', power: 20, type: 'attack', description: 'Sticky tongue snaps out' },
      { name: 'Chorus Call', power: 15, type: 'special', description: 'Deafening group ribbit' },
      { name: 'Leap', power: 0, type: 'defend', description: 'Leaps high to dodge' },
    ],
  },
  {
    id: 'western-fence-lizard',
    name: 'Western Fence Lizard',
    scientificName: 'Sceloporus occidentalis',
    description: 'The "blue belly" lizard, doing pushups on every sun-warmed rock in the Bay. Brown-gray scales on top, vivid blue patches underneath.',
    lore: 'Western fence lizards carry a protein in their blood that kills the Lyme disease bacterium inside ticks that feed on them, effectively cleansing ticks of the disease. Their territorial pushup displays on rocks and fences are a ubiquitous sight on Bay Area trails. Males flash their bright blue belly patches to assert dominance and attract mates.',
    type: 'reptile',
    rarity: 'common',
    biomes: ['grassland', 'urban', 'mountain', 'beach'],
    subregions: ['Twin Peaks', 'Mt. Tamalpais', 'Oakland Hills', 'Mt. Diablo', 'Rancho San Antonio'],
    stats: { hp: 30, maxHp: 30, attack: 22, defense: 30, speed: 35 },
    isFantasy: false,
    sprite: '🦎',
    color: '#78716c',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Tail Whip', power: 20, type: 'attack', description: 'Swings tail like a lash' },
      { name: 'Sunbask', power: 0, type: 'defend', description: 'Soaks sun to heal slightly' },
      { name: 'Blue Flash', power: 25, type: 'special', description: 'Flashes blue belly to intimidate' },
    ],
  },

  // === FANTASY SPECIES ===
  {
    id: 'fog-serpent',
    name: 'Fog Serpent',
    scientificName: 'Nebulaserpens pacifica',
    description: 'Born from the famous SF fog, this ethereal serpent glides through the Golden Gate at dawn.',
    lore: 'Sailors passing through the Golden Gate have whispered of the Fog Serpent for generations. It is said to form when Karl the Fog rolls in thick enough to achieve consciousness, coiling through the bridge cables and dissolving before the sun burns through. Some claim it guards the strait, swallowing ships that stray too close to the rocks.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['water', 'beach', 'marsh'],
    subregions: ['Golden Gate Strait', 'Marin Headlands', 'The Presidio', 'The Presidio'],
    stats: { hp: 60, maxHp: 60, attack: 45, defense: 35, speed: 50 },
    isFantasy: true,
    sprite: '🐉',
    color: '#94a3b8',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Fog Veil', power: 0, type: 'defend', description: 'Wraps in impenetrable fog' },
      { name: 'Mist Fang', power: 40, type: 'attack', description: 'Bites from within the fog' },
      { name: 'Gale Breath', power: 50, type: 'special', description: 'Exhales a blast of cold sea air' },
    ],
  },
  {
    id: 'crystal-fox',
    name: 'Crystal Fox',
    scientificName: 'Vulpes crystallinus',
    description: 'A shimmering fox made of living quartz. Found only deep in the redwood groves at midnight.',
    lore: 'Legend holds that the Crystal Fox was born when moonlight struck a vein of quartz deep beneath Muir Woods during a thousand-year alignment. It leaves no footprints, only faint prismatic refractions in the morning dew. Those who glimpse it are said to gain clarity of purpose — but only if they do not try to follow.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['redwood'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods'],
    stats: { hp: 70, maxHp: 70, attack: 55, defense: 45, speed: 55 },
    isFantasy: true,
    sprite: '🦊',
    color: '#c084fc',
    activeTime: ['night'],
    moves: [
      { name: 'Prism Strike', power: 55, type: 'attack', description: 'Refracts light into a cutting beam' },
      { name: 'Crystal Shield', power: 0, type: 'defend', description: 'Grows crystal armor' },
      { name: 'Starlight Howl', power: 45, type: 'special', description: 'Howls and the sky fills with light' },
    ],
  },
  {
    id: 'ember-salamander',
    name: 'Ember Salamander',
    scientificName: 'Salamandra igneous',
    description: 'A volcanic salamander that lives in the hot springs of Mt. Diablo. Its tail glows like magma.',
    lore: 'Geologists exploring the volcanic vents on Mt. Diablo reported seeing something glowing in the steam — not lava, but a living creature. The Ember Salamander is believed to incubate in superheated mineral pools, absorbing geothermal energy into its crystalline skin. Its tail tip burns hot enough to ignite dry grass, and some blame it for the mysterious wildfires that start deep in the backcountry with no apparent cause.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['mountain'],
    subregions: ['Mt. Diablo', 'Mt. Tamalpais'],
    stats: { hp: 55, maxHp: 55, attack: 50, defense: 30, speed: 35 },
    isFantasy: true,
    sprite: '🔥',
    color: '#ef4444',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Lava Tongue', power: 45, type: 'attack', description: 'Tongue of living lava lashes out' },
      { name: 'Ash Cloud', power: 0, type: 'defend', description: 'Cloaks in volcanic ash' },
      { name: 'Eruption', power: 55, type: 'special', description: 'Unleashes stored geothermal energy' },
    ],
  },
  {
    id: 'tide-phantom',
    name: 'Tide Phantom',
    scientificName: 'Spectralus marinus',
    description: 'A ghostly jellyfish-like creature that appears when the tides shift. Bioluminescent and hypnotic.',
    lore: 'Fishermen off Half Moon Bay sometimes haul up nets filled not with fish but with faintly glowing water that evaporates before it hits the deck. The Tide Phantom exists at the boundary between liquid and light, pulsing with bioluminescent patterns that mirror the phases of the moon. Divers who have encountered one report a deep sense of calm followed by hours of lost time.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['water', 'beach'],
    subregions: ['Half Moon Bay', 'Pacifica', 'North Beach / Fishermans Wharf'],
    stats: { hp: 40, maxHp: 40, attack: 35, defense: 45, speed: 30 },
    isFantasy: true,
    sprite: '👻',
    color: '#22d3ee',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Tidal Pull', power: 35, type: 'special', description: 'Drags foe with invisible current' },
      { name: 'Phase Shift', power: 0, type: 'defend', description: 'Becomes intangible' },
      { name: 'Bio Shock', power: 40, type: 'attack', description: 'Zaps with bioluminescent charge' },
    ],
  },
  {
    id: 'redwood-guardian',
    name: 'Redwood Guardian',
    scientificName: 'Sequoia animatus',
    description: 'An ancient tree spirit that protects Muir Woods. It moves slowly but is nearly indestructible.',
    lore: 'Park rangers at Muir Woods have long noticed that certain ancient redwoods never fall, even in the fiercest storms. The Redwood Guardian is the reason — a spirit as old as the grove itself, fused with the heartwood of a two-thousand-year-old tree. It stirs only at night, rearranging fallen branches and sealing wounds in the bark of its kin with sap that glows faintly green.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['redwood'],
    subregions: ['Muir Woods', 'Redwood Regional Park', 'Purisima Creek Redwoods'],
    stats: { hp: 100, maxHp: 100, attack: 40, defense: 60, speed: 10 },
    isFantasy: true,
    sprite: '🌲',
    color: '#166534',
    activeTime: ['night'],
    moves: [
      { name: 'Root Crush', power: 50, type: 'attack', description: 'Massive roots erupt from below' },
      { name: 'Bark Armor', power: 0, type: 'defend', description: 'Thickens bark to absorb damage' },
      { name: 'Ancient Growth', power: 30, type: 'special', description: 'Heals by drawing from the earth' },
    ],
  },
  {
    id: 'bay-wisp',
    name: 'Bay Wisp',
    scientificName: 'Ignis bayensis',
    description: 'Tiny orbs of light that dance over the Bay at twilight. Hard to catch, harder to keep.',
    lore: 'On still evenings when the Bay turns to glass, clusters of warm golden light drift above the water near Richardson Bay and the Don Edwards marshes. Bay Wisps are thought to be fragments of old lighthouse beams that gained sentience, endlessly searching for ships to guide. They scatter when approached but reassemble moments later in a different pattern, as if communicating in a language of light.',
    type: 'mystic',
    rarity: 'uncommon',
    biomes: ['water', 'marsh', 'beach'],
    subregions: ['Don Edwards Wildlife Refuge', 'Richardson Bay', 'The Presidio', 'Baylands Nature Preserve'],
    stats: { hp: 22, maxHp: 22, attack: 28, defense: 12, speed: 60 },
    isFantasy: true,
    sprite: '✨',
    color: '#fbbf24',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Spark Dash', power: 25, type: 'attack', description: 'Zips through the foe like lightning' },
      { name: 'Flicker', power: 0, type: 'defend', description: 'Blinks in and out of existence' },
      { name: 'Will-o-Wisp', power: 30, type: 'special', description: 'Lures the foe into confusion' },
    ],
  },
  // === NEW SPECIES ===
  {
    id: 'raccoon',
    name: 'Raccoon',
    scientificName: 'Procyon lotor',
    description: 'A clever masked bandit that thrives in Bay Area parks and neighborhoods. Surprisingly dexterous paws.',
    lore: 'Bay Area raccoons are notoriously bold, raiding compost bins in Berkeley and breaking into parked cars in Golden Gate Park. Their nimble front paws have as many nerve endings as human fingertips, letting them unlock latches and unscrew jar lids. San Francisco animal control receives more raccoon calls than any other urban wildlife species.',
    type: 'beast',
    rarity: 'common',
    biomes: ['urban', 'forest'],
    subregions: ['Golden Gate Park', 'Downtown Oakland', 'Berkeley', 'Financial District'],
    stats: { hp: 38, maxHp: 38, attack: 25, defense: 22, speed: 32 },
    isFantasy: false,
    sprite: '🦝',
    color: '#78716c',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Trash Toss', power: 22, type: 'attack', description: 'Hurls found objects at the foe' },
      { name: 'Play Dead', power: 0, type: 'defend', description: 'Pretends to be unconscious' },
      { name: 'Night Eyes', power: 18, type: 'special', description: 'Dazzles with reflective eyes' },
    ],
  },
  {
    id: 'black-tailed-deer',
    name: 'Black-tailed Deer',
    scientificName: 'Odocoileus hemionus columbianus',
    description: 'Graceful deer that browse through the hills at dawn and dusk. Common on Bay Area trails.',
    lore: 'Black-tailed deer are a subspecies of mule deer unique to the Pacific Coast. In the Bay Area, they have adapted remarkably to suburban life, browsing on roses in Marin backyards and crossing Highway 280 via wildlife underpasses. During the fall rut, bucks spar on the hillsides of Mt. Tamalpais, their antler clashes audible from the trails below.',
    type: 'beast',
    rarity: 'common',
    biomes: ['forest', 'grassland', 'redwood'],
    subregions: ['Mt. Tamalpais', 'Tilden Regional Park', 'Purisima Creek Redwoods', 'Rancho San Antonio'],
    stats: { hp: 50, maxHp: 50, attack: 20, defense: 28, speed: 42 },
    isFantasy: false,
    sprite: '🦌',
    color: '#92400e',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Antler Charge', power: 30, type: 'attack', description: 'Lowers head and charges' },
      { name: 'Fleet Foot', power: 0, type: 'defend', description: 'Bounds away with incredible speed' },
      { name: 'Warning Stomp', power: 18, type: 'special', description: 'Stomps hoof to alert and intimidate' },
    ],
  },
  {
    id: 'brown-pelican',
    name: 'Brown Pelican',
    scientificName: 'Pelecanus occidentalis',
    description: 'Dives headfirst from great heights to scoop fish. A Bay Area comeback story after DDT recovery.',
    lore: 'Brown pelicans were nearly wiped out by DDT in the 1970s but have made a remarkable comeback along the California coast. They plunge-dive from heights of 60 feet, folding their wings and hitting the water at 40 mph. Watch them glide in formation just inches above the waves at Half Moon Bay — they use ground effect to fly with almost no effort.',
    type: 'bird',
    rarity: 'common',
    biomes: ['beach', 'water'],
    subregions: ['Half Moon Bay', 'North Beach / Fishermans Wharf', 'Sausalito', 'Pacifica'],
    stats: { hp: 44, maxHp: 44, attack: 32, defense: 22, speed: 28 },
    isFantasy: false,
    sprite: '🐦',
    color: '#a16207',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Plunge Dive', power: 35, type: 'attack', description: 'Crashes down from the sky' },
      { name: 'Pouch Scoop', power: 20, type: 'special', description: 'Scoops up with expandable pouch' },
      { name: 'Glide', power: 0, type: 'defend', description: 'Soars on thermals to evade' },
    ],
  },
  {
    id: 'gopher-snake',
    name: 'Gopher Snake',
    scientificName: 'Pituophis catenifer',
    description: 'A large non-venomous snake that mimics rattlesnakes when threatened. Masters of bluffing.',
    lore: 'Gopher snakes are the longest snakes in the Bay Area, reaching up to seven feet. When threatened, they flatten their heads, hiss loudly, and vibrate their tails in dry leaves to mimic a rattlesnake — a bluff so convincing that many are killed by hikers who mistake them for the real thing. They are invaluable rodent controllers on the grasslands of Mt. Diablo and Rancho San Antonio.',
    type: 'reptile',
    rarity: 'uncommon',
    biomes: ['grassland', 'mountain'],
    subregions: ['Mt. Diablo', 'Rancho San Antonio', 'Oakland Hills'],
    stats: { hp: 42, maxHp: 42, attack: 30, defense: 32, speed: 20 },
    isFantasy: false,
    sprite: '🐍',
    color: '#ca8a04',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Constrict', power: 30, type: 'attack', description: 'Wraps around and squeezes' },
      { name: 'Rattle Bluff', power: 25, type: 'special', description: 'Mimics a rattlesnake to terrify' },
      { name: 'Burrow', power: 0, type: 'defend', description: 'Slips underground to hide' },
    ],
  },
  {
    id: 'river-otter',
    name: 'River Otter',
    scientificName: 'Lontra canadensis',
    description: 'Playful and sleek, otters have returned to Bay Area waterways after decades of absence.',
    lore: 'River otters were extirpated from the Bay Area by the early 1900s due to fur trapping and pollution. They began returning naturally around 2012, and sightings at Richardson Bay and along Corte Madera Creek have become a beloved local event. They eat up to 15% of their body weight daily and are often spotted sliding down muddy banks purely for fun.',
    type: 'marine',
    rarity: 'uncommon',
    biomes: ['marsh', 'water'],
    subregions: ['Richardson Bay', 'Don Edwards Wildlife Refuge', 'Baylands Nature Preserve'],
    stats: { hp: 40, maxHp: 40, attack: 28, defense: 25, speed: 44 },
    isFantasy: false,
    sprite: '🦦',
    color: '#78350f',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Aqua Tackle', power: 28, type: 'attack', description: 'Launches from the water at speed' },
      { name: 'Belly Slide', power: 0, type: 'defend', description: 'Slides away on its belly' },
      { name: 'Fish Slap', power: 22, type: 'special', description: 'Whacks foe with a caught fish' },
    ],
  },
  {
    id: 'scrub-jay',
    name: 'California Scrub-Jay',
    scientificName: 'Aphelocoma californica',
    description: 'Bold and intelligent, these blue jays remember thousands of acorn hiding spots.',
    lore: 'California scrub-jays are among the most intelligent birds in the world, capable of planning for the future and remembering the locations of thousands of cached acorns. They are also known to re-hide food if they notice another jay watching them. In Bay Area neighborhoods, they serve as a noisy alarm system, mobbing hawks, cats, and snakes with loud scolding calls that alert every animal in earshot.',
    type: 'bird',
    rarity: 'common',
    biomes: ['urban', 'forest', 'grassland'],
    subregions: ['Berkeley', 'Palo Alto / Menlo Park', 'San Jose', 'Oakland Hills', 'Twin Peaks'],
    stats: { hp: 28, maxHp: 28, attack: 24, defense: 16, speed: 40 },
    isFantasy: false,
    sprite: '🐦',
    color: '#2563eb',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Acorn Barrage', power: 22, type: 'attack', description: 'Pelts foe with cached acorns' },
      { name: 'Mimic Call', power: 20, type: 'special', description: 'Copies a hawk cry to scare' },
      { name: 'Quick Hop', power: 0, type: 'defend', description: 'Hops rapidly to dodge' },
    ],
  },
  {
    id: 'bobcat',
    name: 'Bobcat',
    scientificName: 'Lynx rufus',
    description: 'A stealthy predator prowling the wild edges of the Bay Area. Rarely seen, always watching.',
    lore: 'Bobcats are the Bay Area\'s most elusive large predator, rarely seen despite being present in nearly every regional park. They are solitary ambush hunters capable of taking down prey several times their size, including young deer. The famous "Bobcat Trail" in the Marin Headlands is named for the frequent sightings along its ridge, where bobcats hunt rabbits in the coastal scrub at dusk.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['forest', 'mountain', 'grassland'],
    subregions: ['Mt. Tamalpais', 'Marin Headlands', 'Rancho San Antonio', 'Mt. Diablo'],
    stats: { hp: 52, maxHp: 52, attack: 45, defense: 30, speed: 48 },
    isFantasy: false,
    sprite: '🐈',
    color: '#b45309',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Ambush Pounce', power: 45, type: 'attack', description: 'Leaps from hiding with deadly aim' },
      { name: 'Shadow Stalk', power: 0, type: 'defend', description: 'Melts into the underbrush' },
      { name: 'Feral Snarl', power: 30, type: 'special', description: 'A terrifying growl that weakens resolve' },
    ],
  },
  {
    id: 'silicon-sprite',
    name: 'Silicon Sprite',
    scientificName: 'Spiritus siliconis',
    description: 'A crackling spirit born from the collective energy of Silicon Valley. Feeds on Wi-Fi signals.',
    lore: 'The Silicon Sprite emerged spontaneously from a server farm in Palo Alto during the dot-com boom and has been growing stronger with each generation of wireless technology. It feeds on stray electromagnetic radiation, growing brighter near dense Wi-Fi networks and dimming in dead zones. Engineers at major tech campuses report unexplained power surges and phantom keystrokes that they privately attribute to the Sprite passing through.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['urban'],
    subregions: ['Palo Alto / Menlo Park', 'San Jose', 'Fremont / Union City'],
    stats: { hp: 35, maxHp: 35, attack: 42, defense: 20, speed: 55 },
    isFantasy: true,
    sprite: '⚡',
    color: '#06b6d4',
    activeTime: ['day', 'night'],
    moves: [
      { name: 'Data Surge', power: 40, type: 'attack', description: 'Blasts with concentrated data streams' },
      { name: 'Firewall', power: 0, type: 'defend', description: 'Erects a digital barrier' },
      { name: 'Blue Screen', power: 35, type: 'special', description: 'Crashes the opponents systems' },
    ],
  },
  {
    id: 'golden-eagle',
    name: 'Golden Eagle',
    scientificName: 'Aquila chrysaetos',
    description: 'The king of Bay Area skies. Nests on remote cliff faces and hunts with devastating speed.',
    lore: 'Golden eagles are the apex aerial predator of the Bay Area, with a wingspan of over seven feet and dive speeds exceeding 150 mph. Mt. Diablo hosts one of the densest nesting populations in the state, with pairs returning to the same cliff ledge for decades. They prey on ground squirrels, jackrabbits, and even young coyotes, making them one of the few animals that keep coyote populations in check.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['mountain', 'grassland'],
    subregions: ['Mt. Diablo', 'Mt. Tamalpais', 'Marin Headlands'],
    stats: { hp: 55, maxHp: 55, attack: 50, defense: 28, speed: 48 },
    isFantasy: false,
    sprite: '🦅',
    color: '#b45309',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Talon Strike', power: 48, type: 'attack', description: 'Raking talons at terminal velocity' },
      { name: 'Soar', power: 0, type: 'defend', description: 'Rises beyond reach' },
      { name: 'Golden Scream', power: 35, type: 'special', description: 'An ear-splitting battle cry' },
    ],
  },
  {
    id: 'mission-phantom',
    name: 'Mission Phantom',
    scientificName: 'Spectralus missionis',
    description: 'The ghost of old San Francisco, haunting the alleys of the Mission District. Appears only at midnight.',
    lore: 'The Mission Phantom is said to be the restless spirit of the city itself — not any single person, but the collective memory of every San Franciscan who ever walked these streets. It manifests as a flickering silhouette in the alleys between Valencia and Mission, trailing the scent of sourdough and salt air. Those who hear its bell say it sounds like the old Mission Dolores bells, tolling for a city that no longer exists.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['urban'],
    subregions: ['SoMa / Mission District', 'Financial District'],
    stats: { hp: 80, maxHp: 80, attack: 55, defense: 50, speed: 40 },
    isFantasy: true,
    sprite: '👻',
    color: '#a855f7',
    activeTime: ['night'],
    moves: [
      { name: 'Phantom Toll', power: 50, type: 'attack', description: 'Exacts a spiritual toll on the living' },
      { name: 'Vanish', power: 0, type: 'defend', description: 'Fades into the fog completely' },
      { name: 'Mission Bell', power: 45, type: 'special', description: 'Tolls a ghostly bell that echoes through time' },
    ],
  },

  // === EVOLVED FORMS ===
  {
    id: 'painted-lady-swarm',
    name: 'Painted Lady Swarm',
    scientificName: 'Vanessa cardui collective',
    description: 'A whirlwind of thousands of painted lady butterflies moving as a single coordinated organism.',
    lore: 'Every few years, billions of painted ladies sweep through California in a "super bloom" migration — the largest insect migration in North America. In the Bay Area, residents have reported skies darkening with their sheer numbers. This swarm has achieved a hive-like coordination, each butterfly a cell in a larger living body that thinks, hunts, and defends as one.',
    type: 'insect',
    rarity: 'rare',
    biomes: ['forest', 'grassland', 'beach'],
    subregions: ['Golden Gate Park', 'Half Moon Bay', 'The Presidio', 'Muir Beach'],
    stats: { hp: 38, maxHp: 38, attack: 30, defense: 22, speed: 55 },
    isFantasy: false,
    sprite: '🦋',
    color: '#dc2626',
    activeTime: ['day', 'dusk'],
    moves: [
      { name: 'Swarm Strike', power: 35, type: 'attack', description: 'Thousands of wings batter the foe' },
      { name: 'Pollen Cloud', power: 0, type: 'defend', description: 'A blinding cloud of scales and pollen' },
      { name: 'Migration Wind', power: 30, type: 'special', description: 'The swarm generates a powerful gust' },
    ],
  },
  {
    id: 'tule-elk',
    name: 'Tule Elk',
    scientificName: 'Cervus canadensis nannodes',
    description: 'The majestic Tule elk, once nearly extinct, now thrives at Point Reyes. Massive antlers crown its head.',
    lore: 'Tule elk are found only in California and were hunted to near-extinction by 1874, when a single breeding pair was discovered hiding in the tule marshes of the Central Valley. Today, the herd at Point Reyes National Seashore numbers over 600 — a conservation triumph. During the fall rut, bull elk bugle across the coastal hills, a haunting sound that carries for miles.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['grassland', 'marsh'],
    subregions: ['Marin Headlands', 'Rancho San Antonio', 'Mt. Tamalpais'],
    stats: { hp: 70, maxHp: 70, attack: 42, defense: 40, speed: 35 },
    isFantasy: false,
    sprite: '🦌',
    color: '#78350f',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Antler Sweep', power: 42, type: 'attack', description: 'Swings massive antlers in a wide arc' },
      { name: 'Iron Hide', power: 0, type: 'defend', description: 'Thick hide absorbs the blow' },
      { name: 'Bugle Call', power: 30, type: 'special', description: 'A haunting call that shakes resolve' },
    ],
  },
  {
    id: 'sandhill-crane',
    name: 'Sandhill Crane',
    scientificName: 'Antigone canadensis',
    description: 'A tall, elegant crane with a vivid red crown. Their rattling calls echo across the winter marshes.',
    lore: 'Sandhill cranes are among the oldest living bird species, with fossils dating back 2.5 million years. Each winter, flocks settle in the wetlands around the South Bay, their prehistoric "garoo-a-a-a" calls a living link to the Pleistocene. Their elaborate courtship dances — leaping, bowing, and tossing sticks — are one of nature\'s great spectacles.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['marsh', 'grassland', 'water'],
    subregions: ['Don Edwards Wildlife Refuge', 'Baylands Nature Preserve', 'Richardson Bay'],
    stats: { hp: 55, maxHp: 55, attack: 45, defense: 30, speed: 38 },
    isFantasy: false,
    sprite: '🪿',
    color: '#9ca3af',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Crane Dance', power: 30, type: 'special', description: 'A dizzying ritual dance confuses the foe' },
      { name: 'Spear Thrust', power: 42, type: 'attack', description: 'Drives long beak like a lance' },
      { name: 'Sky Trumpet', power: 0, type: 'defend', description: 'Deafening call stuns attackers' },
    ],
  },
  {
    id: 'california-condor',
    name: 'California Condor',
    scientificName: 'Gymnogyps californianus',
    description: 'The largest flying bird in North America with a 9.5-foot wingspan. A living dinosaur of the skies.',
    lore: 'The California condor was reduced to just 22 birds in 1987 before a desperate captive breeding program pulled them back from the brink. With a wingspan of nearly ten feet, they are the largest flying land bird in the Western Hemisphere. They can soar for hours without flapping, riding thermals to altitudes of 15,000 feet. Reintroduction efforts have brought them back to the Big Sur coast, tantalizingly close to the Bay Area.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['mountain', 'grassland'],
    subregions: ['Mt. Diablo', 'Mt. Tamalpais', 'Marin Headlands'],
    stats: { hp: 65, maxHp: 65, attack: 48, defense: 35, speed: 30 },
    isFantasy: false,
    sprite: '🦅',
    color: '#1c1917',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Shadow Wing', power: 45, type: 'attack', description: 'Blots out the sun with massive wings' },
      { name: 'Thermal Ascent', power: 0, type: 'defend', description: 'Soars beyond all reach' },
      { name: 'Carrion Feast', power: 35, type: 'special', description: 'Drains vitality from weakened foes' },
    ],
  },
  {
    id: 'ancient-gastropod',
    name: 'Ancient Gastropod',
    scientificName: 'Ariolimax primordius',
    description: 'A colossal slug infused with centuries of redwood forest energy. Its shell-like hide is bark-tough.',
    lore: 'Deep in the oldest groves of Muir Woods, where the redwood duff is three feet thick and the canopy blocks all sunlight, something enormous leaves trails of luminescent slime. The Ancient Gastropod is believed to be a banana slug that has fed on nothing but ancient redwood matter for so long that it has absorbed the tree\'s longevity. Park rangers find its trails but never the creature itself — it moves only on the darkest, wettest nights.',
    type: 'beast',
    rarity: 'uncommon',
    biomes: ['redwood', 'forest'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Redwood Regional Park'],
    stats: { hp: 75, maxHp: 75, attack: 25, defense: 65, speed: 8 },
    isFantasy: false,
    sprite: '🐌',
    color: '#a16207',
    activeTime: ['night', 'dusk'],
    moves: [
      { name: 'Primordial Ooze', power: 30, type: 'attack', description: 'Engulfs foe in ancient slime' },
      { name: 'Bark Shell', power: 0, type: 'defend', description: 'Hardens outer layer like redwood bark' },
      { name: 'Acid Wave', power: 35, type: 'special', description: 'A wave of caustic mucus corrodes defenses' },
    ],
  },
  {
    id: 'mountain-lion',
    name: 'Mountain Lion',
    scientificName: 'Puma concolor',
    description: 'The apex predator of the Bay Area hills. Silent, powerful, and nearly invisible until it strikes.',
    lore: 'An estimated 30-50 mountain lions live in the hills surrounding the Bay Area, yet most residents never see one. They are ambush predators capable of leaping 40 feet horizontally and 15 feet vertically. The famous "Peninsula puma" P-35 was tracked roaming from Pacifica to Palo Alto, crossing Highway 280 at night. Trail cameras in the Santa Cruz Mountains regularly capture their ghostly nighttime patrols.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['mountain', 'forest', 'grassland'],
    subregions: ['Mt. Tamalpais', 'Mt. Diablo', 'Rancho San Antonio', 'Oakland Hills'],
    stats: { hp: 65, maxHp: 65, attack: 55, defense: 35, speed: 50 },
    isFantasy: false,
    sprite: '🐆',
    color: '#b45309',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Silent Stalk', power: 50, type: 'attack', description: 'Strikes from complete concealment' },
      { name: 'Killing Bite', power: 55, type: 'special', description: 'A precise bite to the back of the neck' },
      { name: 'Canyon Fade', power: 0, type: 'defend', description: 'Vanishes into the terrain like a ghost' },
    ],
  },
  {
    id: 'giant-salamander',
    name: 'Giant Salamander',
    scientificName: 'Dicamptodon ensatus',
    description: 'A massive, ancient salamander lurking in deep forest pools. Its toxic skin glows faintly at night.',
    lore: 'The Pacific giant salamander is the largest terrestrial salamander in North America and the only one that can vocalize — producing a low, dog-like bark when disturbed. In the deep pools of Bay Area redwood creeks, specimens over a foot long have been found, their mottled brown skin making them nearly invisible against the streambed. Unlike most salamanders, they are aggressive predators that eat mice, snakes, and even other salamanders.',
    type: 'amphibian',
    rarity: 'rare',
    biomes: ['forest', 'redwood', 'marsh'],
    subregions: ['Muir Woods', 'Redwood Regional Park', 'Tilden Regional Park'],
    stats: { hp: 60, maxHp: 60, attack: 35, defense: 55, speed: 18 },
    isFantasy: false,
    sprite: '🦎',
    color: '#7c2d12',
    activeTime: ['night', 'dawn'],
    moves: [
      { name: 'Toxic Flood', power: 38, type: 'attack', description: 'Releases a wave of concentrated toxin' },
      { name: 'Regenerate', power: 0, type: 'defend', description: 'Rapidly regrows damaged tissue' },
      { name: 'Ancient Bark', power: 30, type: 'special', description: 'A prehistoric vocalization that stuns' },
    ],
  },
  {
    id: 'sea-lion',
    name: 'California Sea Lion',
    scientificName: 'Zalophus californianus',
    description: 'The boisterous, barking pinnipeds of Pier 39. Powerful swimmers and fearless performers.',
    lore: 'California sea lions famously took over the docks at Pier 39 in January 1990, and the Marina has embraced them ever since. Males can weigh over 800 pounds and dive to depths of 900 feet. They are the fastest pinnipeds, swimming at bursts of 25 mph. During breeding season, dominant bulls defend harems of up to 15 females with thunderous barking that can be heard blocks away.',
    type: 'marine',
    rarity: 'rare',
    biomes: ['beach', 'water'],
    subregions: ['North Beach / Fishermans Wharf', 'Half Moon Bay', 'Sausalito'],
    stats: { hp: 62, maxHp: 62, attack: 40, defense: 38, speed: 35 },
    isFantasy: false,
    sprite: '🦭',
    color: '#44403c',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Thunderous Bark', power: 35, type: 'special', description: 'A deafening roar that rattles bones' },
      { name: 'Torpedo Dive', power: 42, type: 'attack', description: 'Rockets through water at top speed' },
      { name: 'Colony Call', power: 0, type: 'defend', description: 'Summons the colony to intimidate' },
    ],
  },
  {
    id: 'southern-sea-otter',
    name: 'Southern Sea Otter',
    scientificName: 'Enhydra lutris nereis',
    description: 'A charismatic marine mammal that floats belly-up in kelp beds, cracking open shellfish with favorite stones.',
    lore: 'Southern sea otters were hunted nearly to extinction for their pelts — by 1938 only about 50 remained along the California coast. Today the population has rebounded to roughly 3,000, largely centered around Monterey Bay. They are a keystone species: by eating sea urchins they protect kelp forests from being grazed to the seafloor. At Natural Bridges and the Santa Cruz wharf you can spot them wrapping themselves in kelp fronds to keep from drifting while they nap.',
    type: 'marine',
    rarity: 'rare',
    biomes: ['water', 'kelp_forest', 'rocky_beach'],
    subregions: ['Monterey Bay', 'Monterey Bay Kelp Forest', 'Santa Cruz Beach Boardwalk'],
    stats: { hp: 58, maxHp: 58, attack: 32, defense: 42, speed: 30 },
    isFantasy: false,
    sprite: '🦦',
    color: '#78350f',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Rock Smash', power: 38, type: 'attack', description: 'Cracks open shells with a favorite stone' },
      { name: 'Kelp Wrap', power: 0, type: 'defend', description: 'Bundles in kelp to anchor and rest' },
      { name: 'Dive & Retrieve', power: 28, type: 'special', description: 'Plunges to the seafloor and surfaces with a weapon' },
    ],
  },

  // ==========================================
  // ALCATRAZ ISLAND EXCLUSIVE CREATURES
  // ==========================================
  {
    id: 'phantom-crab',
    name: 'Phantom Crab',
    scientificName: 'Cancer spectris',
    description: 'A translucent crab that scuttles through Alcatraz tide pools, phasing through rock when startled.',
    lore: 'First documented by a night watchman in 1934, the Phantom Crab was dismissed as a trick of the lighthouse beam. But guards kept finding claw marks inside locked cells. Marine biologists now believe a colony of these semi-corporeal crustaceans has inhabited the island since before the prison was built, using tidal caves beneath the cellblock as nurseries. Their shells shimmer between visible and invisible depending on the phase of the moon.',
    type: 'marine',
    rarity: 'uncommon',
    biomes: ['urban'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 38, maxHp: 38, attack: 32, defense: 42, speed: 28 },
    isFantasy: true,
    sprite: '🦀',
    color: '#a78bfa',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Phase Claw', power: 35, type: 'attack', description: 'Claws that pass through defenses' },
      { name: 'Spectral Shell', power: 0, type: 'defend', description: 'Turns partially invisible' },
      { name: 'Tide Haunt', power: 25, type: 'special', description: 'Summons ghostly tidewater' },
    ],
  },
  {
    id: 'cell-block-specter',
    name: 'Cell Block Specter',
    scientificName: 'Umbra carceris',
    description: 'A shadowy figure that drifts through the abandoned cellblocks of Alcatraz, rattling phantom chains.',
    lore: 'Rangers have reported cold spots in D-Block since the 1970s, decades after the last prisoner left. The Cell Block Specter is believed to be a psychic imprint left by the collective misery of Alcatraz inmates — not a ghost of any one person, but the distilled essence of confinement itself. It manifests as a dark silhouette with faintly glowing eyes, and the sound of dragging chains follows it through the corridors. Brave visitors sometimes find their watches stopped after an encounter.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['urban'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 55, maxHp: 55, attack: 48, defense: 30, speed: 40 },
    isFantasy: true,
    sprite: '👻',
    color: '#6366f1',
    activeTime: ['night'],
    moves: [
      { name: 'Chain Rattle', power: 42, type: 'attack', description: 'Phantom chains lash out from the shadows' },
      { name: 'Solitary', power: 0, type: 'defend', description: 'Retreats into the isolation of D-Block' },
      { name: 'Cold Spot', power: 38, type: 'special', description: 'Drains warmth from the surrounding area' },
    ],
  },
  {
    id: 'alcatraz-night-heron',
    name: 'Alcatraz Night Heron',
    scientificName: 'Nycticorax alcatrazensis',
    description: 'A black-crowned night heron adapted to Alcatraz, with eerily luminous eyes and silent wingbeats.',
    lore: 'The night herons of Alcatraz are a well-known real colony — one of the largest on the West Coast, nesting in the old parade ground gardens. But this subspecies is different. Decades of roosting in the abandoned prison have changed them. Their eyes reflect light like no other heron, and they hunt in perfect silence. Fishermen swear they\'ve seen one pluck a fish from the Bay without making a single ripple. The rangers call them the Wardens.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['urban'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 44, maxHp: 44, attack: 38, defense: 25, speed: 36 },
    isFantasy: false,
    sprite: '🦉',
    color: '#1e293b',
    activeTime: ['dusk', 'night', 'dawn'],
    moves: [
      { name: 'Silent Strike', power: 38, type: 'attack', description: 'Attacks without a sound' },
      { name: 'Warden\'s Gaze', power: 0, type: 'defend', description: 'Piercing stare that freezes prey' },
      { name: 'Shadow Wing', power: 30, type: 'special', description: 'Cloaks in darkness between wingbeats' },
    ],
  },
  {
    id: 'rock-wraith',
    name: 'Rock Wraith',
    scientificName: 'Petraspirans insularis',
    description: 'A creature of living stone and sea spray that guards the rocky shores of Alcatraz.',
    lore: 'The Rock Wraith emerged when the restless energy of Alcatraz fused with the island\'s ancient sandstone. It moves like a shifting pile of rubble, blending perfectly with the crumbling prison walls. Only its eyes — two points of cold blue light — give it away. Old escape plans drawn by inmates contain sketches of something watching from the rocks, suggesting the Wraith predates the federal prison. Some say it was the island\'s original warden.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['urban'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 65, maxHp: 65, attack: 42, defense: 55, speed: 18 },
    isFantasy: true,
    sprite: '🗿',
    color: '#78716c',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    moves: [
      { name: 'Stone Crush', power: 48, type: 'attack', description: 'Slams with a fist of prison stone' },
      { name: 'Fortress Wall', power: 0, type: 'defend', description: 'Hardens into impenetrable bedrock' },
      { name: 'Alcatraz Tremor', power: 40, type: 'special', description: 'The whole island seems to shake' },
    ],
  },
  {
    id: 'fog-gull',
    name: 'Fog Gull',
    scientificName: 'Larus nebulosus',
    description: 'A spectral seagull wreathed in perpetual mist, circling the Alcatraz lighthouse at all hours.',
    lore: 'Every lighthouse keeper on Alcatraz logged the same complaint: a single gull that never landed, never ate, and never stopped circling. When the lighthouse was automated in 1963, the Fog Gull kept its vigil. It appears to be made partly of condensed fog, leaving a misty trail as it wheels endlessly around the tower. Photographs of it always come out blurred. It is said to cry out only when someone approaches the island with ill intent.',
    type: 'bird',
    rarity: 'common',
    biomes: ['urban', 'water'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 30, maxHp: 30, attack: 25, defense: 20, speed: 45 },
    isFantasy: true,
    sprite: '🕊',
    color: '#cbd5e1',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    moves: [
      { name: 'Mist Dive', power: 28, type: 'attack', description: 'Dives from the fog at high speed' },
      { name: 'Fog Shroud', power: 0, type: 'defend', description: 'Disappears into a thick fog bank' },
      { name: 'Lighthouse Cry', power: 22, type: 'special', description: 'An eerie wail that echoes across the Bay' },
    ],
  },
  {
    id: 'warden-of-the-rock',
    name: 'Warden of the Rock',
    scientificName: 'Marespectrum alcatraz',
    description: 'A legendary entity of living water and moonlight that rises from the Bay around Alcatraz during king tides.',
    lore: 'The Warden of the Rock is spoken of in the oral traditions of the Ohlone people, who called it "the one who remembers the drowned." It manifests as a towering figure of luminous seawater, visible only when the moon is full and the tides are at their highest. Three escape attempts from Alcatraz ended when prisoners encountered something in the water that turned them back. The official records say "strong currents." The prisoners said something else entirely. Some say it is the island itself, risen to prevent anyone from leaving.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['urban', 'water'],
    subregions: ['Alcatraz Island'],
    stats: { hp: 80, maxHp: 80, attack: 55, defense: 50, speed: 48 },
    isFantasy: true,
    sprite: '🌊',
    color: '#3b82f6',
    activeTime: ['night'],
    moves: [
      { name: 'Riptide', power: 55, type: 'attack', description: 'A crushing wave shaped like a fist' },
      { name: 'Moonlit Aegis', power: 0, type: 'defend', description: 'A shield of reflected moonlight' },
      { name: 'Drowner\'s Memory', power: 48, type: 'special', description: 'The cold memory of every soul lost to the Bay' },
      { name: 'King Tide', power: 65, type: 'attack', description: 'The full force of the Pacific surges through' },
    ],
  },

  // ==========================================
  // ANGEL ISLAND CREATURES
  // ==========================================
  {
    id: 'angel-island-fox',
    name: 'Island Fox',
    scientificName: 'Urocyon insularis angelorum',
    description: 'A small, russet fox found only on Angel Island, adapted to island life over centuries of isolation.',
    lore: 'Angel Island\'s foxes are a unique population isolated from the mainland for so long they\'ve developed distinctly smaller bodies and bolder temperaments. They raid the old military buildings for scraps and have been known to approach hikers without fear. Rangers believe they descend from gray foxes that crossed during a drought thousands of years ago.',
    type: 'beast',
    rarity: 'uncommon',
    biomes: ['forest'],
    subregions: ['Angel Island'],
    stats: { hp: 35, maxHp: 35, attack: 30, defense: 22, speed: 40 },
    isFantasy: false,
    sprite: '🦊',
    color: '#ea580c',
    activeTime: ['dawn', 'dusk'],
    moves: [
      { name: 'Quick Pounce', power: 30, type: 'attack', description: 'A swift ambush from the brush' },
      { name: 'Island Agility', power: 0, type: 'defend', description: 'Darts nimbly between obstacles' },
      { name: 'Bark Echo', power: 22, type: 'special', description: 'A sharp bark that disorients' },
    ],
  },
  {
    id: 'immigration-spirit',
    name: 'Immigration Spirit',
    scientificName: 'Spiritus transitum',
    description: 'A luminous figure that wanders Angel Island\'s old immigration station, echoing the hopes of those who passed through.',
    lore: 'Angel Island served as the "Ellis Island of the West" from 1910 to 1940, processing hundreds of thousands of immigrants. The Immigration Spirit is said to be a collective memory of their hopes and fears, manifesting as a warm golden light that drifts through the old barracks. Poems carved into the wooden walls by detained immigrants sometimes glow faintly when it passes.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['forest'],
    subregions: ['Angel Island'],
    stats: { hp: 50, maxHp: 50, attack: 35, defense: 40, speed: 32 },
    isFantasy: true,
    sprite: '✨',
    color: '#f59e0b',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Hope\'s Light', power: 38, type: 'special', description: 'A warm beam carrying centuries of hope' },
      { name: 'Memory Veil', power: 0, type: 'defend', description: 'Wraps in protective memories of the past' },
      { name: 'Passage Wind', power: 32, type: 'attack', description: 'A gust carrying the weight of a thousand journeys' },
    ],
  },

  // ==========================================
  // TREASURE ISLAND CREATURES
  // ==========================================
  {
    id: 'neon-rat',
    name: 'Neon Rat',
    scientificName: 'Rattus luminosus',
    description: 'A rat infused with the residual energy of Treasure Island\'s old naval radiation, it glows faintly at night.',
    lore: 'Treasure Island was a naval base where radiological decontamination work was performed for decades. The island\'s rat population absorbed trace amounts of something unusual in the soil. Now their fur has a faint bioluminescent shimmer, especially visible at night. They\'re surprisingly docile for rats and seem to navigate by their own glow.',
    type: 'beast',
    rarity: 'common',
    biomes: ['urban'],
    subregions: ['Treasure Island'],
    stats: { hp: 25, maxHp: 25, attack: 22, defense: 18, speed: 38 },
    isFantasy: true,
    sprite: '🐀',
    color: '#10b981',
    activeTime: ['night', 'dusk'],
    moves: [
      { name: 'Glow Bite', power: 24, type: 'attack', description: 'Teeth that gleam with an eerie light' },
      { name: 'Tunnel', power: 0, type: 'defend', description: 'Dives into a crack in the concrete' },
      { name: 'Neon Flash', power: 20, type: 'special', description: 'A blinding pulse of green light' },
    ],
  },
  {
    id: 'expo-golem',
    name: 'Expo Golem',
    scientificName: 'Constructum expositionis',
    description: 'A creature made from the ruins of the 1939 World\'s Fair buildings, animated by forgotten Art Deco magic.',
    lore: 'Treasure Island was built from scratch in the Bay for the 1939 Golden Gate International Exposition. When the fair ended, most structures were demolished — but something remained in the foundations. The Expo Golem assembles itself from Art Deco tiles, rusty rebar, and fragments of murals depicting a utopian future. It moves slowly but is remarkably tough, and its body hums with the optimism of a world that hadn\'t yet seen the war.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['urban'],
    subregions: ['Treasure Island'],
    stats: { hp: 60, maxHp: 60, attack: 40, defense: 52, speed: 15 },
    isFantasy: true,
    sprite: '🏗',
    color: '#d97706',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    moves: [
      { name: 'Deco Slam', power: 45, type: 'attack', description: 'Swings a fist of Art Deco masonry' },
      { name: 'Fair Grounds', power: 0, type: 'defend', description: 'Rebuilds from surrounding rubble' },
      { name: 'Exposition Beam', power: 38, type: 'special', description: 'Fires a ray from a 1939 spotlight' },
    ],
  },
  // === NOCTURNAL CREATURES ===
  {
    id: 'western-screech-owl',
    name: 'Western Screech-Owl',
    scientificName: 'Megascops kennicottii',
    description: 'A small owl with piercing yellow eyes, hunting rodents in the night-darkened parks.',
    lore: 'Western Screech-Owls are year-round Bay Area residents, roosting in tree cavities by day and hunting at night. Their "bouncing ball" call — a series of accelerating hoots — echoes through Golden Gate Park and Presidio after sunset. Despite being only 8 inches tall, they can take prey as large as rats.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['forest', 'urban', 'redwood'],
    subregions: ['Golden Gate Park', 'The Presidio', 'Muir Woods', 'Tilden Regional Park'],
    stats: { hp: 38, maxHp: 38, attack: 36, defense: 22, speed: 40 },
    isFantasy: false,
    sprite: '🦉',
    color: '#8b5e3c',
    activeTime: ['night'],
    moves: [
      { name: 'Silent Swoop', power: 35, type: 'attack', description: 'Dives silently from above' },
      { name: 'Night Vision', power: 0, type: 'defend', description: 'Sees perfectly in darkness' },
      { name: 'Eerie Hoot', power: 22, type: 'special', description: 'A chilling call that startles' },
    ],
  },
  {
    id: 'ghost-moth',
    name: 'Ghost Moth',
    scientificName: 'Hepialus spectris',
    description: 'An ethereal white moth that drifts through fog banks, leaving trails of luminescent dust.',
    lore: 'Ghost Moths appear only in thick Bay Area fog, particularly on moonless nights. Their bioluminescent wing scales evolved to attract mates in zero-visibility conditions. They feed on century-old lichen growing on redwood bark. Catching one is said to bring good luck — or invite the fog to follow you home.',
    type: 'insect',
    rarity: 'rare',
    biomes: ['forest', 'redwood', 'marsh'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Marin Headlands', 'Mt. Tamalpais'],
    stats: { hp: 28, maxHp: 28, attack: 20, defense: 18, speed: 50 },
    isFantasy: true,
    sprite: '🦋',
    color: '#e2e8f0',
    activeTime: ['night'],
    moves: [
      { name: 'Moon Dust', power: 28, type: 'special', description: 'Showers blinding luminescent scales' },
      { name: 'Fog Fade', power: 0, type: 'defend', description: 'Vanishes into the mist' },
      { name: 'Phantom Wing', power: 20, type: 'attack', description: 'Phases through and strikes' },
    ],
  },
  {
    id: 'midnight-coyote',
    name: 'Midnight Coyote',
    scientificName: 'Canis latrans noctis',
    description: 'A shadow-furred coyote that prowls city streets after midnight, howling at the fog.',
    lore: 'The Midnight Coyote is a melanistic variant that thrives in urban darkness. They navigate by scent through the city\'s alleyways and rooftops, feeding on rats and raccoons. Their eerie howls at 3 AM have spawned countless SF ghost stories. Park rangers believe only a handful exist in the entire Bay Area.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['urban', 'grassland', 'forest'],
    subregions: ['The Presidio', 'Golden Gate Park', 'Oakland Hills', 'Marin Headlands'],
    stats: { hp: 50, maxHp: 50, attack: 42, defense: 30, speed: 45 },
    isFantasy: false,
    sprite: '🐺',
    color: '#1e293b',
    activeTime: ['night'],
    moves: [
      { name: 'Shadow Bite', power: 40, type: 'attack', description: 'Strikes from total darkness' },
      { name: 'Howl', power: 0, type: 'defend', description: 'Rallies courage and raises defense' },
      { name: 'Midnight Rush', power: 30, type: 'attack', description: 'A blur of dark fur and fangs' },
    ],
  },
  {
    id: 'bay-firefly',
    name: 'Bay Firefly',
    scientificName: 'Photinus pacificus',
    description: 'A bioluminescent beetle found in Bay Area wetlands — one of the few firefly species on the West Coast.',
    lore: 'For decades scientists believed there were no fireflies west of the Rockies. Then hikers in the East Bay hills started reporting flickering green lights in summer marshes. Bay Fireflies use a unique flashing pattern — three quick pulses followed by a long glow — found nowhere else in the world.',
    type: 'insect',
    rarity: 'uncommon',
    biomes: ['marsh', 'grassland', 'forest'],
    subregions: ['Don Edwards Wildlife Refuge', 'Alviso Marsh', 'Coyote Hills', 'Tilden Regional Park'],
    stats: { hp: 22, maxHp: 22, attack: 18, defense: 15, speed: 38 },
    isFantasy: false,
    sprite: '🪲',
    color: '#84cc16',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Flash Burst', power: 22, type: 'special', description: 'Blinding flash of bioluminescence' },
      { name: 'Glow Trail', power: 0, type: 'defend', description: 'Leaves afterimages to confuse' },
      { name: 'Spark Tackle', power: 18, type: 'attack', description: 'Charges with electric glow' },
    ],
  },
  {
    id: 'karl-fog-serpent',
    name: 'Karl the Fog Serpent',
    scientificName: 'Nebulophidius karlii',
    description: 'A vast, translucent serpent that coils through fog banks over the Golden Gate. Named after Karl the Fog.',
    lore: 'Fog Serpents are visible only when the marine layer rolls in at dusk. Fishermen on the Bay have reported seeing massive coils undulating through the fog for over a century. Marine biologists dismiss these as optical illusions caused by fog density variations, but WildCal rangers have documented at least three distinct individuals. The largest, nicknamed "Karl Jr," has been estimated at over 200 feet long.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['water', 'beach'],
    subregions: ['Marin Headlands', 'Baker Beach', 'Ocean Beach', 'Treasure Island'],
    stats: { hp: 85, maxHp: 85, attack: 55, defense: 40, speed: 50 },
    isFantasy: true,
    sprite: '🐍',
    color: '#94a3b8',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Fog Crush', power: 50, type: 'attack', description: 'Constricts with coils of condensed fog' },
      { name: 'Mist Veil', power: 0, type: 'defend', description: 'Becomes invisible in the fog' },
      { name: 'Tidal Surge', power: 42, type: 'special', description: 'Summons a wave from the deep' },
    ],
  },
  {
    id: 'nightjar',
    name: 'Common Poorwill',
    scientificName: 'Phalaenoptilus nuttallii',
    description: 'A cryptic nightbird that sits motionless on trails until flushed, revealing white tail patches.',
    lore: 'The Common Poorwill is the only bird known to hibernate. On cold Bay Area winter nights, they enter torpor, slowing their heartbeat to near-undetectable levels. The Hopi people called them "the sleeping one." You\'ll hear their mournful "poor-will" call on warm summer nights along dry hillside trails.',
    type: 'bird',
    rarity: 'common',
    biomes: ['grassland', 'mountain'],
    subregions: ['Mt. Diablo', 'Mt. Tamalpais', 'Oakland Hills', 'Marin Headlands'],
    stats: { hp: 30, maxHp: 30, attack: 25, defense: 20, speed: 35 },
    isFantasy: false,
    sprite: '🐦',
    color: '#78716c',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Night Dive', power: 25, type: 'attack', description: 'Swoops from the darkness' },
      { name: 'Torpor', power: 0, type: 'defend', description: 'Enters suspended animation' },
      { name: 'Echocall', power: 18, type: 'special', description: 'A haunting cry in the darkness' },
    ],
  },

  // === LANDMARK-EXCLUSIVE CREATURES ===
  {
    id: 'wharf-pelican',
    name: 'Wharf Pelican',
    scientificName: 'Pelecanus occidentalis wharfius',
    description: 'A massive brown pelican that patrols the docks of Fisherman\'s Wharf, boldly stealing fish from unsuspecting fishermen.',
    lore: 'Brown pelicans were nearly wiped out by DDT in the 1970s but made a remarkable comeback along the California coast. At Fisherman\'s Wharf, they\'ve grown famously brazen — perching on crab pots, swiping bait buckets, and photobombing tourists. Regulars at the wharf have named the boldest ones and swear they recognize individual birds by their scars.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['urban', 'beach'],
    subregions: ['North Beach / Fishermans Wharf'],
    stats: { hp: 42, maxHp: 42, attack: 22, defense: 28, speed: 24 },
    isFantasy: false,
    sprite: '🐦‍⬛',
    color: '#78716c',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Plunge Dive', power: 28, type: 'attack', description: 'Dives beak-first from height into the target' },
      { name: 'Fish Snatch', power: 22, type: 'attack', description: 'Scoops up prey in its enormous throat pouch' },
      { name: 'Pouch Shield', power: 0, type: 'defend', description: 'Puffs out its gullet to absorb blows' },
      { name: 'Dock Intimidate', power: 18, type: 'special', description: 'Spreads wings wide to frighten opponents' },
    ],
  },
  {
    id: 'pyramid-peregrine',
    name: 'Pyramid Peregrine',
    scientificName: 'Falco peregrinus pyramidalis',
    description: 'A peregrine falcon that nests on the spire of the Transamerica Pyramid, diving at speeds over 200 mph.',
    lore: 'Peregrine falcons have nested on San Francisco skyscrapers since the 1990s, with the Transamerica Pyramid being a favored site. The building\'s tapered spire mimics the cliff faces peregrines prefer in the wild. During their hunting stoops, they become the fastest animals on Earth — clocking over 240 mph as they plummet toward pigeons in the Financial District below.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['urban'],
    subregions: ['Financial District'],
    stats: { hp: 28, maxHp: 28, attack: 35, defense: 15, speed: 40 },
    isFantasy: false,
    sprite: '🦅',
    color: '#475569',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Terminal Velocity', power: 40, type: 'attack', description: 'A devastating 200 mph stoop from the pyramid spire' },
      { name: 'Talon Rake', power: 25, type: 'attack', description: 'Slashes with razor-sharp talons at blinding speed' },
      { name: 'Evasive Roll', power: 0, type: 'defend', description: 'Barrel-rolls to dodge incoming attacks' },
      { name: 'Spire Screech', power: 20, type: 'special', description: 'A piercing cry that echoes off downtown glass towers' },
    ],
  },
  {
    id: 'oracle-splash-seal',
    name: 'Oracle Splash Seal',
    scientificName: 'Phoca vitulina oraculus',
    description: 'A hefty harbor seal famous for lounging in McCovey Cove during Giants home games, occasionally catching splash-hit home runs.',
    lore: 'McCovey Cove, the waterway behind Oracle Park\'s right field wall, attracts kayakers and harbor seals alike whenever the Giants play. The seals have become unofficial mascots, popping up to sun themselves on the concrete embankment. Local legend says a seal once nudged a Barry Bonds splash-hit baseball back to a kayaker — though no one got it on camera.',
    type: 'marine',
    rarity: 'uncommon',
    biomes: ['urban', 'water'],
    subregions: ['SoMa / Mission District'],
    stats: { hp: 45, maxHp: 45, attack: 20, defense: 30, speed: 22 },
    isFantasy: false,
    sprite: '🦭',
    color: '#6b7280',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Body Slam', power: 30, type: 'attack', description: 'Hurls its full weight at the opponent' },
      { name: 'Splash Hit', power: 25, type: 'special', description: 'Launches a wall of cove water at the target' },
      { name: 'Blubber Guard', power: 0, type: 'defend', description: 'Thick blubber absorbs incoming damage' },
      { name: 'Bark Volley', power: 18, type: 'attack', description: 'A rapid series of startling barks' },
    ],
  },
  {
    id: 'redwood-sprite',
    name: 'Redwood Sprite',
    scientificName: 'Lucerna sequoiae',
    description: 'A tiny luminous spirit born from ancient redwood sap, flickering between the cathedral-like trunks of Muir Woods.',
    lore: 'Old-growth coast redwoods in Muir Woods are over a thousand years old, and hikers sometimes report seeing faint greenish lights drifting between the trunks at twilight. Naturalists blame bioluminescent fungi, but locals whisper about the Redwood Sprites — beings formed when ancient sap crystallizes with morning dew. The monument was saved from logging in 1908 by William Kent, and some say the sprites appeared the day the axes stopped.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['forest'],
    subregions: ['Muir Woods'],
    stats: { hp: 30, maxHp: 30, attack: 35, defense: 18, speed: 32 },
    isFantasy: true,
    sprite: '🌿',
    color: '#22c55e',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Sap Burst', power: 35, type: 'special', description: 'Fires a concentrated bolt of glowing ancient sap' },
      { name: 'Root Tangle', power: 22, type: 'attack', description: 'Summons roots to ensnare the foe' },
      { name: 'Canopy Veil', power: 0, type: 'defend', description: 'Vanishes into the dappled redwood canopy' },
      { name: 'Photon Pulse', power: 28, type: 'special', description: 'Releases stored sunlight in a blinding flash' },
    ],
  },
  {
    id: 'tam-summit-hawk',
    name: 'Tam Summit Hawk',
    scientificName: 'Buteo lineatus tamalpaisensis',
    description: 'A powerful red-shouldered hawk that rules the thermal updrafts around the summit of Mt. Tamalpais.',
    lore: 'Mt. Tamalpais — "Mt. Tam" to locals — rises 2,571 feet above Mill Valley and generates strong thermal updrafts that raptors ride for effortless soaring. The Tam Summit Hawk is the undisputed king of these thermals, circling the East Peak fire lookout for hours. The mountain\'s name comes from the Coast Miwok "Tamal-Pa" meaning "bay mountain," and the hawk has been a symbol of the peak since long before European settlement.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['mountain'],
    subregions: ['Mt. Tamalpais'],
    stats: { hp: 35, maxHp: 35, attack: 32, defense: 22, speed: 35 },
    isFantasy: false,
    sprite: '🦅',
    color: '#b45309',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Thermal Strike', power: 32, type: 'attack', description: 'Rides an updraft then dives with tremendous force' },
      { name: 'Wing Buffet', power: 20, type: 'attack', description: 'Batters the opponent with powerful wingbeats' },
      { name: 'Summit Guard', power: 0, type: 'defend', description: 'Circles high to avoid ground threats' },
      { name: 'Raptor Cry', power: 25, type: 'special', description: 'A piercing shriek that echoes across the mountain' },
    ],
  },
  {
    id: 'twin-peaks-fogcat',
    name: 'Twin Peaks Fogcat',
    scientificName: 'Felis nebulosa geminus',
    description: 'A ghostly cat-like creature that materializes from the fog rolling over Twin Peaks at dusk and night.',
    lore: 'Twin Peaks, the two adjacent summits near the geographic center of San Francisco, sit directly in the path of the summer fog that pours through the Golden Gate. Residents of the surrounding neighborhoods have long reported glimpsing a translucent feline shape padding silently through the fog banks. It leaves no paw prints and makes no sound — only a faint chill where it passes. Some say it\'s the spirit of the last mountain lion to roam the San Francisco hills.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['urban', 'mountain'],
    subregions: ['Twin Peaks'],
    stats: { hp: 33, maxHp: 33, attack: 30, defense: 20, speed: 38 },
    isFantasy: true,
    sprite: '🐱',
    color: '#a78bfa',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Phantom Pounce', power: 32, type: 'attack', description: 'Leaps from the fog with spectral claws' },
      { name: 'Fog Fade', power: 0, type: 'defend', description: 'Dissolves into mist to avoid all damage' },
      { name: 'Chill Gaze', power: 25, type: 'special', description: 'Locks eyes with the foe, draining warmth' },
      { name: 'Spectral Yowl', power: 20, type: 'special', description: 'An eerie cry that reverberates through the fog' },
    ],
  },

  // === SANTA CRUZ SURFING CREATURES ===
  {
    id: 'surf-otter',
    name: 'Surf Otter',
    scientificName: 'Enhydra surfaris',
    description: 'A wave-riding sea otter that catches swells off Steamer Lane. Its kelp-wrapped board gives it uncanny balance.',
    lore: 'Southern sea otters returned to Santa Cruz in the 1980s after being hunted nearly to extinction. Today they float in the kelp beds off Natural Bridges and West Cliff. One otter — dubbed "Otter 841" — became famous for stealing surfboards from surfers at Steamer Lane. This creature honors that rebel spirit.',
    type: 'marine',
    rarity: 'rare',
    biomes: ['beach', 'water'],
    subregions: ['Santa Cruz Beach Boardwalk', 'Santa Cruz Coast'],
    stats: { hp: 55, maxHp: 55, attack: 42, defense: 38, speed: 48 },
    isFantasy: true,
    sprite: '🦦',
    color: '#92400e',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Wave Crash', power: 40, type: 'attack', description: 'Rides a massive wave into the target' },
      { name: 'Kelp Wrap', power: 0, type: 'defend', description: 'Wraps in kelp armor for protection' },
      { name: 'Barrel Roll', power: 35, type: 'special', description: 'Spins through a curling wave for a devastating strike' },
    ],
  },
  {
    id: 'wave-spirit',
    name: 'Wave Spirit',
    scientificName: 'Fluctus animus',
    description: 'A luminous entity born from the perfect wave. Surfers at Steamer Lane glimpse it riding inside barrels at dawn.',
    lore: 'Santa Cruz locals speak of the Wave Spirit in hushed tones. It appears only when conditions align — a large northwest swell, offshore winds, and the golden light of dawn or dusk. Those who have surfed alongside it describe a feeling of weightless perfection, as if the ocean itself was guiding their board.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['beach', 'water'],
    subregions: ['Santa Cruz Beach Boardwalk', 'Santa Cruz Coast'],
    stats: { hp: 70, maxHp: 70, attack: 55, defense: 40, speed: 65 },
    isFantasy: true,
    sprite: '🌊',
    color: '#0ea5e9',
    activeTime: ['dawn', 'dusk'],
    moves: [
      { name: 'Tidal Surge', power: 50, type: 'attack', description: 'Summons the full force of the Pacific' },
      { name: 'Undertow', power: 35, type: 'special', description: 'Drags the foe into a powerful current' },
      { name: 'Glassy Calm', power: 0, type: 'defend', description: 'The ocean goes perfectly still, deflecting all attacks' },
    ],
  },
  {
    id: 'pelican-diver',
    name: 'Brown Pelican',
    scientificName: 'Pelecanus occidentalis',
    description: 'A massive seabird that plunge-dives from 60 feet up, hitting the water like a torpedo to catch fish.',
    lore: 'Brown pelicans were nearly wiped out by DDT in the 1970s. After the pesticide was banned, they made one of the most dramatic comebacks in conservation history. At Santa Cruz, they soar in formation along the cliffs of West Cliff Drive, then fold their wings and plummet headfirst into the surf.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['beach', 'water'],
    subregions: ['Santa Cruz Beach Boardwalk', 'Santa Cruz Coast', 'Half Moon Bay', 'Pacifica'],
    stats: { hp: 45, maxHp: 45, attack: 40, defense: 28, speed: 35 },
    isFantasy: false,
    sprite: '🐦',
    color: '#78350f',
    activeTime: ['dawn', 'day'],
    moves: [
      { name: 'Plunge Dive', power: 45, type: 'attack', description: 'Dives from great height with devastating impact' },
      { name: 'Pouch Scoop', power: 25, type: 'special', description: 'Scoops up the foe in an expandable throat pouch' },
      { name: 'Thermal Glide', power: 0, type: 'defend', description: 'Rides coastal updrafts to evade attacks' },
    ],
  },
]

// ============================================================
// WEATHER VARIANT CREATURES — only appear during specific weather
// ============================================================
export const WEATHER_CREATURES: Creature[] = [
  {
    id: 'fog-wraith',
    name: 'Fog Wraith',
    scientificName: 'Nebula spectris',
    description: 'Born from the thick San Francisco fog, this spectral creature drifts silently through the mist.',
    lore: 'The famous Karl the Fog sometimes carries these ethereal beings in from the Pacific. They materialize where the fog is thickest — the Golden Gate, Ocean Beach, Twin Peaks — and vanish the moment the sun burns through. Some say they are the spirits of lost sailors.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['beach', 'urban', 'grassland', 'forest'],
    subregions: ['Golden Gate Bridge', 'Ocean Beach', 'Twin Peaks', 'Marin Headlands', 'Half Moon Bay', 'Pacifica'],
    stats: { hp: 55, maxHp: 55, attack: 45, defense: 30, speed: 50 },
    isFantasy: true,
    sprite: '👻',
    color: '#94a3b8',
    activeTime: ['dusk', 'night'],
    activeWeather: ['fog'],
    moves: [
      { name: 'Fog Veil', power: 0, type: 'defend', description: 'Wraps in dense fog, becoming untouchable' },
      { name: 'Chill Touch', power: 35, type: 'attack', description: 'A freezing touch that saps warmth' },
      { name: 'Mist Burst', power: 40, type: 'special', description: 'Explodes into a cloud of freezing mist' },
    ],
  },
  {
    id: 'storm-petrel',
    name: 'Storm Petrel',
    scientificName: 'Oceanodroma tempestus',
    description: 'A dark seabird that rides the storm winds, thriving in rain and tempest.',
    lore: 'Storm petrels dance across the wave tops even in the worst weather. Bay Area birders treasure sightings after big Pacific storms push these pelagic birds close to shore. They tap the water surface with their feet while feeding, seeming to walk on waves — giving them the name "petrel" from Saint Peter.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['beach', 'water', 'marsh'],
    subregions: ['Ocean Beach', 'Pacifica', 'Half Moon Bay', 'Point Reyes', 'Santa Cruz Coast'],
    stats: { hp: 35, maxHp: 35, attack: 40, defense: 20, speed: 55 },
    isFantasy: false,
    sprite: '🕊️',
    color: '#475569',
    activeTime: ['dusk', 'night'],
    activeWeather: ['rain', 'wind'],
    moves: [
      { name: 'Storm Dive', power: 40, type: 'attack', description: 'Plummets through rain and wind' },
      { name: 'Gale Wing', power: 25, type: 'special', description: 'Buffets the foe with storm winds' },
      { name: 'Wave Walk', power: 0, type: 'defend', description: 'Skims the water to dodge' },
    ],
  },
  {
    id: 'rain-salamander',
    name: 'Rain Salamander',
    scientificName: 'Aneides pluvialis',
    description: 'Emerges from the forest floor only during rainfall, its bright blue markings glow in the wet.',
    lore: 'These elusive amphibians spend most of their lives underground. When the first rains of autumn arrive, they surface in the redwood forests and oak woodlands. Their bioluminescent markings are unique among Bay Area amphibians — scientists believe the glow attracts the small invertebrates they feed on.',
    type: 'amphibian',
    rarity: 'rare',
    biomes: ['forest', 'redwood', 'marsh'],
    subregions: ['Muir Woods', 'Redwood Regional Park', 'Purisima Creek Redwoods', 'Tilden Regional Park'],
    stats: { hp: 45, maxHp: 45, attack: 30, defense: 45, speed: 20 },
    isFantasy: true,
    sprite: '🐸',
    color: '#3b82f6',
    activeTime: ['dusk', 'night'],
    activeWeather: ['rain'],
    moves: [
      { name: 'Rain Dance', power: 30, type: 'special', description: 'Summons a downpour that empowers allies' },
      { name: 'Mud Shield', power: 0, type: 'defend', description: 'Coats itself in protective mud armor' },
      { name: 'Glow Burst', power: 35, type: 'attack', description: 'Flashes bioluminescent light blindingly' },
    ],
  },
  {
    id: 'wind-hawk',
    name: 'Wind Hawk',
    scientificName: 'Accipiter ventosus',
    description: 'A fierce raptor that hunts only during strong Bay Area winds, using the gusts as weapons.',
    lore: 'When the Diablo winds whip through the East Bay passes or the ocean wind screams through the Golden Gate, the Wind Hawks take flight. They use the extreme turbulence to outmaneuver prey, striking with talon attacks amplified by wind speed. Their feathers shimmer with an unusual blue sheen.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['mountain', 'grassland', 'beach'],
    subregions: ['Mt. Tamalpais', 'Marin Headlands', 'Hawk Hill', 'Mt. Diablo', 'Oakland Hills'],
    stats: { hp: 50, maxHp: 50, attack: 55, defense: 25, speed: 60 },
    isFantasy: true,
    sprite: '🦅',
    color: '#60a5fa',
    activeTime: ['dawn', 'day', 'dusk'],
    activeWeather: ['wind'],
    moves: [
      { name: 'Gale Strike', power: 45, type: 'attack', description: 'Wind-powered diving attack' },
      { name: 'Cyclone Feathers', power: 35, type: 'special', description: 'Razor-sharp feathers whipped by wind' },
      { name: 'Updraft', power: 0, type: 'defend', description: 'Catches a thermal to soar out of reach' },
    ],
  },
  {
    id: 'sun-sprite',
    name: 'Sun Sprite',
    scientificName: 'Solaris pixium',
    description: 'A tiny golden creature that appears only in brilliant sunshine, dancing in the light.',
    lore: 'Sun Sprites are drawn to the warmest, brightest days in the Bay Area. They cluster around the sun-baked hills of Mt. Diablo and the sunny grasslands of the East Bay. Some believe they are manifestations of pure solar energy, born where California sunshine meets ancient geologic magic.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['grassland', 'mountain', 'beach'],
    subregions: ['Mt. Diablo', 'Rancho San Antonio', 'Sunol Regional Wilderness', 'Santa Cruz Beach Boardwalk'],
    stats: { hp: 40, maxHp: 40, attack: 50, defense: 20, speed: 55 },
    activeTime: ['dawn', 'day'],
    isFantasy: true,
    sprite: '✨',
    color: '#fbbf24',
    activeWeather: ['sunny'],
    moves: [
      { name: 'Solar Beam', power: 50, type: 'special', description: 'Concentrates sunlight into a searing beam' },
      { name: 'Dazzle', power: 0, type: 'defend', description: 'Blinds the foe with reflected light' },
      { name: 'Warmth Drain', power: 30, type: 'attack', description: 'Absorbs heat energy from the target' },
    ],
  },
  {
    id: 'thunder-crab',
    name: 'Thunder Crab',
    scientificName: 'Cancer fulguris',
    description: 'A massive armored crab that surfaces during storms, crackling with static electricity.',
    lore: 'Thunder Crabs are extraordinarily rare — appearing only during the most intense Pacific storms. Their shells contain mineral deposits that attract and store lightning. Fishermen in Half Moon Bay tell stories of seeing them glow blue in the crashing surf during winter storms.',
    type: 'marine',
    rarity: 'legendary',
    biomes: ['beach', 'water', 'marsh'],
    subregions: ['Half Moon Bay', 'Pacifica', 'Ocean Beach', 'Santa Cruz Beach Boardwalk', 'Santa Cruz Coast'],
    stats: { hp: 75, maxHp: 75, attack: 60, defense: 65, speed: 15 },
    isFantasy: true,
    sprite: '🦀',
    color: '#7c3aed',
    activeWeather: ['rain'],
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Thunder Claw', power: 55, type: 'attack', description: 'Electrically charged pincer strike' },
      { name: 'Shell Fortress', power: 0, type: 'defend', description: 'Retreats into electrified shell' },
      { name: 'Storm Surge', power: 45, type: 'special', description: 'Summons a wave crackling with lightning' },
    ],
  },
  {
    id: 'thunder-serpent',
    name: 'Thunder Serpent',
    scientificName: 'Fulguris draconus',
    description: 'A legendary sky serpent that rides inside thunderstorm cells, visible only during lightning flashes.',
    lore: 'Miwok oral tradition tells of a great serpent that lived inside thunderclouds over Mt. Diablo. When lightning struck the summit, it was the serpent diving to drink from the creeks. Modern sightings cluster around the Diablo Range during winter storms — always glimpsed for a split second during a flash, then gone.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['mountain', 'grassland', 'alpine', 'valley'],
    subregions: ['Mt. Diablo', 'Mt. Tamalpais', 'Pinnacles NP', 'Santa Cruz'],
    stats: { hp: 90, maxHp: 90, attack: 72, defense: 40, speed: 65 },
    isFantasy: true,
    sprite: '🐉',
    color: '#a855f7',
    activeTime: ['dusk', 'night'],
    activeWeather: ['thunderstorm'],
    moves: [
      { name: 'Chain Lightning', power: 65, type: 'special', description: 'Arcing bolt that jumps between targets' },
      { name: 'Thunder Coil', power: 0, type: 'defend', description: 'Wraps in crackling electric armor' },
      { name: 'Stormbreak', power: 80, type: 'attack', description: 'Crashes down from the clouds with devastating force' },
    ],
  },
  {
    id: 'static-sprite',
    name: 'Static Sprite',
    scientificName: 'Electricula minima',
    description: 'Tiny ball-lightning creatures that swarm during thunderstorms, dancing between raindrops.',
    lore: 'Ball lightning has been reported in the Bay Area since the Gold Rush. Scientists remain baffled, but creature researchers know these are colonies of Static Sprites — bioluminescent organisms that feed on atmospheric charge. They cluster around tall structures during storms: Salesforce Tower, Coit Tower, the Golden Gate Bridge pylons.',
    type: 'mystic',
    rarity: 'uncommon',
    biomes: ['urban', 'mountain', 'grassland'],
    subregions: ['Financial District', 'Twin Peaks', 'Berkeley', 'Oakland Hills'],
    stats: { hp: 30, maxHp: 30, attack: 38, defense: 15, speed: 70 },
    isFantasy: true,
    sprite: '⚡',
    color: '#facc15',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    activeWeather: ['thunderstorm'],
    moves: [
      { name: 'Spark Swarm', power: 35, type: 'attack', description: 'A cloud of crackling sprites surges forward' },
      { name: 'Discharge', power: 50, type: 'special', description: 'Releases all stored charge in a blinding flash' },
      { name: 'Static Cling', power: 0, type: 'defend', description: 'Charges static field that shocks on contact' },
    ],
  },
  {
    id: 'storm-heron',
    name: 'Storm Heron',
    scientificName: 'Ardea tempestis',
    description: 'A massive great blue heron that hunts exclusively during thunderstorms, using lightning flashes to spot fish.',
    lore: 'Great blue herons normally hunt at dawn and dusk, but the Storm Heron has evolved to exploit thunderstorms. When lightning illuminates the shallows, it strikes with perfect accuracy. Found wading through flooded marshes around the Bay during heavy storms, these birds stand nearly five feet tall with a wingspan that seems to crackle with static.',
    type: 'bird',
    rarity: 'rare',
    biomes: ['marsh', 'beach', 'water', 'lakeshore'],
    subregions: ['Richardson Bay', 'Don Edwards Wildlife Refuge', 'Alviso Marsh', 'Lake Merritt', 'Coyote Hills'],
    stats: { hp: 65, maxHp: 65, attack: 55, defense: 35, speed: 40 },
    isFantasy: false,
    sprite: '🪽',
    color: '#6366f1',
    activeTime: ['dawn', 'day', 'dusk'],
    activeWeather: ['thunderstorm', 'rain'],
    moves: [
      { name: 'Lightning Strike', power: 55, type: 'attack', description: 'Strikes with electric precision in a flash of light' },
      { name: 'Stormwing', power: 40, type: 'special', description: 'Beats wings to generate crackling gusts' },
      { name: 'Hunker Down', power: 0, type: 'defend', description: 'Tucks into a low defensive stance' },
    ],
  },
]

// === NOCTURNAL-ONLY CREATURES ===
// These creatures appear exclusively at night, rewarding players who explore after dark.
const NOCTURNAL_CREATURES: Creature[] = [
  // --- Real nocturnal species ---
  {
    id: 'barn-owl',
    name: 'Barn Owl',
    scientificName: 'Tyto alba',
    description: 'A ghostly white owl that hunts silently through Bay Area grasslands after dark.',
    lore: 'Barn owls are among the most effective rodent predators in the world, catching up to a thousand mice per year. Their heart-shaped facial disc acts as a parabolic reflector, funneling sound to asymmetrically placed ears — allowing them to pinpoint prey in total darkness by sound alone. In the Bay Area, they nest in old barns, church steeples, and nest boxes placed by conservation groups along the edges of marshland.',
    type: 'bird',
    rarity: 'uncommon',
    biomes: ['grassland', 'marsh', 'urban'],
    subregions: ['Marin Headlands', 'Rancho San Antonio', 'Baylands Nature Preserve', 'Coyote Hills'],
    stats: { hp: 42, maxHp: 42, attack: 45, defense: 22, speed: 50 },
    isFantasy: false,
    sprite: '🦉',
    color: '#f5f0e1',
    activeTime: ['night'],
    moves: [
      { name: 'Silent Swoop', power: 40, type: 'attack', description: 'Strikes from above without a sound' },
      { name: 'Night Vision', power: 0, type: 'special', description: 'Locks onto prey with perfect precision' },
      { name: 'Screech', power: 25, type: 'special', description: 'A blood-curdling shriek that paralyzes' },
    ],
  },
  {
    id: 'ringtail-cat',
    name: 'Ringtail',
    scientificName: 'Bassariscus astutus',
    description: 'A slender nocturnal carnivore with enormous eyes and a long striped tail. Rarely seen.',
    lore: 'Despite the name "ringtail cat," this animal is actually a relative of the raccoon. California miners in the 1800s kept ringtails as mousers in their cabins, earning them the nickname "miner\'s cat." They are exceptional climbers — their hind feet can rotate 180 degrees, allowing them to descend cliffs headfirst. In the Bay Area, they are rarely spotted in rocky canyons of Mt. Diablo and the East Bay hills.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['mountain', 'forest'],
    subregions: ['Mt. Diablo', 'Oakland Hills', 'Mt. Tamalpais', 'Tilden Regional Park'],
    stats: { hp: 38, maxHp: 38, attack: 40, defense: 25, speed: 55 },
    isFantasy: false,
    sprite: '🦝',
    color: '#d4a574',
    activeTime: ['night'],
    moves: [
      { name: 'Pounce', power: 35, type: 'attack', description: 'Lightning-fast ambush from the rocks' },
      { name: 'Wall Climb', power: 0, type: 'defend', description: 'Scrambles up a sheer surface to safety' },
      { name: 'Tail Lure', power: 20, type: 'special', description: 'Waves its banded tail to distract' },
    ],
  },
  {
    id: 'pacific-giant-salamander',
    name: 'Pacific Giant Salamander',
    scientificName: 'Dicamptodon tenebrosus',
    description: 'One of the few salamanders that can vocalize — a rare bark heard only on rainy nights.',
    lore: 'The Pacific Giant Salamander is North America\'s largest terrestrial salamander, reaching over a foot in length. Unlike most salamanders, it can vocalize — producing a low bark or yelp when threatened. It hunts aggressively at night, eating everything from insects to small mice and even other salamanders. In Bay Area redwood forests, they require cold, clear streams free of sedimentation to breed.',
    type: 'amphibian',
    rarity: 'rare',
    biomes: ['redwood', 'forest'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Redwood Regional Park'],
    stats: { hp: 55, maxHp: 55, attack: 42, defense: 38, speed: 18 },
    isFantasy: false,
    sprite: '🦎',
    color: '#5b4a3f',
    activeTime: ['night'],
    moves: [
      { name: 'Bark', power: 25, type: 'special', description: 'A startling croak that shakes the foe' },
      { name: 'Jaw Clamp', power: 40, type: 'attack', description: 'Powerful bite that doesn\'t let go' },
      { name: 'Mud Slide', power: 0, type: 'defend', description: 'Slips into wet earth to evade' },
    ],
  },
  {
    id: 'western-harvest-mouse',
    name: 'Salt Marsh Harvest Mouse',
    scientificName: 'Reithrodontomys raviventris',
    description: 'A tiny endangered mouse that lives only in San Francisco Bay salt marshes.',
    lore: 'The salt marsh harvest mouse is found nowhere else on Earth — it is endemic to the salt marshes and tidal wetlands ringing San Francisco Bay. Weighing less than a nickel, it is one of the few mammals that can drink saltwater. Its populations have declined drastically as Bay marshes were filled for development. Today, fewer than estimated 50,000 remain, making a nighttime encounter in the marshes a truly special event.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['marsh'],
    subregions: ['Baylands Nature Preserve', 'Coyote Hills', 'Don Edwards Wildlife Refuge'],
    stats: { hp: 18, maxHp: 18, attack: 12, defense: 15, speed: 58 },
    isFantasy: false,
    sprite: '🐭',
    color: '#c4956a',
    activeTime: ['night'],
    moves: [
      { name: 'Quick Dash', power: 15, type: 'attack', description: 'A blur of tiny feet' },
      { name: 'Salt Resistance', power: 0, type: 'defend', description: 'Endures what others cannot' },
      { name: 'Grass Weave', power: 0, type: 'defend', description: 'Vanishes into the pickleweed' },
    ],
  },
  {
    id: 'pallid-bat',
    name: 'Pallid Bat',
    scientificName: 'Antrozous pallidus',
    description: 'A large pale bat that hunts scorpions and crickets on the ground — unusual for a bat.',
    lore: 'Unlike most bats, pallid bats are ground hunters. They listen for the scuttling of prey on the earth below, then swoop down to snatch scorpions, crickets, and beetles from the ground. They are immune to scorpion venom. Their roosts in Bay Area rock crevices and old buildings smell strongly of musk — an unmistakable sign if you find one. Their echolocation calls are low-frequency, making them nearly silent to human ears.',
    type: 'beast',
    rarity: 'uncommon',
    biomes: ['grassland', 'mountain', 'urban'],
    subregions: ['Mt. Diablo', 'Marin Headlands', 'Oakland Hills', 'The Presidio'],
    stats: { hp: 32, maxHp: 32, attack: 35, defense: 20, speed: 52 },
    isFantasy: false,
    sprite: '🦇',
    color: '#e8d5b7',
    activeTime: ['night'],
    moves: [
      { name: 'Ground Strike', power: 30, type: 'attack', description: 'Swoops to snatch prey from the earth' },
      { name: 'Echolocation', power: 0, type: 'special', description: 'Maps every obstacle in darkness' },
      { name: 'Wing Buffet', power: 20, type: 'attack', description: 'Slaps with broad leathery wings' },
    ],
  },
  // --- Fantasy nocturnal creatures ---
  {
    id: 'moonfire-jellyfish',
    name: 'Moonfire Jellyfish',
    scientificName: 'Lunaris ignis',
    description: 'A bioluminescent jellyfish that rises from the deep Bay at night, trailing silver fire.',
    lore: 'Moonfire jellyfish are visible only on clear, moonlit nights when the Bay is calm. They rise from depths no submersible has reached, pulsing with an inner light that shifts between silver and pale blue. Kayakers in Richardson Bay have reported being surrounded by hundreds, their tentacles creating a lattice of light beneath the water\'s surface. By dawn, they sink back to whatever abyss they call home.',
    type: 'marine',
    rarity: 'rare',
    biomes: ['water', 'beach'],
    subregions: ['Ocean Beach', 'Half Moon Bay', 'Pacifica', 'Santa Cruz Coast'],
    stats: { hp: 45, maxHp: 45, attack: 38, defense: 30, speed: 25 },
    isFantasy: true,
    sprite: '🪼',
    color: '#c0c0ff',
    activeTime: ['night'],
    moves: [
      { name: 'Moonbeam Sting', power: 35, type: 'attack', description: 'Tentacles lash with silver light' },
      { name: 'Bioluminesce', power: 0, type: 'special', description: 'Blazes with blinding radiance' },
      { name: 'Depth Fade', power: 0, type: 'defend', description: 'Sinks into darkness, becoming intangible' },
    ],
  },
  {
    id: 'shadow-heron',
    name: 'Shadow Heron',
    scientificName: 'Ardea umbrae',
    description: 'A great heron made of living darkness that wades through moonlit tidal flats.',
    lore: 'The Shadow Heron appears where great blue herons roost, but only after the last light fades. It is not a spirit of a dead heron — it is something older, a creature of the tidal boundary between land and sea, light and dark. Its feathers absorb all light, creating a bird-shaped void that moves with eerie grace through the shallows. Fish it catches dissolve into wisps of shadow.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['marsh', 'water', 'beach'],
    subregions: ['Baylands Nature Preserve', 'Coyote Hills', 'Don Edwards Wildlife Refuge', 'Richardson Bay'],
    stats: { hp: 60, maxHp: 60, attack: 50, defense: 35, speed: 38 },
    isFantasy: true,
    sprite: '🐦‍⬛',
    color: '#1a1a2e',
    activeTime: ['night'],
    moves: [
      { name: 'Shadow Spear', power: 45, type: 'attack', description: 'Bill strikes like a lance of darkness' },
      { name: 'Void Plumage', power: 0, type: 'defend', description: 'Light-absorbing feathers make it untouchable' },
      { name: 'Tidal Whisper', power: 30, type: 'special', description: 'The sound of midnight waves saps strength' },
    ],
  },
  {
    id: 'starweaver-spider',
    name: 'Starweaver Spider',
    scientificName: 'Aranea stellaris',
    description: 'A mystic spider whose web captures starlight, creating constellation maps in the forest canopy.',
    lore: 'Starweaver spiders build their webs high in the redwood canopy where they can catch unobstructed starlight. Each strand of silk contains crystallized moonlight, and the completed web mirrors the night sky in miniature. Rangers have found that the constellations in the web don\'t match any known star chart — they show the sky as it appeared thousands of years ago, or perhaps as it will appear thousands of years hence.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['redwood', 'forest'],
    subregions: ['Muir Woods', 'Purisima Creek Redwoods', 'Redwood Regional Park', 'Big Basin'],
    stats: { hp: 50, maxHp: 50, attack: 55, defense: 40, speed: 45 },
    isFantasy: true,
    sprite: '🕷️',
    color: '#6366f1',
    activeTime: ['night'],
    moves: [
      { name: 'Starweb Snare', power: 40, type: 'special', description: 'Webs woven from captured starlight bind the foe' },
      { name: 'Constellation Strike', power: 50, type: 'attack', description: 'Channels the power of a mapped star' },
      { name: 'Light Weave', power: 0, type: 'defend', description: 'Wraps itself in a cocoon of constellations' },
    ],
  },
  {
    id: 'eclipse-moth',
    name: 'Eclipse Moth',
    scientificName: 'Papilio eclipsis',
    description: 'A colossal moth whose wings display a perfect solar eclipse — darkness ringed with golden corona.',
    lore: 'The Eclipse Moth appears only during the darkest hours, drawn to places where no artificial light reaches. Its wingspan exceeds three feet, and each wing bears a pattern that perfectly mimics a total solar eclipse — a dark circle ringed with streaming golden filaments. Those who watch it fly describe a feeling of time stopping, as if the moth carries a pocket of eternal twilight wherever it goes. Entomologists have found its wing scales contain an unknown pigment that absorbs 99.7% of visible light.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['forest', 'redwood', 'mountain'],
    subregions: ['Muir Woods', 'Mt. Tamalpais', 'Big Basin', 'Purisima Creek Redwoods', 'Oakland Hills'],
    stats: { hp: 55, maxHp: 55, attack: 50, defense: 35, speed: 60 },
    isFantasy: true,
    sprite: '🦋',
    color: '#1c1917',
    activeTime: ['night'],
    moves: [
      { name: 'Eclipse Dust', power: 45, type: 'special', description: 'Wing scales that darken everything they touch' },
      { name: 'Corona Flare', power: 50, type: 'attack', description: 'A blinding ring of golden light erupts from its wings' },
      { name: 'Umbra Cloak', power: 0, type: 'defend', description: 'Wraps in total shadow, becoming nearly invisible' },
    ],
  },
]

// Add weather creatures to the main list so they show in catalog/baydex/species count
ALL_CREATURES.push(...WEATHER_CREATURES)

// Add nocturnal-exclusive creatures
ALL_CREATURES.push(...NOCTURNAL_CREATURES)

// === LUNAR BOSS CREATURES ===
// These legendary mystic creatures only appear during full moon nights as boss encounters.
// They have dramatically boosted stats and unique moves. Not in regular spawn pool.
export const LUNAR_BOSSES: Creature[] = [
  {
    id: 'lunar-titan',
    name: 'Lunar Titan',
    scientificName: 'Colossus lunaris',
    description: 'A towering entity of solidified moonlight that rises from the earth during the full moon.',
    lore: 'The Lunar Titan is said to be the physical embodiment of the full moon\'s gravitational pull on the Bay Area. It rises from the earth in places where tectonic faults meet water — the San Andreas, the Hayward. Standing three stories tall, its body is translucent silver, filled with swirling galaxies visible through its crystalline form. It has been defeated exactly once in recorded history, by the legendary Ranger Captain Mira Okonkwo in 1906.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['mountain', 'grassland', 'forest'],
    subregions: ['Mt. Tamalpais', 'Mt. Diablo', 'Oakland Hills', 'Marin Headlands'],
    stats: { hp: 200, maxHp: 200, attack: 75, defense: 70, speed: 35 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🗿',
    color: '#c0c0ff',
    activeTime: ['night'],
    moves: [
      { name: 'Moonfall', power: 65, type: 'attack', description: 'Brings down a fragment of the moon itself' },
      { name: 'Tidal Gravity', power: 50, type: 'special', description: 'Warps gravity, crushing everything inward' },
      { name: 'Lunar Shield', power: 0, type: 'defend', description: 'A barrier of pure moonlight deflects all attacks' },
    ],
  },
  {
    id: 'selenar-wolf',
    name: 'Selenar Wolf',
    scientificName: 'Lupus selenae',
    description: 'A spectral wolf pack leader whose howl can shatter glass and bend moonbeams into blades.',
    lore: 'The Selenar Wolf appears at the summit of the highest peak visible under the full moon. Unlike the Midnight Coyote, which is a solitary urban prowler, the Selenar Wolf commands an army of phantom wolves made of compressed moonlight. Its silver fur burns cold to the touch, leaving frost wherever it steps. Rangers who have tracked it say the temperature drops 30 degrees in its presence.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['forest', 'mountain', 'redwood'],
    subregions: ['Muir Woods', 'Mt. Tamalpais', 'Big Basin', 'Oakland Hills'],
    stats: { hp: 160, maxHp: 160, attack: 85, defense: 50, speed: 70 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🐺',
    color: '#94a3b8',
    activeTime: ['night'],
    moves: [
      { name: 'Howl of Ruin', power: 60, type: 'special', description: 'A devastating howl that echoes across dimensions' },
      { name: 'Moonblade Fang', power: 70, type: 'attack', description: 'Fangs sharpened by concentrated moonlight' },
      { name: 'Pack Mirage', power: 0, type: 'defend', description: 'Phantom wolves absorb the incoming attack' },
    ],
  },
  {
    id: 'abyssal-leviathan',
    name: 'Abyssal Leviathan',
    scientificName: 'Leviathanus profundis',
    description: 'A colossal deep-sea entity that surfaces in the Bay only when the full moon pulls the tides to their highest.',
    lore: 'The Abyssal Leviathan dwells in a trench beneath the Golden Gate that no sonar has ever mapped. During full moons, the extreme tidal forces pull it close enough to the surface that its bioluminescent organs illuminate the water from beneath. Fishing boats have reported seeing a shape larger than Alcatraz Island moving slowly beneath them. Those who have battled it say its scales are harder than diamond and its eyes hold the memory of every ship that ever sank in the Bay.',
    type: 'marine',
    rarity: 'legendary',
    biomes: ['water', 'beach'],
    subregions: ['Ocean Beach', 'Half Moon Bay', 'Pacifica', 'Richardson Bay'],
    stats: { hp: 250, maxHp: 250, attack: 70, defense: 85, speed: 25 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🐉',
    color: '#1e3a5f',
    activeTime: ['night'],
    moves: [
      { name: 'Abyssal Crush', power: 70, type: 'attack', description: 'Pressure from the deepest ocean trenches' },
      { name: 'Tidal Maelstrom', power: 55, type: 'special', description: 'Creates a whirlpool that drags everything down' },
      { name: 'Deep Shell', power: 0, type: 'defend', description: 'Retreats into impenetrable abyssal armor' },
    ],
  },
  {
    id: 'phoenix-moth',
    name: 'Phoenix Moth',
    scientificName: 'Papilio ignis renascens',
    description: 'A moth wreathed in cold silver flame that only ignites under the light of the full moon.',
    lore: 'The Phoenix Moth is the mature form of the Eclipse Moth — but this transformation occurs only once per century, when a full moon coincides with the winter solstice. Its wings burn with a silver fire that does not consume but transforms. Flowers bloom in its wake, even in winter. Those who catch its falling scales find them heavier than lead and warm to the touch for exactly one lunar month.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['forest', 'redwood', 'grassland', 'urban'],
    subregions: ['Golden Gate Park', 'Muir Woods', 'The Presidio', 'Big Basin', 'Rancho San Antonio'],
    stats: { hp: 130, maxHp: 130, attack: 90, defense: 40, speed: 80 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🦋',
    color: '#f59e0b',
    activeTime: ['night'],
    moves: [
      { name: 'Silver Inferno', power: 75, type: 'attack', description: 'Cold moonfire engulfs everything' },
      { name: 'Rebirth Dust', power: 0, type: 'defend', description: 'Sheds burning scales that heal and protect' },
      { name: 'Eclipse Dive', power: 60, type: 'special', description: 'Plunges from the sky trailing silver flame' },
    ],
  },
]

// Add lunar bosses to ALL_CREATURES so they appear in BayDex/catalog
ALL_CREATURES.push(...LUNAR_BOSSES)

// === NEW MOON SHADOW BOSSES ===
// Dark counterpart bosses that spawn only during new moon nights.
// They are stealthier but deal devastating damage.
export const SHADOW_BOSSES: Creature[] = [
  {
    id: 'void-stalker',
    name: 'Void Stalker',
    scientificName: 'Umbra praedator',
    description: 'A shapeless predator born from absolute darkness, visible only as the absence of starlight.',
    lore: 'When the new moon plunges the Bay Area into total darkness, the Void Stalker coalesces from the shadows between buildings in the oldest parts of San Francisco. It has no fixed form — witnesses describe a moving hole in reality, a place where light enters and never returns. It hunts by vibration, sensing footsteps through the concrete. The only defense is absolute stillness.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['urban', 'forest', 'grassland'],
    subregions: ['SoMa / Mission District', 'The Presidio', 'Golden Gate Park', 'Oakland Hills'],
    stats: { hp: 140, maxHp: 140, attack: 95, defense: 35, speed: 85 },
    isFantasy: true,
    isAlpha: true,
    sprite: '👁️',
    color: '#4c1d95',
    activeTime: ['night'],
    moves: [
      { name: 'Null Strike', power: 80, type: 'attack', description: 'An attack from nowhere that ignores all defenses' },
      { name: 'Shadow Consume', power: 50, type: 'special', description: 'Drains life force, healing the Stalker' },
      { name: 'Phase Shift', power: 0, type: 'defend', description: 'Becomes completely intangible' },
    ],
  },
  {
    id: 'dread-serpent',
    name: 'Dread Serpent',
    scientificName: 'Serpens tenebrarum',
    description: 'An enormous shadow snake that slithers between dimensions, its coils spanning entire hillsides.',
    lore: 'The Dread Serpent is older than the Bay itself. Indigenous Ohlone stories speak of a great snake that sleeps beneath the hills, stirring only when the moon hides its face. Its scales are made of compressed night, each one a tiny window into a lightless dimension. Those who have survived its gaze report weeks of nightmares and an irrational fear of the dark that never fully fades.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['mountain', 'forest', 'marsh'],
    subregions: ['Mt. Tamalpais', 'Mt. Diablo', 'Oakland Hills', 'Big Basin'],
    stats: { hp: 180, maxHp: 180, attack: 80, defense: 65, speed: 50 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🐍',
    color: '#1e1b4b',
    activeTime: ['night'],
    moves: [
      { name: 'Venom of Despair', power: 65, type: 'attack', description: 'Poison that attacks the mind, not the body' },
      { name: 'Coil of Darkness', power: 0, type: 'defend', description: 'Wraps in impenetrable shadow coils' },
      { name: 'Nightmare Gaze', power: 55, type: 'special', description: 'Locks eyes with prey, paralyzing with terror' },
    ],
  },
  {
    id: 'umbral-kraken',
    name: 'Umbral Kraken',
    scientificName: 'Kraken umbralis',
    description: 'A deep-sea horror whose ink-black tentacles reach through the darkness from beneath the waves.',
    lore: 'The Umbral Kraken lurks in the trenches beneath the Golden Gate where no sonar can penetrate. Unlike the Abyssal Leviathan which is a creature of deep pressure, the Kraken is a creature of pure darkness — it exists in the spaces between light. On new moon nights, when even the moon cannot illuminate the water, its tentacles reach up through the surface, each one tipped with a bioluminescent lure that mimics drowning sailors.',
    type: 'marine',
    rarity: 'legendary',
    biomes: ['water', 'beach', 'marsh'],
    subregions: ['Ocean Beach', 'Half Moon Bay', 'Pacifica', 'Richardson Bay', 'Don Edwards Wildlife Refuge'],
    stats: { hp: 220, maxHp: 220, attack: 75, defense: 80, speed: 30 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🦑',
    color: '#0f0a2e',
    activeTime: ['night'],
    moves: [
      { name: 'Ink Abyss', power: 60, type: 'special', description: 'Floods the area with reality-dissolving ink' },
      { name: 'Tentacle Crush', power: 70, type: 'attack', description: 'Massive tentacles slam down from above' },
      { name: 'Abyssal Veil', power: 0, type: 'defend', description: 'Retreats into impenetrable darkness' },
    ],
  },
  {
    id: 'nightmare-stag',
    name: 'Nightmare Stag',
    scientificName: 'Cervus somnii',
    description: 'A spectral black stag with antlers of crystallized shadow, each tine a different stolen dream.',
    lore: 'The Nightmare Stag walks the ridgelines of the East Bay hills on moonless nights. Its hooves make no sound, but those who see it feel an overwhelming urge to sleep. Its antlers are grown from the nightmares of every creature that has ever feared the dark in the Bay Area — an antler rack that spans ten feet and glimmers with stolen dreams. It is said that capturing it grants immunity to nightmares forever.',
    type: 'mystic',
    rarity: 'legendary',
    biomes: ['forest', 'redwood', 'grassland', 'mountain'],
    subregions: ['Muir Woods', 'Rancho San Antonio', 'Big Basin', 'Mt. Diablo', 'Oakland Hills'],
    stats: { hp: 160, maxHp: 160, attack: 70, defense: 60, speed: 75 },
    isFantasy: true,
    isAlpha: true,
    sprite: '🦌',
    color: '#2d1b69',
    activeTime: ['night'],
    moves: [
      { name: 'Dream Shatter', power: 70, type: 'attack', description: 'Antler tines fragment reality like broken glass' },
      { name: 'Sleep Fog', power: 45, type: 'special', description: 'Exhales a mist that pulls victims into nightmares' },
      { name: 'Phantom Stride', power: 0, type: 'defend', description: 'Steps between dimensions, becoming untouchable' },
    ],
  },
]

ALL_CREATURES.push(...SHADOW_BOSSES)

// Add extended biodiversity creatures (reptiles, plants, tidepool, chaparral, oak, kelp, migrants)
ALL_CREATURES.push(...EXTENDED_CREATURES)

// Add California-wide expansion creatures (desert, alpine, valley, volcanic, etc.)
ALL_CREATURES.push(...CALIFORNIA_CREATURES)

// Add new species (desert, alpine, marine, mystic expansions)
ALL_CREATURES.push(...NEW_SPECIES)

// ============================================================
// BORDER CREATURES — rare spawns near state boundaries
// These appear on California tiles adjacent to neighboring states
// ============================================================
const BORDER_CREATURES: Creature[] = [
  {
    id: 'oregon-gray-wolf', name: 'Oregon Gray Wolf', scientificName: 'Canis lupus',
    description: 'A powerful gray wolf that has wandered south from Oregon packs. Extremely rare this far into California.',
    type: 'beast', rarity: 'legendary', biomes: ['forest', 'mountain', 'redwood'],
    subregions: ['Yreka', 'Jedediah Smith Redwoods', 'Modoc Plateau', 'Lava Beds'],
    stats: { hp: 95, maxHp: 95, attack: 42, defense: 30, speed: 38 },
    isFantasy: false, sprite: '🐺', color: '#6b7280',
    moves: [
      { name: 'Howling Strike', power: 35, type: 'attack', description: 'A ferocious lunge preceded by a chilling howl' },
      { name: 'Pack Tactics', power: 28, type: 'special', description: 'Calls phantom pack members to flank the opponent' },
      { name: 'Iron Hide', power: 0, type: 'defend', description: 'Thick northern fur absorbs incoming blows' },
    ],
    activeTime: ['dawn', 'dusk', 'night'],
    lore: 'Oregon\'s gray wolf population has slowly expanded since OR-7 famously crossed into California in 2011. These border wolves are scouts — the first of their kind seen in the Golden State in nearly a century. Hearing their howl echo across the Siskiyous at dusk is a once-in-a-lifetime encounter.',
  },
  {
    id: 'nevada-horned-lizard', name: 'Nevada Horned Lizard', scientificName: 'Phrynosoma platyrhinos',
    description: 'A desert-adapted horned lizard from the Great Basin, sometimes seen sunning on rocks near the Nevada border.',
    type: 'reptile', rarity: 'rare', biomes: ['desert', 'scrubland', 'dunes'],
    subregions: ['Death Valley', 'Mojave Desert', 'Badwater Basin', 'Lone Pine'],
    stats: { hp: 55, maxHp: 55, attack: 22, defense: 40, speed: 15 },
    isFantasy: false, sprite: '🦎', color: '#d97706',
    moves: [
      { name: 'Blood Squirt', power: 30, type: 'special', description: 'Shoots a stream of blood from its eyes to startle predators' },
      { name: 'Thorn Armor', power: 0, type: 'defend', description: 'Spiny scales deflect attacks' },
      { name: 'Sand Burrow', power: 20, type: 'attack', description: 'Digs under the sand and strikes from below' },
    ],
    activeTime: ['day'],
    activeWeather: ['sunny', 'clear'],
    lore: 'The desert horned lizard is the master of the Great Basin\'s alkaline flats. Its signature defense — squirting blood from the corners of its eyes — contains chemicals that taste foul to canine predators. They flatten their bodies against warm rocks at dawn, soaking up enough heat to fuel a day of ant-hunting.',
  },
  {
    id: 'arizona-condor', name: 'Arizona Condor', scientificName: 'Gymnogyps californianus',
    description: 'A California condor that ranges north from Arizona\'s reintroduction sites. Its 9.5-foot wingspan casts an unmistakable shadow.',
    type: 'bird', rarity: 'legendary', biomes: ['canyon', 'desert', 'mountain'],
    subregions: ['Mojave Desert', 'Death Valley', 'Mojave NP', 'Kelso Dunes'],
    stats: { hp: 85, maxHp: 85, attack: 35, defense: 25, speed: 40 },
    isFantasy: false, sprite: '🦅', color: '#1f2937',
    moves: [
      { name: 'Thermal Dive', power: 38, type: 'attack', description: 'Plummets from a thermal at terrifying speed' },
      { name: 'Wingspan Shadow', power: 25, type: 'special', description: 'Its massive shadow demoralizes opponents' },
      { name: 'Ancient Resilience', power: 0, type: 'defend', description: 'A species that survived extinction refuses to fall easily' },
    ],
    activeTime: ['day', 'dawn'],
    lore: 'The California condor nearly vanished — just 22 birds remained in 1987. Arizona\'s reintroduction program at Vermilion Cliffs has been one of conservation\'s greatest triumphs. These border-crossing condors carry wing tags and GPS transmitters. Spotting one soaring over the Mojave, its shadow rippling across the dunes, is proof that some comebacks are real.',
  },
  {
    id: 'great-basin-rattlesnake', name: 'Great Basin Rattlesnake', scientificName: 'Crotalus lutosus',
    description: 'A heavy-bodied rattlesnake from the sagebrush steppe of the Great Basin, found near Nevada\'s western border.',
    type: 'reptile', rarity: 'rare', biomes: ['scrubland', 'desert', 'grassland'],
    subregions: ['Modoc Plateau', 'Lava Beds', 'Bishop', 'Lone Pine'],
    stats: { hp: 65, maxHp: 65, attack: 38, defense: 28, speed: 22 },
    isFantasy: false, sprite: '🐍', color: '#78716c',
    moves: [
      { name: 'Venom Strike', power: 35, type: 'attack', description: 'A lightning-fast hemotoxic bite' },
      { name: 'Rattle Warning', power: 15, type: 'special', description: 'The buzzing rattle shakes the opponent\'s confidence' },
      { name: 'Coil Defense', power: 0, type: 'defend', description: 'Coils into a tight defensive posture' },
    ],
    activeTime: ['day', 'dusk'],
    activeWeather: ['sunny', 'clear'],
    lore: 'The Great Basin rattlesnake rules the sagebrush sea east of the Sierra. Unlike its western cousins, it has adapted to extreme temperature swings — from 110°F summer days to below-zero winter nights. It hibernates in communal dens called hibernacula, sometimes sharing space with hundreds of other snakes.',
  },
  {
    id: 'pronghorn-antelope', name: 'Pronghorn', scientificName: 'Antilocapra americana',
    description: 'The fastest land animal in the Western Hemisphere, occasionally seen crossing from Nevada\'s open ranges.',
    type: 'beast', rarity: 'rare', biomes: ['grassland', 'scrubland', 'desert'],
    subregions: ['Modoc Plateau', 'Lava Beds', 'Goose Lake', 'California Wilderness'],
    stats: { hp: 70, maxHp: 70, attack: 25, defense: 20, speed: 48 },
    isFantasy: false, sprite: '🦌', color: '#ca8a04',
    moves: [
      { name: 'Sprint Charge', power: 30, type: 'attack', description: 'Charges at 55 mph — faster than any predator' },
      { name: 'Horizon Dash', power: 0, type: 'defend', description: 'Outruns danger entirely with explosive speed' },
      { name: 'Prong Slash', power: 25, type: 'attack', description: 'Hooks with curved horn prongs' },
    ],
    activeTime: ['dawn', 'day'],
    lore: 'Pronghorn can sustain 55 mph sprints and cruise at 30 mph for miles — they evolved to outrun the now-extinct American cheetah. California\'s border herds migrate between Nevada\'s Great Basin and the Modoc Plateau, one of the longest remaining pronghorn migration corridors in the West.',
  },
  {
    id: 'gila-monster', name: 'Gila Monster', scientificName: 'Heloderma suspectum',
    description: 'One of only two venomous lizards in North America. Rarely seen north of the Mexican border region.',
    type: 'reptile', rarity: 'legendary', biomes: ['desert', 'canyon', 'scrubland'],
    subregions: ['Mojave Desert', 'Algodones Dunes', 'Kelso Dunes', 'Badwater Basin'],
    stats: { hp: 75, maxHp: 75, attack: 40, defense: 35, speed: 8 },
    isFantasy: false, sprite: '🦎', color: '#ea580c',
    moves: [
      { name: 'Venom Clamp', power: 40, type: 'attack', description: 'Locks its jaws and chews venom deep into the wound' },
      { name: 'Desert Patience', power: 0, type: 'defend', description: 'Remains perfectly still, waiting for the perfect moment' },
      { name: 'Tail Lash', power: 22, type: 'attack', description: 'Whips its heavy bead-scaled tail' },
    ],
    activeTime: ['night', 'dusk'],
    lore: 'The Gila monster spends 95% of its life underground, emerging only to feed and mate. Its venom — delivered by chewing rather than injecting — inspired the diabetes drug exenatide. A beaded mosaic of orange and black warns predators: this is one of the most ancient venomous animals in North America, unchanged for millions of years.',
  },
]
ALL_CREATURES.push(...BORDER_CREATURES)

// ============================================================
// LANDMARK CREATURES — unique encounters near specific landmarks
// ============================================================
export const LANDMARK_CREATURES: Creature[] = [
  {
    id: 'bridge-troll',
    name: 'Bridge Troll',
    scientificName: 'Pontus custos aurantiacus',
    description: 'A fog-wreathed stone sentinel that clings beneath the Golden Gate, waking only when the fog horns sound.',
    lore: 'Construction workers in 1935 reported something moving in the fog beneath the half-built bridge — a shape the color of International Orange that seemed to grow from the tower itself. The Bridge Troll has been part of the structure ever since, its stone hide indistinguishable from the bridge\'s riveted steel. It feeds on the vibrations of passing traffic and grows stronger when the fog horns blast.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['water', 'urban'],
    subregions: ['Golden Gate Strait', 'The Presidio', 'Marin Headlands'],
    stats: { hp: 70, maxHp: 70, attack: 45, defense: 55, speed: 15 },
    isFantasy: true,
    sprite: '🗿',
    color: '#cc3300',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Fog Horn Blast', power: 50, type: 'special', description: 'A deafening blast that echoes across the strait' },
      { name: 'Iron Hide', power: 0, type: 'defend', description: 'Hardens skin to match the bridge\'s steel' },
      { name: 'Rivet Strike', power: 40, type: 'attack', description: 'Launches red-hot rivets at the foe' },
    ],
  },
  {
    id: 'alcatraz-phantom',
    name: 'Alcatraz Phantom',
    scientificName: 'Spiritus carceris',
    description: 'A translucent figure that drifts through Alcatraz\'s empty cellblocks, rattling chains that aren\'t there.',
    lore: 'After the prison closed in 1963, night watchmen reported cold spots in Cell Block D and the sound of a banjo playing from Al Capone\'s old cell. The Alcatraz Phantom is believed to be a composite haunting — not one spirit but the residual energy of thousands of inmates, condensed into a single restless form. It cannot leave the island; the salt water contains it.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['water', 'urban'],
    subregions: ['San Francisco Bay'],
    stats: { hp: 55, maxHp: 55, attack: 42, defense: 30, speed: 45 },
    isFantasy: true,
    sprite: '👻',
    color: '#94a3b8',
    activeTime: ['night'],
    moves: [
      { name: 'Chain Rattle', power: 38, type: 'attack', description: 'Spectral chains lash out from the void' },
      { name: 'Cell Block Chill', power: 45, type: 'special', description: 'Drops the temperature to freezing' },
      { name: 'Phase Walk', power: 0, type: 'defend', description: 'Passes through walls, becoming untouchable' },
    ],
  },
  {
    id: 'hearst-zebroid',
    name: 'Hearst Zebroid',
    scientificName: 'Equus quagga hearstiensis',
    description: 'Descendant of the zebras that escaped William Randolph Hearst\'s private zoo. Adapted to the California hills.',
    lore: 'When Hearst Castle\'s private zoo closed, most animals were donated — but the zebras were simply released onto the surrounding ranchland. Their descendants still roam the hills above Highway 1 near San Simeon, startling drivers who don\'t expect to see African wildlife grazing above the Pacific. The Hearst Zebroids have grown shaggier coats for the coastal fog and developed a taste for California wild oats.',
    type: 'beast',
    rarity: 'rare',
    biomes: ['grassland', 'chaparral'],
    subregions: ['San Simeon', 'Cambria'],
    stats: { hp: 60, maxHp: 60, attack: 38, defense: 40, speed: 42 },
    isFantasy: false,
    sprite: '🦓',
    color: '#1c1917',
    activeTime: ['dawn', 'day', 'dusk'],
    moves: [
      { name: 'Stampede', power: 45, type: 'attack', description: 'Charges with the force of the herd' },
      { name: 'Dazzle Pattern', power: 0, type: 'defend', description: 'Stripes confuse the attacker\'s aim' },
      { name: 'Coastal Kick', power: 35, type: 'attack', description: 'A powerful hind-leg strike' },
    ],
  },
  {
    id: 'disney-cat',
    name: 'Park Cat',
    scientificName: 'Felis catus disneyensis',
    description: 'One of over 200 feral cats that secretly patrol Disneyland at night, keeping the mouse population in check.',
    lore: 'The irony is lost on no one: the kingdom of the Mouse is ruled at night by cats. Over 200 feral felines roam Disneyland after closing, fed and neutered by a dedicated cast member team. They\'re the park\'s most efficient pest control — and guests occasionally spot them slinking behind Sleeping Beauty\'s Castle at dusk. Disney\'s official position: no comment.',
    type: 'beast',
    rarity: 'uncommon',
    biomes: ['urban'],
    subregions: ['Anaheim'],
    stats: { hp: 30, maxHp: 30, attack: 28, defense: 20, speed: 45 },
    isFantasy: false,
    sprite: '🐈‍⬛',
    color: '#1e293b',
    activeTime: ['night', 'dusk'],
    moves: [
      { name: 'Silent Pounce', power: 32, type: 'attack', description: 'Strikes from the shadows with practiced stealth' },
      { name: 'Night Prowl', power: 0, type: 'defend', description: 'Vanishes into the park\'s hidden passages' },
      { name: 'Mouser\'s Bite', power: 25, type: 'attack', description: 'Quick, precise strike honed on nightly hunts' },
    ],
  },
  {
    id: 'bristlecone-elder',
    name: 'Bristlecone Elder',
    scientificName: 'Spiritus pinus longaeva',
    description: 'The spirit of the oldest living tree on Earth — a bristlecone pine that has witnessed 4,800 years of California history.',
    lore: 'The Ancient Bristlecone Pine Forest in the White Mountains holds trees older than the pyramids. Methuselah, the most famous, germinated around 2832 BCE. The Bristlecone Elder is the forest\'s collective consciousness — a slow, patient intelligence that thinks in centuries. It communicates through the creaking of wood and the patterns of its twisted grain. To battle it is to fight time itself.',
    type: 'plant',
    rarity: 'legendary',
    biomes: ['alpine', 'mountain'],
    subregions: ['Bishop', 'Lone Pine'],
    stats: { hp: 90, maxHp: 90, attack: 30, defense: 65, speed: 5 },
    isFantasy: true,
    sprite: '🌳',
    color: '#8b6914',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    moves: [
      { name: 'Ancient Roots', power: 50, type: 'attack', description: 'Roots older than civilization erupt from the earth' },
      { name: 'Bark of Ages', power: 0, type: 'defend', description: 'Millennial growth rings harden into impenetrable armor' },
      { name: 'Time Warp', power: 40, type: 'special', description: 'Distorts time around the foe, aging their resolve' },
    ],
  },
  {
    id: 'pupfish-guardian',
    name: 'Pupfish Guardian',
    scientificName: 'Cyprinodon diabolis magnificus',
    description: 'An enlarged, luminous desert pupfish that guards the last salt pools of Death Valley.',
    lore: 'The Devil\'s Hole pupfish is the rarest fish in the world — fewer than 200 survive in a single limestone cavern in the Nevada desert. The Pupfish Guardian is their mythical protector, a giant version that glows with the heat of the valley floor. It can survive water temperatures that would kill any other fish and has been spotted in the shallow salt pools of Badwater Basin during the hottest days of summer.',
    type: 'marine',
    rarity: 'rare',
    biomes: ['desert', 'dunes'],
    subregions: ['Death Valley', 'Badwater Basin'],
    stats: { hp: 45, maxHp: 45, attack: 35, defense: 30, speed: 38 },
    isFantasy: true,
    sprite: '🐟',
    color: '#06b6d4',
    activeTime: ['day'],
    moves: [
      { name: 'Salt Surge', power: 40, type: 'attack', description: 'Blasts concentrated brine at the foe' },
      { name: 'Heat Shimmer', power: 0, type: 'defend', description: 'Bends light and heat to become invisible' },
      { name: 'Desert Spring', power: 35, type: 'special', description: 'Summons precious water from deep underground' },
    ],
  },
  {
    id: 'morro-sentinel',
    name: 'Morro Sentinel',
    scientificName: 'Saxum custos morronis',
    description: 'A volcanic rock spirit that has guarded Morro Rock for 23 million years, since the plug first cooled.',
    lore: 'Morro Rock is the last of the Nine Sisters — a chain of volcanic plugs stretching from San Luis Obispo to the coast. The Sentinel is the rock\'s living heart, a being of compressed basalt and ancient fire. It stirs when peregrine falcons return to nest on the cliff face each spring, and sleeps through the winter storms. Chumash people called it the guardian of the bay.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['rocky_beach', 'mountain'],
    subregions: ['Morro Bay'],
    stats: { hp: 75, maxHp: 75, attack: 40, defense: 60, speed: 10 },
    isFantasy: true,
    sprite: '🗿',
    color: '#57534e',
    activeTime: ['dawn', 'day', 'dusk', 'night'],
    moves: [
      { name: 'Volcanic Pulse', power: 48, type: 'attack', description: 'Releases ancient magma energy through the ground' },
      { name: 'Stone Mantle', power: 0, type: 'defend', description: 'Encases itself in 23-million-year-old basalt' },
      { name: 'Peregrine Call', power: 35, type: 'special', description: 'Summons falcon allies with a resonating hum' },
    ],
  },
  {
    id: 'joshua-shade',
    name: 'Joshua Shade',
    scientificName: 'Umbra yuccae brevifolia',
    description: 'A spectral silhouette that appears beneath Joshua trees at twilight, shaped by the tree\'s twisted branches.',
    lore: 'Mormon settlers named the Joshua tree because its upraised branches reminded them of the prophet Joshua praying. But at sunset, those same branches cast shadows that seem to move independently of the wind. The Joshua Shade is the tree\'s dark twin — a being of pure contrast that exists only when light and dark meet. In the park\'s famous dark skies, it dances between the Milky Way and the desert floor.',
    type: 'mystic',
    rarity: 'rare',
    biomes: ['desert', 'scrubland'],
    subregions: ['Joshua Tree NP', 'Joshua Tree'],
    stats: { hp: 50, maxHp: 50, attack: 40, defense: 35, speed: 35 },
    isFantasy: true,
    sprite: '🌑',
    color: '#1e1b4b',
    activeTime: ['dusk', 'night'],
    moves: [
      { name: 'Shadow Branch', power: 38, type: 'attack', description: 'Twisted shadow limbs lash out' },
      { name: 'Desert Mirage', power: 0, type: 'defend', description: 'Blends into the heat shimmer, becoming untargetable' },
      { name: 'Starlight Drain', power: 42, type: 'special', description: 'Absorbs the starlight itself, darkening the sky' },
    ],
  },
]

ALL_CREATURES.push(...LANDMARK_CREATURES)

export const LANDMARK_SPAWNS: Record<string, { creatureIds: string[]; boost: number }> = {
  'Golden Gate Bridge': { creatureIds: ['bridge-troll', 'fog-serpent'], boost: 8 },
  'Alcatraz Island': { creatureIds: ['alcatraz-phantom', 'phantom-crab'], boost: 8 },
  'Hearst Castle': { creatureIds: ['hearst-zebroid'], boost: 10 },
  'Disneyland': { creatureIds: ['disney-cat'], boost: 10 },
  'Ancient Bristlecone Pine': { creatureIds: ['bristlecone-elder'], boost: 6 },
  'Death Valley': { creatureIds: ['pupfish-guardian'], boost: 8 },
  'Morro Rock': { creatureIds: ['morro-sentinel'], boost: 8 },
  'Joshua Tree': { creatureIds: ['joshua-shade'], boost: 8 },
  'Ghirardelli Square': { creatureIds: ['phantom-crab', 'fog-serpent'], boost: 5 },
  'Griffith Observatory': { creatureIds: ['ghost-moth'], boost: 6 },
  'Muir Woods': { creatureIds: ['ancient-gastropod'], boost: 6 },
  'Bixby Bridge': { creatureIds: ['california-condor'], boost: 8 },
  'Channel Islands NP': { creatureIds: ['angel-island-fox'], boost: 8 },
  'Yosemite Falls': { creatureIds: ['golden-eagle'], boost: 6 },
  'Mt. Whitney': { creatureIds: ['golden-eagle'], boost: 6 },
  'Winchester Mystery House': { creatureIds: ['mission-phantom'], boost: 8 },
  'Santa Barbara Mission': { creatureIds: ['mission-phantom'], boost: 6 },
  'Mission San Juan Capistrano': { creatureIds: ['mission-phantom'], boost: 6 },
  'Monterey Bay Aquarium': { creatureIds: ['tide-phantom'], boost: 5 },
  'Cannery Row': { creatureIds: ['tide-phantom'], boost: 5 },
  'Queen Mary': { creatureIds: ['alcatraz-phantom'], boost: 5 },
  'Half Dome': { creatureIds: ['golden-eagle'], boost: 6 },
  'Redwood National Park': { creatureIds: ['ancient-gastropod'], boost: 6 },
  'General Sherman Tree': { creatureIds: ['bristlecone-elder'], boost: 4 },
  'Palm Springs Tramway': { creatureIds: ['joshua-shade'], boost: 4 },
}

// ============================================================
// CONSERVATION DATA — backfills IUCN status, native/endemic flags,
// and seasonal migration windows onto existing creature entries.
// Applied at module load. Fantasy entries are flagged accordingly.
// ============================================================
interface ConservationEntry {
  conservationStatus: ConservationStatus
  isNative: boolean
  isEndemic?: boolean
  migrationWindow?: { startMonth: number; endMonth: number }
}

const CONSERVATION_DATA: Record<string, ConservationEntry> = {
  // --- Real Bay Area species ---
  'red-tailed-hawk':      { conservationStatus: 'LC', isNative: true },
  'california-newt':      { conservationStatus: 'LC', isNative: true, isEndemic: true },
  'mission-blue-butterfly': { conservationStatus: 'EN', isNative: true, isEndemic: true },
  'monarch-butterfly':      { conservationStatus: 'EN', isNative: true, migrationWindow: { startMonth: 9, endMonth: 1 } },
  'harbor-seal':          { conservationStatus: 'LC', isNative: true },
  'gray-fox':             { conservationStatus: 'LC', isNative: true },
  'banana-slug':          { conservationStatus: 'LC', isNative: true, isEndemic: true },
  'great-blue-heron':     { conservationStatus: 'LC', isNative: true },
  'coyote':               { conservationStatus: 'LC', isNative: true },
  'pacific-tree-frog':    { conservationStatus: 'LC', isNative: true },
  'western-fence-lizard': { conservationStatus: 'LC', isNative: true },
  'raccoon':              { conservationStatus: 'LC', isNative: true },
  'black-tailed-deer':    { conservationStatus: 'LC', isNative: true },
  'brown-pelican':        { conservationStatus: 'LC', isNative: true },
  'gopher-snake':         { conservationStatus: 'LC', isNative: true },
  'river-otter':          { conservationStatus: 'LC', isNative: true },
  'scrub-jay':            { conservationStatus: 'LC', isNative: true, isEndemic: true },
  'bobcat':               { conservationStatus: 'LC', isNative: true },
  'golden-eagle':         { conservationStatus: 'LC', isNative: true },
  'painted-lady-swarm':   { conservationStatus: 'LC', isNative: true },
  'tule-elk':             { conservationStatus: 'NT', isNative: true, isEndemic: true },
  'sandhill-crane':       { conservationStatus: 'LC', isNative: true, migrationWindow: { startMonth: 10, endMonth: 1 } },
  'california-condor':    { conservationStatus: 'CR', isNative: true, isEndemic: true },
  'mountain-lion':        { conservationStatus: 'LC', isNative: true },
  'giant-salamander':     { conservationStatus: 'NT', isNative: true },
  'sea-lion':             { conservationStatus: 'LC', isNative: true },
  'alcatraz-night-heron': { conservationStatus: 'LC', isNative: true },
  'angel-island-fox':     { conservationStatus: 'LC', isNative: true },
  'western-screech-owl':  { conservationStatus: 'LC', isNative: true },
  'bay-firefly':          { conservationStatus: 'LC', isNative: true },
  'nightjar':             { conservationStatus: 'LC', isNative: true },
  'wharf-pelican':        { conservationStatus: 'LC', isNative: true },
  'pyramid-peregrine':    { conservationStatus: 'LC', isNative: true },
  'oracle-splash-seal':   { conservationStatus: 'LC', isNative: true },
  'tam-summit-hawk':      { conservationStatus: 'LC', isNative: true },
  'storm-petrel':         { conservationStatus: 'LC', isNative: true },
  'pelican-diver':        { conservationStatus: 'LC', isNative: true },

  // --- Fantasy species (all flagged) ---
  'fog-serpent':         { conservationStatus: 'fantasy', isNative: true },
  'crystal-fox':         { conservationStatus: 'fantasy', isNative: true },
  'ember-salamander':    { conservationStatus: 'fantasy', isNative: true },
  'tide-phantom':        { conservationStatus: 'fantasy', isNative: true },
  'redwood-guardian':    { conservationStatus: 'fantasy', isNative: true },
  'bay-wisp':            { conservationStatus: 'fantasy', isNative: true },
  'silicon-sprite':      { conservationStatus: 'fantasy', isNative: true },
  'mission-phantom':     { conservationStatus: 'fantasy', isNative: true },
  'ancient-gastropod':   { conservationStatus: 'fantasy', isNative: true },
  'phantom-crab':        { conservationStatus: 'fantasy', isNative: true },
  'cell-block-specter':  { conservationStatus: 'fantasy', isNative: true },
  'rock-wraith':         { conservationStatus: 'fantasy', isNative: true },
  'fog-gull':            { conservationStatus: 'fantasy', isNative: true },
  'warden-of-the-rock':  { conservationStatus: 'fantasy', isNative: true },
  'immigration-spirit':  { conservationStatus: 'fantasy', isNative: true },
  'neon-rat':            { conservationStatus: 'INV', isNative: false }, // urban invasive variant
  'expo-golem':          { conservationStatus: 'fantasy', isNative: true },
  'ghost-moth':          { conservationStatus: 'fantasy', isNative: true },
  'midnight-coyote':     { conservationStatus: 'fantasy', isNative: true },
  'karl-fog-serpent':    { conservationStatus: 'fantasy', isNative: true },
  'redwood-sprite':      { conservationStatus: 'fantasy', isNative: true },
  'twin-peaks-fogcat':   { conservationStatus: 'fantasy', isNative: true },
  'surf-otter':          { conservationStatus: 'fantasy', isNative: true },
  'wave-spirit':         { conservationStatus: 'fantasy', isNative: true },
  'fog-wraith':          { conservationStatus: 'fantasy', isNative: true },
  'rain-salamander':     { conservationStatus: 'fantasy', isNative: true },
  'wind-hawk':           { conservationStatus: 'fantasy', isNative: true },
  'sun-sprite':          { conservationStatus: 'fantasy', isNative: true },
  'thunder-crab':        { conservationStatus: 'fantasy', isNative: true },
  // --- Nocturnal creatures ---
  'barn-owl':            { conservationStatus: 'LC', isNative: true },
  'ringtail-cat':        { conservationStatus: 'LC', isNative: true },
  'pacific-giant-salamander': { conservationStatus: 'LC', isNative: true },
  'western-harvest-mouse': { conservationStatus: 'EN', isNative: true, isEndemic: true },
  'pallid-bat':          { conservationStatus: 'LC', isNative: true },
  'moonfire-jellyfish':  { conservationStatus: 'fantasy', isNative: true },
  'shadow-heron':        { conservationStatus: 'fantasy', isNative: true },
  'starweaver-spider':   { conservationStatus: 'fantasy', isNative: true },
  'eclipse-moth':        { conservationStatus: 'fantasy', isNative: true },
  // --- Lunar bosses ---
  'lunar-titan':         { conservationStatus: 'fantasy', isNative: true },
  'selenar-wolf':        { conservationStatus: 'fantasy', isNative: true },
  'abyssal-leviathan':   { conservationStatus: 'fantasy', isNative: true },
  'phoenix-moth':        { conservationStatus: 'fantasy', isNative: true },
  // --- Shadow bosses ---
  'void-stalker':        { conservationStatus: 'fantasy', isNative: true },
  'dread-serpent':       { conservationStatus: 'fantasy', isNative: true },
  'umbral-kraken':       { conservationStatus: 'fantasy', isNative: true },
  'nightmare-stag':      { conservationStatus: 'fantasy', isNative: true },
  // Border creatures
  'oregon-gray-wolf':     { conservationStatus: 'EN', isNative: true },
  'nevada-horned-lizard': { conservationStatus: 'LC', isNative: false },
  'arizona-condor':       { conservationStatus: 'CR', isNative: true },
  'great-basin-rattlesnake': { conservationStatus: 'LC', isNative: false },
  'pronghorn-antelope':   { conservationStatus: 'LC', isNative: true },
  'gila-monster':         { conservationStatus: 'NT', isNative: false },
  'thunder-serpent':      { conservationStatus: 'fantasy', isNative: true },
  'static-sprite':        { conservationStatus: 'fantasy', isNative: true },
  'storm-heron':          { conservationStatus: 'VU', isNative: true },
  'bridge-troll':         { conservationStatus: 'fantasy', isNative: true },
  'alcatraz-phantom':     { conservationStatus: 'fantasy', isNative: true },
  'hearst-zebroid':       { conservationStatus: 'LC', isNative: false },
  'disney-cat':           { conservationStatus: 'LC', isNative: false },
  'bristlecone-elder':    { conservationStatus: 'fantasy', isNative: true },
  'pupfish-guardian':     { conservationStatus: 'fantasy', isNative: true },
  'morro-sentinel':       { conservationStatus: 'fantasy', isNative: true },
  'joshua-shade':         { conservationStatus: 'fantasy', isNative: true },
}

// Apply conservation data to every creature whose id is in the map.
// New creatures added via creaturesExtended will embed their own fields inline.
for (const c of ALL_CREATURES) {
  const data = CONSERVATION_DATA[c.id]
  if (!data) continue
  c.conservationStatus = data.conservationStatus
  c.isNative = data.isNative
  if (data.isEndemic !== undefined) c.isEndemic = data.isEndemic
  if (data.migrationWindow !== undefined) c.migrationWindow = data.migrationWindow
}

export function getCreaturesByBiome(biome: string): Creature[] {
  return ALL_CREATURES.filter(c => c.biomes.includes(biome as Creature['biomes'][number]))
}

/** Returns creature types that get a spawn boost in the given weather (3× weight). */
export function getWeatherBoostedTypes(weather: string): { type: string; count: number }[] {
  const typeCounts: Record<string, number> = {}
  for (const c of ALL_CREATURES) {
    if (c.activeWeather && (c.activeWeather as string[]).includes(weather)) {
      typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1
    }
  }
  return Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export const WEATHER_TYPE_BONUSES: Record<string, { types: string[]; multiplier: number; label: string }> = {
  rain:         { types: ['amphibian', 'marine', 'plant'], multiplier: 2, label: 'Amphibians, marine & plants thrive' },
  fog:          { types: ['mystic'],                       multiplier: 2.5, label: 'Mystic creatures emerge' },
  wind:         { types: ['bird', 'insect'],               multiplier: 1.8, label: 'Birds & insects ride the gusts' },
  sunny:        { types: ['reptile', 'insect', 'beast'],   multiplier: 1.5, label: 'Reptiles, insects & beasts bask' },
  thunderstorm: { types: ['mystic', 'amphibian', 'marine'], multiplier: 2.5, label: 'Storm energy surges — legendary +50%' },
}

function getWeatherTypeBonus(weather: string | undefined, creatureType: string): number {
  if (!weather) return 1
  const bonus = WEATHER_TYPE_BONUSES[weather]
  if (!bonus) return 1
  return bonus.types.includes(creatureType) ? bonus.multiplier : 1
}

export const TIME_RARITY_BONUSES: Record<string, { common: number; uncommon: number; rare: number; legendary: number; label: string; icon: string }> = {
  dawn:  { common: 0.7, uncommon: 1.2, rare: 1.5, legendary: 2.0, label: 'Rare & legendary creatures stir at dawn', icon: '🌅' },
  day:   { common: 1.0, uncommon: 1.0, rare: 1.0, legendary: 1.0, label: 'Standard encounter rates', icon: '☀️' },
  dusk:  { common: 0.8, uncommon: 1.3, rare: 1.8, legendary: 1.5, label: 'Rare creatures emerge at dusk', icon: '🌇' },
  night: { common: 0.6, uncommon: 1.0, rare: 2.0, legendary: 2.5, label: 'Legendary creatures prowl the night', icon: '🌙' },
}

function getTimeRarityMultiplier(timeOfDay: string | undefined, rarity: string): number {
  if (!timeOfDay) return 1
  const bonus = TIME_RARITY_BONUSES[timeOfDay]
  if (!bonus) return 1
  const multipliers: Record<string, number> = { common: bonus.common, uncommon: bonus.uncommon, rare: bonus.rare, legendary: bonus.legendary }
  return multipliers[rarity] ?? 1
}

// === MOON PHASE SYSTEM ===
// 30-day lunar cycle (12 full cycles per 360-day game year)
export interface MoonPhase {
  name: string
  icon: string
  mysticMultiplier: number
  legendaryMultiplier: number
  label: string
}

const MOON_PHASES: MoonPhase[] = [
  { name: 'New Moon',        icon: '🌑', mysticMultiplier: 1.8, legendaryMultiplier: 1.3, label: 'Mystic creatures stir in the darkness' },
  { name: 'Waxing Crescent', icon: '🌒', mysticMultiplier: 1.0, legendaryMultiplier: 1.0, label: 'Standard encounter rates' },
  { name: 'First Quarter',   icon: '🌓', mysticMultiplier: 1.2, legendaryMultiplier: 1.0, label: 'Slight mystic activity increase' },
  { name: 'Waxing Gibbous',  icon: '🌔', mysticMultiplier: 1.4, legendaryMultiplier: 1.2, label: 'Mystic energy building' },
  { name: 'Full Moon',       icon: '🌕', mysticMultiplier: 2.5, legendaryMultiplier: 2.0, label: 'Mystic and legendary creatures surge' },
  { name: 'Waning Gibbous',  icon: '🌖', mysticMultiplier: 1.4, legendaryMultiplier: 1.2, label: 'Residual mystic energy lingers' },
  { name: 'Last Quarter',    icon: '🌗', mysticMultiplier: 1.2, legendaryMultiplier: 1.0, label: 'Slight mystic activity increase' },
  { name: 'Waning Crescent', icon: '🌘', mysticMultiplier: 1.0, legendaryMultiplier: 1.0, label: 'Standard encounter rates' },
]

export function getMoonPhase(gameDay: number): MoonPhase {
  const dayInCycle = ((gameDay % 30) + 30) % 30
  const phaseIndex = Math.floor(dayInCycle / 3.75)
  return MOON_PHASES[Math.min(phaseIndex, 7)]
}

export function getMoonMultiplier(gameDay: number | undefined, creatureType: string, rarity: string): number {
  if (gameDay === undefined) return 1
  const phase = getMoonPhase(gameDay)
  let mult = 1
  if (creatureType === 'mystic') mult *= phase.mysticMultiplier
  if (rarity === 'legendary') mult *= phase.legendaryMultiplier
  return mult
}

export function getRandomEncounter(biome: string, subregion?: string, timeOfDay?: string, weather?: string, gameDay?: number, playerPos?: { x: number; y: number }): Creature | null {
  const isActive = (c: Creature) => {
    if (!timeOfDay || !c.activeTime || c.activeTime.length === 0) {
      // time check passes
    } else if (!(c.activeTime as string[]).includes(timeOfDay)) {
      return false
    }
    if (c.activeWeather && c.activeWeather.length > 0) {
      if (!weather || !(c.activeWeather as string[]).includes(weather)) return false
    }
    if (c.migrationWindow) {
      const day = ((gameDay ?? 0) % 360 + 360) % 360
      const month = Math.floor(day / 30) % 12
      const { startMonth, endMonth } = c.migrationWindow
      const inWindow = startMonth <= endMonth
        ? (month >= startMonth && month <= endMonth)
        : (month >= startMonth || month <= endMonth)
      if (!inWindow) return false
    }
    return true
  }

  const pool = ALL_CREATURES

  // Landmark creature injection: if near a landmark, add its creatures with high weight
  const landmarkCreatures: { creature: Creature; boost: number }[] = []
  if (playerPos) {
    for (const lm of LANDMARKS) {
      const dx = playerPos.x - lm.x, dy = playerPos.y - lm.y
      if (dx * dx + dy * dy <= 9) { // within 3 tiles
        const spawns = LANDMARK_SPAWNS[lm.name]
        if (spawns) {
          for (const cid of spawns.creatureIds) {
            const creature = pool.find((c: Creature) => c.id === cid)
            if (creature && isActive(creature)) {
              landmarkCreatures.push({ creature, boost: spawns.boost })
            }
          }
        }
      }
    }
  }

  // Try subregion-specific creatures first
  if (subregion) {
    const subregionMatches = pool.filter(
      c => c.biomes.includes(biome as Creature['biomes'][number]) && c.subregions.includes(subregion) && isActive(c)
    )
    if (subregionMatches.length > 0 || landmarkCreatures.length > 0) {
      const weighted: Creature[] = []
      for (const c of subregionMatches) {
        const activeWeatherBonus = (c.activeWeather && weather && (c.activeWeather as string[]).includes(weather)) ? 3 : 1
        const typeBonus = getWeatherTypeBonus(weather, c.type)
        const timeBonus = getTimeRarityMultiplier(timeOfDay, c.rarity)
        const moonBonus = getMoonMultiplier(gameDay, c.type, c.rarity)
        const stormLegendary = (weather === 'thunderstorm' && (c.rarity === 'legendary' || c.rarity === 'rare')) ? 1.5 : 1
        const weight = Math.max(1, Math.round((c.rarity === 'common' ? 8 : c.rarity === 'uncommon' ? 4 : c.rarity === 'rare' ? 2 : 1) * activeWeatherBonus * typeBonus * timeBonus * moonBonus * stormLegendary))
        for (let i = 0; i < weight; i++) weighted.push(c)
      }
      for (const { creature, boost } of landmarkCreatures) {
        for (let i = 0; i < boost; i++) weighted.push(creature)
      }
      if (weighted.length > 0) return weighted[Math.floor(Math.random() * weighted.length)]
    }
  }

  // Fall back to biome-only filtering
  const available = getCreaturesByBiome(biome).filter(isActive)
  if (available.length === 0 && landmarkCreatures.length === 0) return null

  const weighted: Creature[] = []
  for (const c of available) {
    const activeWeatherBonus = (c.activeWeather && weather && (c.activeWeather as string[]).includes(weather)) ? 3 : 1
    const typeBonus = getWeatherTypeBonus(weather, c.type)
    const timeBonus = getTimeRarityMultiplier(timeOfDay, c.rarity)
    const moonBonus = getMoonMultiplier(gameDay, c.type, c.rarity)
    const weight = Math.round((c.rarity === 'common' ? 8 : c.rarity === 'uncommon' ? 4 : c.rarity === 'rare' ? 2 : 1) * activeWeatherBonus * typeBonus * timeBonus * moonBonus)
    for (let i = 0; i < weight; i++) weighted.push(c)
  }
  for (const { creature, boost } of landmarkCreatures) {
    for (let i = 0; i < boost; i++) weighted.push(creature)
  }

  return weighted[Math.floor(Math.random() * weighted.length)]
}

export function isFullMoon(gameDay: number): boolean {
  const phase = getMoonPhase(gameDay)
  return phase.name === 'Full Moon'
}

export function isNewMoon(gameDay: number): boolean {
  const phase = getMoonPhase(gameDay)
  return phase.name === 'New Moon'
}

export function getLunarBoss(biome: string, subregion?: string): Creature | null {
  const candidates = LUNAR_BOSSES.filter(c => {
    if (subregion && c.subregions.includes(subregion)) return true
    return c.biomes.includes(biome as Creature['biomes'][number])
  })
  if (candidates.length === 0) return LUNAR_BOSSES[Math.floor(Math.random() * LUNAR_BOSSES.length)]
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function getShadowBoss(biome: string, subregion?: string): Creature | null {
  const candidates = SHADOW_BOSSES.filter(c => {
    if (subregion && c.subregions.includes(subregion)) return true
    return c.biomes.includes(biome as Creature['biomes'][number])
  })
  if (candidates.length === 0) return SHADOW_BOSSES[Math.floor(Math.random() * SHADOW_BOSSES.length)]
  return candidates[Math.floor(Math.random() * candidates.length)]
}
