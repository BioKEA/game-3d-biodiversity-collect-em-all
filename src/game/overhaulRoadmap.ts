export type OverhaulTrackId =
  | 'map-accuracy'
  | 'regional-identity'
  | 'creature-art'
  | 'encounter-presentation'
  | 'field-guide'
  | 'landmarks-traversal'
  | 'map-interaction'
  | 'progression-loop'
  | 'animation-juice'
  | 'quality-regression'

export interface OverhaulTrack {
  id: OverhaulTrackId
  number: string
  title: string
  accent: string
  summary: string
}

export const WILDCAL_OVERHAUL_TRACKS: OverhaulTrack[] = [
  {
    id: 'map-accuracy',
    number: '01',
    title: 'Map Accuracy',
    accent: '#67e8f9',
    summary: 'Coordinates, shoreline, terrain, bridge, and walkability survey.',
  },
  {
    id: 'regional-identity',
    number: '02',
    title: 'Regional Identity',
    accent: '#a7f3d0',
    summary: 'Distinct biome language for every California province.',
  },
  {
    id: 'creature-art',
    number: '03',
    title: 'Creature Art',
    accent: '#f0abfc',
    summary: 'Custom pixel creatures with evolution-ready adaptation slots.',
  },
  {
    id: 'encounter-presentation',
    number: '04',
    title: 'Encounters',
    accent: '#fbbf24',
    summary: 'Biome arenas, entrance drama, weather, and capture effects.',
  },
  {
    id: 'field-guide',
    number: '05',
    title: 'Field Guide',
    accent: '#93c5fd',
    summary: 'Collection book depth, silhouettes, habitats, and discovery notes.',
  },
  {
    id: 'landmarks-traversal',
    number: '06',
    title: 'Landmarks',
    accent: '#fb7185',
    summary: 'Recognizable places, terrain anchors, bridges, ferries, and routes.',
  },
  {
    id: 'map-interaction',
    number: '07',
    title: 'Map Interaction',
    accent: '#5eead4',
    summary: 'Layered atlas, labels, height overlays, routes, and inspection.',
  },
  {
    id: 'progression-loop',
    number: '08',
    title: 'Progression',
    accent: '#c4b5fd',
    summary: 'Regional mastery, conservation quests, evolution goals, and badges.',
  },
  {
    id: 'animation-juice',
    number: '09',
    title: 'Animation',
    accent: '#fdba74',
    summary: 'Subtle shimmer, bobbing, particles, water flow, and camera polish.',
  },
  {
    id: 'quality-regression',
    number: '10',
    title: 'QA Coverage',
    accent: '#f9a8d4',
    summary: 'Tests and visual checks for critical geography and art surfaces.',
  },
]

export function getOverhaulTrackById(id: OverhaulTrackId): OverhaulTrack {
  const track = WILDCAL_OVERHAUL_TRACKS.find(entry => entry.id === id)
  if (!track) throw new Error(`Unknown WildCal overhaul track: ${id}`)
  return track
}
