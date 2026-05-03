import type { TimeOfDay } from '@/types/game'

// ============================================================
// Creature Migration System
// Herds of creatures migrate across the map at dawn and dusk
// Walking into a migrating herd guarantees an encounter
// ============================================================

export interface MigrationHerd {
  id: string
  creatureId: string
  sprite: string
  name: string
  count: number         // number of sprites to render
  // Route: start and end points on the 200x500 grid
  startX: number
  startY: number
  endX: number
  endY: number
  activeTimes: TimeOfDay[]
  speed: number         // tiles per game-minute
  biomePreference: string  // only active in matching biomes nearby
}

export const MIGRATION_HERDS: MigrationHerd[] = [
  {
    id: 'deer-migration',
    creatureId: 'black-tailed-deer',
    sprite: '🦌',
    name: 'Deer Herd',
    count: 4,
    startX: 48, startY: 210,  // Mt. Tam foothills
    endX: 49, endY: 216,      // Down through Marin Headlands
    activeTimes: ['dawn', 'dusk'],
    speed: 0.15,
    biomePreference: 'grassland',
  },
  {
    id: 'hawk-migration',
    creatureId: 'red-tailed-hawk',
    sprite: '🦅',
    name: 'Hawk Kettle',
    count: 5,
    startX: 74, startY: 220,  // Mt. Diablo
    endX: 64, endY: 215,      // Over to Oakland/Berkeley hills
    activeTimes: ['dawn', 'day'],
    speed: 0.25,
    biomePreference: 'mountain',
  },
  {
    id: 'pelican-flyover',
    creatureId: 'pelican-diver',
    sprite: '🐦',
    name: 'Pelican Squadron',
    count: 6,
    startX: 52, startY: 252,  // Santa Cruz coast
    endX: 48, endY: 236,      // Up the coast toward Half Moon Bay
    activeTimes: ['dawn', 'day'],
    speed: 0.3,
    biomePreference: 'beach',
  },
  {
    id: 'coyote-pack',
    creatureId: 'coyote',
    sprite: '🐺',
    name: 'Coyote Pack',
    count: 3,
    startX: 51, startY: 221,  // Twin Peaks
    endX: 50, endY: 219,      // Through Presidio
    activeTimes: ['dusk', 'night'],
    speed: 0.12,
    biomePreference: 'urban',
  },
  {
    id: 'butterfly-cloud',
    creatureId: 'mission-blue-butterfly',
    sprite: '🦋',
    name: 'Mission Blue Cloud',
    count: 8,
    startX: 53, startY: 251,  // UC Santa Cruz
    endX: 52, endY: 253,      // To Steamer Lane coast
    activeTimes: ['day', 'dusk'],
    speed: 0.18,
    biomePreference: 'forest',
  },
  {
    id: 'seal-pod',
    creatureId: 'harbor-seal',
    sprite: '🦭',
    name: 'Seal Pod',
    count: 4,
    startX: 52, startY: 219,  // Embarcadero
    endX: 53, endY: 221,      // Down to Oracle Park / Mission Bay
    activeTimes: ['dawn', 'dusk'],
    speed: 0.1,
    biomePreference: 'beach',
  },
]

/** Get the current position of each herd member based on game time */
export function getHerdPositions(
  herd: MigrationHerd,
  gameMinutes: number,
  timeOfDay: TimeOfDay,
): { x: number; y: number }[] | null {
  // Only active during specified times
  if (!herd.activeTimes.includes(timeOfDay)) return null

  // Calculate progress along the route (0-1, loops back)
  // Use gameMinutes to drive position — each cycle is ~120 game minutes
  const cycleLength = 120
  const rawProgress = (gameMinutes % cycleLength) / cycleLength
  // Ping-pong: 0→1→0
  const progress = rawProgress < 0.5 ? rawProgress * 2 : 2 - rawProgress * 2

  const positions: { x: number; y: number }[] = []

  for (let i = 0; i < herd.count; i++) {
    // Stagger each member slightly behind the leader
    const memberProgress = Math.max(0, Math.min(1, progress - i * 0.06))
    const x = Math.round(herd.startX + (herd.endX - herd.startX) * memberProgress)
    const y = Math.round(herd.startY + (herd.endY - herd.startY) * memberProgress)

    // Add slight random offset so they don't stack
    const offsetX = Math.round(Math.sin(i * 2.7) * 1.5)
    const offsetY = Math.round(Math.cos(i * 3.1) * 1)

    positions.push({ x: x + offsetX, y: y + offsetY })
  }

  return positions
}

/** Check if the player is colliding with any migrating herd */
export function checkHerdEncounter(
  playerX: number,
  playerY: number,
  gameMinutes: number,
  timeOfDay: TimeOfDay,
): MigrationHerd | null {
  for (const herd of MIGRATION_HERDS) {
    const positions = getHerdPositions(herd, gameMinutes, timeOfDay)
    if (!positions) continue

    for (const pos of positions) {
      if (Math.abs(pos.x - playerX) <= 1 && Math.abs(pos.y - playerY) <= 1) {
        return herd
      }
    }
  }
  return null
}
