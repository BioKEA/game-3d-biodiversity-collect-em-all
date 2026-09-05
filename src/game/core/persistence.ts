import type { GameState } from '@/types/game'
import type { PlayerStats } from '../achievements'

export const STORAGE_KEYS = {
  save: 'bioquest-bay-save-', stats: 'bioquest-bay-stats-', explored: 'bioquest-bay-explored-', slotName: 'bioquest-bay-slot-name-',
  playerName: 'bioquest-bay-player-name', bayDexAck: 'bioquest-bay-baydex-ack-',
  legacySave: 'bioquest-bay-save', legacyStats: 'bioquest-bay-stats', legacyExplored: 'bioquest-bay-explored',
  alcatrazEscaped: 'bioquest-bay-alcatraz-escaped', defeatedTrainers: 'bioquest-bay-defeated-trainers',
  fishLog: 'bioquest-bay-fish-log', conservationDismissed: 'bioquest-conservation-dismissed',
} as const

export type SaveSlotIndex = 1 | 2 | 3

export interface SaveSlotSummary {
  slot: SaveSlotIndex
  state: GameState
  stats: PlayerStats | null
  exploredCount: number
  lastPlayed: string // ISO timestamp
  name: string | null // custom slot name
}

function saveKey(slot: SaveSlotIndex): string { return STORAGE_KEYS.save + slot }
function statsKey(slot: SaveSlotIndex): string { return STORAGE_KEYS.stats + slot }
function exploredKey(slot: SaveSlotIndex): string { return STORAGE_KEYS.explored + slot }

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
  localStorage.removeItem(STORAGE_KEYS.slotName + slot)
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
    const v = localStorage.getItem(STORAGE_KEYS.slotName + slot)
    return v && v.trim() ? v : null
  } catch { return null }
}

export function saveSlotName(slot: SaveSlotIndex, name: string): void {
  try {
    const trimmed = name.trim().slice(0, 20)
    if (trimmed) localStorage.setItem(STORAGE_KEYS.slotName + slot, trimmed)
    else localStorage.removeItem(STORAGE_KEYS.slotName + slot)
  } catch { /* ignore */ }
}

/** Global player name (shared across all slots) */
export function loadPlayerName(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.playerName)
    if (v && v.trim()) return v
  } catch { /* ignore */ }
  return 'Explorer'
}

export function savePlayerName(name: string): void {
  try {
    const trimmed = name.trim().slice(0, 16)
    if (trimmed) localStorage.setItem(STORAGE_KEYS.playerName, trimmed)
  } catch { /* ignore */ }
}

/** Load the set of creature IDs the player has acknowledged in the BayDex for a slot */
export function loadBayDexAck(slot: SaveSlotIndex): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bayDexAck + slot)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

/** Save the set of acknowledged creature IDs */
export function saveBayDexAck(slot: SaveSlotIndex, ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.bayDexAck + slot, JSON.stringify(ids))
  } catch { /* ignore */ }
}

/** Migrate legacy single-save to slot 1 */
export function migrateLegacySave(): void {
  try {
    const legacy = localStorage.getItem(STORAGE_KEYS.legacySave)
    if (legacy && !localStorage.getItem(saveKey(1))) {
      localStorage.setItem(saveKey(1), legacy)
      localStorage.removeItem(STORAGE_KEYS.legacySave)
    }
    const legacyStats = localStorage.getItem(STORAGE_KEYS.legacyStats)
    if (legacyStats && !localStorage.getItem(statsKey(1))) {
      localStorage.setItem(statsKey(1), legacyStats)
      localStorage.removeItem(STORAGE_KEYS.legacyStats)
    }
    const legacyExplored = localStorage.getItem(STORAGE_KEYS.legacyExplored)
    if (legacyExplored && !localStorage.getItem(exploredKey(1))) {
      localStorage.setItem(exploredKey(1), legacyExplored)
      localStorage.removeItem(STORAGE_KEYS.legacyExplored)
    }
  } catch { /* ignore */ }
}

export function loadAlcatrazEscaped(): boolean {
  try { return localStorage.getItem(STORAGE_KEYS.alcatrazEscaped) === 'true' } catch { return false }
}
export function saveAlcatrazEscaped(): void {
  try { localStorage.setItem(STORAGE_KEYS.alcatrazEscaped, 'true') } catch { /* ignore */ }
}
export function loadDefeatedTrainers(): string[] {
  try { const saved = localStorage.getItem(STORAGE_KEYS.defeatedTrainers); return saved ? JSON.parse(saved) as string[] : [] } catch { return [] }
}
export function saveDefeatedTrainers(ids: string[]): void {
  try { localStorage.setItem(STORAGE_KEYS.defeatedTrainers, JSON.stringify(ids)) } catch { /* ignore */ }
}
export function loadFishLog(): string[] {
  try { const saved = localStorage.getItem(STORAGE_KEYS.fishLog); return saved ? JSON.parse(saved) as string[] : [] } catch { return [] }
}
export function saveFishLog(ids: string[]): void {
  try { localStorage.setItem(STORAGE_KEYS.fishLog, JSON.stringify(ids)) } catch { /* ignore */ }
}
export function loadConservationDismissed(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEYS.conservationDismissed) ?? '0', 10) } catch { return 0 }
}
export function saveConservationDismissed(n: number): void {
  try { localStorage.setItem(STORAGE_KEYS.conservationDismissed, String(n)) } catch { /* ignore */ }
}
