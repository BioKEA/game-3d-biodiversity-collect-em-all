// Curated fast-travel destinations — only unlocks once the tile has been explored.
// Coordinates and subregion names match getSubregion() in bayAreaMap.ts.
export const FAST_TRAVEL_DESTINATIONS: { name: string; emoji: string; x: number; y: number; region: string; subregion: string; description: string }[] = [
  // Bay Area
  { name: 'San Francisco',  emoji: '🌉', x: 52, y: 219, region: 'Bay Area', subregion: 'San Francisco',        description: 'The City by the Bay' },
  { name: 'Golden Gate Pk', emoji: '🌳', x: 50, y: 220, region: 'Bay Area', subregion: 'Golden Gate Park',      description: 'Urban forest, bison paddock, trails' },
  { name: 'Muir Woods',     emoji: '🌲', x: 49, y: 212, region: 'Bay Area', subregion: 'Muir Woods',            description: 'Ancient coast redwoods in a quiet canyon' },
  { name: 'Mt. Tamalpais',  emoji: '⛰️', x: 51, y: 210, region: 'Bay Area', subregion: 'Mt. Tamalpais',         description: 'Sacred mountain, hawks, wildflowers' },
  { name: 'Oakland',        emoji: '🏟',  x: 64, y: 218, region: 'Bay Area', subregion: 'Downtown Oakland',      description: 'City skyline, Lake Merritt nearby' },
  { name: 'Berkeley',       emoji: '🏛',  x: 64, y: 215, region: 'Bay Area', subregion: 'Berkeley',              description: 'University town and hills' },
  { name: 'Mt. Diablo',     emoji: '🏔',  x: 74, y: 220, region: 'Bay Area', subregion: 'Mt. Diablo',            description: 'Highest peak in the Bay, eagles circling' },
  { name: 'San Jose',       emoji: '💻', x: 60, y: 232, region: 'Bay Area', subregion: 'San Jose',              description: 'Capital of Silicon Valley' },
  { name: 'Santa Cruz',     emoji: '🏄', x: 52, y: 252, region: 'Coast',   subregion: 'Santa Cruz',             description: 'Beach boardwalk and redwood forests' },
  // NorCal
  { name: 'Redwood NP',     emoji: '🌲', x: 30, y: 15,  region: 'NorCal',  subregion: 'Crescent City',          description: 'Tallest trees on Earth' },
  { name: 'Mt. Shasta',     emoji: '🏔️', x: 78, y: 35,  region: 'NorCal',  subregion: 'Mt. Shasta',             description: 'Sacred snow-capped volcano' },
  { name: 'Lassen Volcanic', emoji: '🌋', x: 85, y: 78, region: 'NorCal',  subregion: 'Lassen Volcanic NP',     description: 'Bubbling mudpots and volcanic peaks' },
  { name: 'Sacramento',     emoji: '🏛️', x: 82, y: 140, region: 'NorCal',  subregion: 'Sacramento',             description: 'State capital on the river' },
  { name: 'Lake Tahoe',     emoji: '💎', x: 130, y: 156, region: 'Sierra', subregion: 'Lake Tahoe',             description: 'Crystal-clear alpine lake' },
  // Sierra
  { name: 'Yosemite',       emoji: '🏞️', x: 115, y: 200, region: 'Sierra', subregion: 'Yosemite Valley',       description: 'Half Dome, waterfalls, granite walls' },
  { name: 'Sequoia NP',     emoji: '🌳', x: 118, y: 255, region: 'Sierra', subregion: 'Sequoia NP',            description: 'Giant sequoias, the largest trees' },
  { name: 'Mono Lake',      emoji: '🧂', x: 142, y: 198, region: 'Sierra', subregion: 'Mono Lake',             description: 'Eerie tufa towers, brine shrimp' },
  // Central Coast
  { name: 'Monterey',       emoji: '🦦', x: 60, y: 268, region: 'Coast',   subregion: 'Monterey',               description: 'Cannery Row, sea otters, aquarium' },
  { name: 'Big Sur',        emoji: '🌊', x: 62, y: 290, region: 'Coast',   subregion: 'Big Sur',                description: 'Dramatic cliffs, condors, redwoods' },
  // SoCal
  { name: 'Santa Barbara',  emoji: '🌴', x: 100, y: 390, region: 'SoCal',  subregion: 'Santa Barbara',          description: 'The American Riviera' },
  { name: 'Los Angeles',    emoji: '🎬', x: 126, y: 418, region: 'SoCal',  subregion: 'Downtown LA',            description: 'City of Angels, Hollywood' },
  { name: 'San Diego',      emoji: '☀️', x: 143, y: 483, region: 'SoCal',  subregion: 'San Diego',              description: 'Perfect weather, beaches, zoo' },
  { name: 'Joshua Tree',    emoji: '🌵', x: 165, y: 438, region: 'Desert', subregion: 'Joshua Tree NP',         description: 'Surreal desert landscape' },
  { name: 'Death Valley',   emoji: '🔥', x: 165, y: 295, region: 'Desert', subregion: 'Death Valley',           description: 'Hottest, driest, lowest in North America' },
  // Border ranger stations
  { name: 'Oregon Border',  emoji: '🐺', x: 75,  y: 4,   region: 'Border', subregion: 'California Wilderness', description: 'Ranger Sequoia\'s outpost, wolves nearby' },
  { name: 'Modoc Outpost',  emoji: '🤠', x: 126, y: 50,  region: 'Border', subregion: 'Modoc Plateau',         description: 'Ranger Dusty\'s station, pronghorn territory' },
  { name: 'Mojave Basecamp', emoji: '🦅', x: 188, y: 420, region: 'Border', subregion: 'California Wilderness', description: 'Ranger Solana\'s camp, condors and Gila monsters' },
]
