// Landmark data shared between renderers
export interface LandmarkDef {
  x: number; y: number
  name: string
  color: string      // primary building color
  accent: string     // roof/trim color
  label: string      // short label
  height: number     // building height in pixels (used as scale factor in 3D)
  width: number      // building half-width (used as scale factor in 3D)
  glow: string       // glow color
  emoji?: string     // optional icon
}

export const LANDMARKS: LandmarkDef[] = [
  // Universities
  { x: 64, y: 215, name: 'UC Berkeley', color: '#1e3a5f', accent: '#fdb515', label: 'Cal', height: 18, width: 7, glow: '#fdb515', emoji: '🏛' },
  { x: 54, y: 230, name: 'Stanford', color: '#8c1515', accent: '#f4e6c2', label: 'Stanford', height: 16, width: 7, glow: '#8c1515', emoji: '🌴' },
  { x: 52, y: 220, name: 'UCSF', color: '#052049', accent: '#00629b', label: 'UCSF', height: 14, width: 6, glow: '#00629b', emoji: '🏥' },
  { x: 50, y: 222, name: 'SFSU', color: '#46166b', accent: '#c4a747', label: 'SFSU', height: 12, width: 6, glow: '#c4a747', emoji: '🎓' },
  // Tech companies
  { x: 52, y: 219, name: 'Anthropic', color: '#d4a574', accent: '#1a1a2e', label: 'Anthropic', height: 16, width: 6, glow: '#d4a574', emoji: '🧠' },
  { x: 55, y: 231, name: 'Google', color: '#4285f4', accent: '#ea4335', label: 'Google', height: 14, width: 7, glow: '#4285f4', emoji: '🔍' },
  { x: 57, y: 232, name: 'NVIDIA', color: '#76b900', accent: '#1a1a1a', label: 'NVIDIA', height: 15, width: 7, glow: '#76b900', emoji: '💚' },
  { x: 55, y: 232, name: 'Apple', color: '#a3a3a3', accent: '#f5f5f5', label: 'Apple', height: 10, width: 8, glow: '#a3a3a3', emoji: '🍎' },
  { x: 55, y: 230, name: 'Meta', color: '#0668e1', accent: '#ffffff', label: 'Meta', height: 13, width: 7, glow: '#0668e1', emoji: '🔵' },
  { x: 64, y: 228, name: 'Tesla', color: '#cc0000', accent: '#e8e8e8', label: 'Tesla', height: 12, width: 8, glow: '#cc0000', emoji: '⚡' },
  // SF Landmarks
  { x: 52, y: 218, name: 'Coit Tower', color: '#d4c4a0', accent: '#f0e6cc', label: 'Coit Tower', height: 24, width: 4, glow: '#f0d080', emoji: '🗼' },
  { x: 53, y: 218, name: 'Transamerica Pyramid', color: '#c8c8c8', accent: '#ffffff', label: 'Transamerica', height: 26, width: 5, glow: '#e0e0e0', emoji: '🔺' },
  { x: 53, y: 219, name: 'Salesforce Tower', color: '#00a1e0', accent: '#e0f0ff', label: 'Salesforce', height: 28, width: 5, glow: '#00a1e0', emoji: '🏢' },
  { x: 51, y: 218, name: "Fisherman's Wharf", color: '#8b4513', accent: '#deb887', label: 'Wharf', height: 8, width: 9, glow: '#deb887', emoji: '🦞' },
  { x: 53, y: 221, name: 'Oracle Park', color: '#fd5a1e', accent: '#27251f', label: 'Oracle Park', height: 10, width: 8, glow: '#fd5a1e', emoji: '⚾' },
  // Nature landmarks
  { x: 49, y: 212, name: 'Muir Woods', color: '#2d5016', accent: '#4a7c23', label: 'Muir Woods', height: 22, width: 6, glow: '#3a6b1e', emoji: '🌲' },
  { x: 51, y: 210, name: 'Mt. Tamalpais', color: '#5a7247', accent: '#8faf6a', label: 'Mt. Tam', height: 30, width: 9, glow: '#6b8a50', emoji: '⛰️' },
  { x: 51, y: 221, name: 'Twin Peaks', color: '#6b7a5a', accent: '#90a070', label: 'Twin Peaks', height: 18, width: 7, glow: '#7a8a60', emoji: '🏔️' },
  // East Bay
  { x: 64, y: 214, name: 'Memorial Stadium', color: '#1e3a5f', accent: '#fdb515', label: 'Cal Stadium', height: 10, width: 9, glow: '#fdb515', emoji: '🏟️' },
  { x: 65, y: 218, name: 'Lake Merritt', color: '#0369a1', accent: '#38bdf8', label: 'Lake Merritt', height: 6, width: 10, glow: '#38bdf8', emoji: '🦢' },
  { x: 65, y: 220, name: 'Oakland Coliseum', color: '#006341', accent: '#efb21e', label: 'Coliseum', height: 10, width: 9, glow: '#006341', emoji: '⚾' },
  { x: 74, y: 220, name: 'Mt. Diablo', color: '#78716c', accent: '#a8a29e', label: 'Mt. Diablo', height: 32, width: 10, glow: '#78716c', emoji: '🏔️' },
  { x: 72, y: 216, name: 'Walnut Creek BART', color: '#4b5563', accent: '#eab308', label: 'WC Downtown', height: 12, width: 7, glow: '#eab308', emoji: '🏙️' },
  // Santa Cruz
  { x: 51, y: 253, name: 'Steamer Lane', color: '#0e7490', accent: '#22d3ee', label: 'Steamer Lane', height: 10, width: 8, glow: '#06b6d4', emoji: '🏄' },
  { x: 51, y: 254, name: 'Natural Bridges', color: '#a16207', accent: '#fbbf24', label: 'Natural Bridges', height: 8, width: 7, glow: '#fbbf24', emoji: '🪨' },
  { x: 52, y: 253, name: 'Santa Cruz Boardwalk', color: '#c026d3', accent: '#fde047', label: 'Boardwalk', height: 18, width: 10, glow: '#fde047', emoji: '🎡' },
  { x: 52, y: 254, name: 'Santa Cruz Wharf', color: '#7c2d12', accent: '#fbbf24', label: 'SC Wharf', height: 9, width: 8, glow: '#fbbf24', emoji: '🎣' },
  { x: 60, y: 269, name: 'Monterey Bay Aquarium', color: '#0e7490', accent: '#06b6d4', label: 'MB Aquarium', height: 14, width: 8, glow: '#22d3ee', emoji: '🐠' },
  { x: 53, y: 251, name: 'UC Santa Cruz', color: '#1e3a5f', accent: '#fde047', label: 'UCSC', height: 16, width: 7, glow: '#fde047', emoji: '🐌' },
  // Statewide landmarks
  { x: 78, y: 35, name: 'Mt. Shasta', color: '#e2e8f0', accent: '#94a3b8', label: 'Mt. Shasta', height: 35, width: 10, glow: '#cbd5e1', emoji: '🏔️' },
  { x: 82, y: 140, name: 'State Capitol', color: '#f5f5dc', accent: '#daa520', label: 'Capitol', height: 22, width: 8, glow: '#daa520', emoji: '🏛️' },
  { x: 126, y: 418, name: 'Hollywood Sign', color: '#f5f5f5', accent: '#dc2626', label: 'Hollywood', height: 14, width: 12, glow: '#f5f5f5', emoji: '🎬' },
  { x: 115, y: 200, name: 'Half Dome', color: '#94a3b8', accent: '#e2e8f0', label: 'Half Dome', height: 30, width: 8, glow: '#94a3b8', emoji: '🏞️' },
  // Bay Area icons
  { x: 49, y: 216, name: 'Golden Gate Bridge', color: '#cc3300', accent: '#e8a040', label: 'GG Bridge', height: 22, width: 10, glow: '#ff4400', emoji: '🌉' },
  { x: 52, y: 216, name: 'Alcatraz Island', color: '#78716c', accent: '#94a3b8', label: 'Alcatraz', height: 12, width: 7, glow: '#94a3b8', emoji: '🏚️' },
  { x: 51, y: 217, name: 'Ghirardelli Square', color: '#8b4513', accent: '#dc2626', label: 'Ghirardelli', height: 10, width: 6, glow: '#dc2626', emoji: '🍫' },
  { x: 60, y: 236, name: 'Winchester Mystery House', color: '#5b3a1a', accent: '#9ca3af', label: 'Winchester', height: 16, width: 7, glow: '#9ca3af', emoji: '👻' },
  // NorCal
  { x: 30, y: 12, name: 'Redwood National Park', color: '#2d5016', accent: '#4a7c23', label: 'Redwood NP', height: 26, width: 7, glow: '#3a6b1e', emoji: '🌲' },
  { x: 85, y: 80, name: 'Lassen Peak', color: '#78716c', accent: '#f97316', label: 'Lassen Peak', height: 28, width: 8, glow: '#f97316', emoji: '🌋' },
  { x: 42, y: 208, name: 'Point Reyes Lighthouse', color: '#f5f5dc', accent: '#fbbf24', label: 'Pt Reyes', height: 16, width: 4, glow: '#fbbf24', emoji: '🔦' },
  { x: 125, y: 157, name: 'Emerald Bay', color: '#0369a1', accent: '#22d3ee', label: 'Emerald Bay', height: 12, width: 7, glow: '#22d3ee', emoji: '💎' },
  // Wine Country
  { x: 56, y: 176, name: 'Napa Valley Winery', color: '#722f37', accent: '#daa520', label: 'Napa Winery', height: 12, width: 7, glow: '#daa520', emoji: '🍷' },
  // Sierra Nevada
  { x: 116, y: 198, name: 'Yosemite Falls', color: '#94a3b8', accent: '#38bdf8', label: 'Yosemite Falls', height: 24, width: 5, glow: '#38bdf8', emoji: '💧' },
  { x: 118, y: 258, name: 'General Sherman Tree', color: '#2d5016', accent: '#8b4513', label: 'Gen Sherman', height: 30, width: 6, glow: '#4a7c23', emoji: '🌲' },
  { x: 138, y: 250, name: 'Mt. Whitney', color: '#e2e8f0', accent: '#94a3b8', label: 'Mt. Whitney', height: 34, width: 8, glow: '#e2e8f0', emoji: '⛰️' },
  { x: 138, y: 213, name: "Devil's Postpile", color: '#44403c', accent: '#78716c', label: "Devil's Post", height: 18, width: 5, glow: '#78716c', emoji: '🪨' },
  { x: 150, y: 242, name: 'Ancient Bristlecone Pine', color: '#8b6914', accent: '#a3a056', label: 'Bristlecone', height: 16, width: 5, glow: '#a3a056', emoji: '🌿' },
  // Central Coast
  { x: 62, y: 288, name: 'Bixby Bridge', color: '#b45309', accent: '#f59e0b', label: 'Bixby Bridge', height: 14, width: 8, glow: '#f59e0b', emoji: '🌉' },
  { x: 68, y: 316, name: 'Hearst Castle', color: '#daa520', accent: '#f5f5dc', label: 'Hearst Castle', height: 22, width: 8, glow: '#daa520', emoji: '🏰' },
  { x: 74, y: 332, name: 'Morro Rock', color: '#57534e', accent: '#78716c', label: 'Morro Rock', height: 24, width: 9, glow: '#78716c', emoji: '🪨' },
  { x: 59, y: 268, name: 'Cannery Row', color: '#8b4513', accent: '#0ea5e9', label: 'Cannery Row', height: 10, width: 8, glow: '#0ea5e9', emoji: '🐟' },
  // SoCal Coast
  { x: 122, y: 412, name: 'Santa Monica Pier', color: '#c026d3', accent: '#fde047', label: 'SM Pier', height: 12, width: 9, glow: '#fde047', emoji: '🎪' },
  { x: 101, y: 390, name: 'Santa Barbara Mission', color: '#d4a574', accent: '#dc2626', label: 'SB Mission', height: 16, width: 7, glow: '#d4a574', emoji: '⛪' },
  { x: 140, y: 477, name: 'La Jolla Cove', color: '#0ea5e9', accent: '#22d3ee', label: 'La Jolla', height: 8, width: 7, glow: '#22d3ee', emoji: '🦭' },
  { x: 142, y: 487, name: 'Coronado Bridge', color: '#0284c7', accent: '#38bdf8', label: 'Coronado', height: 16, width: 9, glow: '#38bdf8', emoji: '🌉' },
  // LA Metro
  { x: 124, y: 416, name: 'Griffith Observatory', color: '#f5f5dc', accent: '#4ade80', label: 'Griffith Obs', height: 14, width: 7, glow: '#4ade80', emoji: '🔭' },
  { x: 136, y: 423, name: 'Disneyland', color: '#1e40af', accent: '#f472b6', label: 'Disneyland', height: 24, width: 8, glow: '#f472b6', emoji: '🎢' },
  { x: 129, y: 421, name: 'Watts Towers', color: '#b45309', accent: '#fbbf24', label: 'Watts Towers', height: 20, width: 4, glow: '#fbbf24', emoji: '🗼' },
  { x: 131, y: 426, name: 'Queen Mary', color: '#1e3a5f', accent: '#f5f5f5', label: 'Queen Mary', height: 12, width: 10, glow: '#f5f5f5', emoji: '🚢' },
  { x: 119, y: 414, name: 'Getty Center', color: '#f5f5f5', accent: '#a3a3a3', label: 'Getty Center', height: 16, width: 8, glow: '#f5f5f5', emoji: '🏛️' },
  { x: 125, y: 419, name: 'Olvera Street', color: '#cc5500', accent: '#fde047', label: 'Olvera St', height: 10, width: 6, glow: '#fde047', emoji: '🎭' },
  // San Diego
  { x: 144, y: 481, name: 'Balboa Park', color: '#166534', accent: '#4ade80', label: 'Balboa Park', height: 16, width: 8, glow: '#4ade80', emoji: '🐼' },
  { x: 140, y: 472, name: 'Torrey Pines', color: '#166534', accent: '#22c55e', label: 'Torrey Pines', height: 14, width: 6, glow: '#22c55e', emoji: '🌲' },
  { x: 141, y: 475, name: 'Salk Institute', color: '#a3a3a3', accent: '#0ea5e9', label: 'Salk Inst', height: 14, width: 7, glow: '#0ea5e9', emoji: '🧬' },
  // Desert
  { x: 166, y: 436, name: 'Joshua Tree', color: '#a3a056', accent: '#d4a574', label: 'Joshua Tree', height: 14, width: 6, glow: '#d4a574', emoji: '🌵' },
  { x: 166, y: 296, name: 'Death Valley', color: '#dc2626', accent: '#f59e0b', label: 'Death Valley', height: 10, width: 7, glow: '#f59e0b', emoji: '🌡️' },
  { x: 157, y: 441, name: 'Palm Springs Tramway', color: '#4b5563', accent: '#a3a3a3', label: 'Palm Springs', height: 18, width: 5, glow: '#a3a3a3', emoji: '🚡' },
  // Channel Islands
  { x: 96, y: 402, name: 'Channel Islands NP', color: '#166534', accent: '#0ea5e9', label: 'Channel Is', height: 10, width: 7, glow: '#0ea5e9', emoji: '🏝️' },
  // Missions
  { x: 133, y: 436, name: 'Mission San Juan Capistrano', color: '#d4a574', accent: '#dc2626', label: 'Mission SJC', height: 14, width: 6, glow: '#d4a574', emoji: '⛪' },
]

export const LANDMARK_INFO: Record<string, { description: string; creatures: string[] }> = {
  'Coit Tower': { description: 'Built in 1933 on Telegraph Hill to honor SF firefighters. Home to famous wild parrots and nesting peregrine falcons.', creatures: ['🐦‍⬛', '🦅', '🐦'] },
  'Transamerica Pyramid': { description: 'SF\'s iconic 48-story pyramid, completed in 1972. Peregrine falcons nest on the upper floors, diving at 240 mph to hunt pigeons.', creatures: ['🦅'] },
  'Salesforce Tower': { description: 'The tallest building in SF at 1,070 feet. Its LED crown lights up the skyline — and attracts unusual nocturnal creatures.', creatures: ['✨', '🦉'] },
  "Fisherman's Wharf": { description: 'SF\'s famous waterfront since the Gold Rush. Sea lions took over Pier 39 in 1989 and never left. Fresh Dungeness crab year-round.', creatures: ['🐦‍⬛', '🦭', '🦀'] },
  'Oracle Park': { description: 'Home of the SF Giants. Harbor seals swim into McCovey Cove during home games, catching splash-hit home run balls.', creatures: ['🦭', '🐦'] },
  'Muir Woods': { description: 'Ancient coast redwood grove, some trees over 1,000 years old. The cathedral-like canopy blocks 97% of sunlight.', creatures: ['🌿', '🐌', '🦎'] },
  'Mt. Tamalpais': { description: 'Marin\'s 2,571-ft peak with 360° views of the Bay. Mountain biking was invented here in the 1970s. Hawks rule the summit thermals.', creatures: ['🦅', '🐺', '🦊'] },
  'Twin Peaks': { description: 'Two 922-ft peaks in the heart of SF. On foggy nights, the city lights diffuse into an ethereal glow. Coyotes roam the slopes.', creatures: ['🐱', '🦊', '✨'] },
  'UC Berkeley': { description: 'Founded in 1868, Cal is the flagship of the UC system. The campus creek is home to an unusual population of creatures.', creatures: ['🦎', '🐸', '🦅'] },
  'Stanford': { description: 'Founded in 1885 in Palo Alto. The campus is so large it has its own zip code, and the foothills teem with wildlife.', creatures: ['🦊', '🦌', '🐦'] },
  'UCSF': { description: 'A leading medical research university perched on Parnassus Heights with views across the city.', creatures: ['🦅', '🐦'] },
  'SFSU': { description: 'San Francisco State University, near Lake Merced. The lakeside campus attracts migratory birds and other wildlife.', creatures: ['🐸', '🐦'] },
  'Anthropic': { description: 'AI safety research company headquartered in SF\'s Financial District. The building hums with computational energy.', creatures: ['🧠', '✨'] },
  'Google': { description: 'The Googleplex in Mountain View, surrounded by carefully restored wetlands that attract Bay Area wildlife.', creatures: ['🦊', '🐦', '🦋'] },
  'NVIDIA': { description: 'NVIDIA\'s Voyager campus in Santa Clara, shaped like a spaceship. The green glow attracts unusual creatures at night.', creatures: ['⚡', '✨'] },
  'Apple': { description: 'Apple Park in Cupertino — the Ring. 175 acres of restored grassland and 9,000 drought-resistant trees.', creatures: ['🦊', '🦋', '🐦'] },
  'Meta': { description: 'Meta\'s campus in Menlo Park, built on reclaimed salt ponds. The surrounding marshes are rich with wildlife.', creatures: ['🦭', '🐦', '🦦'] },
  'Tesla': { description: 'Tesla\'s Fremont factory, the largest building in the Bay Area. The EM fields attract electric-natured creatures from miles away.', creatures: ['⚡', '🐍', '🦎'] },
  'Memorial Stadium': { description: 'UC Berkeley\'s 63,000-seat stadium sits directly on the Hayward Fault. Built in 1923, it hosts Cal Bears football. Red-tailed hawks nest on the rim, hunting pigeons during games.', creatures: ['🦅', '🐿️', '🐦'] },
  'Lake Merritt': { description: 'The first official wildlife refuge in North America (1870). This tidal lagoon in the heart of Oakland hosts thousands of migrating birds. A 3.4-mile necklace of lights rings the shore.', creatures: ['🦢', '🦆', '🐢'] },
  'Oakland Coliseum': { description: 'Home of legendary Oakland sports. The surrounding marshlands of the Coliseum complex attract surprising wildlife — herons fish in the parking lot puddles after rainstorms.', creatures: ['🦅', '🐦', '🦎'] },
  'Mt. Diablo': { description: 'At 3,849 feet, Mt. Diablo offers one of the largest viewsheds on Earth — you can see 35 of California\'s 58 counties from the summit. Golden eagles and peregrine falcons rule the thermals.', creatures: ['🦅', '🐍', '🦎'] },
  'Walnut Creek BART': { description: 'The eastern terminus of BART, where suburban Contra Costa County meets Iron Horse Trail. The nearby open spaces of Shell Ridge teem with deer and coyotes.', creatures: ['🦌', '🐺', '🦅'] },
  'Steamer Lane': { description: 'One of California\'s most iconic surf breaks, perched on the cliffs of West Cliff Drive. Surfers have ridden these waves since the 1930s. The lighthouse marks the point where the Pacific delivers perfect swells.', creatures: ['🦦', '🌊', '🐦'] },
  'Santa Cruz Boardwalk': { description: 'The oldest surviving amusement park in California, opened in 1907. The Giant Dipper wooden roller coaster has rumbled along the sand since 1924. Sea otters, pelicans, and the occasional ghost crab share the boardwalk with cotton-candy-fueled visitors.', creatures: ['🦦', '🦀', '🐦'] },
  'Natural Bridges': { description: 'A sea-carved sandstone arch rising from the surf at the west end of Santa Cruz. Each October tens of thousands of monarch butterflies cluster in the eucalyptus grove behind the beach — one of the largest overwintering sites on the California coast.', creatures: ['🦋', '🦦', '🐚'] },
  'Santa Cruz Wharf': { description: 'California\'s longest wooden pier, stretching half a mile into Monterey Bay. Sea lions bark from under the planks, and fishermen haul up mackerel alongside tourists chasing clam chowder. The pelicans here are bold enough to steal your sandwich.', creatures: ['🦭', '🐦', '🐟'] },
  'Monterey Bay Aquarium': { description: 'A living window into the kelp forest, built on the old Hovden Cannery on Cannery Row in 1984. The three-story kelp tank uses real seawater pumped straight from the bay. It\'s the research center that brought southern sea otters back from the brink — orphan pups raised here are released wild into Monterey Bay.', creatures: ['🦦', '🐠', '🪼'] },
  'UC Santa Cruz': { description: 'The "City on a Hill" — a university campus nestled in a redwood forest overlooking Monterey Bay. Home of the Banana Slugs, the most beloved mascot in college sports.', creatures: ['🐌', '🦎', '🌿'] },
  'Golden Gate Bridge': { description: 'The most photographed bridge on Earth, opened in 1937. Its international orange towers rise 746 feet above the strait where the Pacific surges into SF Bay. Peregrine falcons nest on the towers, and gray whales pass below during migration.', creatures: ['🦅', '🐋', '🌊'] },
  'Alcatraz Island': { description: 'The Rock — a federal penitentiary from 1934 to 1963, now the most-visited island in the National Park system. Western gulls have reclaimed the cellblocks, and black-crowned night herons nest in the old warden\'s garden.', creatures: ['🐦', '🦅', '✨'] },
  'Ghirardelli Square': { description: 'Once Domingo Ghirardelli\'s chocolate factory (1852), now a waterfront landmark where the smell of chocolate still drifts over the bay. Sea lions bark from nearby Aquatic Park, and gulls patrol the plaza.', creatures: ['🐦', '🦭'] },
  'Winchester Mystery House': { description: 'A 160-room Victorian mansion in San Jose, built continuously from 1886 to 1922. Sarah Winchester believed she was haunted by the ghosts of those killed by Winchester rifles. Staircases lead to ceilings, doors open to walls.', creatures: ['👻', '✨', '🦇'] },
  'Redwood National Park': { description: 'Home to the tallest living things on Earth — coast redwoods over 370 feet tall and 2,000 years old. The old-growth canopy holds an entire ecosystem of ferns, salamanders, and creatures that never touch the forest floor.', creatures: ['🌿', '🦎', '🐌'] },
  'Lassen Peak': { description: 'The southernmost active volcano in the Cascades, last erupting in 1914-1917. Boiling mud pots, fumaroles, and hot springs mark the volcanic hellscape of Bumpass Hell. Black bears and marmots navigate the sulphur fields.', creatures: ['🐻', '🦅', '🔥'] },
  'Point Reyes Lighthouse': { description: 'Perched 300 steps down a wind-blasted cliff, this 1870 lighthouse marks the foggiest and windiest point on the Pacific coast. Tule elk graze the headlands, and gray whales pass so close you can hear them breathe.', creatures: ['🐋', '🦌', '🌊'] },
  'Emerald Bay': { description: 'A glacially carved inlet on Lake Tahoe\'s southwest shore, with Fannette Island — the lake\'s only island — at its center. The turquoise water is so clear you can see 70 feet down. Bald eagles hunt trout from the granite cliffs.', creatures: ['🦅', '🐟', '🐻'] },
  'Napa Valley Winery': { description: 'The heart of California wine country, where 500+ wineries line the valley floor between the Mayacamas and Vaca mountains. Red-tailed hawks ride thermals above the vines, and wild turkeys strut between the rows.', creatures: ['🦅', '🦋', '🐦'] },
  'Yosemite Falls': { description: 'North America\'s tallest waterfall at 2,425 feet — a three-stage plunge that thunders in spring and whispers by September. On full-moon nights in April, the mist produces a rare moonbow. Peregrine falcons nest on the face.', creatures: ['🦅', '🐻', '💧'] },
  'General Sherman Tree': { description: 'The largest living thing on Earth by volume — a giant sequoia standing 275 feet tall, 36 feet across, and over 2,200 years old. It was alive when Rome was a republic. Black bears nap in the hollowed bases of nearby sequoias.', creatures: ['🐻', '🌿', '🦎'] },
  'Mt. Whitney': { description: 'The highest peak in the contiguous United States at 14,505 feet. From its summit, you can see both the Sierra crest and Death Valley — the lowest point in North America. Pikas and marmots live among the talus.', creatures: ['🐿️', '🦅', '⛰️'] },
  "Devil's Postpile": { description: 'A wall of perfectly hexagonal basalt columns formed by cooling lava 100,000 years ago. The columns are so regular they look machine-cut. The nearby Rainbow Falls drops 101 feet into a mist that makes constant rainbows.', creatures: ['🦎', '🐻', '🌊'] },
  'Ancient Bristlecone Pine': { description: 'The White Mountains hold the oldest non-clonal organisms on Earth — bristlecone pines over 4,800 years old. Methuselah was a seedling when the pyramids were built. The gnarled, wind-sculpted trees grow at 10,000+ feet in alkaline soil.', creatures: ['🦅', '🐿️', '🌿'] },
  'Bixby Bridge': { description: 'An open-spandrel arch bridge spanning 714 feet over Bixby Creek Canyon on Highway 1. Built in 1932, it\'s the gateway to Big Sur — where the Santa Lucia Mountains plunge straight into the Pacific. California condors soar through the canyon.', creatures: ['🦅', '🦎', '🌊'] },
  'Hearst Castle': { description: 'William Randolph Hearst\'s 127-acre hilltop estate above San Simeon, built over 28 years. The Neptune Pool alone holds 345,000 gallons. Zebras from the original private zoo still roam the surrounding hills — you can see them from Highway 1.', creatures: ['🦓', '🦅', '🐦'] },
  'Morro Rock': { description: 'A 581-foot volcanic plug rising from the surf at the mouth of Morro Bay — the "Gibraltar of the Pacific." Peregrine falcons nest on the protected rock face, and sea otters raft in the calm harbor behind it.', creatures: ['🦅', '🦦', '🐦'] },
  'Cannery Row': { description: 'John Steinbeck\'s "poem, a stink, a grating noise" — the sardine canning district that collapsed when the fish vanished in the 1950s. Now a waterfront strip where sea otters float in the kelp just offshore and harbor seals haul out on the rocks.', creatures: ['🦦', '🦭', '🐟'] },
  'Santa Monica Pier': { description: 'The western terminus of Route 66, with a solar-powered Ferris wheel and the world\'s only solar-powered amusement park. Built in 1909, the pier\'s pilings are home to mussels, sea stars, and the occasional octopus.', creatures: ['🐙', '🐦', '🌊'] },
  'Santa Barbara Mission': { description: 'The "Queen of the Missions," founded in 1786 and still an active parish. Its twin bell towers overlook the Riviera. The mission\'s lavanderia (laundry) is fed by a 200-year-old aqueduct, and the gardens attract hummingbirds year-round.', creatures: ['🐦', '🦎', '🦋'] },
  'La Jolla Cove': { description: 'A tiny, gem-blue inlet framed by sandstone cliffs. The underwater ecological reserve teems with garibaldi (California\'s state marine fish), leopard sharks, and sea lions who have colonized the beach and refuse to leave.', creatures: ['🦭', '🐟', '🐙'] },
  'Coronado Bridge': { description: 'A 2.1-mile sweeping curve over San Diego Bay, with a 200-foot clearance for Navy aircraft carriers. The blue bridge frames the Hotel del Coronado — where "Some Like It Hot" was filmed and the ghost of Kate Morgan allegedly roams.', creatures: ['🐦', '🦭', '🌊'] },
  'Griffith Observatory': { description: 'Perched on Mt. Hollywood with a view from downtown to the Pacific. Free public telescope since 1935 — more people have looked through a telescope here than anywhere else on Earth. Coyotes and mule deer share the trails below.', creatures: ['🦊', '🦉', '✨'] },
  'Disneyland': { description: 'Walt Disney\'s original theme park, opened July 17, 1955, in Anaheim. The feral cats of Disneyland are a beloved open secret — over 200 cats roam the park at night, keeping the mouse population in check (the irony is intentional).', creatures: ['🐱', '🐦', '✨'] },
  'Watts Towers': { description: 'Seventeen interconnected towers of steel, mortar, and found objects — bottle caps, seashells, pottery — built single-handedly by Simon Rodia over 33 years (1921-1954). The tallest reaches 99.5 feet. A monument to one person\'s obsession.', creatures: ['🐦', '🦎', '✨'] },
  'Queen Mary': { description: 'A retired Cunard ocean liner permanently moored in Long Beach since 1967. She carried troops in WWII and celebrities in peace. Allegedly one of the most haunted places in America — and seals now rest on her hull.', creatures: ['🦭', '👻', '🐦'] },
  'Getty Center': { description: 'Richard Meier\'s billion-dollar travertine campus crowning the Santa Monica Mountains. The Central Garden is a living sculpture that changes every season. Red-tailed hawks use the thermals off the canyon to hunt.', creatures: ['🦅', '🦋', '🐦'] },
  'Olvera Street': { description: 'The birthplace of Los Angeles — the original 1781 pueblo settlement, now a vibrant Mexican marketplace. The Avila Adobe (1818) is the oldest building in LA. Pigeons own the plaza; at dusk, bats emerge from the old brick.', creatures: ['🦇', '🐦', '🐱'] },
  'Balboa Park': { description: '1,200 acres of gardens, museums, and the world-famous San Diego Zoo. The park\'s canyons shelter coyotes, raccoons, and over 200 bird species. Giant pandas, though on loan, became the park\'s most beloved residents.', creatures: ['🐼', '🐦', '🦎'] },
  'Torrey Pines': { description: 'One of the rarest pine trees in the world — only about 3,000 Torrey pines survive, almost all of them here on these eroded sandstone bluffs above the Pacific. Peregrine falcons hunt from the cliff edge.', creatures: ['🦅', '🦎', '🌿'] },
  'Salk Institute': { description: 'Jonas Salk\'s brutalist masterwork by Louis Kahn — two rows of travertine labs flanking a water channel that frames the Pacific sunset twice a year on the equinox. Hawks perch on the concrete walls at dusk.', creatures: ['🦅', '🐦', '✨'] },
  'Joshua Tree': { description: 'Where the Mojave and Colorado deserts meet. The twisted Joshua trees (actually giant yuccas) were named by Mormon settlers who saw Joshua\'s arms raised in prayer. At night, the park is one of the darkest places in Southern California.', creatures: ['🦎', '🐍', '🦊'] },
  'Death Valley': { description: 'The hottest, driest, lowest place in North America — 134°F recorded in 1913, with Badwater Basin at 282 feet below sea level. Yet after rare rains, the valley explodes in wildflowers. Desert pupfish survive in salt pools.', creatures: ['🦎', '🐍', '🐛'] },
  'Palm Springs Tramway': { description: 'The world\'s largest rotating aerial tramway climbs 8,516 vertical feet from the Sonoran desert floor to the alpine forests of Mt. San Jacinto in 10 minutes. Temperature drops 30°F. Bighorn sheep cling to the granite walls.', creatures: ['🐏', '🦅', '🦎'] },
  'Channel Islands NP': { description: 'Five islands off the Ventura coast — California\'s Galápagos. The island fox, found nowhere else on Earth, nearly went extinct (just 15 remained on Santa Cruz) before a dramatic recovery. Blue whales feed in the channel.', creatures: ['🦊', '🐋', '🦭'] },
  'Mission San Juan Capistrano': { description: 'Founded in 1776, famous for the cliff swallows that return every March 19 (St. Joseph\'s Day) — though they\'ve been arriving less predictably since the 1990s. The Great Stone Church collapsed in the 1812 earthquake.', creatures: ['🐦', '🦎', '🦋'] },
}

const LANDMARK_MAP = new Map<string, LandmarkDef>()
for (const lm of LANDMARKS) {
  LANDMARK_MAP.set(`${lm.x},${lm.y}`, lm)
}

export function getLandmarkAt(x: number, y: number): LandmarkDef | undefined {
  return LANDMARK_MAP.get(`${x},${y}`)
}

export function getNearbyLandmark(x: number, y: number, radius = 2): LandmarkDef | undefined {
  let best: LandmarkDef | undefined
  let bestDist = Infinity
  for (const lm of LANDMARKS) {
    const dx = x - lm.x, dy = y - lm.y
    const dist = dx * dx + dy * dy
    if (dist <= radius * radius && dist < bestDist) {
      best = lm
      bestDist = dist
    }
  }
  return best
}

export type LandmarkRegion = 'Bay Area' | 'NorCal' | 'Wine Country' | 'Sierra Nevada' | 'Central Coast' | 'SoCal Coast' | 'LA Metro' | 'San Diego' | 'Desert' | 'Channel Islands' | 'Statewide'

export const LANDMARK_REGIONS: Record<LandmarkRegion, string[]> = {
  'Bay Area': ['UC Berkeley', 'Stanford', 'UCSF', 'SFSU', 'Anthropic', 'Google', 'NVIDIA', 'Apple', 'Meta', 'Tesla', 'Coit Tower', 'Transamerica Pyramid', 'Salesforce Tower', "Fisherman's Wharf", 'Oracle Park', 'Muir Woods', 'Mt. Tamalpais', 'Twin Peaks', 'Memorial Stadium', 'Lake Merritt', 'Oakland Coliseum', 'Mt. Diablo', 'Walnut Creek BART', 'Golden Gate Bridge', 'Alcatraz Island', 'Ghirardelli Square', 'Winchester Mystery House'],
  'NorCal': ['Redwood National Park', 'Lassen Peak', 'Point Reyes Lighthouse', 'Mt. Shasta'],
  'Wine Country': ['Napa Valley Winery'],
  'Sierra Nevada': ['Emerald Bay', 'Half Dome', 'Yosemite Falls', 'General Sherman Tree', 'Mt. Whitney', "Devil's Postpile", 'Ancient Bristlecone Pine', 'State Capitol'],
  'Central Coast': ['Steamer Lane', 'Natural Bridges', 'Santa Cruz Boardwalk', 'Santa Cruz Wharf', 'Monterey Bay Aquarium', 'UC Santa Cruz', 'Bixby Bridge', 'Hearst Castle', 'Morro Rock', 'Cannery Row'],
  'SoCal Coast': ['Santa Monica Pier', 'Santa Barbara Mission', 'La Jolla Cove', 'Coronado Bridge'],
  'LA Metro': ['Hollywood Sign', 'Griffith Observatory', 'Disneyland', 'Watts Towers', 'Queen Mary', 'Getty Center', 'Olvera Street'],
  'San Diego': ['Balboa Park', 'Torrey Pines', 'Salk Institute'],
  'Desert': ['Joshua Tree', 'Death Valley', 'Palm Springs Tramway'],
  'Channel Islands': ['Channel Islands NP'],
  'Statewide': ['Mission San Juan Capistrano'],
}

export function getLandmarkRegion(name: string): LandmarkRegion {
  for (const [region, names] of Object.entries(LANDMARK_REGIONS)) {
    if (names.includes(name)) return region as LandmarkRegion
  }
  return 'Statewide'
}
