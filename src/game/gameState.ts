import type { GameState, InventoryItem } from '@/types/game'
import type { PlayerStats } from './achievements'

const SAVE_KEY_PREFIX = 'bioquest-bay-save-'
const STATS_KEY_PREFIX = 'bioquest-bay-stats-'
const EXPLORED_KEY_PREFIX = 'bioquest-bay-explored-'
const SLOT_NAME_KEY_PREFIX = 'bioquest-bay-slot-name-'
const PLAYER_NAME_KEY = 'bioquest-bay-player-name'
const BAYDEX_SEEN_ACK_KEY_PREFIX = 'bioquest-bay-baydex-ack-'
const LEGACY_SAVE_KEY = 'bioquest-bay-save'
const LEGACY_STATS_KEY = 'bioquest-bay-stats'
const LEGACY_EXPLORED_KEY = 'bioquest-bay-explored'

export type SaveSlotIndex = 1 | 2 | 3

export interface SaveSlotSummary {
  slot: SaveSlotIndex
  state: GameState
  stats: PlayerStats | null
  exploredCount: number
  lastPlayed: string // ISO timestamp
  name: string | null // custom slot name
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 10, description: 'A standard capture device for creatures.', sprite: '🔮' },
  { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 5, description: 'Restores 30 HP to one creature.', sprite: '🧪' },
  { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 3, description: 'Boosts attack for the next battle.', sprite: '🫐' },
]

// createInitialState now creates a state WITHOUT a starter creature.
// The starter is picked in the StarterSelect screen and set via setStarter.
export function createInitialState(): GameState {
  return {
    screen: 'title',
    player: {
      x: 52,
      y: 219,
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: 100,
      maxHp: 100,
      coins: 100,
      inventory: [...DEFAULT_INVENTORY],
      team: [], // empty until starter is chosen
      catalog: [],
      captured: [],
      journal: {},
      nursery: null,
      reserves: [],
    },
    battle: {
      active: false,
      wildCreature: null,
      playerCreature: null,
      turn: 'player',
      log: [],
      captureChance: 0,
    },
    currentBiome: 'grassland',
    currentSubregion: '',
    encounterCooldown: 0,
    activeRangerId: null,
    questProgress: {},
    timeOfDay: 'day',
    weather: 'clear',
    gameMinutes: 480,
    gameDay: 75, // mid-spring (mid-March)
    arenaWins: { bronze: 0, silver: 0, gold: 0 },
  }
}

function saveKey(slot: SaveSlotIndex): string { return SAVE_KEY_PREFIX + slot }
function statsKey(slot: SaveSlotIndex): string { return STATS_KEY_PREFIX + slot }
function exploredKey(slot: SaveSlotIndex): string { return EXPLORED_KEY_PREFIX + slot }

export function saveGame(state: GameState, slot: SaveSlotIndex = 1): void {
  try {
    const data = { ...state, _lastPlayed: new Date().toISOString() }
    localStorage.setItem(saveKey(slot), JSON.stringify(data))
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadGame(slot: SaveSlotIndex = 1): GameState | null {
  try {
    const saved = localStorage.getItem(saveKey(slot))
    if (saved) return JSON.parse(saved) as GameState
  } catch {
    // corrupt save
  }
  return null
}

export function clearSave(slot: SaveSlotIndex = 1): void {
  localStorage.removeItem(saveKey(slot))
  localStorage.removeItem(statsKey(slot))
  localStorage.removeItem(exploredKey(slot))
  localStorage.removeItem(SLOT_NAME_KEY_PREFIX + slot)
}

export function saveStats(stats: PlayerStats, slot: SaveSlotIndex = 1): void {
  try {
    localStorage.setItem(statsKey(slot), JSON.stringify(stats))
  } catch { /* ignore */ }
}

export function loadStats(slot: SaveSlotIndex = 1): PlayerStats | null {
  try {
    const saved = localStorage.getItem(statsKey(slot))
    if (saved) return JSON.parse(saved) as PlayerStats
  } catch { /* ignore */ }
  return null
}

export function saveExplored(tiles: Set<string>, slot: SaveSlotIndex = 1): void {
  try {
    localStorage.setItem(exploredKey(slot), JSON.stringify([...tiles]))
  } catch { /* ignore */ }
}

export function loadExplored(slot: SaveSlotIndex = 1): Set<string> {
  try {
    const saved = localStorage.getItem(exploredKey(slot))
    if (saved) return new Set(JSON.parse(saved) as string[])
  } catch { /* ignore */ }
  return new Set<string>()
}

/** Get summaries of all 3 save slots */
export function getAllSaveSlots(): (SaveSlotSummary | null)[] {
  return ([1, 2, 3] as SaveSlotIndex[]).map(slot => {
    const state = loadGame(slot)
    if (!state) return null
    const stats = loadStats(slot)
    const explored = loadExplored(slot)
    const lastPlayed = (state as GameState & { _lastPlayed?: string })._lastPlayed || new Date().toISOString()
    return { slot, state, stats, exploredCount: explored.size, lastPlayed, name: loadSlotName(slot) }
  })
}

/** Custom per-slot display name */
export function loadSlotName(slot: SaveSlotIndex): string | null {
  try {
    const v = localStorage.getItem(SLOT_NAME_KEY_PREFIX + slot)
    return v && v.trim() ? v : null
  } catch { return null }
}

export function saveSlotName(slot: SaveSlotIndex, name: string): void {
  try {
    const trimmed = name.trim().slice(0, 20)
    if (trimmed) localStorage.setItem(SLOT_NAME_KEY_PREFIX + slot, trimmed)
    else localStorage.removeItem(SLOT_NAME_KEY_PREFIX + slot)
  } catch { /* ignore */ }
}

/** Global player name (shared across all slots) */
export function loadPlayerName(): string {
  try {
    const v = localStorage.getItem(PLAYER_NAME_KEY)
    if (v && v.trim()) return v
  } catch { /* ignore */ }
  return 'Explorer'
}

export function savePlayerName(name: string): void {
  try {
    const trimmed = name.trim().slice(0, 16)
    if (trimmed) localStorage.setItem(PLAYER_NAME_KEY, trimmed)
  } catch { /* ignore */ }
}

/** Load the set of creature IDs the player has acknowledged in the BayDex for a slot */
export function loadBayDexAck(slot: SaveSlotIndex): string[] {
  try {
    const raw = localStorage.getItem(BAYDEX_SEEN_ACK_KEY_PREFIX + slot)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

/** Save the set of acknowledged creature IDs */
export function saveBayDexAck(slot: SaveSlotIndex, ids: string[]): void {
  try {
    localStorage.setItem(BAYDEX_SEEN_ACK_KEY_PREFIX + slot, JSON.stringify(ids))
  } catch { /* ignore */ }
}

/** Migrate legacy single-save to slot 1 */
export function migrateLegacySave(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY)
    if (legacy && !localStorage.getItem(saveKey(1))) {
      localStorage.setItem(saveKey(1), legacy)
      localStorage.removeItem(LEGACY_SAVE_KEY)
    }
    const legacyStats = localStorage.getItem(LEGACY_STATS_KEY)
    if (legacyStats && !localStorage.getItem(statsKey(1))) {
      localStorage.setItem(statsKey(1), legacyStats)
      localStorage.removeItem(LEGACY_STATS_KEY)
    }
    const legacyExplored = localStorage.getItem(LEGACY_EXPLORED_KEY)
    if (legacyExplored && !localStorage.getItem(exploredKey(1))) {
      localStorage.setItem(exploredKey(1), legacyExplored)
      localStorage.removeItem(LEGACY_EXPLORED_KEY)
    }
  } catch { /* ignore */ }
}
