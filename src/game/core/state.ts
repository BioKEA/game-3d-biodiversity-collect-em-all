import type { GameState, MapTile } from '@/types/game'

/** Injected randomness and clock so feature logic is pure and testable. */
export interface LogicDeps {
  rng: () => number
  now: () => string
}

// Thunks, not references: tests that stub Math.random must reach every caller.
export const runtimeDeps: LogicDeps = {
  rng: () => Math.random(),
  now: () => new Date().toISOString(),
}

/**
 * Patch saves written by older builds and force a movable state.
 * Moved verbatim from Game.tsx; `map` is passed instead of closed over.
 */
export function applyBackwardCompat(saved: GameState, map: MapTile[][]): GameState {
  if (!saved.player.journal) saved.player.journal = {}
  if (!saved.questProgress) saved.questProgress = {}
  if (saved.activeRangerId === undefined) saved.activeRangerId = null
  if (saved.timeOfDay === undefined) saved.timeOfDay = 'day'
  if (saved.weather === undefined) saved.weather = 'clear'
  if (saved.gameMinutes === undefined) saved.gameMinutes = 480
  if (saved.gameDay === undefined) saved.gameDay = 75 // mid-spring
  if (saved.player.nursery === undefined) saved.player.nursery = null
  if (saved.player.reserves === undefined) saved.player.reserves = []
  if (saved.player.coins === undefined) saved.player.coins = 100

  // Force any in-progress battle off on load. The auto-save persists
  // gameState every change (line 289), so a player who left mid-
  // battle came back with battle.active=true. The loader forces
  // screen → 'world' but did not clear the battle struct, and both
  // world-keyboard effects bail at `screen!=='world' || battle.active`
  // — so the world rendered but movement was silently dropped. We
  // reset the struct here, after backward-compat patches, so the
  // load lands in a movable state regardless of where the player
  // saved.
  saved.battle = {
    active: false,
    wildCreature: null,
    playerCreature: null,
    turn: 'player',
    log: [],
    captureChance: 0,
  }

  // Rescue: if the player is stuck on an unwalkable tile (e.g. from an
  // older map generation or a broken fast-travel destination), bump them
  // to the nearest walkable tile with a spiral search.
  const startTile = map[saved.player.y]?.[saved.player.x]
  if (startTile && !startTile.isWalkable) {
    for (let r = 1; r <= 10; r++) {
      let found = false
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
          const nx = saved.player.x + dx
          const ny = saved.player.y + dy
          const t = map[ny]?.[nx]
          if (t && t.isWalkable) {
            saved.player.x = nx
            saved.player.y = ny
            found = true
          }
        }
      }
      if (found) break
    }
  }
  return saved
}
