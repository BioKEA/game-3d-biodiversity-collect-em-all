import type { BiomeType } from '@/types/game'

/**
 * Field notes unlock progressively as the player catches creatures from a biome.
 * Each note has a unlock threshold (count of unique species caught from that biome).
 */

export interface FieldNote {
  threshold: number // unique species caught from this biome
  title: string
  text: string
}

export interface BiomeFieldNotes {
  biome: BiomeType
  label: string
  icon: string
  color: string
  notes: FieldNote[]
}

export const BIOME_FIELD_NOTES: Record<BiomeType, BiomeFieldNotes> = {
  forest: {
    biome: 'forest',
    label: 'Forest',
    icon: '🌲',
    color: '#16a34a',
    notes: [
      { threshold: 1, title: 'Canopy Layers', text: 'A Bay Area forest is a four-story building: forest floor, understory, midstory, and canopy. Each layer hosts different creatures.' },
      { threshold: 3, title: 'Leaf Litter Is Alive', text: 'The top inch of forest soil contains thousands of mites, collembola, and fungi per square foot — breaking down leaves into new soil.' },
      { threshold: 5, title: 'Trophic Cascade', text: 'When top predators vanish, deer overbrowse saplings, insects explode, and the whole forest unravels. Presence of hawks and foxes signals ecosystem health.' },
      { threshold: 8, title: 'Succession', text: 'After a fire, grasses come first, then shrubs, then pioneer trees like ceanothus and bay laurel. A mature oak-bay forest takes 80+ years to recover.' },
    ],
  },
  redwood: {
    biome: 'redwood',
    label: 'Redwood',
    icon: '🌳',
    color: '#166534',
    notes: [
      { threshold: 1, title: 'Fog Drip', text: 'Coast redwoods drink fog. Their needles comb moisture from coastal fog, adding up to 40% of their annual water intake. No fog, no redwoods.' },
      { threshold: 3, title: 'Burl Clones', text: 'If a redwood falls, it sends up new trunks from the burl at its base — genetically identical to the parent. Some fairy rings are over 2,000 years old as a single organism.' },
      { threshold: 5, title: 'Albino Redwoods', text: 'Roughly 400 ghostly-white redwoods exist worldwide — mutants lacking chlorophyll that survive by parasitizing their parent trees. Their locations are kept secret.' },
      { threshold: 8, title: 'Canopy Soil', text: 'High in redwood canopies, decomposing needles form soil mats supporting ferns, huckleberries, and even salamanders that never touch the ground in their entire lives.' },
    ],
  },
  grassland: {
    biome: 'grassland',
    label: 'Grassland',
    icon: '🌾',
    color: '#84cc16',
    notes: [
      { threshold: 1, title: 'Mostly Invasive', text: 'Today\'s "California grasslands" are 90% non-native wild oats and filaree from Europe — introduced by Spanish missions. Native perennial bunchgrasses are now rare.' },
      { threshold: 3, title: 'Gopher Architects', text: 'Pocket gophers turn over 8 tons of soil per acre per year, aerating, mixing nutrients, and creating the mounds where wildflowers thrive.' },
      { threshold: 5, title: 'Vernal Pools', text: 'Seasonal rain pools in Bay Area grasslands host unique fairy shrimp and endemic wildflowers found nowhere else. They fill in winter and dry by summer.' },
      { threshold: 8, title: 'Fire-Adapted', text: 'California grasslands evolved with lightning and Indigenous burning. Suppressing fire lets shrubs invade, erasing the open prairies deer and elk depend on.' },
    ],
  },
  marsh: {
    biome: 'marsh',
    label: 'Marsh',
    icon: '🪴',
    color: '#0891b2',
    notes: [
      { threshold: 1, title: 'Filter and Buffer', text: 'Bay marshes filter pollution from runoff and buffer the shore from storms. An acre of salt marsh absorbs more carbon than the same acre of forest.' },
      { threshold: 3, title: '90% Lost', text: 'Only 10% of the original San Francisco Bay marshland survives. The rest was diked, drained, and paved. Restoration is clawing some back.' },
      { threshold: 5, title: 'Tidal Rhythm', text: 'Marsh creatures live on a lunar clock. Snails climb stalks at high tide, crabs burrow at low tide, rails feed at dawn. Everything is timed to the water.' },
      { threshold: 8, title: 'Salt Tolerance', text: 'Marsh plants like pickleweed have specialized cells that store excess salt in their tips, then drop them off. The stems turn red as they approach saturation.' },
    ],
  },
  beach: {
    biome: 'beach',
    label: 'Beach',
    icon: '🏖️',
    color: '#fbbf24',
    notes: [
      { threshold: 1, title: 'The Wrack Line', text: 'That seaweed-and-debris stripe at high tide is called the wrack line. It feeds shorebirds, beach hoppers, and kelp flies — the base of the beach food chain.' },
      { threshold: 3, title: 'Sand Grains Tell Stories', text: 'Bay Area beach sand is a mix of eroded granite from the Sierra, crushed shell fragments, and dark magnetite from local basalt. Pick it up with a magnet — it sticks.' },
      { threshold: 5, title: 'Snowy Plover Decline', text: 'Western snowy plovers nest directly on open sand. Loose dogs, beach driving, and habitat loss have pushed them onto the Endangered Species List.' },
      { threshold: 8, title: 'Longshore Drift', text: 'Sand doesn\'t stay put. Waves hit the beach at an angle and push grains along the coast — millions of tons travel from Marin south to Half Moon Bay every year.' },
    ],
  },
  rocky_beach: {
    biome: 'rocky_beach',
    label: 'Rocky Shore',
    icon: '🪨',
    color: '#a8a29e',
    notes: [
      { threshold: 1, title: 'Sea Arches', text: 'Waves exploit cracks in sandstone cliffs, carving caves that punch through to become arches. Natural Bridges once had three — now just one remains.' },
      { threshold: 3, title: 'Intertidal Zones', text: 'Rocky shores stack life in bands: splash, high, mid, low. Each zone is a different mix of barnacles, mussels, anemones, and algae, set by how long each tile stays wet.' },
      { threshold: 5, title: 'Keystone Stars', text: 'Ochre sea stars eat mussels. Remove the stars and mussels blanket everything else out. A single predator shapes the entire community — the origin of the "keystone species" idea.' },
      { threshold: 8, title: 'Wave Energy', text: 'A breaking wave on a rocky coast delivers up to 10 tons per square meter of force. Every creature here is built to cling, clamp, or hide in the lee of a boulder.' },
    ],
  },
  urban: {
    biome: 'urban',
    label: 'Urban',
    icon: '🏙️',
    color: '#64748b',
    notes: [
      { threshold: 1, title: 'Novel Ecosystem', text: 'A city is not the absence of nature — it\'s a brand-new ecosystem. Peregrine falcons nest on skyscrapers. Coyotes patrol alleys. Raccoons raid dumpsters. Life adapts.' },
      { threshold: 3, title: 'Heat Islands', text: 'Asphalt absorbs sun and cities run 5–10°F hotter than surrounding land. This shifts bloom times, drives insects north, and stresses street trees.' },
      { threshold: 5, title: 'Light Pollution', text: 'Streetlights confuse migrating birds — they crash into lit windows or circle until exhausted. Lights Out programs dim buildings during migration peaks.' },
      { threshold: 8, title: 'Pollinator Highways', text: 'Small native plantings in yards and parking strips stitch together a pollinator corridor through the city. Every pocket matters.' },
    ],
  },
  water: {
    biome: 'water',
    label: 'Open Water',
    icon: '🌊',
    color: '#0284c7',
    notes: [
      { threshold: 1, title: 'Estuary Mixing', text: 'Where the Sacramento meets the ocean is one of the most productive estuaries on Earth. Fresh and salt water layer like oil and vinegar, feeding a huge food web.' },
      { threshold: 3, title: 'Plankton Bloom', text: 'In spring, diatoms and dinoflagellates explode in sunlit surface waters. This bloom feeds everything from anchovies to blue whales.' },
      { threshold: 5, title: 'Dead Zones', text: 'When nutrient runoff overfeeds algae, the decomposing bloom sucks oxygen from the water, killing fish. The Bay has its own small dead zones each summer.' },
      { threshold: 8, title: 'Acidification', text: 'The ocean absorbs a quarter of human CO₂ emissions, and that changes water chemistry. Oyster larvae already struggle to form shells in Pacific hatcheries.' },
    ],
  },
  mountain: {
    biome: 'mountain',
    label: 'Mountain',
    icon: '⛰️',
    color: '#78716c',
    notes: [
      { threshold: 1, title: 'Rain Shadow', text: 'Mt. Diablo blocks Pacific storms, creating a dry eastern leeward side. One mountain can separate wet Douglas-fir forest from parched chaparral in a mile.' },
      { threshold: 3, title: 'Elevation Bands', text: 'Climb 1,000 feet and you gain the equivalent of 600 miles north. Mountain slopes are ecosystem escalators, stacking biomes from grassland to fir.' },
      { threshold: 5, title: 'Serpentine Soils', text: 'Mt. Tam and Mt. Diablo sit on serpentine rock — toxic to most plants. The weirdos that tolerate it are often endemic and found nowhere else.' },
      { threshold: 8, title: 'Genetic Islands', text: 'Mountain-top species are trapped as the climate warms. They can\'t migrate uphill anymore — and shifting plant communities strand them in shrinking habitats.' },
    ],
  },
  tidepool: {
    biome: 'tidepool',
    label: 'Tidepool',
    icon: '🦀',
    color: '#0d9488',
    notes: [
      { threshold: 1, title: 'Zonation', text: 'Tidepools stack life in stripes. High zone: barnacles and periwinkles (tough, dry-tolerant). Mid zone: mussels and limpets. Low zone: anemones and urchins (can\'t dry out).' },
      { threshold: 3, title: 'Keystone Species', text: 'Pisaster sea stars were the original "keystone species" — remove them from a tidepool and mussels take over, smothering every other species.' },
      { threshold: 5, title: 'Sea Star Wasting', text: 'Starting in 2013, a mysterious disease melted millions of Pacific sea stars into white goo. Populations are slowly recovering but still depressed.' },
      { threshold: 8, title: 'Marine Protected Areas', text: 'Fitzgerald Marine Reserve near Moss Beach is a no-take zone — you can look but not collect. Within the boundary, biodiversity is visibly higher than outside.' },
    ],
  },
  chaparral: {
    biome: 'chaparral',
    label: 'Chaparral',
    icon: '🌵',
    color: '#ca8a04',
    notes: [
      { threshold: 1, title: 'Fire-Dependent', text: 'Chaparral shrubs don\'t just survive fire — they require it. Manzanita seeds won\'t germinate without heat and smoke. Long fire suppression kills this ecosystem.' },
      { threshold: 3, title: 'Allelopathy', text: 'Some chaparral shrubs leak chemicals from their leaves that prevent competitors from germinating nearby. That bare ring around a sagebrush isn\'t by accident.' },
      { threshold: 5, title: 'Bird Diversity', text: 'California chaparral hosts specialized birds — wrentit, California thrasher, sage sparrow — that exist almost nowhere else. The soundscape is unique.' },
      { threshold: 8, title: 'Lignotubers', text: 'Chaparral shrubs store energy in underground swellings called lignotubers. After fire, they resprout from these underground reserves within weeks.' },
    ],
  },
  oak_woodland: {
    biome: 'oak_woodland',
    label: 'Oak Woodland',
    icon: '🌳',
    color: '#a16207',
    notes: [
      { threshold: 1, title: 'Keystone Trees', text: 'Oaks are the Bay Area\'s most biodiverse habitat. A single valley oak supports over 5,000 species of insects, birds, mammals, lichens, and fungi.' },
      { threshold: 3, title: 'Acorn Economy', text: 'A mature oak drops thousands of acorns a year. Scrub jays cache them, woodpeckers granary them, deer and bears fatten on them. Miss a mast year, miss a generation.' },
      { threshold: 5, title: 'Sudden Oak Death', text: 'A pathogen introduced from Europe in the 1990s has killed millions of Bay Area oaks. Tanoaks and coast live oaks die in days; the ripple effects last decades.' },
      { threshold: 8, title: 'Mycorrhizal Networks', text: 'Oak roots are wired into fungal networks that share nutrients and water tree-to-tree. Old oaks feed their saplings through this underground "wood wide web".' },
    ],
  },
  kelp_forest: {
    biome: 'kelp_forest',
    label: 'Kelp Forest',
    icon: '🌿',
    color: '#15803d',
    notes: [
      { threshold: 1, title: 'Fastest Growing', text: 'Giant kelp can grow two feet per day — faster than any land plant on Earth. A single stipe can reach 100 feet and live several years.' },
      { threshold: 3, title: 'Urchin Barrens', text: 'When otters are removed, urchins multiply and mow kelp forests down to bare rock. These "urchin barrens" can persist for decades and support almost nothing.' },
      { threshold: 5, title: 'Carbon Sink', text: 'Kelp forests sequester carbon like rainforests. California\'s coastal kelp once stored millions of tons annually — before 95% of it collapsed in 2014.' },
      { threshold: 8, title: 'Three-Story Forest', text: 'Kelp has a canopy (surface fronds), understory (mid-water blades), and floor (holdfast). Each layer hosts different fish and invertebrates — just like a rainforest.' },
    ],
  },
  desert: {
    biome: 'desert',
    label: 'Desert',
    icon: '🏜️',
    color: '#d4a574',
    notes: [
      { threshold: 1, title: 'Not Empty', text: 'The Mojave and Colorado deserts support over 2,000 plant species. Most life hides underground by day and emerges at night.' },
      { threshold: 3, title: 'Desert Varnish', text: 'The dark coating on desert rocks is a living biofilm of bacteria and manganese oxide, growing at a fraction of a millimeter per millennium.' },
      { threshold: 5, title: 'Superbloom', text: 'After rare heavy rains, dormant seeds burst into carpets of wildflowers. Some seeds wait 20+ years for the right conditions.' },
    ],
  },
  alpine: {
    biome: 'alpine',
    label: 'Alpine',
    icon: '🏔️',
    color: '#94a3b8',
    notes: [
      { threshold: 1, title: 'Above Treeline', text: 'Alpine zones begin where trees can no longer grow — around 10,000 feet in the Sierra Nevada. Wind, cold, and UV shape everything here.' },
      { threshold: 3, title: 'Cushion Plants', text: 'Alpine plants grow in tight domes that trap heat, block wind, and create their own microclimate. Some are centuries old and only inches tall.' },
      { threshold: 5, title: 'Pika Haystacks', text: 'American pikas gather wildflowers into "haystacks" to dry for winter food. They cannot survive body temps above 78°F — climate change threatens them.' },
    ],
  },
  snow: {
    biome: 'snow',
    label: 'Snowfield',
    icon: '❄️',
    color: '#e2e8f0',
    notes: [
      { threshold: 1, title: 'Watermelon Snow', text: 'Pink-tinted snow on Sierra peaks is colored by Chlamydomonas algae. The pigment protects the algae from UV light at extreme altitude.' },
      { threshold: 3, title: 'Snow Ecology', text: 'The subnivean zone — the space between snowpack and ground — stays near 32°F all winter, sheltering voles, shrews, and insects from lethal surface cold.' },
    ],
  },
  valley: {
    biome: 'valley',
    label: 'Valley',
    icon: '🌾',
    color: '#7cb342',
    notes: [
      { threshold: 1, title: 'Breadbasket', text: 'California\'s Central Valley produces 25% of America\'s food on 1% of its farmland — the most productive agricultural region on Earth.' },
      { threshold: 3, title: 'Lost Wetlands', text: 'Before agriculture, the Valley floor was a vast seasonal wetland. Tulare Lake was the largest freshwater lake west of the Mississippi — now completely drained.' },
      { threshold: 5, title: 'Flyway Funnel', text: 'The Pacific Flyway channels millions of birds through the Valley each fall. Remaining wetlands in the Sacramento Delta are critical stopover habitat.' },
    ],
  },
  volcanic: {
    biome: 'volcanic',
    label: 'Volcanic',
    icon: '🌋',
    color: '#5c4033',
    notes: [
      { threshold: 1, title: 'Still Active', text: 'Lassen Peak last erupted in 1915 — the most recent eruption in the contiguous US before Mt. St. Helens. Bumpass Hell still boils with fumaroles and mudpots.' },
      { threshold: 3, title: 'Primary Succession', text: 'On fresh lava flows, lichens arrive first, cracking rock into soil over centuries. Mosses follow, then grasses, then shrubs — a slow-motion colonization.' },
    ],
  },
  scrubland: {
    biome: 'scrubland',
    label: 'Scrubland',
    icon: '🌿',
    color: '#c4a882',
    notes: [
      { threshold: 1, title: 'Sagebrush Sea', text: 'The Great Basin sagebrush ecosystem once stretched unbroken from the Sierra east. Each bush can live 100+ years and hosts specialized insects found nowhere else.' },
      { threshold: 3, title: 'Cryptobiotic Crust', text: 'The dark, lumpy soil crust between shrubs is alive — cyanobacteria, mosses, and fungi that fix nitrogen and prevent erosion. A single footstep destroys decades of growth.' },
    ],
  },
  dunes: {
    biome: 'dunes',
    label: 'Sand Dunes',
    icon: '🏖️',
    color: '#e8d5a3',
    notes: [
      { threshold: 1, title: 'Singing Sand', text: 'The Kelso Dunes in the Mojave produce a deep humming sound when sand avalanches down steep slopes — caused by uniform grain size creating resonant vibrations.' },
      { threshold: 3, title: 'Dune Ecology', text: 'Dune systems support specialized beetles, lizards, and plants found nowhere else. The Algodones Dunes harbor several endemic species adapted to shifting sand.' },
    ],
  },
  canyon: {
    biome: 'canyon',
    label: 'Canyon',
    icon: '🏜️',
    color: '#c07040',
    notes: [
      { threshold: 1, title: 'Layer Cake', text: 'Canyon walls expose millions of years of geological history in colorful strata. Death Valley\'s canyons show rocks from the Precambrian — over 1.7 billion years old.' },
      { threshold: 3, title: 'Flash Floods', text: 'Narrow slot canyons can fill wall-to-wall in minutes from a storm miles away. These violent floods also carve the canyon deeper and redistribute nutrients.' },
    ],
  },
  lakeshore: {
    biome: 'lakeshore',
    label: 'Lakeshore',
    icon: '🏞️',
    color: '#5da87e',
    notes: [
      { threshold: 1, title: 'Transition Zone', text: 'Lake edges are ecological hotspots where aquatic and terrestrial food webs overlap. More species per square foot than either pure land or pure water habitat.' },
      { threshold: 3, title: 'Mono Lake Brine', text: 'Mono Lake is 2.5x saltier than the ocean and supports trillions of brine shrimp and alkali flies — the base of a food web feeding millions of migratory birds.' },
    ],
  },
  old_growth: {
    biome: 'old_growth',
    label: 'Old Growth',
    icon: '🌲',
    color: '#0d4a20',
    notes: [
      { threshold: 1, title: 'Cathedral Groves', text: 'Old-growth giant sequoias can be over 3,000 years old and 30 feet in diameter. Their bark is fireproof, their crowns touch the sky, and their root systems span acres.' },
      { threshold: 3, title: 'Irreplaceable', text: 'Less than 5% of California\'s original old-growth forest remains. These groves took millennia to develop and cannot be replicated by planting — the ecosystem complexity is irreproducible.' },
      { threshold: 5, title: 'Living Skyscrapers', text: 'A single old-growth tree is an ecosystem: its canopy hosts ferns, salamanders, and flying squirrels. Some branches collect enough soil to grow other trees.' },
    ],
  },
}

/** Count unique species caught from a specific biome, given the player's captured id list. */
export function getBiomeCatchSpeciesCount(
  biome: BiomeType,
  capturedIds: string[],
  creatureLookup: Map<string, { biomes: import('@/types/game').BiomeType[] }>,
): number {
  const unique = new Set<string>()
  for (const id of capturedIds) {
    const c = creatureLookup.get(id)
    if (c && c.biomes.includes(biome)) unique.add(id)
  }
  return unique.size
}

/** Total notes + unlocked notes across all biomes */
export function getTotalProgress(
  capturedIds: string[],
  creatureLookup: Map<string, { biomes: import('@/types/game').BiomeType[] }>,
): { unlocked: number; total: number } {
  let unlocked = 0
  let total = 0
  for (const biome of Object.keys(BIOME_FIELD_NOTES) as BiomeType[]) {
    const bn = BIOME_FIELD_NOTES[biome]
    total += bn.notes.length
    const count = getBiomeCatchSpeciesCount(biome, capturedIds, creatureLookup)
    for (const n of bn.notes) {
      if (count >= n.threshold) unlocked++
    }
  }
  return { unlocked, total }
}
