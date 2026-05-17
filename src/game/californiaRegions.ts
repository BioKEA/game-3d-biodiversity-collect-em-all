import type { JournalEntry, MapTile } from '@/types/game'

export type CaliforniaRegionId =
  | 'north-coast'
  | 'klamath-cascades'
  | 'sacramento-delta'
  | 'bay-area'
  | 'sierra-nevada'
  | 'central-valley'
  | 'central-coast'
  | 'south-coast'
  | 'deserts'
  | 'channel-islands'

export interface CaliforniaRegion {
  id: CaliforniaRegionId
  name: string
  shortName: string
  color: string
  dark: string
  accent: string
  terrain: string
  encounterStage: string
  fieldGuideGoal: string
}

export const CALIFORNIA_REGIONS: Record<CaliforniaRegionId, CaliforniaRegion> = {
  'north-coast': {
    id: 'north-coast',
    name: 'North Coast Redwoods',
    shortName: 'North Coast',
    color: '#34d399',
    dark: '#064e3b',
    accent: '#a7f3d0',
    terrain: 'Foggy coast shelves, river mouths, redwood ravines, and steep sea-facing hills.',
    encounterStage: 'Tall trunks, low fog, wet ferns, and filtered green light.',
    fieldGuideGoal: 'Document old-growth specialists, amphibians, fog species, and coastal birds.',
  },
  'klamath-cascades': {
    id: 'klamath-cascades',
    name: 'Klamath, Cascades, and Modoc',
    shortName: 'Cascades',
    color: '#93c5fd',
    dark: '#1e3a8a',
    accent: '#dbeafe',
    terrain: 'Volcanic peaks, lava beds, alpine forests, snowfields, and high plateaus.',
    encounterStage: 'Basalt blocks, cold stars, pumice ridges, and snowy volcanic silhouettes.',
    fieldGuideGoal: 'Track high-country birds, fire-adapted creatures, and volcanic-range forms.',
  },
  'sacramento-delta': {
    id: 'sacramento-delta',
    name: 'Sacramento Valley and Delta',
    shortName: 'Delta',
    color: '#5eead4',
    dark: '#134e4a',
    accent: '#ccfbf1',
    terrain: 'Flat valley floor, tidal sloughs, river channels, rice fields, levees, and tule marsh.',
    encounterStage: 'Layered reeds, glittering channels, flyway silhouettes, and low levee horizons.',
    fieldGuideGoal: 'Build a wetland and flyway record across rivers, farms, and restored marsh.',
  },
  'bay-area': {
    id: 'bay-area',
    name: 'San Francisco Bay Area',
    shortName: 'Bay Area',
    color: '#fbbf24',
    dark: '#713f12',
    accent: '#fef3c7',
    terrain: 'Bay water, bridges, fog belts, urban hills, oak slopes, marsh edges, and peninsula ridges.',
    encounterStage: 'Glass skyline blocks, bridge lights, coastal fog, and bright estuary water.',
    fieldGuideGoal: 'Tie city wildlife, bridge routes, Bay marshes, and peninsula habitats together.',
  },
  'sierra-nevada': {
    id: 'sierra-nevada',
    name: 'Sierra Nevada',
    shortName: 'Sierra',
    color: '#c4b5fd',
    dark: '#4c1d95',
    accent: '#ede9fe',
    terrain: 'Exaggerated granite relief, alpine lakes, sequoia groves, snow crests, and deep canyons.',
    encounterStage: 'Stepped granite walls, bright snowcaps, waterfall mist, and high talus ledges.',
    fieldGuideGoal: 'Complete vertical habitat chains from foothill oak to snowfield specialists.',
  },
  'central-valley': {
    id: 'central-valley',
    name: 'Central Valley',
    shortName: 'Valley',
    color: '#bef264',
    dark: '#365314',
    accent: '#ecfccb',
    terrain: 'Broad flatlands, orchards, grassland remnants, canals, and seasonal wetland basins.',
    encounterStage: 'Long horizon bands, crop rows, irrigation glints, and warm flyway skies.',
    fieldGuideGoal: 'Recover the hidden wetland and grassland story beneath the farm grid.',
  },
  'central-coast': {
    id: 'central-coast',
    name: 'Central Coast and Santa Lucia',
    shortName: 'Central Coast',
    color: '#fb923c',
    dark: '#7c2d12',
    accent: '#fed7aa',
    terrain: 'Big Sur cliffs, Monterey Bay, oak woodland, chaparral ridges, dunes, and tidepools.',
    encounterStage: 'Ocean cliffs, kelp water, cypress silhouettes, and warm sandstone blocks.',
    fieldGuideGoal: 'Link coastal marine species with cliff, canyon, and oak woodland creatures.',
  },
  'south-coast': {
    id: 'south-coast',
    name: 'Southern California Coast',
    shortName: 'SoCal Coast',
    color: '#f472b6',
    dark: '#831843',
    accent: '#fce7f3',
    terrain: 'Urban basin, beaches, chaparral mountains, missions, piers, canyons, and coastal lagoons.',
    encounterStage: 'Bright skyline blocks, palm silhouettes, chaparral hills, and sunset pier lights.',
    fieldGuideGoal: 'Connect city-adapted species with beach, canyon, and coastal-sage habitats.',
  },
  deserts: {
    id: 'deserts',
    name: 'Mojave, Colorado, and Death Valley',
    shortName: 'Deserts',
    color: '#facc15',
    dark: '#713f12',
    accent: '#fef08a',
    terrain: 'Hot basins, Joshua tree flats, dunes, salt pans, volcanic ranges, and desert canyons.',
    encounterStage: 'Sharp shadows, salt flats, heat shimmer, ocotillo spikes, and star-heavy nights.',
    fieldGuideGoal: 'Find nocturnal, burrowing, heat-adapted, and superbloom-linked creatures.',
  },
  'channel-islands': {
    id: 'channel-islands',
    name: 'Channel Islands',
    shortName: 'Islands',
    color: '#38bdf8',
    dark: '#075985',
    accent: '#e0f2fe',
    terrain: 'Offshore islands, sea caves, kelp channels, endemic fox habitat, and windswept bluffs.',
    encounterStage: 'Island silhouettes, blue channels, kelp beds, and wind-carved grass.',
    fieldGuideGoal: 'Separate island endemics and marine migrations from mainland coastal records.',
  },
}

const REGION_ORDER: CaliforniaRegionId[] = [
  'channel-islands',
  'bay-area',
  'north-coast',
  'klamath-cascades',
  'sacramento-delta',
  'sierra-nevada',
  'deserts',
  'south-coast',
  'central-coast',
  'central-valley',
]

const SUBREGION_KEYWORDS: Array<[CaliforniaRegionId, RegExp]> = [
  ['channel-islands', /channel island|santa cruz island|anacapa|santa rosa island|san miguel/i],
  ['bay-area', /san francisco|financial district|soma|mission|north beach|fisherman|golden gate|twin peaks|presidio|alcatraz|oakland|berkeley|san jose|stanford|palo alto|silicon valley|mt\.? diablo|muir|tamalpais|marin|bay bridge|san pablo bay|south bay|petaluma|napa|sonoma|walnut creek|fremont|hayward|richmond/i],
  ['sacramento-delta', /sacramento|stockton|delta|suisun|sutter|yolo|colusa|rice|tule|san joaquin valley|modesto|fresno|bakersfield/i],
  ['north-coast', /redwood|cresent|crescent|del norte|klamath river|prairie creek|trinidad|arcata|eureka|humboldt|lost coast|mendocino|fort bragg|point arena|shelter cove|sea ranch|jenner/i],
  ['klamath-cascades', /shasta|lassen|modoc|lava beds|yreka|castle crags|trinity|weaverville|cascades/i],
  ['sierra-nevada', /tahoe|yosemite|sequoia|kings canyon|whitney|mono lake|mammoth|bristlecone|postpile|palisades|inyo|white mountain|emerald bay|half dome/i],
  ['central-coast', /santa cruz|monterey|big sur|carmel|salinas|san luis|morro|hearst|bixby|pismo|santa lucia|point reyes/i],
  ['south-coast', /los angeles|hollywood|santa monica|malibu|ventura|santa barbara|orange county|anaheim|long beach|san diego|la jolla|coronado|balboa|torrey|capistrano|getty|griffith|olvera|watts|queen mary/i],
  ['deserts', /death valley|mojave|joshua tree|palm springs|anza|borrego|colorado desert|imperial|salton|panamint|tehachapi|san jacinto|san bernardino|providence/i],
]

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function getCaliforniaRegionForSubregion(subregion?: string): CaliforniaRegion {
  if (subregion) {
    for (const [regionId, pattern] of SUBREGION_KEYWORDS) {
      if (pattern.test(subregion)) return CALIFORNIA_REGIONS[regionId]
    }
  }
  return CALIFORNIA_REGIONS['central-valley']
}

export function getCaliforniaRegionForLandmarkRegion(region: string): CaliforniaRegion {
  if (region === 'Channel Islands') return CALIFORNIA_REGIONS['channel-islands']
  if (region === 'Bay Area' || region === 'Wine Country') return CALIFORNIA_REGIONS['bay-area']
  if (region === 'NorCal') return CALIFORNIA_REGIONS['klamath-cascades']
  if (region === 'Sierra Nevada') return CALIFORNIA_REGIONS['sierra-nevada']
  if (region === 'Central Coast') return CALIFORNIA_REGIONS['central-coast']
  if (region === 'SoCal Coast' || region === 'LA Metro' || region === 'San Diego') return CALIFORNIA_REGIONS['south-coast']
  if (region === 'Desert') return CALIFORNIA_REGIONS.deserts
  return CALIFORNIA_REGIONS['central-valley']
}

export function getCaliforniaRegionAt(x: number, y: number, subregion?: string): CaliforniaRegion {
  if (subregion) {
    const matched = getCaliforniaRegionForSubregion(subregion)
    if (matched.id !== 'central-valley' || /valley|fresno|bakersfield|stockton|sacramento|modesto/i.test(subregion)) return matched
  }

  if (inRange(x, 88, 105) && inRange(y, 390, 414)) return CALIFORNIA_REGIONS['channel-islands']
  if (inRange(y, 206, 242) && inRange(x, 42, 80)) return CALIFORNIA_REGIONS['bay-area']
  if (y < 170 && x <= 48) return CALIFORNIA_REGIONS['north-coast']
  if (y < 112 && x > 48) return CALIFORNIA_REGIONS['klamath-cascades']
  if (inRange(y, 150, 205) && inRange(x, 40, 92)) return CALIFORNIA_REGIONS['sacramento-delta']
  if (inRange(y, 110, 315) && inRange(x, 108, 155)) return CALIFORNIA_REGIONS['sierra-nevada']
  if ((x >= 145 && y >= 245) || (x >= 155 && y >= 360)) return CALIFORNIA_REGIONS.deserts
  if (y >= 370 && inRange(x, 90, 154)) return CALIFORNIA_REGIONS['south-coast']
  if (inRange(y, 242, 370) && x <= 98) return CALIFORNIA_REGIONS['central-coast']
  if (inRange(y, 112, 365) && inRange(x, 68, 112)) return CALIFORNIA_REGIONS['central-valley']
  return CALIFORNIA_REGIONS['central-valley']
}

export function getCaliforniaRegionForTile(tile: MapTile): CaliforniaRegion {
  return getCaliforniaRegionAt(tile.x, tile.y, tile.subregion)
}

export function getRegionCompletion(
  regionId: CaliforniaRegionId,
  journal: Record<string, JournalEntry>,
  visitedLandmarks: string[],
  landmarkRegionByName: (name: string) => CaliforniaRegionId | undefined,
): { visitedSubregions: number; visitedLandmarks: number; score: number } {
  const visitedSubregions = Object.keys(journal).filter(subregion => getCaliforniaRegionForSubregion(subregion).id === regionId).length
  const landmarkCount = visitedLandmarks.filter(name => landmarkRegionByName(name) === regionId).length
  return {
    visitedSubregions,
    visitedLandmarks: landmarkCount,
    score: Math.min(100, Math.round(visitedSubregions * 6 + landmarkCount * 7)),
  }
}

export function getRegionLayerColor(tile: MapTile): string {
  if (tile.borderState) return '#4b5563'
  const region = getCaliforniaRegionForTile(tile)
  return region.color
}

export function getCaliforniaRegionsInOrder(): CaliforniaRegion[] {
  return REGION_ORDER.map(id => CALIFORNIA_REGIONS[id])
}
