import type { BiomeType, MapTile } from '@/types/game'
import { FIELD_GUIDE_BIOME_COLORS } from './artDirection'

const MAP_WIDTH = 200
const MAP_HEIGHT = 500

export const BIOME_COLORS: Record<BiomeType, { top: string; side: string; dark: string }> = FIELD_GUIDE_BIOME_COLORS

function interpX(y: number, pts: [number, number][]): number {
  if (y <= pts[0][0]) return pts[0][1]
  if (y >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    if (y <= pts[i + 1][0]) {
      const t = (y - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1])
    }
  }
  return pts[pts.length - 1][1]
}

const COASTLINE: [number, number][] = [
  [0,30],[15,30],[35,29],[55,28],[65,27],[80,24],[95,28],[110,30],
  [130,33],[148,34],[165,38],[180,42],[193,40],[200,43],[208,46],
  [215,48],[220,47],[228,45],[240,47],[250,50],[262,55],[270,58],
  [285,60],[300,63],[315,67],[330,72],[345,78],[358,82],[370,85],
  [380,92],[388,98],[395,106],[402,114],[410,120],[418,126],
  [428,130],[438,133],[450,136],[465,138],[478,140],[490,142],[500,144],
]

const EAST_BORDER: [number, number][] = [
  [0,128],[80,128],[120,130],[155,132],[190,140],[220,148],
  [260,158],[290,168],[330,178],[370,185],[400,190],[430,194],[460,196],[500,196],
]

const SIERRA_W: [number, number][] = [
  [100,92],[130,96],[160,100],[190,105],[220,108],[250,112],[280,110],[310,107],[340,102],
]
const SIERRA_E: [number, number][] = [
  [100,118],[130,124],[160,132],[190,140],[220,148],[250,156],[280,162],[310,158],[340,150],
]
const VALLEY_W: [number, number][] = [
  [50,56],[100,60],[140,64],[170,68],[210,72],[250,76],[300,82],[340,86],[360,88],
]
const VALLEY_E: [number, number][] = [
  [50,88],[100,90],[140,94],[170,96],[210,100],[250,106],[300,100],[340,96],[360,92],
]

function coastAt(y: number): number { return interpX(y, COASTLINE) }
function eastAt(y: number): number { return interpX(y, EAST_BORDER) }

// California's land borders with neighboring states
// North: Oregon (y < ~3 is "past the border")
// East: Nevada for most of the length, Arizona at the far southeast
// The actual border buffer is 3 tiles wide to give visual continuity
const CA_NORTH_BORDER = 3
function getBorderState(x: number, y: number): string | null {
  const c = coastAt(y)
  if (x < c) return null // Pacific Ocean — not a state border
  if (y < CA_NORTH_BORDER) return 'Oregon'
  const eb = eastAt(y)
  if (x > eb) {
    if (y >= 460) return 'Mexico'
    if (y >= 420) return 'Arizona'
    return 'Nevada'
  }
  return null
}

function pointInPoly(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1]
    const xj = poly[j][0], yj = poly[j][1]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx, dy = (y - cy) / ry
  return dx * dx + dy * dy < 1
}

function hash(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return h - Math.floor(h)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function smoothstep(edge0: number, edge1: number, n: number): number {
  const t = clamp((n - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function ellipseInfluence(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  const d = dx * dx + dy * dy
  if (d >= 1) return 0
  return 1 - smoothstep(0.2, 1, d)
}

function rangeBandInfluence(x: number, y: number, westPts: [number, number][], eastPts: [number, number][]): number {
  const minY = Math.max(westPts[0][0], eastPts[0][0])
  const maxY = Math.min(westPts[westPts.length - 1][0], eastPts[eastPts.length - 1][0])
  if (y < minY || y > maxY) return 0

  const west = interpX(y, westPts)
  const east = interpX(y, eastPts)
  const width = east - west
  if (width <= 0) return 0

  const t = (x - west) / width
  if (t < 0 || t > 1) return 0

  const crossRange = Math.sin(Math.PI * t)
  const endFalloff = smoothstep(minY, minY + 22, y) * (1 - smoothstep(maxY - 22, maxY, y))
  return clamp(crossRange * endFalloff, 0, 1)
}

const SF_BAY: [number, number][] = [
  [54,208],[62,208],[64,212],[65,216],[66,220],[65,225],
  [63,230],[60,234],[57,233],[54,229],[52,225],[51,221],
  [51,218],[52,215],[53,211],
]

interface LakeDef { name: string; cx: number; cy: number; rx: number; ry: number }
const LAKES: LakeDef[] = [
  { name:'Lake Tahoe', cx:130, cy:156, rx:4, ry:6 },
  { name:'Mono Lake', cx:142, cy:198, rx:3, ry:3 },
  { name:'Salton Sea', cx:170, cy:462, rx:5, ry:12 },
  { name:'Clear Lake', cx:55, cy:152, rx:3, ry:4 },
  { name:'Lake Shasta', cx:72, cy:66, rx:3, ry:5 },
  { name:'Owens Lake', cx:148, cy:255, rx:3, ry:4 },
  { name:'Goose Lake', cx:127, cy:8, rx:2, ry:4 },
  { name:'Eagle Lake', cx:118, cy:42, rx:2, ry:3 },
  { name:'Lake Berryessa', cx:58, cy:170, rx:1, ry:3 },
  { name:'Folsom Lake', cx:88, cy:138, rx:2, ry:2 },
  { name:'Lake Oroville', cx:82, cy:105, rx:2, ry:3 },
  { name:'Humboldt Bay', cx:28, cy:64, rx:2, ry:3 },
]

function isGGStrait(x: number, y: number): boolean {
  return y >= 214 && y <= 217 && x >= 49 && x <= 52
}

function getBayAreaBiome(x: number, y: number): BiomeType | null {
  const c = coastAt(y)

  if (isGGStrait(x, y)) return null

  // Marin / North Bay
  if (y < 216 && x < 58) {
    if (x >= 53 && pointInPoly(x, y, SF_BAY)) return null
    if (inEllipse(x, y, 49, 212, 3, 2)) return 'redwood'
    if (inEllipse(x, y, 51, 210, 3, 3)) return 'mountain'
    if (inEllipse(x, y, 56, 210, 2, 2)) return 'urban'
    if (inEllipse(x, y, 54, 206, 3, 2)) return 'urban'
    if (x <= c + 3) return 'grassland'
    return 'forest'
  }

  // SF Peninsula
  if (y >= 216 && y <= 224 && x >= 49 && x <= 56) {
    if (x >= 55) return null
    if (inEllipse(x, y, 50, 220, 2, 2)) return 'forest'
    return 'urban'
  }

  // Pacifica / HMB
  if (y >= 220 && y <= 240 && x >= c && x <= c + 4) {
    if (y > 228) return 'forest'
    return 'urban'
  }

  // Oakland / Berkeley / East Bay
  if (y >= 210 && y <= 226 && x >= 62 && x <= 70) {
    if (y >= 216 && x <= 63) return null
    if (x >= 67) return 'forest'
    return 'urban'
  }

  // Walnut Creek / Concord / Diablo
  if (y >= 210 && y <= 226 && x >= 70 && x <= 78) {
    if (inEllipse(x, y, 72, 216, 3, 3)) return 'urban'
    if (inEllipse(x, y, 74, 212, 3, 3)) return 'urban'
    if (inEllipse(x, y, 74, 220, 4, 4)) return 'mountain'
    return 'grassland'
  }

  // Peninsula south of SF
  if (y >= 224 && y <= 232 && x >= 49 && x <= 56) return 'urban'

  // South Bay - Peninsula side
  if (y >= 228 && y <= 238 && x >= 56 && x <= 58) return 'urban'
  // South Bay - East Bay side
  if (y >= 228 && y <= 238 && x >= 62 && x <= 66) return 'urban'

  // San Jose / South Valley (south of bay tip)
  if (y >= 234 && y <= 242 && x >= 58 && x <= 64) return 'urban'

  // Livermore
  if (y >= 222 && y <= 230 && x >= 74 && x <= 82) {
    if (inEllipse(x, y, 76, 226, 3, 3)) return 'urban'
    return 'grassland'
  }

  // SC Mountains
  if (y >= 230 && y <= 252 && x >= c && x <= c + 8) {
    if (hash(x, y) > 0.4) return 'redwood'
    return 'forest'
  }

  // Santa Cruz / Monterey
  if (y >= 245) {
    if (inEllipse(x, y, 52, 252, 3, 3)) return 'urban'
    if (inEllipse(x, y, 62, 268, 4, 3)) return 'urban'
    return 'grassland'
  }

  return null
}

function getWaterName(x: number, y: number): string | null {
  if (x < coastAt(y)) return 'Pacific Ocean'
  if (isGGStrait(x, y)) return 'Golden Gate Strait'
  if (pointInPoly(x, y, SF_BAY)) {
    if (y < 213) return 'San Pablo Bay'
    if (y > 226) return 'South Bay'
    return 'San Francisco Bay'
  }
  for (const l of LAKES) {
    if (inEllipse(x, y, l.cx, l.cy, l.rx, l.ry)) return l.name
  }
  return null
}

function isWater(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true
  return getWaterName(x, y) !== null
}

function nearWater(x: number, y: number): boolean {
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      if (isWater(x + dx, y + dy)) return true
  return false
}

function getBiome(x: number, y: number): BiomeType {
  // Bay Area land takes priority over generic water/marsh checks
  if (y >= 206 && y <= 250 && x >= 42 && x <= 80) {
    const bayBiome = getBayAreaBiome(x, y)
    if (bayBiome !== null) return bayBiome
  }

  // Distinct terrain for neighboring states
  const border = getBorderState(x, y)
  if (border === 'Oregon') {
    const h = hash(x, y)
    if (h > 0.7) return 'mountain'
    if (h > 0.2) return 'forest'
    return 'redwood'
  }
  if (border === 'Nevada') {
    const h = hash(x, y)
    if (y < 150) return h > 0.4 ? 'scrubland' : 'grassland'
    if (y < 300) return h > 0.3 ? 'desert' : 'scrubland'
    return h > 0.2 ? 'desert' : 'dunes'
  }
  if (border === 'Arizona') {
    const h = hash(x, y)
    return h > 0.7 ? 'canyon' : h > 0.15 ? 'desert' : 'dunes'
  }
  if (border === 'Mexico') {
    return hash(x, y) > 0.3 ? 'desert' : 'scrubland'
  }

  if (isWater(x, y)) {
    const c = coastAt(y)
    if (x < c && x >= c - 3 && y > 100 && y < 320 && hash(x, y) > 0.5) return 'kelp_forest'
    if (x < c && x >= c - 3 && y > 400 && y < 490 && hash(x, y) > 0.6) return 'kelp_forest'
    return 'water'
  }

  const nw = nearWater(x, y)
  const c = coastAt(y)

  // Coastal
  if (nw && x <= c + 2) {
    if (y > 280 && y < 320) return hash(x, y) > 0.5 ? 'rocky_beach' : 'tidepool'
    if (y > 240 && y < 270) return 'beach'
    if (y > 400 && y < 500) return 'beach'
    return hash(x, y) > 0.6 ? 'tidepool' : 'rocky_beach'
  }

  // Marshes near water
  if (nw) {
    if (y >= 208 && y <= 236) return 'marsh'
    if (y >= 165 && y <= 178 && x >= 64 && x <= 78) return 'marsh'
    if (y >= 60 && y <= 70 && x >= 26 && x <= 30) return 'marsh'
    return 'lakeshore'
  }

  // === NAMED PEAKS ===
  if (inEllipse(x, y, 78, 35, 5, 5)) return 'snow'
  if (inEllipse(x, y, 78, 35, 8, 8)) return 'alpine'
  if (inEllipse(x, y, 85, 78, 6, 6)) return 'volcanic'
  if (inEllipse(x, y, 138, 248, 4, 4)) return 'snow'

  // === URBAN AREAS ===
  if (inEllipse(x, y, 82, 140, 7, 5)) return 'urban'
  if (inEllipse(x, y, 72, 68, 5, 4)) return 'urban'
  if (inEllipse(x, y, 29, 63, 3, 3)) return 'urban'
  if (inEllipse(x, y, 78, 102, 4, 3)) return 'urban'
  if (inEllipse(x, y, 88, 170, 4, 3)) return 'urban'
  if (inEllipse(x, y, 92, 238, 5, 4)) return 'urban'
  if (inEllipse(x, y, 90, 320, 5, 4)) return 'urban'
  if (inEllipse(x, y, 80, 340, 4, 4)) return 'urban'
  if (inEllipse(x, y, 100, 390, 5, 3)) return 'urban'
  if (inEllipse(x, y, 108, 395, 4, 3)) return 'urban'
  if (y >= 408 && y <= 432 && x >= 115 && x <= 145) return 'urban'
  if (y >= 418 && y <= 435 && x >= 140 && x <= 155) return 'urban'
  if (inEllipse(x, y, 143, 483, 7, 7)) return 'urban'
  if (inEllipse(x, y, 158, 440, 4, 4)) return 'urban'
  if (inEllipse(x, y, 52, 252, 3, 2)) return 'urban'
  if (inEllipse(x, y, 62, 268, 4, 3)) return 'urban'
  if (inEllipse(x, y, 86, 134, 3, 3)) return 'urban'
  if (inEllipse(x, y, 90, 15, 4, 3)) return 'urban'

  // === SIERRA NEVADA ===
  const sw = interpX(y, SIERRA_W), se = interpX(y, SIERRA_E)
  if (y >= 100 && y <= 340 && x >= sw && x <= se) {
    const center = (sw + se) / 2
    const norm = Math.abs(x - center) / ((se - sw) / 2)
    if (inEllipse(x, y, 118, 200, 8, 8)) {
      if (norm < 0.3) return 'alpine'
      return 'mountain'
    }
    if (y >= 240 && y <= 270 && x >= 108 && x <= 125 && hash(x, y) > 0.4) return 'old_growth'
    if (norm < 0.25) return y < 165 ? 'snow' : 'alpine'
    if (norm < 0.45) return 'alpine'
    if (x < center) return 'forest'
    return 'scrubland'
  }

  // === TRANSVERSE RANGES ===
  if (y >= 395 && y <= 425 && x >= 128 && x <= 165) {
    if (inEllipse(x, y, 138, 410, 3, 2)) return 'alpine'
    if (inEllipse(x, y, 138, 410, 7, 5)) return 'mountain'
    if (inEllipse(x, y, 152, 412, 3, 2)) return 'alpine'
    if (inEllipse(x, y, 152, 412, 6, 5)) return 'mountain'
    return 'chaparral'
  }

  // === PENINSULAR RANGES ===
  if (y >= 430 && y <= 490 && x >= 146 && x <= 162) {
    if (inEllipse(x, y, 155, 445, 5, 8)) return 'mountain'
    return 'chaparral'
  }

  // === DESERTS ===
  if (y >= 370 && y <= 445 && x >= 148 && x <= eastAt(y)) {
    if (inEllipse(x, y, 178, 395, 5, 5)) return 'dunes'
    if (inEllipse(x, y, 165, 438, 8, 8)) return hash(x, y) > 0.5 ? 'scrubland' : 'desert'
    return hash(x, y) > 0.85 ? 'scrubland' : 'desert'
  }
  if (y >= 270 && y <= 330 && x >= 155 && x <= eastAt(y)) {
    if (inEllipse(x, y, 165, 300, 4, 10)) return 'dunes'
    return hash(x, y) > 0.5 ? 'canyon' : 'desert'
  }
  if (y >= 445 && x >= 160 && x <= eastAt(y)) {
    if (inEllipse(x, y, 188, 478, 6, 6)) return 'dunes'
    return 'desert'
  }

  // === OWENS VALLEY ===
  if (y >= 200 && y <= 270 && x >= se && x <= se + 15) return 'scrubland'

  // === CENTRAL VALLEY ===
  const vw = interpX(y, VALLEY_W), ve = interpX(y, VALLEY_E)
  if (y >= 50 && y <= 360 && x >= vw && x <= ve) return 'valley'

  // === CASCADES ===
  if (y < 95 && x >= 68 && x <= 100) return hash(x, y) > 0.6 ? 'mountain' : 'forest'
  if (y < 60 && x >= 35 && x <= 68) return 'mountain'
  if (y < 100 && x >= 100 && x <= eastAt(y)) return 'scrubland'

  // === REDWOOD BELT ===
  if (x >= c && x <= c + 6) {
    if (y >= 10 && y <= 45) return 'redwood'
    if (y >= 55 && y <= 80) return hash(x, y) > 0.3 ? 'redwood' : 'forest'
    if (y >= 95 && y <= 140) return 'redwood'
    if (y >= 280 && y <= 310) return 'redwood'
  }

  // === WINE COUNTRY ===
  if (y >= 160 && y <= 200 && x >= 48 && x <= 62) return hash(x, y) > 0.5 ? 'oak_woodland' : 'grassland'

  // === COAST RANGES ===
  if (y >= 260 && y <= 370 && x >= c + 5 && x <= 90) return hash(x, y) > 0.5 ? 'chaparral' : 'oak_woodland'
  if (y >= 30 && y <= 160 && x >= c + 3 && x <= 55) return hash(x, y) > 0.4 ? 'forest' : 'oak_woodland'

  // === SOCAL CHAPARRAL ===
  if (y >= 370 && x >= c + 3 && x < 145) return hash(x, y) > 0.4 ? 'chaparral' : 'grassland'
  if (y >= 432 && y <= 500 && x >= c && x <= c + 10) return 'chaparral'

  // === DEFAULT ===
  if (y < 100) return hash(x, y) > 0.5 ? 'forest' : 'grassland'
  return 'grassland'
}

function getElevation(x: number, y: number, biome: BiomeType): number {
  if (biome === 'water' || biome === 'kelp_forest') return 0

  const n = hash(x * 1.73, y * 0.91) - 0.5
  let elevation = 0.9

  if (biome === 'tidepool') elevation = 0.2
  else if (biome === 'beach' || biome === 'marsh' || biome === 'lakeshore') elevation = 0.3
  else if (biome === 'dunes' || biome === 'desert') elevation = 0.55
  else if (biome === 'valley') elevation = 0.42
  else if (biome === 'grassland' || biome === 'scrubland') elevation = 0.8 + hash(x, y) * 0.35
  else if (biome === 'urban') elevation = 0.9
  else if (biome === 'forest' || biome === 'chaparral' || biome === 'oak_woodland') elevation = 1.2 + hash(x, y) * 0.35
  else if (biome === 'redwood' || biome === 'old_growth') elevation = 1.55 + hash(x, y) * 0.35
  else if (biome === 'mountain' || biome === 'volcanic' || biome === 'canyon') elevation = 2.45 + hash(x, y) * 0.55
  else if (biome === 'alpine') elevation = 3.15 + hash(x, y) * 0.45
  else if (biome === 'snow') elevation = 3.8 + hash(x, y) * 0.45
  else if (biome === 'rocky_beach') elevation = 0.55

  // California's main physical structure: low Central Valley, high Sierra Nevada.
  const valleyFloor = rangeBandInfluence(x, y, VALLEY_W, VALLEY_E)
  if (valleyFloor > 0) {
    elevation = Math.min(elevation, 0.38 + hash(x + 9, y + 3) * 0.18)
  }

  const sierra = rangeBandInfluence(x, y, SIERRA_W, SIERRA_E)
  if (sierra > 0) {
    elevation = Math.max(elevation, 1.15 + sierra * 4.35 + n * 0.45)
  }

  // Coastal ranges: lower than the Sierra, but visible as long north/south ridges.
  const coast = coastAt(y)
  if (x >= coast + 3 && x <= coast + 18 && y >= 25 && y <= 380) {
    const t = (x - (coast + 3)) / 15
    const ridge = Math.sin(Math.PI * clamp(t, 0, 1))
    elevation = Math.max(elevation, 0.9 + ridge * 1.7 + n * 0.25)
  }

  // Named high points and volcanic/cascade terrain.
  const highPoints = [
    { cx: 78, cy: 35, rx: 16, ry: 18, peak: 5.4 },  // Mt. Shasta / Castle Crags
    { cx: 85, cy: 78, rx: 18, ry: 20, peak: 4.9 },  // Lassen Volcanic
    { cx: 130, cy: 156, rx: 14, ry: 24, peak: 4.9 }, // Tahoe crest
    { cx: 115, cy: 200, rx: 16, ry: 22, peak: 5.2 }, // Yosemite high country
    { cx: 118, cy: 255, rx: 18, ry: 24, peak: 5.15 }, // Sequoia / Kings Canyon
    { cx: 49, cy: 210, rx: 8, ry: 8, peak: 3.35 },  // Mt. Tamalpais
    { cx: 74, cy: 220, rx: 9, ry: 9, peak: 3.9 },   // Mt. Diablo
    { cx: 56, cy: 245, rx: 13, ry: 18, peak: 3.1 }, // Santa Cruz Mountains
    { cx: 126, cy: 418, rx: 24, ry: 18, peak: 3.8 }, // Transverse ranges north of LA
    { cx: 144, cy: 475, rx: 18, ry: 22, peak: 3.25 }, // Peninsular ranges
    { cx: 165, cy: 438, rx: 18, ry: 22, peak: 2.8 }, // Joshua Tree uplands
  ]
  for (const hp of highPoints) {
    const influence = ellipseInfluence(x, y, hp.cx, hp.cy, hp.rx, hp.ry)
    if (influence > 0) elevation = Math.max(elevation, 1 + influence * (hp.peak - 1) + n * 0.25)
  }

  // Death Valley is a low basin tucked beside high desert mountains.
  const deathValleyBasin = ellipseInfluence(x, y, 165, 295, 9, 25)
  if (deathValleyBasin > 0) {
    elevation = Math.min(elevation, 0.18 + (1 - deathValleyBasin) * 0.6)
  }
  const deathValleyRanges = Math.max(
    ellipseInfluence(x, y, 154, 292, 10, 28),
    ellipseInfluence(x, y, 176, 292, 10, 28),
  )
  if (deathValleyRanges > 0) {
    elevation = Math.max(elevation, 1.2 + deathValleyRanges * 2.4)
  }

  return Math.round(clamp(elevation, 0.15, 5.8) * 100) / 100
}

// Subregion centers: [name, cx, cy, radius]
const SUBS: [string, number, number, number][] = [
  // North Coast
  ['Jedediah Smith Redwoods',31,8,5],['Crescent City',30,15,4],['Del Norte Coast',28,22,5],
  ['Klamath River',32,30,5],['Prairie Creek Redwoods',29,18,4],['Trinidad',28,45,4],
  ['Arcata',29,58,4],['Eureka',29,63,4],['Humboldt Redwoods',26,72,5],
  ['Cape Mendocino',24,82,4],['Lost Coast',27,90,6],['Shelter Cove',28,95,4],
  ['Fort Bragg',33,130,4],['Mendocino',34,138,4],['Point Arena',35,148,4],
  ['Sea Ranch',36,155,4],['Salt Point',37,160,4],['Jenner',38,165,3],
  // North Interior
  ['Yreka',90,15,5],['Mt. Shasta',78,35,6],['Castle Crags',74,42,4],
  ['Weaverville',58,50,5],['Lava Beds',115,20,8],['Modoc Plateau',120,35,8],
  ['Redding',72,68,5],['Lake Shasta',72,60,5],['Lassen Volcanic NP',85,78,7],
  ['Susanville',110,52,5],['Burney Falls',88,55,4],['Eagle Lake',118,42,4],
  ['Red Bluff',68,82,4],
  // Sacramento Valley
  ['Chico',78,102,5],['Oroville',82,108,4],['Yuba City',78,118,4],
  ['Woodland',76,135,4],['Davis',76,140,4],['Sacramento',82,140,7],
  ['Roseville',86,134,4],['Folsom',90,136,4],['Elk Grove',84,150,4],
  // Wine Country
  ['Napa',56,178,4],['Sonoma',52,182,4],['Santa Rosa',48,175,5],
  ['Petaluma',46,188,4],['Healdsburg',44,168,4],['Calistoga',58,172,3],
  ['Bodega Bay',42,190,3],
  // Bay Area
  ['Point Reyes',42,205,5],['Muir Woods',49,212,3],['Mt. Tamalpais',51,210,3],
  ['Sausalito',51,214,3],['San Rafael',56,210,4],['Novato',54,206,4],
  ['The Presidio',50,217,2],['Financial District',53,219,2],['SoMa / Mission District',53,221,2],
  ['North Beach / Fishermans Wharf',52,218,2],['Twin Peaks',51,221,2],
  ['Sunset District',49,222,2],['Golden Gate Park',50,220,2],
  ['San Francisco',52,220,5],['Crissy Field',50,217,1],['Baker Beach',49,219,2],
  ['Ocean Beach',48,222,2],['Fishermans Wharf / Pier 39',51,218,1],
  ['Downtown Oakland',64,218,3],['Berkeley',64,215,3],['Oakland Hills',67,218,3],
  ['Tilden Regional Park',65,214,2],['Redwood Regional Park',67,216,2],
  ['Richmond',63,210,3],['Walnut Creek',72,216,4],['Concord',74,212,4],
  ['Mt. Diablo',74,220,4],['Daly City',50,224,3],['San Mateo',52,226,3],
  ['Palo Alto',54,229,3],['Palo Alto / Menlo Park',55,230,3],
  ['San Jose',60,232,5],['Fremont',64,228,4],['Fremont / Union City',64,230,3],
  ['Coyote Hills',62,232,3],['Don Edwards Wildlife Refuge',61,233,2],['Alviso Marsh',60,234,2],
  ['Rancho San Antonio',56,232,3],['Sunol Regional Wilderness',68,228,3],
  ['Livermore',76,226,4],['Half Moon Bay',45,233,3],['Pacifica',47,222,3],
  ['Milpitas',62,233,3],['Marin Headlands',49,215,2],['Hawk Hill',49,214,2],
  ['Muir Beach',47,213,2],['Richardson Bay',51,213,2],
  // Santa Cruz / Monterey
  ['Santa Cruz',52,252,4],['UC Santa Cruz',53,251,2],['Santa Cruz Beach Boardwalk',52,253,2],
  ['Santa Cruz Coast',50,253,3],['Watsonville',56,258,4],['Monterey',60,268,4],
  ['Monterey Bay',56,262,5],['Monterey Bay Kelp Forest',55,264,4],
  ['Carmel',58,272,3],['Pacific Grove',59,266,3],['Pinnacles NP',72,265,5],
  // Central Valley South
  ['Stockton',88,170,5],['Tracy',82,175,4],['Modesto',86,192,5],
  ['Merced',90,215,5],['Fresno',92,238,6],['Visalia',95,265,5],
  ['Bakersfield',90,320,6],['Delano',92,300,4],
  // Sierra Nevada
  ['Auburn',92,130,4],['Placerville',95,136,4],['Lake Tahoe',130,156,5],
  ['Truckee',126,148,4],['Donner Pass',124,146,3],
  ['Yosemite Valley',115,200,5],['Tuolumne Meadows',120,195,4],
  ['Mammoth Lakes',140,212,4],['Bishop',148,235,4],['Mt. Whitney',138,248,4],
  ['Sequoia NP',118,255,6],['Kings Canyon',115,245,5],['Lone Pine',148,250,4],
  ['Mono Lake',142,198,4],['Desolation Wilderness',126,155,4],
  // Central Coast
  ['Big Sur',62,290,6],['San Simeon',67,315,4],['Morro Bay',73,330,4],
  ['San Luis Obispo',80,340,5],['Pismo Beach',79,348,4],['Paso Robles',82,325,5],
  ['Cambria',68,318,3],
  // SoCal Mountains
  ['San Gabriel Mountains',138,410,7],['San Bernardino Mountains',152,412,6],
  ['Big Bear Lake',155,415,4],['San Jacinto Mountains',155,445,5],
  ['Palomar Mountain',148,460,4],
  // SoCal Coast
  ['Santa Barbara',100,390,5],['Ventura',108,395,4],['Malibu',115,405,4],
  ['Santa Monica',120,412,4],['Long Beach',130,425,4],
  ['Huntington Beach',132,428,4],['Laguna Beach',134,434,3],
  ['Oceanside',137,450,4],['La Jolla',140,475,4],
  // LA Metro
  ['Downtown LA',126,418,5],['Hollywood',123,416,4],['Pasadena',132,414,4],
  ['Anaheim',136,422,4],['Riverside',148,425,5],['San Bernardino',150,420,5],
  // San Diego
  ['San Diego',143,483,5],['Point Loma',140,486,3],['Coronado',142,487,3],
  ['Escondido',146,468,4],['Temecula',150,455,5],['Julian',152,468,4],
  // Deserts
  ['Death Valley',165,295,8],['Badwater Basin',167,300,4],['Zabriskie Point',163,290,3],
  ['Mojave NP',175,378,8],['Kelso Dunes',178,385,5],['Barstow',155,388,5],
  ['Victorville',148,395,5],['Joshua Tree NP',165,438,8],
  ['Palm Springs',158,440,5],['Palm Desert',162,445,4],
  ['Anza-Borrego',160,465,8],['Borrego Springs',162,462,4],
  ['Imperial Valley',175,480,6],['Algodones Dunes',188,478,6],
  ['Salton Sea',178,470,5],
  // Channel Islands
  ['Santa Cruz Island',95,402,4],['Santa Catalina Island',120,430,4],['Channel Islands',95,402,6],
  // Aliases and fine-grained subregions
  ['Joshua Tree',165,438,6],['Mojave Desert',170,385,10],['Los Angeles',126,418,6],
  ['Sequoia National Park',118,255,5],['Lassen Volcanic',85,78,5],['Shasta Lake',72,60,4],
  ['Inland Empire',148,425,6],['Orange County',134,430,5],['San Joaquin Valley',90,250,15],
  ['Carrizo Plain',82,310,6],['Gold Country',92,135,5],['Pinnacles',72,265,4],
  ['Downtown San Francisco',53,219,2],['Lake Merritt',65,218,2],['Lake Merced',50,224,2],
  ['Stow Lake',50,220,1],['Pillar Point Harbor',44,233,2],['Pigeon Point',42,240,2],
  ['Montara',46,226,2],['Fitzgerald Marine Reserve',45,230,2],
  ['Big Basin',48,248,3],['Purisima Creek Redwoods',48,232,3],
  ['Año Nuevo',42,247,3],['Elkhorn Slough',58,262,3],
  ['Baylands Nature Preserve',54,231,2],['Henry W. Coe State Park',66,234,4],
  ['Briones Regional Park',68,212,3],['McNears Brickyard',55,208,2],
  ['Sacramento River',82,140,5],['American River',86,138,4],['Mokelumne River',88,165,4],
]

function getSubregion(x: number, y: number, biome: BiomeType): string {
  if (biome === 'water') {
    const wn = getWaterName(x, y)
    if (wn) return wn
  }
  if (biome === 'kelp_forest') {
    if (y < 200) return 'North Coast Kelp Forest'
    if (y < 320) return 'Central Coast Kelp Forest'
    return 'Southern Kelp Forest'
  }
  let bestIn: [string, number, number, number] | null = null
  let bestR = Infinity
  let bestOut: [string, number, number, number] | null = null
  let bestScore = Infinity
  for (const s of SUBS) {
    const dx = x - s[1], dy = y - s[2]
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < s[3]) {
      if (s[3] < bestR) { bestIn = s; bestR = s[3] }
    } else {
      const score = dist / s[3]
      if (score < bestScore) { bestOut = s; bestScore = score }
    }
  }
  if (bestIn) return bestIn[0]
  if (bestOut && bestScore < 2.5) return bestOut[0]
  return 'California Wilderness'
}

// Bridges
interface BridgeDef { name: string; tiles: [number, number][] }

function genBridgeTiles(x1: number, y1: number, x2: number, y2: number): [number, number][] {
  const tiles: [number, number][] = []
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1
  let err = dx - dy, cx = x1, cy = y1
  while (true) {
    tiles.push([cx, cy])
    if (cx === x2 && cy === y2) break
    const e2 = 2 * err
    const stepX = e2 > -dy, stepY = e2 < dx
    if (stepX && stepY) {
      err -= dy; cx += sx; tiles.push([cx, cy]); err += dx; cy += sy
    } else if (stepX) { err -= dy; cx += sx }
    else { err += dx; cy += sy }
  }
  return tiles
}

const BRIDGES: BridgeDef[] = [
  { name: 'Golden Gate Bridge', tiles: genBridgeTiles(49, 213, 49, 218) },
  { name: 'Bay Bridge', tiles: [...genBridgeTiles(50, 218, 57, 218), ...genBridgeTiles(57, 218, 64, 218)] },
  { name: 'Richmond-San Rafael Bridge', tiles: genBridgeTiles(55, 210, 62, 210) },
  { name: 'San Mateo Bridge', tiles: genBridgeTiles(53, 226, 64, 226) },
  { name: 'Dumbarton Bridge', tiles: genBridgeTiles(54, 229, 63, 229) },
]

const BRIDGE_MAP = new Map<string, string>()
for (const b of BRIDGES) for (const [bx, by] of b.tiles) BRIDGE_MAP.set(`${bx},${by}`, b.name)

export function getBridgeAt(x: number, y: number): string | undefined {
  return BRIDGE_MAP.get(`${x},${y}`)
}

// Islands
interface IslandDef { name: string; biome: BiomeType; tiles: [number, number][] }

const ISLANDS: IslandDef[] = [
  { name: 'Alcatraz Island', biome: 'urban', tiles: [[53,212],[54,212],[53,213],[54,213]] },
  { name: 'Angel Island', biome: 'forest', tiles: [[55,211],[56,211],[55,212],[56,212],[55,213],[56,213]] },
  { name: 'Treasure Island', biome: 'urban', tiles: [[57,217],[58,217],[57,218],[58,218]] },
  { name: 'Santa Cruz Island', biome: 'chaparral', tiles: [[94,401],[95,401],[96,401],[94,402],[95,402],[96,402],[95,403]] },
  { name: 'Santa Catalina Island', biome: 'chaparral', tiles: [[119,429],[120,429],[121,429],[119,430],[120,430],[121,430],[120,431]] },
]

const ISLAND_MAP = new Map<string, IslandDef>()
for (const isl of ISLANDS) for (const [ix, iy] of isl.tiles) ISLAND_MAP.set(`${ix},${iy}`, isl)

function getIslandAt(x: number, y: number): IslandDef | undefined {
  return ISLAND_MAP.get(`${x},${y}`)
}

// Boat Docks
export interface BoatDock {
  name: string; x: number; y: number
  destinationName: string; destX: number; destY: number
}

export const BOAT_DOCKS: BoatDock[] = [
  { name: 'SF Ferry Building', x: 51, y: 219, destinationName: 'Sausalito', destX: 50, destY: 212 },
  { name: 'Sausalito Ferry', x: 50, y: 212, destinationName: 'SF Ferry Building', destX: 51, destY: 219 },
  { name: 'SF Ferry (Oakland)', x: 52, y: 219, destinationName: 'Jack London Square', destX: 64, destY: 219 },
  { name: 'Jack London Square Ferry', x: 64, y: 219, destinationName: 'SF Ferry Building', destX: 52, destY: 219 },
  { name: 'Alcatraz Cruises', x: 51, y: 218, destinationName: 'Alcatraz Island', destX: 53, destY: 213 },
  { name: 'Alcatraz Dock', x: 53, y: 213, destinationName: 'Embarcadero', destX: 51, destY: 218 },
  { name: 'Angel Island Ferry', x: 50, y: 213, destinationName: 'Angel Island', destX: 55, destY: 212 },
  { name: 'Angel Island Dock', x: 55, y: 212, destinationName: 'Sausalito', destX: 50, destY: 212 },
]

export function getBoatDockAt(x: number, y: number): BoatDock | undefined {
  return BOAT_DOCKS.find(d => d.x === x && d.y === y)
}

// Border signposts — placed on the last walkable CA tile facing each neighboring state
export interface BorderSignpost {
  x: number; y: number
  state: string // neighboring state name
  message: string
  fact: string
}

export const BORDER_SIGNPOSTS: BorderSignpost[] = [
  // Oregon border
  { x: 40, y: 3, state: 'Oregon', message: 'Now leaving California. Welcome to Oregon!', fact: 'Oregon became a state in 1859 — the 33rd state.' },
  { x: 70, y: 3, state: 'Oregon', message: 'California / Oregon State Line', fact: 'The border follows the 42nd parallel north.' },
  { x: 100, y: 3, state: 'Oregon', message: 'You are at the northern edge of California.', fact: 'The CA-OR border is 210 miles long.' },
  // Nevada border
  { x: 128, y: 30, state: 'Nevada', message: 'California / Nevada State Line', fact: 'Nevada means "snow-capped" in Spanish.' },
  { x: 131, y: 150, state: 'Nevada', message: 'Entering Nevada — The Silver State', fact: 'Lake Tahoe straddles both California and Nevada.' },
  { x: 155, y: 250, state: 'Nevada', message: 'Edge of California. Nevada beyond.', fact: 'Death Valley and the Nevada border are 100 miles apart.' },
  { x: 181, y: 350, state: 'Nevada', message: 'California / Nevada border', fact: 'The Mojave Desert extends into both states.' },
  // Arizona border
  { x: 194, y: 430, state: 'Arizona', message: 'California / Arizona State Line', fact: 'The Colorado River forms most of the CA-AZ border.' },
  // Mexico border
  { x: 196, y: 470, state: 'Mexico', message: 'U.S. / Mexico International Border', fact: 'The CA-Mexico border is 140 miles long.' },
]

const SIGNPOST_MAP = new Map<string, BorderSignpost>()
for (const sp of BORDER_SIGNPOSTS) SIGNPOST_MAP.set(`${sp.x},${sp.y}`, sp)

export function getSignpostAt(x: number, y: number): BorderSignpost | undefined {
  return SIGNPOST_MAP.get(`${x},${y}`)
}

// Generate the full map
export function generateMap(): MapTile[][] {
  const map: MapTile[][] = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: MapTile[] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const biome = getBiome(x, y)
      const elevation = getElevation(x, y, biome)
      const noise = hash(x * 1.1 + 0.3, y * 0.7 + 0.9)
      const creatureChance = biome === 'water' ? 0.03
        : biome === 'urban' ? 0.06
        : biome === 'redwood' ? 0.18
        : biome === 'marsh' ? 0.15
        : biome === 'forest' ? 0.14
        : biome === 'mountain' ? 0.12
        : biome === 'tidepool' ? 0.20
        : biome === 'kelp_forest' ? 0.18
        : biome === 'oak_woodland' ? 0.16
        : biome === 'chaparral' ? 0.13
        : biome === 'old_growth' ? 0.20
        : biome === 'lakeshore' ? 0.15
        : biome === 'alpine' ? 0.12
        : biome === 'volcanic' ? 0.10
        : biome === 'valley' ? 0.12
        : biome === 'scrubland' ? 0.09
        : biome === 'desert' ? 0.08
        : biome === 'canyon' ? 0.11
        : biome === 'dunes' ? 0.06
        : biome === 'snow' ? 0.05
        : 0.10
      const hasCreature = noise < creatureChance
      const bridgeName = getBridgeAt(x, y)
      const island = getIslandAt(x, y)
      const dock = getBoatDockAt(x, y)
      const borderState = getBorderState(x, y)
      const subregion = island ? island.name : (bridgeName ?? getSubregion(x, y, biome))
      const walkable = borderState ? false
        : bridgeName ? true
        : island ? true
        : (biome !== 'water')
      row.push({
        x, y,
        biome: bridgeName ? 'urban' : island ? island.biome : biome,
        subregion: borderState ?? subregion,
        elevation: bridgeName ? 1 : island ? 2 : elevation,
        hasCreature: borderState ? false : bridgeName ? false : island ? (noise < 0.2) : hasCreature,
        isWalkable: walkable,
        bridge: bridgeName,
        boatDock: dock ? true : undefined,
        borderState: borderState ?? undefined,
      })
    }
    map.push(row)
  }
  return map
}

export { MAP_WIDTH, MAP_HEIGHT }
