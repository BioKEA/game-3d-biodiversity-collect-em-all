import type { BiomeType, CapturedCreature, Creature, GameState, JournalEntry, MapTile } from '@/types/game'
import type { LogicDeps } from '@/game/core/state'
import type { BoatDock } from '@/game/bayAreaMap'
import { getRandomEncounter, ALL_CREATURES, isFullMoon, isNewMoon, getLunarBoss, getShadowBoss } from '@/game/creatures'
import { advanceTime, rollWeather } from '@/game/timeWeather'
import { getNearbyLandmark } from '@/game/landmarks'
import { checkHerdEncounter } from '@/game/migration'
import { rollTrainerEncounter, type RoamingTrainer } from '@/game/roamingTrainers'
import { makeBattle } from '@/game/features/progression/logic'

export function updateJournal(
  journal: Record<string, JournalEntry>,
  subregion: string,
  biome: BiomeType,
  prevSubregion: string,
  now: string,
): Record<string, JournalEntry> {
  if (!subregion) return journal
  const existing = journal[subregion]
  const isNewVisit = subregion !== prevSubregion
  if (existing) {
    if (!isNewVisit) return journal
    return { ...journal, [subregion]: { ...existing, visitCount: existing.visitCount + 1 } }
  }
  return {
    ...journal,
    [subregion]: {
      subregion, biome,
      firstVisited: now,
      creaturesEncountered: [], creaturesCaptured: [],
      visitCount: 1,
    },
  }
}

export function revealTiles(explored: Set<string>, x: number, y: number, radius = 5): { next: Set<string>; changed: boolean } {
  const next = new Set(explored)
  let changed = false
  for (let ry = -radius; ry <= radius; ry++) {
    for (let rx = -radius; rx <= radius; rx++) {
      if (rx * rx + ry * ry > radius * radius) continue
      const key = `${x + rx},${y + ry}`
      if (!next.has(key)) { next.add(key); changed = true }
    }
  }
  return { next, changed }
}

export interface StepContext {
  borderPeek: { state: string; stepsLeft: number; returnX: number; returnY: number } | null
  lastWeatherChange: number
  lunarTriggeredDay: number
  shadowTriggeredDay: number
  defeatedTrainers: string[]
}

export type StepEvents =
  | { kind: 'blocked'; clearBorderPeek: boolean }
  | { kind: 'border-enter'; state: string; stepsLeft: number; message: string }
  | { kind: 'border-step'; message: string }
  | { kind: 'border-return'; message: string }
  | {
      kind: 'moved'; tile: MapTile; clearBorderPeek: boolean; sfxStep: boolean
      enteredNewSubregion: boolean; enteredNewBiome: boolean; weatherChangedAt: number | null
      lunarBoss: Creature | null; shadowBoss: Creature | null; encounter: 'herd' | 'wild' | null; trainer: RoamingTrainer | null
    }

const MAX_BORDER_STEPS = 3

export function stepPlayer(
  prev: GameState,
  map: MapTile[][],
  dx: number,
  dy: number,
  ctx: StepContext,
  deps: LogicDeps,
): { state: GameState; events: StepEvents } {
  const blocked = (clearBorderPeek = false) => ({ state: prev, events: { kind: 'blocked' as const, clearBorderPeek } })
  if (prev.screen !== 'world' || prev.battle.active) return blocked()
  const newX = prev.player.x + dx
  const newY = prev.player.y + dy
  if (newX < 0 || newX >= (map[0]?.length ?? 0) || newY < 0 || newY >= map.length) return blocked()
  const tile = map[newY]?.[newX]
  if (!tile) return blocked()

  // Border peek system — allow 3 steps into neighboring states
  if (tile.borderState && !tile.isWalkable) {
    const bp = ctx.borderPeek
    if (!bp) {
      // Entering border for the first time
      return {
        state: { ...prev, player: { ...prev.player, x: newX, y: newY } },
        events: {
          kind: 'border-enter', state: tile.borderState, stepsLeft: MAX_BORDER_STEPS - 1,
          message: `Entering ${tile.borderState}... ${MAX_BORDER_STEPS - 1} steps before you turn back.`,
        },
      }
    } else if (bp.stepsLeft > 0) {
      // Still have steps left
      const left = bp.stepsLeft - 1
      const message = bp.stepsLeft === 1
        ? `Last step in ${bp.state}! Turning back...`
        : `${left} step${left !== 1 ? 's' : ''} left in ${bp.state}.`
      return { state: { ...prev, player: { ...prev.player, x: newX, y: newY } }, events: { kind: 'border-step', message } }
    } else {
      // Out of steps — teleport back to California
      return {
        state: { ...prev, player: { ...prev.player, x: bp.returnX, y: bp.returnY } },
        events: { kind: 'border-return', message: `Back in California! Your journey continues in the Golden State.` },
      }
    }
  }
  // Original order: clear the peek (if returning to CA) *before* the walkable check.
  const clearBorderPeek = !!ctx.borderPeek && !tile.borderState
  if (!tile.isWalkable) return blocked(clearBorderPeek)

  // RNG order below mirrors the original updater exactly.
  const sfxStep = deps.rng() < 0.3
  const newJournal = updateJournal(prev.player.journal, tile.subregion || '', tile.biome, prev.currentSubregion, deps.now())
  const enteredNewSubregion = !!tile.subregion && tile.subregion !== prev.currentSubregion
  const enteredNewBiome = enteredNewSubregion && tile.biome !== prev.currentBiome

  // Advance game clock
  const timeUpdate = advanceTime(prev.gameMinutes, 3)
  // Detect day wrap (clock went backward = new day rollover)
  const dayWrapped = timeUpdate.gameMinutes < prev.gameMinutes
  const newGameDay = (prev.gameDay ?? 0) + (dayWrapped ? 1 : 0)

  // Weather changes roughly every 60 game-minutes
  let newWeather = prev.weather
  let weatherChangedAt: number | null = null
  if (Math.abs(timeUpdate.gameMinutes - ctx.lastWeatherChange) > 60 || timeUpdate.gameMinutes < ctx.lastWeatherChange) {
    newWeather = rollWeather(prev.weather, tile.biome, newGameDay)
    weatherChangedAt = timeUpdate.gameMinutes
  }

  // Track weather in almanac
  let newAlmanac = prev.weatherAlmanac
  if (newWeather !== prev.weather) {
    newAlmanac = { ...(prev.weatherAlmanac ?? {}), [newWeather]: ((prev.weatherAlmanac ?? {})[newWeather] ?? 0) + 1 } as GameState['weatherAlmanac']
  }

  // Track landmark visits (within 2 tiles)
  let newVisitedLandmarks = prev.visitedLandmarks
  const nearbyLandmark = getNearbyLandmark(newX, newY)
  if (nearbyLandmark && !(prev.visitedLandmarks ?? []).includes(nearbyLandmark.name)) {
    newVisitedLandmarks = [...(prev.visitedLandmarks ?? []), nearbyLandmark.name]
  }

  const newState: GameState = {
    ...prev,
    player: { ...prev.player, x: newX, y: newY, journal: newJournal },
    currentBiome: tile.biome,
    currentSubregion: tile.subregion || '',
    encounterCooldown: Math.max(0, prev.encounterCooldown - 1),
    timeOfDay: timeUpdate.timeOfDay,
    gameMinutes: timeUpdate.gameMinutes,
    gameDay: newGameDay,
    weather: newWeather,
    weatherAlmanac: newAlmanac,
    visitedLandmarks: newVisitedLandmarks,
  }
  const base = {
    kind: 'moved' as const, tile, clearBorderPeek, sfxStep, enteredNewSubregion, enteredNewBiome, weatherChangedAt,
    lunarBoss: null, shadowBoss: null, encounter: null, trainer: null,
  }

  // Migration herd encounter check
  if (newState.encounterCooldown <= 0 && newState.player.team.length > 0) {
    const herd = checkHerdEncounter(newX, newY, timeUpdate.gameMinutes, timeUpdate.timeOfDay)
    if (herd) {
      const herdCreature = ALL_CREATURES.find(c => c.id === herd.creatureId)
      if (herdCreature) {
        return {
          state: {
            ...newState,
            screen: 'encounter',
            battle: makeBattle(herdCreature, newState.player.team[0], [`A migrating ${herd.name} crosses your path! A ${herdCreature.name} faces you!`], 0.5),
            encounterCooldown: 8,
            player: { ...newState.player, catalog: [...new Set([...newState.player.catalog, herdCreature.id])] },
          },
          events: { ...base, encounter: 'herd' },
        }
      }
    }
  }

  // Lunar boss check — full moon + night + not already triggered this game day
  if (
    newState.encounterCooldown <= 0 &&
    tile.biome !== 'water' &&
    timeUpdate.timeOfDay === 'night' &&
    isFullMoon(newState.gameDay ?? 0) &&
    ctx.lunarTriggeredDay !== (newState.gameDay ?? 0) &&
    newState.player.team.length > 0 &&
    deps.rng() < 0.12
  ) {
    const boss = getLunarBoss(tile.biome, tile.subregion)
    if (boss) return { state: { ...newState, encounterCooldown: 8 }, events: { ...base, lunarBoss: boss } }
  }

  // Shadow boss check — new moon + night
  if (
    newState.encounterCooldown <= 0 &&
    tile.biome !== 'water' &&
    timeUpdate.timeOfDay === 'night' &&
    isNewMoon(newState.gameDay ?? 0) &&
    ctx.shadowTriggeredDay !== (newState.gameDay ?? 0) &&
    newState.player.team.length > 0 &&
    deps.rng() < 0.12
  ) {
    const boss = getShadowBoss(tile.biome, tile.subregion)
    if (boss) return { state: { ...newState, encounterCooldown: 8 }, events: { ...base, shadowBoss: boss } }
  }

  // Random encounter check
  if (newState.encounterCooldown <= 0 && tile.biome !== 'water') {
    const encounterRoll = deps.rng()
    const encounterChance = tile.hasCreature ? 0.25 : 0.08

    if (encounterRoll < encounterChance) {
      let creature = getRandomEncounter(tile.biome, tile.subregion, timeUpdate.timeOfDay, newWeather, newState.gameDay, { x: newState.player.x, y: newState.player.y })
      if (creature && newState.player.team.length > 0) {
        // Roll for alpha (5%) or shiny (1/200) variants
        const alphaRoll = deps.rng()
        const shinyRoll = deps.rng()
        const isAlpha = alphaRoll < 0.05
        const isShiny = shinyRoll < 0.005
        if (isAlpha || isShiny) {
          creature = {
            ...creature,
            isAlpha,
            isShiny,
            name: isAlpha ? `Alpha ${creature.name}` : creature.name,
            stats: isAlpha ? {
              hp: Math.floor(creature.stats.hp * 1.5),
              maxHp: Math.floor(creature.stats.maxHp * 1.5),
              attack: Math.floor(creature.stats.attack * 1.4),
              defense: Math.floor(creature.stats.defense * 1.3),
              speed: Math.floor(creature.stats.speed * 1.2),
            } : creature.stats,
          } as typeof creature
        }
        const subregion = tile.subregion || ''
        const journalWithCreature = { ...newState.player.journal }
        if (subregion && journalWithCreature[subregion]) {
          const entry = journalWithCreature[subregion]
          if (!entry.creaturesEncountered.includes(creature.id)) {
            journalWithCreature[subregion] = {
              ...entry,
              creaturesEncountered: [...entry.creaturesEncountered, creature.id],
            }
          }
        }
        return {
          state: {
            ...newState,
            player: { ...newState.player, catalog: [...new Set([...newState.player.catalog, creature.id])], journal: journalWithCreature },
            screen: 'encounter',
            battle: makeBattle(creature, newState.player.team[0]),
            encounterCooldown: 5,
          },
          events: { ...base, encounter: 'wild' },
        }
      }
    }

    // Roaming trainer encounter (3% chance, separate from creature encounters)
    if (deps.rng() < 0.03) {
      const trainer = rollTrainerEncounter(tile.biome, newState.player.level, ctx.defeatedTrainers)
      if (trainer && newState.player.team.length > 0) {
        return { state: { ...newState, screen: 'trainer_encounter', encounterCooldown: 10 }, events: { ...base, trainer } }
      }
    }
  }

  return { state: newState, events: base }
}

export function boatTravel(state: GameState, dock: BoatDock): GameState {
  return { ...state, player: { ...state.player, x: dock.destX, y: dock.destY }, currentSubregion: dock.destinationName }
}

export function fastTravel(state: GameState, map: MapTile[][], x: number, y: number, subregion: string): GameState {
  const tile = map[y]?.[x]
  return { ...state, player: { ...state.player, x, y }, currentSubregion: subregion, currentBiome: tile?.biome ?? state.currentBiome }
}

export function selectStarter(state: GameState, map: MapTile[][], creature: Omit<CapturedCreature, 'capturedAt'>, now: string): GameState {
  const tile = map[state.player.y]?.[state.player.x]
  return {
    ...state,
    screen: 'world',
    player: { ...state.player, team: [{ ...creature, capturedAt: now, happiness: 70 }], catalog: [creature.id], captured: [creature.id] },
    currentBiome: tile?.biome ?? 'grassland',
    currentSubregion: tile?.subregion ?? '',
  }
}
