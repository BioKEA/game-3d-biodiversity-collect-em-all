import type { OverhaulTrackId } from './overhaulRoadmap'

export type CaliforniaMapOverlayKind = 'road' | 'rail' | 'ferry' | 'river' | 'range' | 'coast'

export interface CaliforniaMapPoint {
  x: number
  y: number
}

export interface CaliforniaMapOverlay {
  id: string
  name: string
  kind: CaliforniaMapOverlayKind
  color: string
  width: number
  alpha: number
  points: CaliforniaMapPoint[]
  trackIds: OverhaulTrackId[]
}

export const CALIFORNIA_MAP_OVERLAY_LEGEND: Record<CaliforniaMapOverlayKind, { label: string; color: string }> = {
  road: { label: 'Roads', color: '#facc15' },
  rail: { label: 'Rail', color: '#60a5fa' },
  ferry: { label: 'Ferries', color: '#38bdf8' },
  river: { label: 'Rivers', color: '#22d3ee' },
  range: { label: 'Ranges', color: '#cbd5e1' },
  coast: { label: 'Coast', color: '#f4d06f' },
}

export const CALIFORNIA_MAP_OVERLAYS: CaliforniaMapOverlay[] = [
  {
    id: 'pacific-coast-route',
    name: 'Pacific Coast Route',
    kind: 'coast',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.coast.color,
    width: 1.4,
    alpha: 0.72,
    trackIds: ['map-accuracy', 'landmarks-traversal', 'map-interaction'],
    points: [
      { x: 30, y: 12 }, { x: 38, y: 70 }, { x: 42, y: 208 }, { x: 49, y: 216 },
      { x: 52, y: 254 }, { x: 60, y: 269 }, { x: 74, y: 332 }, { x: 101, y: 390 },
      { x: 122, y: 412 }, { x: 140, y: 481 },
    ],
  },
  {
    id: 'us-101-spine',
    name: 'US-101 Wildlife Corridor',
    kind: 'road',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.road.color,
    width: 1.15,
    alpha: 0.58,
    trackIds: ['landmarks-traversal', 'progression-loop'],
    points: [
      { x: 38, y: 42 }, { x: 47, y: 176 }, { x: 52, y: 216 }, { x: 60, y: 236 },
      { x: 62, y: 288 }, { x: 96, y: 402 }, { x: 140, y: 472 },
    ],
  },
  {
    id: 'i-5-valley-spine',
    name: 'Central Valley Spine',
    kind: 'road',
    color: '#f59e0b',
    width: 1.05,
    alpha: 0.54,
    trackIds: ['map-accuracy', 'progression-loop'],
    points: [
      { x: 92, y: 30 }, { x: 82, y: 140 }, { x: 80, y: 185 }, { x: 86, y: 260 },
      { x: 96, y: 350 }, { x: 126, y: 418 }, { x: 144, y: 481 },
    ],
  },
  {
    id: 'bart-transbay-spine',
    name: 'Bay BART Spine',
    kind: 'rail',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.rail.color,
    width: 1.25,
    alpha: 0.66,
    trackIds: ['landmarks-traversal', 'map-interaction'],
    points: [
      { x: 49, y: 216 }, { x: 53, y: 217 }, { x: 64, y: 214 }, { x: 72, y: 216 },
    ],
  },
  {
    id: 'bay-ferry-loop',
    name: 'Bay Ferry Loop',
    kind: 'ferry',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.ferry.color,
    width: 1.05,
    alpha: 0.6,
    trackIds: ['landmarks-traversal', 'map-interaction'],
    points: [
      { x: 49, y: 216 }, { x: 53, y: 213 }, { x: 60, y: 209 }, { x: 65, y: 218 },
      { x: 53, y: 217 }, { x: 49, y: 216 },
    ],
  },
  {
    id: 'sacramento-san-joaquin-delta',
    name: 'Sacramento-San Joaquin Delta',
    kind: 'river',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.river.color,
    width: 1.5,
    alpha: 0.64,
    trackIds: ['map-accuracy', 'map-interaction', 'quality-regression'],
    points: [
      { x: 82, y: 140 }, { x: 80, y: 158 }, { x: 79, y: 170 }, { x: 80, y: 187 },
      { x: 75, y: 193 }, { x: 67, y: 198 }, { x: 60, y: 209 },
    ],
  },
  {
    id: 'san-joaquin-river',
    name: 'San Joaquin River',
    kind: 'river',
    color: '#67e8f9',
    width: 1.25,
    alpha: 0.58,
    trackIds: ['map-accuracy', 'quality-regression'],
    points: [
      { x: 86, y: 167 }, { x: 85, y: 172 }, { x: 84, y: 178 }, { x: 80, y: 187 },
      { x: 75, y: 193 },
    ],
  },
  {
    id: 'sierra-crest',
    name: 'Sierra Nevada Crest',
    kind: 'range',
    color: CALIFORNIA_MAP_OVERLAY_LEGEND.range.color,
    width: 1.8,
    alpha: 0.62,
    trackIds: ['map-accuracy', 'regional-identity', 'animation-juice'],
    points: [
      { x: 78, y: 35 }, { x: 85, y: 80 }, { x: 115, y: 200 }, { x: 118, y: 258 },
      { x: 138, y: 250 }, { x: 150, y: 242 },
    ],
  },
  {
    id: 'coast-ranges',
    name: 'Coast Ranges',
    kind: 'range',
    color: '#a7f3d0',
    width: 1.35,
    alpha: 0.5,
    trackIds: ['regional-identity', 'landmarks-traversal'],
    points: [
      { x: 51, y: 176 }, { x: 51, y: 210 }, { x: 51, y: 221 }, { x: 53, y: 251 },
      { x: 68, y: 316 }, { x: 101, y: 390 },
    ],
  },
  {
    id: 'la-basin-transit',
    name: 'Los Angeles Basin Spine',
    kind: 'rail',
    color: '#93c5fd',
    width: 1.05,
    alpha: 0.55,
    trackIds: ['landmarks-traversal', 'progression-loop'],
    points: [
      { x: 121, y: 410 }, { x: 126, y: 418 }, { x: 129, y: 421 }, { x: 136, y: 423 },
      { x: 133, y: 436 },
    ],
  },
  {
    id: 'san-diego-coast',
    name: 'San Diego Coastal Link',
    kind: 'road',
    color: '#fde68a',
    width: 1.0,
    alpha: 0.56,
    trackIds: ['landmarks-traversal', 'map-interaction'],
    points: [
      { x: 140, y: 472 }, { x: 141, y: 475 }, { x: 144, y: 481 }, { x: 142, y: 487 },
    ],
  },
]

export function getCaliforniaMapOverlayKindCounts(): Record<CaliforniaMapOverlayKind, number> {
  return CALIFORNIA_MAP_OVERLAYS.reduce((counts, overlay) => {
    counts[overlay.kind] += 1
    return counts
  }, {
    road: 0,
    rail: 0,
    ferry: 0,
    river: 0,
    range: 0,
    coast: 0,
  } satisfies Record<CaliforniaMapOverlayKind, number>)
}
