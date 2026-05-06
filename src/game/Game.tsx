import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { GameState, Creature, CapturedCreature, MapTile, JournalEntry, BreedingSlot } from '@/types/game'

// When a text input/textarea/contentEditable element is focused, game keyboard
// shortcuts must not fire — otherwise typing "w" or "d" moves the player, and
// letters like "c"/"j"/"t" open menus instead of being typed into the field.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    // Range/checkbox inputs don't consume character keys — let the game handler run for those.
    if (tag === 'INPUT') {
      const type = (target as HTMLInputElement).type
      if (type === 'range' || type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit') {
        return false
      }
    }
    return true
  }
  return target.isContentEditable
}
import { createInitialState, saveGame, loadGame, clearSave, saveStats, loadStats, saveExplored, loadExplored, loadPlayerName, savePlayerName, loadBayDexAck, saveBayDexAck } from './gameState'
import { BiokeaLeaderboardPrompt } from '@/components/BiokeaLeaderboardPrompt'
import { reportCreatureEncountered } from '@/lib/golden-sample'
import type { SaveSlotIndex } from './gameState'
import { generateMap, getBoatDockAt, getSignpostAt, type BoatDock } from './bayAreaMap'
import { getRandomEncounter, ALL_CREATURES, isFullMoon, isNewMoon, getLunarBoss, getShadowBoss, LUNAR_BOSSES, SHADOW_BOSSES } from './creatures'

const BOSS_IDS = new Set([...LUNAR_BOSSES.map(b => b.id), ...SHADOW_BOSSES.map(b => b.id)])
import { RANGERS, getNearbyRanger } from './rangers'
import { getRangerActivity, getRangerPosition, type RangerActivity } from './npcSchedules'
import { advanceTime, rollWeather } from './timeWeather'
import {
  rollMood, rollEncounterType, type CreatureMood, type EncounterType,
  type FriendlyGift, type Personality,
} from './encounterSystem'
import IsometricRenderer from './IsometricRenderer'
import BattleScreen from './BattleScreen'
import CatalogScreen from './CatalogScreen'
import TeamScreen, { getHealAmount } from './TeamScreen'
import TitleScreen from './TitleScreen'
import StarterSelect from './StarterSelect'
import GameHUD from './GameHUD'
import Minimap from './Minimap'
import FieldJournal from './FieldJournal'
import RangerDialog from './RangerDialog'
import TradeCenter from './TradeCenter'
import EvolutionScreen from './EvolutionScreen'
import BayDex from './BayDex'
import BreedingScreen from './BreedingScreen'
import { getEvolution, getEvolutionTarget, evolveCreature } from './evolutions'
import { createInitialStats, getNewAchievements, getUnlockedAchievements, type PlayerStats } from './achievements'
import AchievementsScreen from './AchievementsScreen'
import QuestLog from './QuestLog'
import MigrationCalendar from './MigrationCalendar'
import BiomeFieldNotesPanel from './BiomeFieldNotesPanel'
import CraftingScreen from './CraftingScreen'
import EncounterTransition from './EncounterTransition'
import QuestTracker from './QuestTracker'
import FishingScreen from './FishingScreen'
import type { FishDef } from './FishingScreen'
import RangerBattleScreen from './RangerBattleScreen'
import ChampionScreen from './ChampionScreen'
import { getLandmarkAt, getNearbyLandmark, LANDMARK_INFO } from './landmarks'
import { FINAL_BOSS_ID, GRAND_CHAMPION_ID, canChallengeGrandChampion } from './rangers'
import WorldEventBanner, { useWorldEvents } from './WorldEvents'
import { SFX, Music } from './sounds'
import { rollMaterialDrops, RECIPES, canCraft, MATERIALS } from './crafting'
import HabitatMap from './HabitatMap'
import TrainerEncounter from './TrainerEncounter'
import { rollTrainerEncounter, type RoamingTrainer } from './roamingTrainers'
import AdoptionCenter from './AdoptionCenter'
import Leaderboard from './Leaderboard'
import AlcatrazEscape from './AlcatrazEscape'
import type { EscapeStage } from './AlcatrazEscape'
import FusionLab from './FusionLab'
import DivingMinigame from './DivingMinigame'
import BartSystem, { getBartStationAt } from './BartSystem'
import Shop from './Shop'
import DailyChallenges from './DailyChallenges'
import ArenaScreen from './ArenaScreen'
import MoveTutorScreen from './MoveTutorScreen'
import { HELD_ITEMS } from './heldItems'
import { adjustHappiness, DEFAULT_HAPPINESS, LEVEL_UP_GAIN, BATTLE_WIN_LEAD_GAIN, BATTLE_WIN_BENCH_GAIN, PET_GAIN } from './happiness'
import type { ArenaTier } from './arena'
import { loadDailyState, updateChallengeProgress, claimChallengeReward, getClaimableCount, type DailyState } from './dailyChallengesData'
import { checkHerdEncounter } from './migration'
import BoardwalkMinigame from './BoardwalkMinigame'
import SurfingMinigame from './SurfingMinigame'
import WeatherEffects from './WeatherEffects'
import BiomeParticles from './BiomeParticles'
import BiomeTransition from './BiomeTransition'
import DayNightSky from './DayNightSky'
import NightAtmosphere from './NightAtmosphere'
import WalkParticles from './WalkParticles'
import CreatureFootprints from './CreatureFootprints'
import TutorialTip from './TutorialTip'
import QuestRewardPopup from './QuestRewardPopup'
import LunarBossPopup from './LunarBossPopup'
import ShadowBossPopup from './ShadowBossPopup'
import BossTrophyRoom from './BossTrophyRoom'
import ConservationPrompt from './ConservationPrompt'

// Curated fast-travel destinations — only unlocks once the tile has been explored.
// Coordinates and subregion names match getSubregion() in bayAreaMap.ts.
const FAST_TRAVEL_DESTINATIONS: { name: string; emoji: string; x: number; y: number; region: string; subregion: string; description: string }[] = [
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

export default function Game() {
  const [activeSlot, setActiveSlot] = useState<SaveSlotIndex>(1)
  const [gameState, setGameState] = useState<GameState>(() => createInitialState())
  const [playerName, setPlayerName] = useState<string>(() => loadPlayerName())
  const [bayDexAck, setBayDexAck] = useState<string[]>([])

  const handleRenamePlayer = useCallback((name: string) => {
    savePlayerName(name)
    setPlayerName(name)
  }, [])

  // BiokeaLeaderboardPrompt at game-start when the player still has the
  // default 'Explorer' handle. Captures handle (required) + optional
  // email subscription, same as the arcade games' game-end prompt.
  const [biokeaPromptOpen, setBiokeaPromptOpen] = useState<boolean>(
    () => loadPlayerName() === 'Explorer',
  )

  // Golden Sample 26: every time the BayDex (catalog of creatures
  // encountered, not captured) grows, push the new high-water mark to
  // the hunt API and try to claim slot 2 (20 unique creatures
  // encountered). Capture would be a steeper bar — we want exploration
  // to unlock the slot, not battle proficiency. Server is authoritative;
  // this hook is a no-op until the threshold is met.
  // I won't tell. That would be cheating.
  const uniqueEncountered = gameState.player.catalog.length
  useEffect(() => {
    if (uniqueEncountered > 0) void reportCreatureEncountered(uniqueEncountered)
  }, [uniqueEncountered])

  const [map] = useState<MapTile[][]>(() => generateMap())
  const [exploredTiles, setExploredTiles] = useState<Set<string>>(() => new Set<string>())
  const worldEvents = useWorldEvents(gameState.gameMinutes, gameState.gameDay ?? 75)
  const [nearbyRangerId, setNearbyRangerId] = useState<string | null>(null)
  const [currentLandmark, setCurrentLandmark] = useState<string | null>(null)
  const [showChampion, setShowChampion] = useState(false)
  const [nearbyDock, setNearbyDock] = useState<BoatDock | null>(null)
  const [boatAnimating, setBoatAnimating] = useState(false)
  const [pendingEvolution, setPendingEvolution] = useState<{
    from: CapturedCreature
    to: CapturedCreature
    description: string
    teamIndex: number
  } | null>(null)

  // Post-capture notification and nickname prompt
  const [captureNotif, setCaptureNotif] = useState<{
    creature: Creature
    isNewSpecies: boolean
    teamFull: boolean
  } | null>(null)
  const [nicknamePrompt, setNicknamePrompt] = useState<{
    creature: Creature
    teamIndex: number
  } | null>(null)
  const [nicknameInput, setNicknameInput] = useState('')

  // Battle reward toast
  const [battleReward, setBattleReward] = useState<{ xp: number; coins: number; levelUp: boolean; isBoss?: boolean } | null>(null)

  // Screen transition overlay
  const [screenTransition, setScreenTransition] = useState<'none' | 'fade-out' | 'fade-in'>('none')

  // Alcatraz escape quest state
  const [alcatrazEscapeActive, setAlcatrazEscapeActive] = useState(false)
  const [alcatrazStage, setAlcatrazStage] = useState<EscapeStage>('lockdown')
  const [alcatrazCellProgress, setAlcatrazCellProgress] = useState(0)
  const [alcatrazCompleted, setAlcatrazCompleted] = useState(() => {
    try { return localStorage.getItem('bioquest-bay-alcatraz-escaped') === 'true' } catch { return false }
  })

  // Roaming trainer state
  const [pendingTrainer, setPendingTrainer] = useState<RoamingTrainer | null>(null)
  const [defeatedTrainers, setDefeatedTrainers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bioquest-bay-defeated-trainers')
      return saved ? JSON.parse(saved) as string[] : []
    } catch { return [] }
  })
  const [fishLog, setFishLog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bioquest-bay-fish-log')
      return saved ? JSON.parse(saved) as string[] : []
    } catch { return [] }
  })

  // Overlay panels (render on top of whatever screen is active)
  const [showMigrationCalendar, setShowMigrationCalendar] = useState(false)
  const [showFieldNotes, setShowFieldNotes] = useState(false)
  const [showTrophyRoom, setShowTrophyRoom] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [showFastTravel, setShowFastTravel] = useState(false)
  const [borderMessage, setBorderMessage] = useState<string | null>(null)
  const [borderPeek, setBorderPeek] = useState<{ state: string; stepsLeft: number; returnX: number; returnY: number } | null>(null)
  const [nearbySignpost, setNearbySignpost] = useState<{ state: string; message: string; fact: string } | null>(null)

  // Daily challenges
  const [dailyState, setDailyState] = useState<DailyState>(() => loadDailyState())

  // Encounter state
  const [encounterMood, setEncounterMood] = useState<CreatureMood>('neutral')
  const [encounterType, setEncounterType] = useState<EncounterType>('single')

  // Achievement stats — persisted in localStorage per slot
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => createInitialStats())
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [achievementToast, setAchievementToast] = useState<{ name: string; icon: string } | null>(null)
  const [evolveReadyToast, setEvolveReadyToast] = useState<{ name: string; sprite: string; toName: string; gap: number } | null>(null)

  // Conservation prompt — show after sustained engagement, up to 3 times total
  const [showConservation, setShowConservation] = useState(false)
  const conservationDismissals = useRef<number>(
    (() => { try { return parseInt(localStorage.getItem('bioquest-conservation-dismissed') ?? '0', 10) } catch { return 0 } })()
  )
  const sessionStartRef = useRef(Date.now())
  const conservationShownThisSession = useRef(false)

  // Quest reward popup
  const [questReward, setQuestReward] = useState<{ title: string; xp: number; coins: number; items?: { id: string; name: string; sprite: string; quantity: number }[] } | null>(null)

  // Boss encounters (lunar + shadow)
  const [lunarBoss, setLunarBoss] = useState<Creature | null>(null)
  const [shadowBoss, setShadowBoss] = useState<Creature | null>(null)
  const lunarBossTriggeredRef = useRef<number>(-1)
  const shadowBossTriggeredRef = useRef<number>(-1)

  // Tutorial system
  const [tutorialTip, setTutorialTip] = useState<string | null>(null)
  const [showTutorialDialog, setShowTutorialDialog] = useState(false)
  const tutorialFlagsRef = useRef<Set<string>>(new Set(gameState.tutorialFlags ?? []))

  const triggerTutorial = useCallback((flag: string, tip: string) => {
    if (tutorialFlagsRef.current.has(flag)) return
    tutorialFlagsRef.current.add(flag)
    setTutorialTip(tip)
    setGameState(prev => ({
      ...prev,
      tutorialFlags: [...(prev.tutorialFlags ?? []), flag],
    }))
  }, [])

  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMoveTime = useRef(0)
  const pendingEvolutionRef = useRef<typeof pendingEvolution>(null)
  const lastWeatherChange = useRef(gameState.gameMinutes)

  // Auto-save to active slot
  useEffect(() => {
    if (gameState.screen !== 'title' && gameState.screen !== 'starter') {
      saveGame(gameState, activeSlot)
      saveExplored(exploredTiles, activeSlot)
    }
  }, [gameState, exploredTiles, activeSlot])

  // Background music — switch based on screen/biome
  useEffect(() => {
    if (gameState.screen === 'title' || gameState.screen === 'starter') {
      Music.stop()
      return
    }
    if (gameState.screen === 'battle' || gameState.screen === 'ranger_battle') {
      Music.play('battle')
    } else if (gameState.screen === 'fishing') {
      Music.play('explore', 'water')
    } else {
      Music.play('explore', gameState.currentBiome)
    }
    return () => { Music.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.screen, gameState.currentBiome])

  // Ambient biome sounds — crickets, waves, birds, weather
  useEffect(() => {
    if (gameState.screen === 'world') {
      Music.playAmbient(gameState.currentBiome, gameState.timeOfDay, gameState.weather)
    } else if (gameState.screen === 'battle' || gameState.screen === 'ranger_battle') {
      Music.stopAmbient()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.screen, gameState.currentBiome, gameState.timeOfDay, gameState.weather])

  // Persist trainer/fish data
  useEffect(() => {
    try { localStorage.setItem('bioquest-bay-defeated-trainers', JSON.stringify(defeatedTrainers)) } catch { /* ignore */ }
  }, [defeatedTrainers])
  useEffect(() => {
    try { localStorage.setItem('bioquest-bay-fish-log', JSON.stringify(fishLog)) } catch { /* ignore */ }
  }, [fishLog])

  // Save stats & check achievements
  useEffect(() => {
    if (gameState.screen !== 'title') saveStats(playerStats, activeSlot)
    const unlocked = getUnlockedAchievements(gameState, playerStats)
    setUnlockedAchievements(unlocked)
  }, [playerStats, gameState])

  // Check for new achievements and show toast
  const prevUnlockedRef = useRef<string[]>([])
  useEffect(() => {
    const newOnes = getNewAchievements(gameState, playerStats, prevUnlockedRef.current)
    if (newOnes.length > 0 && prevUnlockedRef.current.length > 0) {
      // Show toast for the first new one
      setAchievementToast({ name: newOnes[0].name, icon: newOnes[0].icon })
      SFX.achievement()
      setTimeout(() => setAchievementToast(null), 3000)
    }
    prevUnlockedRef.current = getUnlockedAchievements(gameState, playerStats)
  }, [playerStats, gameState])

  const updateJournal = useCallback((
    journal: Record<string, JournalEntry>,
    subregion: string,
    biome: MapTile['biome'],
    prevSubregion: string
  ): Record<string, JournalEntry> => {
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
        firstVisited: new Date().toISOString(),
        creaturesEncountered: [], creaturesCaptured: [],
        visitCount: 1,
      },
    }
  }, [])

  const movePlayer = useCallback((dx: number, dy: number) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 120) return
    lastMoveTime.current = now

    setGameState(prev => {
      if (prev.screen !== 'world' || prev.battle.active) return prev

      const newX = prev.player.x + dx
      const newY = prev.player.y + dy

      if (newX < 0 || newX >= (map[0]?.length ?? 0) || newY < 0 || newY >= map.length) return prev

      const tile = map[newY]?.[newX]
      if (!tile) return prev

      // Border peek system — allow 3 steps into neighboring states
      if (tile.borderState && !tile.isWalkable) {
        const MAX_BORDER_STEPS = 3
        if (!borderPeek) {
          // Entering border for the first time
          setBorderPeek({ state: tile.borderState, stepsLeft: MAX_BORDER_STEPS - 1, returnX: prev.player.x, returnY: prev.player.y })
          setBorderMessage(`Entering ${tile.borderState}... ${MAX_BORDER_STEPS - 1} steps before you turn back.`)
          setTimeout(() => setBorderMessage(null), 2500)
          return { ...prev, player: { ...prev.player, x: newX, y: newY } }
        } else if (borderPeek.stepsLeft > 0) {
          // Still have steps left
          setBorderPeek(bp => bp ? { ...bp, stepsLeft: bp.stepsLeft - 1 } : null)
          setBorderMessage(borderPeek.stepsLeft === 1
            ? `Last step in ${borderPeek.state}! Turning back...`
            : `${borderPeek.stepsLeft - 1} step${borderPeek.stepsLeft - 1 !== 1 ? 's' : ''} left in ${borderPeek.state}.`)
          setTimeout(() => setBorderMessage(null), 2000)
          return { ...prev, player: { ...prev.player, x: newX, y: newY } }
        } else {
          // Out of steps — teleport back to California
          const rx = borderPeek.returnX, ry = borderPeek.returnY
          setBorderPeek(null)
          setBorderMessage(`Back in California! Your journey continues in the Golden State.`)
          setTimeout(() => setBorderMessage(null), 3000)
          return { ...prev, player: { ...prev.player, x: rx, y: ry } }
        }
      }

      // If returning to CA from a border peek, clear the peek state
      if (borderPeek && !tile.borderState) {
        setBorderPeek(null)
      }

      if (!tile.isWalkable) return prev

      // Track step stats & daily challenges
      setDailyState(ds => updateChallengeProgress(ds, 'steps'))
      setPlayerStats(ps => {
        const newBiomes = ps.uniqueBiomesVisited.includes(tile.biome)
          ? ps.uniqueBiomesVisited
          : [...ps.uniqueBiomesVisited, tile.biome]
        const sub = tile.subregion || ''
        const newSubs = sub && !ps.uniqueSubregionsVisited.includes(sub)
          ? [...ps.uniqueSubregionsVisited, sub]
          : ps.uniqueSubregionsVisited
        return { ...ps, totalStepsWalked: ps.totalStepsWalked + 1, uniqueBiomesVisited: newBiomes, uniqueSubregionsVisited: newSubs }
      })

      // Reveal nearby tiles on minimap (5-tile radius)
      setExploredTiles(prev => {
        const next = new Set(prev)
        const revealR = 5
        let changed = false
        for (let ry = -revealR; ry <= revealR; ry++) {
          for (let rx = -revealR; rx <= revealR; rx++) {
            if (rx * rx + ry * ry > revealR * revealR) continue
            const key = `${newX + rx},${newY + ry}`
            if (!next.has(key)) { next.add(key); changed = true }
          }
        }
        if (changed) {
          // Persist periodically (every ~20 new tiles)
          if (next.size % 20 < 5) {
            saveExplored(next, activeSlot)
          }
          return next
        }
        return prev
      })

      if (Math.random() < 0.3) SFX.step()

      const newJournal = updateJournal(prev.player.journal, tile.subregion || '', tile.biome, prev.currentSubregion)

      // Track explore challenge when entering new tile
      if (tile.subregion && tile.subregion !== prev.currentSubregion) {
        setDailyState(ds => updateChallengeProgress(ds, 'explore'))
        if (tile.biome !== prev.currentBiome) {
          triggerTutorial('new_biome', `You entered ${tile.biome.replace('_', ' ')} terrain. Different biomes have different creatures!`)
        }
      }

      // Advance game clock
      const timeUpdate = advanceTime(prev.gameMinutes, 3)
      // Detect day wrap (clock went backward = new day rollover)
      const dayWrapped = timeUpdate.gameMinutes < prev.gameMinutes
      const newGameDay = (prev.gameDay ?? 0) + (dayWrapped ? 1 : 0)

      // Weather changes roughly every 60 game-minutes
      let newWeather = prev.weather
      if (Math.abs(timeUpdate.gameMinutes - lastWeatherChange.current) > 60 || timeUpdate.gameMinutes < lastWeatherChange.current) {
        newWeather = rollWeather(prev.weather, tile.biome, newGameDay)
        lastWeatherChange.current = timeUpdate.gameMinutes
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

      // Migration herd encounter check
      if (newState.encounterCooldown <= 0 && newState.player.team.length > 0) {
        const herd = checkHerdEncounter(newX, newY, timeUpdate.gameMinutes, timeUpdate.timeOfDay)
        if (herd) {
          const herdCreature = ALL_CREATURES.find(c => c.id === herd.creatureId)
          if (herdCreature) {
            SFX.battleStart()
            const newCatalog = [...new Set([...newState.player.catalog, herdCreature.id])]
            return {
              ...newState,
              screen: 'encounter' as const,
              battle: {
                active: true,
                wildCreature: herdCreature,
                playerCreature: newState.player.team[0],
                turn: 'player' as const,
                log: [`A migrating ${herd.name} crosses your path! A ${herdCreature.name} faces you!`],
                captureChance: 0.5,
              },
              encounterCooldown: 8,
              player: { ...newState.player, catalog: newCatalog },
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
        lunarBossTriggeredRef.current !== (newState.gameDay ?? 0) &&
        newState.player.team.length > 0 &&
        Math.random() < 0.12
      ) {
        const boss = getLunarBoss(tile.biome, tile.subregion)
        if (boss) {
          lunarBossTriggeredRef.current = newState.gameDay ?? 0
          setLunarBoss(boss)
          return { ...newState, encounterCooldown: 8 }
        }
      }

      // Shadow boss check — new moon + night
      if (
        newState.encounterCooldown <= 0 &&
        tile.biome !== 'water' &&
        timeUpdate.timeOfDay === 'night' &&
        isNewMoon(newState.gameDay ?? 0) &&
        shadowBossTriggeredRef.current !== (newState.gameDay ?? 0) &&
        newState.player.team.length > 0 &&
        Math.random() < 0.12
      ) {
        const boss = getShadowBoss(tile.biome, tile.subregion)
        if (boss) {
          shadowBossTriggeredRef.current = newState.gameDay ?? 0
          setShadowBoss(boss)
          return { ...newState, encounterCooldown: 8 }
        }
      }

      // Random encounter check
      if (newState.encounterCooldown <= 0 && tile.biome !== 'water') {
        const encounterRoll = Math.random()
        const encounterChance = tile.hasCreature ? 0.25 : 0.08

        if (encounterRoll < encounterChance) {
          let creature = getRandomEncounter(tile.biome, tile.subregion, timeUpdate.timeOfDay, newWeather, newState.gameDay, { x: newState.player.x, y: newState.player.y })
          if (creature && newState.player.team.length > 0) {
            // Roll for alpha (5%) or shiny (1/200) variants
            const alphaRoll = Math.random()
            const shinyRoll = Math.random()
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
            SFX.battleStart()
            const newCatalog = [...new Set([...newState.player.catalog, creature.id])]
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
              ...newState,
              player: { ...newState.player, catalog: newCatalog, journal: journalWithCreature },
              screen: 'encounter' as const,
              battle: {
                active: true,
                wildCreature: creature,
                playerCreature: newState.player.team[0],
                turn: 'player' as const,
                log: [],
                captureChance: 0,
              },
              encounterCooldown: 5,
            }
          }
        }

        // Roaming trainer encounter (3% chance, separate from creature encounters)
        if (Math.random() < 0.03) {
          const trainer = rollTrainerEncounter(tile.biome, newState.player.level, defeatedTrainers)
          if (trainer && newState.player.team.length > 0) {
            setPendingTrainer(trainer)
            return {
              ...newState,
              screen: 'trainer_encounter' as const,
              encounterCooldown: 10,
            }
          }
        }
      }

      return newState
    })
  }, [map, updateJournal, defeatedTrainers, triggerTutorial])

  // When encounter starts, roll mood and encounter type
  useEffect(() => {
    if ((gameState.screen === 'encounter' || gameState.screen === 'battle') && gameState.battle.wildCreature) {
      setEncounterMood(rollMood(gameState.battle.wildCreature))
      setEncounterType(rollEncounterType(gameState.battle.wildCreature))
      if (gameState.screen === 'encounter') {
        triggerTutorial('first_encounter', 'A wild creature appeared! Battle it to weaken it, then try to catch it.')
      }
    }
  }, [gameState.screen, gameState.battle.wildCreature, triggerTutorial])

  // Transition from encounter animation to battle
  const handleEncounterComplete = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'battle' as const }))
  }, [])

  const handleBoatTravel = useCallback(() => {
    if (!nearbyDock || boatAnimating) return
    setBoatAnimating(true)
    SFX.step()
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, x: nearbyDock.destX, y: nearbyDock.destY },
        currentSubregion: nearbyDock.destinationName,
      }))
      setBoatAnimating(false)

      // Trigger Alcatraz Escape quest when arriving on Alcatraz
      if (nearbyDock.destinationName === 'Alcatraz Island' && !alcatrazCompleted && !alcatrazEscapeActive) {
        setTimeout(() => {
          setAlcatrazEscapeActive(true)
          setAlcatrazStage('lockdown')
          setAlcatrazCellProgress(0)
          setGameState(prev => ({ ...prev, screen: 'alcatraz_escape' }))
        }, 500)
      }
    }, 1500)
  }, [nearbyDock, boatAnimating, alcatrazCompleted, alcatrazEscapeActive])

  // BART station detection
  const nearbyBartStation = gameState.screen === 'world'
    ? getBartStationAt(gameState.player.x, gameState.player.y) : undefined

  // Boardwalk detection — exact tile on the ferris wheel landmark so Ranger
  // Kai's 3x3 radius at (8,57) doesn't hide it on the adjacent beach tiles.
  const atBoardwalk = gameState.screen === 'world' &&
    gameState.player.x === 9 && gameState.player.y === 58

  // Steamer Lane surfing detection — exact tile so Ranger Kai (also at 8,57)
  // doesn't hide the activity on surrounding tiles. Player must stand on the
  // break itself to surf; surrounding tiles show the ranger prompt.
  const atSteamerLane = gameState.screen === 'world' &&
    gameState.player.x === 8 && gameState.player.y === 57

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when the user is typing in a text field
      if (isEditableTarget(e.target)) return

      // Allow Escape from overlay screens
      if (e.key === 'Escape') {
        setGameState(prev => {
          if (['catalog', 'inventory', 'journal', 'ranger', 'trade', 'baydex', 'breeding', 'questlog', 'crafting', 'fishing', 'ranger_battle', 'habitat_map', 'adoption', 'leaderboard', 'fusion', 'diving', 'bart', 'boardwalk', 'surfing', 'shop', 'daily_challenges', 'arena', 'move_tutor'].includes(prev.screen)) {
            return { ...prev, screen: 'world', activeRangerId: null }
          }
          return prev
        })
        return
      }

      if (gameState.screen !== 'world' || gameState.battle.active) return

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); movePlayer(0, -1); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); movePlayer(0, 1); break
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); movePlayer(-1, 0); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); movePlayer(1, 0); break
        case 'c': case 'C':
          setGameState(prev => ({ ...prev, screen: 'catalog' })); break
        case 'b': case 'B':
          setGameState(prev => ({ ...prev, screen: 'baydex' })); break
        case 'j': case 'J':
          setGameState(prev => ({ ...prev, screen: 'journal' })); break
        case 'n': case 'N':
          setGameState(prev => ({ ...prev, screen: 'breeding' })); break
        case 't': case 'T':
          setGameState(prev => ({ ...prev, screen: 'trade' })); break
        case 'q': case 'Q':
          setGameState(prev => ({ ...prev, screen: 'questlog' })); break
        case 'm': case 'M':
          Music.toggle(); break
        case 'r': case 'R':
          setGameState(prev => ({ ...prev, screen: 'crafting' })); break
        case 'h': case 'H':
          setGameState(prev => ({ ...prev, screen: 'habitat_map' })); break
        case 'l': case 'L':
          setGameState(prev => ({ ...prev, screen: 'leaderboard' })); break
        case 'g': case 'G':
          if (gameState.player.team.length >= 2) {
            setGameState(prev => ({ ...prev, screen: 'fusion' }))
          }
          break
        case 'f': case 'F': {
          // Fishing — only near water tiles
          const px = gameState.player.x
          const py = gameState.player.y
          const nearWater = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
            const t = map[py+dy]?.[px+dx]
            return t && t.biome === 'water'
          }) || map[py]?.[px]?.biome === 'beach' || map[py]?.[px]?.biome === 'marsh'
          if (nearWater) {
            setGameState(prev => ({ ...prev, screen: 'fishing' }))
          }
          break
        }
        case ' ': case 'Enter':
          // Exact-tile interactions (dock, BART, Steamer Lane, Boardwalk) take
          // precedence over radius-based ranger interactions — otherwise rangers
          // sitting on/next to these tiles make the activity unreachable.
          if (nearbyDock && !boatAnimating) {
            e.preventDefault()
            handleBoatTravel()
          } else if (nearbyBartStation) {
            e.preventDefault()
            setGameState(prev => ({ ...prev, screen: 'bart' }))
          } else if (atSteamerLane) {
            e.preventDefault()
            setGameState(prev => ({ ...prev, screen: 'surfing' }))
          } else if (atBoardwalk) {
            e.preventDefault()
            setGameState(prev => ({ ...prev, screen: 'boardwalk' }))
          } else if (nearbyRangerId) {
            e.preventDefault()
            setGameState(prev => ({ ...prev, screen: 'ranger', activeRangerId: nearbyRangerId }))
          }
          break
        // Escape handled above the guard
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.screen, gameState.battle.active, movePlayer, nearbyRangerId, nearbyBartStation, atSteamerLane, atBoardwalk, nearbyDock, boatAnimating, handleBoatTravel])


  // Hold-to-move for keyboard
  useEffect(() => {
    if (gameState.screen !== 'world' || gameState.battle.active) return

    const keysDown = new Set<string>()

    const process = () => {
      if (keysDown.has('ArrowUp') || keysDown.has('w')) movePlayer(0, -1)
      else if (keysDown.has('ArrowDown') || keysDown.has('s')) movePlayer(0, 1)
      else if (keysDown.has('ArrowLeft') || keysDown.has('a')) movePlayer(-1, 0)
      else if (keysDown.has('ArrowRight') || keysDown.has('d')) movePlayer(1, 0)

      if (keysDown.size > 0) moveTimeout.current = setTimeout(process, 130)
    }

    const handleDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        if (!keysDown.has(e.key)) {
          keysDown.add(e.key)
          if (keysDown.size === 1) process()
        }
      }
    }

    const handleUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key)
      if (keysDown.size === 0 && moveTimeout.current) {
        clearTimeout(moveTimeout.current)
        moveTimeout.current = null
      }
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
      if (moveTimeout.current) clearTimeout(moveTimeout.current)
    }
  }, [gameState.screen, gameState.battle.active, movePlayer])

  const handleBattleWin = useCallback((xpGained: number) => {
    SFX.victory()
    setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1 }))
    setDailyState(ds => updateChallengeProgress(ds, 'battle'))
    // Fade transition out of battle
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => {
      let newXp = prev.player.xp + xpGained
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      const didLevelUp = newXp >= newMaxXp

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp
        newLevel++
        newMaxXp = Math.floor(newMaxXp * 1.3)
      }

      const isBossKill = !!(prev.battle.wildCreature && BOSS_IDS.has(prev.battle.wildCreature.id))
      const coinsGained = isBossKill ? (50 + newLevel * 5) : (10 + newLevel * 2)
      setBattleReward({ xp: xpGained, coins: coinsGained, levelUp: didLevelUp, isBoss: isBossKill })
      setTimeout(() => setBattleReward(null), 3000)

      const newCatalog = prev.battle.wildCreature
        ? [...new Set([...prev.player.catalog, prev.battle.wildCreature.id])]
        : prev.player.catalog

      const newTeam = [...prev.player.team]
      let evolutionData: { from: CapturedCreature; to: CapturedCreature; description: string; teamIndex: number } | null = null
      // Award XP + happiness to all team members (lead gets full share, others get half)
      for (let ti = 0; ti < newTeam.length; ti++) {
        let member = { ...newTeam[ti] }
        member.xp += Math.floor(xpGained * (ti === 0 ? 1 : 0.5))
        member = adjustHappiness(member, ti === 0 ? BATTLE_WIN_LEAD_GAIN : BATTLE_WIN_BENCH_GAIN)
        if (member.xp >= member.level * 50) {
          member.xp = 0
          member.level++
          member = adjustHappiness(member, LEVEL_UP_GAIN)
          member.stats = {
            ...member.stats,
            maxHp: member.stats.maxHp + 3,
            hp: Math.min(member.stats.hp + 3, member.stats.maxHp + 3),
            attack: member.stats.attack + 2,
            defense: member.stats.defense + 1,
            speed: member.stats.speed + 1,
          }

          const evo = getEvolution(member.id, member.level)
          if (evo) {
            const beforeEvo = { ...member }
            const evolved = evolveCreature(member, evo)
            if (!evolutionData) {
              evolutionData = { from: beforeEvo, to: evolved, description: evo.description, teamIndex: ti }
            }
            newTeam[ti] = evolved
          } else {
            newTeam[ti] = member
            // Almost-evolve hint: fires when lead team member is within 2 levels of its evolution
            const nextEvo = getEvolutionTarget(member.id)
            if (ti === 0 && nextEvo && member.level < nextEvo.level && nextEvo.level - member.level <= 2) {
              const targetSpecies = ALL_CREATURES.find(c => c.id === nextEvo.toId)
              if (targetSpecies) {
                const gap = nextEvo.level - member.level
                setEvolveReadyToast({
                  name: member.nickname || member.name,
                  sprite: member.sprite,
                  toName: targetSpecies.name,
                  gap,
                })
                setTimeout(() => setEvolveReadyToast(null), 4000)
              }
            }
          }
        } else {
          newTeam[ti] = member
        }
      }

      if (evolutionData) {
        pendingEvolutionRef.current = evolutionData
        setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
        SFX.evolution()
        setTimeout(() => {
          if (pendingEvolutionRef.current) {
            setPendingEvolution(pendingEvolutionRef.current)
            pendingEvolutionRef.current = null
          }
        }, 100)
      }

      // Material drops from battle victory
      const drops = rollMaterialDrops(prev.currentBiome, newLevel)
      const newInventory = [...prev.player.inventory]
      for (const drop of drops) {
        const existing = newInventory.find(i => i.id === drop.itemId)
        if (existing) {
          existing.quantity += drop.quantity
        } else {
          const mat = MATERIALS.find(m => m.id === drop.itemId)
          if (mat) {
            newInventory.push({ ...mat, quantity: drop.quantity })
          }
        }
      }

      // Route back to Alcatraz escape if active
      if (alcatrazEscapeActive) {
        if (alcatrazStage === 'cellblock') {
          setAlcatrazCellProgress(p => p + 1)
        } else if (alcatrazStage === 'boss') {
          setAlcatrazStage('freedom')
        }
      }

      // Increment invasive removal counter if the defeated wild creature was invasive
      const defeated = prev.battle.wildCreature
      const wasInvasive = !!defeated && (defeated.conservationStatus === 'INV' || defeated.isNative === false)
      const newInvasivesRemoved = (prev.player.invasivesRemoved ?? 0) + (wasInvasive ? 1 : 0)

      // Track boss defeats
      const newBossDefeats = [...(prev.bossDefeats ?? [])]
      if (defeated && BOSS_IDS.has(defeated.id)) {
        const isLunar = LUNAR_BOSSES.some(b => b.id === defeated.id)
        newBossDefeats.push({
          bossId: defeated.id,
          bossName: defeated.name,
          bossSprite: defeated.sprite,
          bossType: isLunar ? 'lunar' : 'shadow',
          gameDay: prev.gameDay ?? 0,
          captured: false,
        })
      }

      return {
        ...prev,
        screen: alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
        player: {
          ...prev.player,
          xp: newXp,
          level: newLevel,
          maxXp: newMaxXp,
          coins: (prev.player.coins ?? 0) + coinsGained,
          team: newTeam,
          catalog: newCatalog,
          inventory: newInventory,
          invasivesRemoved: newInvasivesRemoved,
        },
        bossDefeats: newBossDefeats,
        battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
      }
    })
  }, [alcatrazEscapeActive, alcatrazStage])

  const handleBattleLose = useCallback(() => {
    SFX.defeat()
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => {
      const newTeam = prev.player.team.map(c => ({
        ...c,
        stats: { ...c.stats, hp: Math.floor(c.stats.maxHp * 0.5) },
      }))
      return {
        ...prev, screen: alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
        player: { ...prev.player, team: newTeam },
        battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
      }
    })
  }, [alcatrazEscapeActive])

  const handleCapture = useCallback((creature: Creature, _personality: Personality) => {
    setPlayerStats(ps => ({ ...ps, totalCreaturesCaught: ps.totalCreaturesCaught + 1 }))
    setDailyState(ds => updateChallengeProgress(ds, 'catch'))
    setTimeout(() => {
      triggerTutorial('first_catch', 'Great catch! Check your team with T and open the WildDex with B to learn more.')
    }, 1500)
    setGameState(prev => {
      const isNewSpecies = !prev.player.captured.includes(creature.id)
      const teamFull = prev.player.team.length >= 6

      const captured: CapturedCreature = {
        ...creature,
        level: Math.max(1, prev.player.level - 1 + Math.floor(Math.random() * 3)),
        xp: 0,
        capturedAt: new Date().toISOString(),
        capturedBiome: prev.currentBiome,
        happiness: DEFAULT_HAPPINESS,
      }

      const newTeam = !teamFull
        ? [...prev.player.team, captured]
        : prev.player.team
      const newReserves = teamFull
        ? [...prev.player.reserves, captured]
        : prev.player.reserves

      const journalWithCapture = { ...prev.player.journal }
      const subregion = prev.currentSubregion
      if (subregion && journalWithCapture[subregion]) {
        const entry = journalWithCapture[subregion]
        if (!entry.creaturesCaptured.includes(creature.id)) {
          journalWithCapture[subregion] = {
            ...entry,
            creaturesCaptured: [...entry.creaturesCaptured, creature.id],
          }
        }
      }

      // Show post-capture notification on world screen
      setCaptureNotif({ creature, isNewSpecies, teamFull })
      setTimeout(() => setCaptureNotif(null), 4000)

      // Show nickname prompt after notification fades
      if (!teamFull) {
        const idx = newTeam.length - 1
        setTimeout(() => {
          setNicknamePrompt({ creature, teamIndex: idx })
          setNicknameInput('')
        }, 2000)
      }

      // Track boss captures
      const newBossDefeats = [...(prev.bossDefeats ?? [])]
      if (BOSS_IDS.has(creature.id)) {
        const isLunar = LUNAR_BOSSES.some(b => b.id === creature.id)
        newBossDefeats.push({
          bossId: creature.id,
          bossName: creature.name,
          bossSprite: creature.sprite,
          bossType: isLunar ? 'lunar' : 'shadow',
          gameDay: prev.gameDay ?? 0,
          captured: true,
        })
      }

      return {
        ...prev, screen: 'world',
        player: {
          ...prev.player, team: newTeam, reserves: newReserves,
          catalog: [...new Set([...prev.player.catalog, creature.id])],
          captured: [...new Set([...prev.player.captured, creature.id])],
          journal: journalWithCapture,
        },
        bossDefeats: newBossDefeats,
        battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
      }
    })
  }, [triggerTutorial])

  const handleFlee = useCallback(() => {
    SFX.flee()
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => ({
      ...prev, screen: 'world',
      battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
      encounterCooldown: 8,
    }))
  }, [])

  const handleCreatureFled = useCallback(() => {
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => ({
      ...prev, screen: 'world',
      battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
      encounterCooldown: 6,
    }))
  }, [])

  const handleBossChallenge = useCallback(() => {
    if (!lunarBoss) return
    SFX.battleStart()
    const newCatalog = [...new Set([...gameState.player.catalog, lunarBoss.id])]
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, catalog: newCatalog },
      screen: 'encounter' as const,
      battle: {
        active: true,
        wildCreature: lunarBoss,
        playerCreature: prev.player.team[0],
        turn: 'player' as const,
        log: [],
        captureChance: 0,
      },
    }))
    setLunarBoss(null)
  }, [lunarBoss, gameState.player.catalog])

  const handleBossFlee = useCallback(() => {
    SFX.flee()
    setLunarBoss(null)
    setShadowBoss(null)
  }, [])

  const handleShadowBossChallenge = useCallback(() => {
    if (!shadowBoss) return
    SFX.battleStart()
    const newCatalog = [...new Set([...gameState.player.catalog, shadowBoss.id])]
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, catalog: newCatalog },
      screen: 'encounter' as const,
      battle: {
        active: true,
        wildCreature: shadowBoss,
        playerCreature: prev.player.team[0],
        turn: 'player' as const,
        log: [],
        captureChance: 0,
      },
    }))
    setShadowBoss(null)
  }, [shadowBoss, gameState.player.catalog])

  const handleFriendlyGift = useCallback((gift: FriendlyGift) => {
    setGameState(prev => {
      const newInventory = [...prev.player.inventory]
      const existing = newInventory.find(i => i.id === gift.itemId)
      if (existing) {
        existing.quantity += 1
      }
      return {
        ...prev, screen: 'world',
        player: { ...prev.player, inventory: newInventory },
        battle: { active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0 },
        encounterCooldown: 5,
      }
    })
  }, [])

  // Ranger battle handlers
  const handleStartRangerBattle = useCallback((rangerId: string) => {
    setGameState(prev => ({
      ...prev,
      screen: 'ranger_battle',
      activeRangerId: rangerId,
    }))
  }, [])

  const handleRangerBattleWin = useCallback((xp: number) => {
    SFX.victory()
    const isFinalBoss = gameState.activeRangerId === FINAL_BOSS_ID
    const isGrandChampion = gameState.activeRangerId === GRAND_CHAMPION_ID
    const alreadyChampion = (playerStats.defeatedRangers ?? []).includes(FINAL_BOSS_ID)
    const alreadyGrandChampion = (playerStats.defeatedRangers ?? []).includes(GRAND_CHAMPION_ID)
    setPlayerStats(ps => {
      const rangerId = gameState.activeRangerId
      const defeated = ps.defeatedRangers ?? []
      const newDefeated = rangerId && !defeated.includes(rangerId)
        ? [...defeated, rangerId] : defeated
      return {
        ...ps,
        rangerBattlesWon: (ps.rangerBattlesWon ?? 0) + 1,
        defeatedRangers: newDefeated,
      }
    })
    setDailyState(ds => updateChallengeProgress(ds, 'battle'))
    setGameState(prev => {
      let newXp = prev.player.xp + xp
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }
      return {
        ...prev,
        screen: 'world',
        activeRangerId: null,
        player: {
          ...prev.player,
          xp: newXp,
          level: newLevel,
          maxXp: newMaxXp,
          coins: (prev.player.coins ?? 0) + 30 + newLevel * 3,
        },
      }
    })
    // Show champion screen on first final/grand boss defeat
    if ((isFinalBoss && !alreadyChampion) || (isGrandChampion && !alreadyGrandChampion)) {
      setTimeout(() => setShowChampion(true), 500)
    }
  }, [gameState.activeRangerId, playerStats.defeatedRangers])

  const handleRangerBattleLose = useCallback(() => {
    setGameState(prev => {
      const newTeam = prev.player.team.map(c => ({
        ...c,
        stats: { ...c.stats, hp: Math.floor(c.stats.maxHp * 0.5) },
      }))
      return {
        ...prev,
        screen: 'world',
        activeRangerId: null,
        player: { ...prev.player, team: newTeam },
      }
    })
  }, [])

  const handleRangerBattleClose = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      screen: 'world',
      activeRangerId: null,
    }))
  }, [])

  const handleArenaWin = useCallback((xp: number, coins: number, tier: ArenaTier) => {
    SFX.victory()
    setGameState(prev => {
      let newXp = prev.player.xp + xp
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }
      return {
        ...prev,
        player: {
          ...prev.player,
          xp: newXp,
          level: newLevel,
          maxXp: newMaxXp,
          coins: (prev.player.coins ?? 0) + coins,
        },
        arenaWins: {
          ...prev.arenaWins,
          [tier]: (prev.arenaWins[tier] ?? 0) + 1,
        },
      }
    })
  }, [])

  const handleArenaLose = useCallback(() => {
    setGameState(prev => {
      const newTeam = prev.player.team.map(c => ({
        ...c,
        stats: { ...c.stats, hp: Math.floor(c.stats.maxHp * 0.5) },
      }))
      return {
        ...prev,
        player: { ...prev.player, team: newTeam },
      }
    })
  }, [])

  const handleTeachMove = useCallback((creatureIndex: number, updatedCreature: import('@/types/game').CapturedCreature, cost: number) => {
    setGameState(prev => {
      const newTeam = [...prev.player.team]
      newTeam[creatureIndex] = updatedCreature
      return {
        ...prev,
        player: {
          ...prev.player,
          team: newTeam,
          coins: Math.max(0, (prev.player.coins ?? 0) - cost),
        },
      }
    })
  }, [])

  const handleLearnAbility = useCallback((creatureIndex: number, abilityId: string, cost: number) => {
    setGameState(prev => {
      const newTeam = [...prev.player.team]
      const creature = newTeam[creatureIndex]
      if (!creature) return prev
      newTeam[creatureIndex] = { ...creature, learnedAbility: abilityId }
      return {
        ...prev,
        player: {
          ...prev.player,
          team: newTeam,
          coins: Math.max(0, (prev.player.coins ?? 0) - cost),
        },
      }
    })
  }, [])

  const handleUseItem = useCallback((itemId: string) => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        inventory: prev.player.inventory.map(item =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        ),
      },
    }))
  }, [])

  const handleBattleSwitch = useCallback((index: number) => {
    setGameState(prev => {
      if (index <= 0 || index >= prev.player.team.length) return prev
      const newTeam = [...prev.player.team]
      const temp = newTeam[0]
      newTeam[0] = newTeam[index]
      newTeam[index] = temp
      return {
        ...prev,
        player: { ...prev.player, team: newTeam },
        battle: { ...prev.battle, playerCreature: newTeam[0] },
      }
    })
  }, [])

  const handleSwapLead = useCallback((index: number) => {
    setGameState(prev => {
      const newTeam = [...prev.player.team]
      const temp = newTeam[0]
      newTeam[0] = newTeam[index]
      newTeam[index] = temp
      return { ...prev, player: { ...prev.player, team: newTeam } }
    })
  }, [])

  const memoizedMap = useMemo(() => map, [map])
  const grandChampionUnlocked = canChallengeGrandChampion(
    playerStats.defeatedRangers ?? [],
    playerStats.uniqueSubregionsVisited ?? [],
  )
  const rangerPositions = useMemo(() =>
    RANGERS
      .filter(r => r.id !== GRAND_CHAMPION_ID || grandChampionUnlocked)
      .map(r => {
        const pos = getRangerPosition(r.id, r.x, r.y, gameState.timeOfDay)
        const activity = getRangerActivity(r.id, gameState.timeOfDay)
        return { x: pos.x, y: pos.y, sprite: r.sprite, activity: activity.activity as RangerActivity }
      }),
    [grandChampionUnlocked, gameState.timeOfDay]
  )
  const bayDexNewCount = useMemo(() => {
    const ackSet = new Set(bayDexAck)
    return gameState.player.catalog.filter(id => !ackSet.has(id)).length
  }, [gameState.player.catalog, bayDexAck])

  // Ranger interaction
  useEffect(() => {
    if (gameState.screen !== 'world') return
    const nearby = getNearbyRanger(gameState.player.x, gameState.player.y, gameState.timeOfDay)
    const isHiddenGrandChampion = nearby?.id === GRAND_CHAMPION_ID && !grandChampionUnlocked
    setNearbyRangerId(isHiddenGrandChampion ? null : (nearby?.id ?? null))
    // Auto-open Ranger Tomás tutorial dialog on first proximity
    if (nearby?.id === 'ranger-golden-gate' && !tutorialFlagsRef.current.has('ranger_tutorial')) {
      tutorialFlagsRef.current.add('ranger_tutorial')
      setShowTutorialDialog(true)
      setGameState(prev => ({
        ...prev,
        screen: 'ranger',
        activeRangerId: 'ranger-golden-gate',
        tutorialFlags: [...(prev.tutorialFlags ?? []), 'ranger_tutorial'],
      }))
    }
  }, [gameState.player.x, gameState.player.y, gameState.screen, gameState.timeOfDay])

  // Footprint proximity tutorial tip
  useEffect(() => {
    if (gameState.screen !== 'world' || tutorialFlagsRef.current.has('footprints')) return
    const px = gameState.player.x, py = gameState.player.y
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (map[py + dy]?.[px + dx]?.hasCreature) {
          triggerTutorial('footprints', 'See those paw prints? Follow them to find wild creatures nearby.')
          return
        }
      }
    }
  }, [gameState.player.x, gameState.player.y, gameState.screen, map, triggerTutorial])

  // Landmark detection
  useEffect(() => {
    if (gameState.screen !== 'world') return
    const lm = getLandmarkAt(gameState.player.x, gameState.player.y)
    setCurrentLandmark(lm?.name ?? null)
  }, [gameState.player.x, gameState.player.y, gameState.screen])

  // Boat dock detection
  useEffect(() => {
    if (gameState.screen !== 'world') return
    const dock = getBoatDockAt(gameState.player.x, gameState.player.y)
    setNearbyDock(dock ?? null)
  }, [gameState.player.x, gameState.player.y, gameState.screen])

  // Signpost detection
  useEffect(() => {
    if (gameState.screen !== 'world') return
    const sp = getSignpostAt(gameState.player.x, gameState.player.y)
    setNearbySignpost(sp ? { state: sp.state, message: sp.message, fact: sp.fact } : null)
  }, [gameState.player.x, gameState.player.y, gameState.screen])

  // World event tutorial tip
  useEffect(() => {
    if (worldEvents.activeEvent && !worldEvents.dismissed) {
      triggerTutorial('world_event', 'A special event is happening! Check the minimap for its location.')
    }
  }, [worldEvents.activeEvent, worldEvents.dismissed, triggerTutorial])

  // Conservation prompt — check engagement thresholds
  useEffect(() => {
    if (gameState.screen !== 'world') return
    if (conservationShownThisSession.current) return
    if (conservationDismissals.current >= 3) return

    const minutesPlayed = (Date.now() - sessionStartRef.current) / 60000
    const creatures = playerStats.totalCreaturesCaught
    const subregions = (playerStats.uniqueSubregionsVisited ?? []).length
    const rangers = (playerStats.defeatedRangers ?? []).length

    // Milestone-based: different thresholds for each showing
    const dismissCount = conservationDismissals.current
    let triggered = false
    if (dismissCount === 0) {
      // First: 10+ creatures AND 3+ subregions AND 15+ min, OR 20+ min alone
      triggered = (creatures >= 10 && subregions >= 3 && minutesPlayed >= 15) || minutesPlayed >= 20
    } else if (dismissCount === 1) {
      // Second: after defeating a ranger AND 30+ min
      triggered = rangers >= 1 && minutesPlayed >= 30
    } else if (dismissCount === 2) {
      // Third: after becoming champion (defeated final boss) AND 45+ min
      triggered = (playerStats.defeatedRangers ?? []).includes(FINAL_BOSS_ID) && minutesPlayed >= 45
    }

    if (triggered) {
      conservationShownThisSession.current = true
      setShowConservation(true)
    }
  }, [gameState.screen, gameState.player.x, playerStats.totalCreaturesCaught, playerStats.uniqueSubregionsVisited, playerStats.defeatedRangers])

  // (BART station and boardwalk detection moved above keyboard handler)

  const handleAcceptQuest = useCallback((questId: string) => {
    setGameState(prev => ({
      ...prev,
      questProgress: { ...prev.questProgress, [questId]: { questId, status: 'active', progress: 0 } },
    }))
  }, [])

  const handleClaimReward = useCallback((questId: string) => {
    const ranger = RANGERS.find(r => r.quests.some(q => q.id === questId))
    const quest = ranger?.quests.find(q => q.id === questId)
    if (quest) {
      const coins = 25 + quest.reward.xp
      setQuestReward({
        title: quest.title,
        xp: quest.reward.xp,
        coins,
        items: quest.reward.items?.map(i => ({ id: i.id, name: i.name, sprite: i.sprite, quantity: i.quantity })),
      })
    }
    setGameState(prev => {
      if (!quest) return prev

      let newXp = prev.player.xp + quest.reward.xp
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }

      const newInventory = [...prev.player.inventory]
      for (const item of quest.reward.items ?? []) {
        const existing = newInventory.find(i => i.id === item.id)
        if (existing) { existing.quantity += item.quantity }
        else { newInventory.push({ id: item.id, name: item.name, type: item.type, quantity: item.quantity, description: item.description, sprite: item.sprite }) }
      }

      return {
        ...prev,
        player: { ...prev.player, xp: newXp, level: newLevel, maxXp: newMaxXp, coins: (prev.player.coins ?? 0) + 25 + quest.reward.xp, inventory: newInventory },
        questProgress: { ...prev.questProgress, [questId]: { questId, status: 'rewarded', progress: 0 } },
      }
    })
  }, [])

  const handleTrade = useCallback((tradeId: string) => {
    setGameState(prev => {
      const ranger = RANGERS.find(r => r.trades.some(t => t.id === tradeId))
      const trade = ranger?.trades.find(t => t.id === tradeId)
      if (!trade) return prev

      const newInventory = [...prev.player.inventory]
      const giveItem = newInventory.find(i => i.id === trade.give.itemId)
      if (!giveItem || giveItem.quantity < trade.give.quantity) return prev
      giveItem.quantity -= trade.give.quantity

      const receiveItem = newInventory.find(i => i.id === trade.receive.itemId)
      if (receiveItem) { receiveItem.quantity += trade.receive.quantity }
      else {
        newInventory.push({
          id: trade.receive.itemId, name: trade.receive.itemName,
          type: trade.receive.type, quantity: trade.receive.quantity,
          description: trade.receive.description, sprite: trade.receive.sprite,
        })
      }

      return { ...prev, player: { ...prev.player, inventory: newInventory } }
    })
  }, [])

  const handleCraft = useCallback((recipeId: string) => {
    setGameState(prev => {
      const recipe = RECIPES.find(r => r.id === recipeId)
      if (!recipe || !canCraft(recipe, prev.player.inventory)) return prev

      const newInventory = [...prev.player.inventory]

      // Remove ingredients
      for (const ing of recipe.ingredients) {
        const item = newInventory.find(i => i.id === ing.itemId)
        if (item) item.quantity -= ing.quantity
      }

      // Add result
      const existing = newInventory.find(i => i.id === recipe.result.itemId)
      if (existing) {
        existing.quantity += recipe.result.quantity
      } else {
        newInventory.push({
          id: recipe.result.itemId,
          name: recipe.result.name,
          type: recipe.result.type,
          quantity: recipe.result.quantity,
          description: recipe.result.description,
          sprite: recipe.result.sprite,
        })
      }

      return { ...prev, player: { ...prev.player, inventory: newInventory } }
    })
  }, [])

  const handleImportCreature = useCallback((creature: CapturedCreature) => {
    setGameState(prev => {
      if (prev.player.team.length >= 6) return prev
      return {
        ...prev,
        player: {
          ...prev.player, team: [...prev.player.team, creature],
          catalog: [...new Set([...prev.player.catalog, creature.id])],
          captured: [...new Set([...prev.player.captured, creature.id])],
        },
      }
    })
  }, [])

  const handleTradeRemoveCreature = useCallback((index: number) => {
    setGameState(prev => {
      const newTeam = prev.player.team.filter((_, i) => i !== index)
      return { ...prev, player: { ...prev.player, team: newTeam } }
    })
  }, [])

  // Breeding handlers
  const handleStartBreeding = useCallback((slot: BreedingSlot, _idx1: number, _idx2: number) => {
    setGameState(prev => ({ ...prev, player: { ...prev.player, nursery: slot } }))
  }, [])

  const handleHatchCreature = useCallback((creature: CapturedCreature) => {
    SFX.hatch()
    setPlayerStats(ps => ({ ...ps, totalBreedsCompleted: ps.totalBreedsCompleted + 1 }))
    setGameState(prev => {
      if (prev.player.team.length >= 6) return prev
      return {
        ...prev,
        player: {
          ...prev.player,
          team: [...prev.player.team, creature],
          catalog: [...new Set([...prev.player.catalog, creature.id])],
          captured: [...new Set([...prev.player.captured, creature.id])],
          nursery: null,
        },
      }
    })
  }, [])

  const handleCancelBreeding = useCallback(() => {
    setGameState(prev => ({ ...prev, player: { ...prev.player, nursery: null } }))
  }, [])

  const handleFishCatch = useCallback((fish: FishDef) => {
    SFX.capture()
    setPlayerStats(ps => ({ ...ps, totalFishCaught: (ps.totalFishCaught ?? 0) + 1 }))
    setDailyState(ds => updateChallengeProgress(ds, 'fish'))
    setFishLog(prev => [...new Set([...prev, fish.id])])
    setGameState(prev => {
      let newXp = prev.player.xp + fish.xpReward
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }
      return {
        ...prev,
        player: { ...prev.player, xp: newXp, level: newLevel, maxXp: newMaxXp, coins: (prev.player.coins ?? 0) + fish.xpReward },
      }
    })
  }, [])

  // Accept trainer challenge → go to ranger battle
  const handleAcceptTrainer = useCallback(() => {
    if (!pendingTrainer) return
    // Create a temporary ranger from the roaming trainer
    setGameState(prev => ({
      ...prev,
      screen: 'ranger_battle',
      activeRangerId: pendingTrainer.id,
    }))
  }, [pendingTrainer])

  // Decline trainer challenge
  const handleDeclineTrainer = useCallback(() => {
    SFX.flee()
    setPendingTrainer(null)
    setGameState(prev => ({
      ...prev,
      screen: 'world',
      encounterCooldown: 8,
    }))
  }, [])

  // After winning a roaming trainer battle
  const handleTrainerBattleWin = useCallback((xp: number) => {
    SFX.victory()
    const trainer = pendingTrainer
    if (trainer) {
      setDefeatedTrainers(prev => [...prev, trainer.id])
      // Resettable after 5 defeats total (so they can be re-battled)
      setDefeatedTrainers(prev => prev.length > 20 ? prev.slice(-10) : prev)
    }
    setPlayerStats(ps => ({
      ...ps,
      totalBattlesWon: ps.totalBattlesWon + 1,
      rangerBattlesWon: (ps.rangerBattlesWon ?? 0) + 1,
    }))
    setGameState(prev => {
      let newXp = prev.player.xp + xp
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }

      // Add reward item if trainer has one
      const newInventory = [...prev.player.inventory]
      if (trainer?.rewardItem) {
        const existing = newInventory.find(i => i.id === trainer.rewardItem!.id)
        if (existing) {
          existing.quantity += trainer.rewardItem.quantity
        } else {
          newInventory.push({
            id: trainer.rewardItem.id,
            name: trainer.rewardItem.name,
            type: trainer.rewardItem.type,
            quantity: trainer.rewardItem.quantity,
            description: trainer.rewardItem.description,
            sprite: trainer.rewardItem.sprite,
          })
        }
      }

      // Check evolutions for all team members
      const newTeam = [...prev.player.team]
      let evoData: typeof pendingEvolution = null
      for (let i = 0; i < newTeam.length; i++) {
        const member = { ...newTeam[i] }
        member.xp += Math.floor(xp * (i === 0 ? 1 : 0.5))
        if (member.xp >= member.level * 50) {
          member.xp = 0
          member.level++
          member.stats = {
            ...member.stats,
            maxHp: member.stats.maxHp + 3,
            hp: Math.min(member.stats.hp + 3, member.stats.maxHp + 3),
            attack: member.stats.attack + 2,
            defense: member.stats.defense + 1,
            speed: member.stats.speed + 1,
          }
          const evo = getEvolution(member.id, member.level)
          if (evo) {
            const beforeEvo = { ...member }
            const evolved = evolveCreature(member, evo)
            if (!evoData) {
              evoData = { from: beforeEvo, to: evolved, description: evo.description, teamIndex: i }
            }
            newTeam[i] = evolved
          } else {
            newTeam[i] = member
          }
        } else {
          newTeam[i] = member
        }
      }

      if (evoData) {
        pendingEvolutionRef.current = evoData
        setPlayerStats(ps2 => ({ ...ps2, totalEvolutions: ps2.totalEvolutions + 1 }))
        SFX.evolution()
        setTimeout(() => {
          if (pendingEvolutionRef.current) {
            setPendingEvolution(pendingEvolutionRef.current)
            pendingEvolutionRef.current = null
          }
        }, 100)
      }

      return {
        ...prev,
        screen: 'world',
        activeRangerId: null,
        player: { ...prev.player, xp: newXp, level: newLevel, maxXp: newMaxXp, coins: (prev.player.coins ?? 0) + 30 + newLevel * 3, team: newTeam, inventory: newInventory },
      }
    })
    setPendingTrainer(null)
  }, [pendingTrainer])

  // Manual evolution from team screen
  const handleManualEvolve = useCallback((teamIndex: number) => {
    setGameState(prev => {
      const creature = prev.player.team[teamIndex]
      if (!creature) return prev
      const evo = getEvolution(creature.id, creature.level)
      if (!evo) return prev

      const beforeEvo = { ...creature }
      const evolved = evolveCreature(creature, evo)
      const newTeam = [...prev.player.team]
      newTeam[teamIndex] = evolved

      pendingEvolutionRef.current = { from: beforeEvo, to: evolved, description: evo.description, teamIndex }
      setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
      SFX.evolution()
      setTimeout(() => {
        if (pendingEvolutionRef.current) {
          setPendingEvolution(pendingEvolutionRef.current)
          pendingEvolutionRef.current = null
        }
      }, 100)

      return {
        ...prev,
        player: { ...prev.player, team: newTeam },
      }
    })
  }, [])

  // Adoption center handlers
  const handleReleaseFromTeam = useCallback((index: number) => {
    setGameState(prev => {
      if (index === 0 || prev.player.team.length <= 1) return prev
      return { ...prev, player: { ...prev.player, team: prev.player.team.filter((_, i) => i !== index) } }
    })
  }, [])

  const handleSwapFromReserve = useCallback((reserveIndex: number, teamIndex: number) => {
    setGameState(prev => {
      const newTeam = [...prev.player.team]
      const newReserves = [...prev.player.reserves]
      const swapped = newTeam[teamIndex]
      newTeam[teamIndex] = newReserves[reserveIndex]
      newReserves[reserveIndex] = swapped
      return { ...prev, player: { ...prev.player, team: newTeam, reserves: newReserves } }
    })
  }, [])

  const handleAdoptFromReserve = useCallback((reserveIndex: number) => {
    setGameState(prev => {
      if (prev.player.team.length >= 6) return prev
      const creature = prev.player.reserves[reserveIndex]
      return {
        ...prev,
        player: {
          ...prev.player,
          team: [...prev.player.team, creature],
          reserves: prev.player.reserves.filter((_, i) => i !== reserveIndex),
        },
      }
    })
  }, [])

  const handleReleaseFromReserve = useCallback((reserveIndex: number) => {
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, reserves: prev.player.reserves.filter((_, i) => i !== reserveIndex) },
    }))
  }, [])

  // Alcatraz escape handlers
  const handleAlcatrazBattle = useCallback((creature: Creature) => {
    setGameState(prev => ({
      ...prev,
      screen: 'battle' as const,
      battle: {
        active: true,
        wildCreature: creature,
        playerCreature: prev.player.team[0],
        turn: 'player' as const,
        log: [],
        captureChance: 0,
      },
    }))
  }, [])

  const handleAlcatrazComplete = useCallback((rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => {
    setAlcatrazEscapeActive(false)
    setAlcatrazCompleted(true)
    try { localStorage.setItem('bioquest-bay-alcatraz-escaped', 'true') } catch { /* ignore */ }
    setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1 }))
    setGameState(prev => {
      let newXp = prev.player.xp + rewards.xp
      let newLevel = prev.player.level
      let newMaxXp = prev.player.maxXp
      while (newXp >= newMaxXp) { newXp -= newMaxXp; newLevel++; newMaxXp = Math.floor(newMaxXp * 1.3) }
      const newInventory = [...prev.player.inventory]
      if (rewards.item) {
        const existing = newInventory.find(i => i.id === rewards.item!.id)
        if (existing) { existing.quantity += rewards.item.quantity }
        else { newInventory.push({ ...rewards.item }) }
      }
      return {
        ...prev,
        screen: 'world',
        player: { ...prev.player, xp: newXp, level: newLevel, maxXp: newMaxXp, inventory: newInventory },
      }
    })
  }, [])

  // Fusion handler
  const handleFusion = useCallback((idx1: number, idx2: number, result: CapturedCreature) => {
    setGameState(prev => {
      const newTeam = prev.player.team.filter((_, i) => i !== idx1 && i !== idx2)
      newTeam.push(result)
      const newCaptured = prev.player.captured.includes(result.id)
        ? prev.player.captured : [...prev.player.captured, result.id]
      const newCatalog = prev.player.catalog.includes(result.id)
        ? prev.player.catalog : [...prev.player.catalog, result.id]
      return {
        ...prev,
        screen: 'world' as const,
        player: { ...prev.player, team: newTeam, captured: newCaptured, catalog: newCatalog },
      }
    })
  }, [])

  // Diving handlers
  const handleDiveEncounter = useCallback((creature: Creature) => {
    setGameState(prev => {
      if (!prev.player.team[0]) return prev
      return {
        ...prev,
        screen: 'battle' as const,
        battle: {
          active: true,
          wildCreature: creature,
          playerCreature: prev.player.team[0],
          turn: 'player' as const,
        log: [],
        captureChance: 0,
      },
    }})
  }, [])

  const handleDiveCollect = useCallback((item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => {
    setGameState(prev => {
      const newInventory = [...prev.player.inventory]
      const existing = newInventory.find(i => i.id === item.id)
      if (existing) { existing.quantity += item.quantity }
      else { newInventory.push({ ...item, sprite: item.sprite || '📦', description: item.description }) }
      return { ...prev, player: { ...prev.player, inventory: newInventory } }
    })
  }, [])

  const handleFastTravel = useCallback((x: number, y: number, subregion: string) => {
    const isExplored = exploredTiles.has(`${x},${y}`)
    const subregionVisited = playerStats.uniqueSubregionsVisited.includes(subregion)
    if (!isExplored && !subregionVisited) return
    setBoatAnimating(true)
    SFX.step()
    setTimeout(() => {
      setGameState(prev => {
        const tile = map[y]?.[x]
        return {
          ...prev,
          player: { ...prev.player, x, y },
          currentSubregion: subregion,
          currentBiome: tile?.biome ?? prev.currentBiome,
        }
      })
      // Reveal tiles around destination
      setExploredTiles(prev => {
        const next = new Set(prev)
        const revealR = 5
        for (let ry = -revealR; ry <= revealR; ry++) {
          for (let rx = -revealR; rx <= revealR; rx++) {
            if (rx * rx + ry * ry > revealR * revealR) continue
            next.add(`${x + rx},${y + ry}`)
          }
        }
        return next
      })
      setBoatAnimating(false)
    }, 1500)
  }, [map, exploredTiles, playerStats.uniqueSubregionsVisited])

  // Backward compat fixer for loaded saves
  function applyBackwardCompat(saved: GameState): GameState {
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

  // Title screen
  if (gameState.screen === 'title') {
    return (
      <TitleScreen
        onLoadSlot={(slot) => {
          setActiveSlot(slot)
          const saved = loadGame(slot)
          if (saved) {
            const loaded = { ...applyBackwardCompat(saved), screen: 'world' as const }
            setGameState(loaded)
            tutorialFlagsRef.current = new Set(loaded.tutorialFlags ?? [])
            const stats = loadStats(slot)
            if (stats) setPlayerStats({ ...createInitialStats(), ...stats })
            setExploredTiles(loadExplored(slot))
            setBayDexAck(loadBayDexAck(slot))
          }
        }}
        onNewGame={(slot) => {
          setActiveSlot(slot)
          clearSave(slot)
          setExploredTiles(new Set())
          setPlayerStats(createInitialStats())
          tutorialFlagsRef.current = new Set()
          setShowTutorialDialog(false)
          const fresh = createInitialState()
          setGameState({ ...fresh, screen: 'starter' })
          setBayDexAck([])
        }}
        onDeleteSlot={(slot) => {
          clearSave(slot)
        }}
      />
    )
  }

  // Starter selection screen
  if (gameState.screen === 'starter') {
    return (
      <StarterSelect
        onSelect={(creature) => {
          const tile = map[gameState.player.y]?.[gameState.player.x]
          setGameState(prev => ({
            ...prev,
            screen: 'world',
            player: {
              ...prev.player,
              team: [{ ...creature, happiness: 70 }],
              catalog: [creature.id],
              captured: [creature.id],
            },
            currentBiome: tile?.biome ?? 'grassland',
            currentSubregion: tile?.subregion ?? '',
          }))
        }}
      />
    )
  }

  return (
    <div className="w-full h-screen bg-[#0e1a2e] relative overflow-hidden select-none">
      <IsometricRenderer map={memoizedMap} playerX={gameState.player.x} playerY={gameState.player.y} rangers={rangerPositions} timeOfDay={gameState.timeOfDay} weather={gameState.weather} gameMinutes={gameState.gameMinutes} />
      <DayNightSky gameMinutes={gameState.gameMinutes} gameDay={gameState.gameDay ?? 75} />
      <NightAtmosphere timeOfDay={gameState.timeOfDay} gameMinutes={gameState.gameMinutes} />
      <WeatherEffects weather={gameState.weather} timeOfDay={gameState.timeOfDay} />
      <BiomeTransition biome={gameState.currentBiome} />

      {/* Border crossing tint overlay */}
      {borderPeek && (
        <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
          style={{
            background: borderPeek.state === 'Oregon' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(34,197,94,0.12) 100%)'
              : borderPeek.state === 'Nevada' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(234,179,8,0.12) 100%)'
              : borderPeek.state === 'Arizona' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.1) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(168,85,247,0.1) 100%)',
          }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'notif-enter 0.5s ease-out', opacity: borderPeek.stepsLeft === 2 ? 1 : 0, transition: 'opacity 0.8s' }}>
            <div className="rounded-xl px-6 py-3 text-center"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
              <div className="text-[10px] tracking-[0.2em] text-white/50 font-bold">NOW ENTERING</div>
              <div className="text-xl font-black text-white mt-0.5">{borderPeek.state.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}
      <BiomeParticles biome={gameState.currentBiome} timeOfDay={gameState.timeOfDay} weather={gameState.weather} />
      <WalkParticles playerX={gameState.player.x} playerY={gameState.player.y} biome={gameState.currentBiome} />
      <CreatureFootprints map={memoizedMap} playerX={gameState.player.x} playerY={gameState.player.y} currentBiome={gameState.currentBiome} />
      <TutorialTip tip={tutorialTip} onDismiss={() => setTutorialTip(null)} />
      <Minimap map={memoizedMap} playerX={gameState.player.x} playerY={gameState.player.y} journal={gameState.player.journal} exploredTiles={exploredTiles} rangers={rangerPositions} onFastTravel={handleFastTravel} timeOfDay={gameState.timeOfDay} weather={gameState.weather} activeEvent={worldEvents.activeEvent} />

      <GameHUD
        player={gameState.player}
        currentBiome={gameState.currentBiome}
        currentSubregion={gameState.currentSubregion}
        timeOfDay={gameState.timeOfDay}
        weather={gameState.weather}
        gameMinutes={gameState.gameMinutes}
        gameDay={gameState.gameDay ?? 75}
        onOpenCatalog={() => setGameState(prev => ({ ...prev, screen: 'catalog' }))}
        onOpenTeam={() => setGameState(prev => ({ ...prev, screen: 'inventory' }))}
        onOpenJournal={() => setGameState(prev => ({ ...prev, screen: 'journal' }))}
        onOpenTrade={() => setGameState(prev => ({ ...prev, screen: 'trade' }))}
        bayDexNewCount={bayDexNewCount}
        onOpenBayDex={() => {
          setGameState(prev => ({ ...prev, screen: 'baydex' }))
          const ids = gameState.player.catalog
          setBayDexAck(ids)
          saveBayDexAck(activeSlot, ids)
        }}
        onOpenBreeding={() => setGameState(prev => ({ ...prev, screen: 'breeding' }))}
        onOpenQuestLog={() => setGameState(prev => ({ ...prev, screen: 'questlog' }))}
        onMove={movePlayer}
        onOpenCrafting={() => setGameState(prev => ({ ...prev, screen: 'crafting' }))}
        onOpenAchievements={() => setGameState(prev => ({ ...prev, screen: 'achievements' }))}
        onOpenHabitatMap={() => setGameState(prev => ({ ...prev, screen: 'habitat_map' }))}
        onOpenAdoption={() => setGameState(prev => ({ ...prev, screen: 'adoption' }))}
        onOpenLeaderboard={() => setGameState(prev => ({ ...prev, screen: 'leaderboard' }))}
        onOpenFusion={() => setGameState(prev => ({ ...prev, screen: 'fusion' }))}
        onOpenDiving={() => {
          const tile = map[gameState.player.y]?.[gameState.player.x]
          if (tile?.biome === 'water' || tile?.biome === 'beach') {
            setGameState(prev => ({ ...prev, screen: 'diving' }))
          }
        }}
        onOpenShop={() => setGameState(prev => ({ ...prev, screen: 'shop' }))}
        onOpenDailyChallenges={() => setGameState(prev => ({ ...prev, screen: 'daily_challenges' }))}
        onOpenArena={() => setGameState(prev => ({ ...prev, screen: 'arena' }))}
        onOpenMoveTutor={() => setGameState(prev => ({ ...prev, screen: 'move_tutor' }))}
        onOpenMigrationCalendar={() => setShowMigrationCalendar(true)}
        onOpenFieldNotes={() => setShowFieldNotes(true)}
        onOpenTrophyRoom={() => setShowTrophyRoom(true)}
        dailyClaimable={getClaimableCount(dailyState)}
        achievementCount={unlockedAchievements.length}
        totalAchievements={20}
        activeQuestCount={RANGERS.reduce((n, r) => n + r.quests.filter(q => gameState.questProgress[q.id]?.status === 'active').length, 0)}
        onToggleFastTravel={() => { setShowFastTravel(v => !v); setShowHotkeys(false) }}
        onToggleHotkeys={() => { setShowHotkeys(v => !v); setShowFastTravel(false) }}
        showFastTravel={showFastTravel}
        showHotkeys={showHotkeys}
      />

      {gameState.screen === 'world' && (
        <QuestTracker
          questProgress={gameState.questProgress}
          player={gameState.player}
          onOpenQuestLog={() => setGameState(prev => ({ ...prev, screen: 'questlog' }))}
        />
      )}

      {/* World event banner */}
      {gameState.screen === 'world' && (
        <WorldEventBanner activeEvent={worldEvents.activeEvent} remainingMinutes={worldEvents.remainingMinutes} dismissed={worldEvents.dismissed} dismiss={worldEvents.dismiss} currentSubregion={gameState.currentSubregion} />
      )}

      {/* State border message */}
      {gameState.screen === 'world' && borderMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[320px]">
          <div className="rounded-xl p-2 sm:p-3 border shadow-lg text-center text-xs sm:text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
              borderColor: 'rgba(251,191,36,0.35)',
              backdropFilter: 'blur(12px)',
              color: '#92400e',
              animation: 'notif-enter 0.3s ease-out',
            }}>
            🚧 {borderMessage}
          </div>
        </div>
      )}

      {/* Border peek counter */}
      {gameState.screen === 'world' && borderPeek && (
        <div className="absolute top-12 right-3 z-30">
          <div className="rounded-lg px-3 py-2 text-xs font-bold"
            style={{
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              backdropFilter: 'blur(8px)',
              color: '#dc2626',
            }}>
            ⚠️ {borderPeek.state} — {borderPeek.stepsLeft} step{borderPeek.stepsLeft !== 1 ? 's' : ''} left
          </div>
        </div>
      )}

      {/* Border signpost */}
      {gameState.screen === 'world' && nearbySignpost && !borderMessage && (
        <div className="absolute bottom-20 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[300px]">
          <div className="rounded-xl p-2 sm:p-3 border shadow-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(6,95,70,0.9), rgba(4,120,87,0.85))',
              borderColor: 'rgba(251,191,36,0.5)',
              backdropFilter: 'blur(12px)',
            }}>
            <div className="text-[10px] tracking-widest text-emerald-300 font-bold mb-1">WELCOME TO CALIFORNIA</div>
            <div className="text-sm font-bold text-white">{nearbySignpost.message}</div>
            <div className="text-[11px] text-emerald-200 mt-1.5 italic">{nearbySignpost.fact}</div>
          </div>
        </div>
      )}

      {/* Post-capture notification */}
      {gameState.screen === 'world' && captureNotif && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[300px]">
          <style>{`
            @keyframes notif-enter {
              0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes notif-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
          <div className="rounded-xl p-3 border shadow-lg" style={{
            background: captureNotif.isNewSpecies
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,211,238,0.1))'
              : 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,197,94,0.06))',
            borderColor: captureNotif.isNewSpecies
              ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: captureNotif.isNewSpecies
              ? '0 0 30px rgba(74,222,128,0.15), 0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'notif-enter 0.4s ease-out',
          }}>
            {/* New species / variant badge */}
            {(captureNotif.isNewSpecies || captureNotif.creature.isAlpha || captureNotif.creature.isShiny) && (
              <div className="text-center mb-2">
                <span className="text-[9px] font-black uppercase tracking-[3px] px-3 py-0.5 rounded-full" style={{
                  background: captureNotif.creature.isShiny
                    ? 'linear-gradient(90deg, #c084fc, #e879f9, #c084fc)'
                    : captureNotif.creature.isAlpha
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #22d3ee, #4ade80, #22d3ee)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'notif-shimmer 2s linear infinite',
                }}>
                  {captureNotif.creature.isShiny ? '✨ Shiny Catch!'
                    : captureNotif.creature.isAlpha ? '⭐ Alpha Catch!'
                    : 'New WildDex Entry!'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Creature sprite */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{
                background: captureNotif.creature.isShiny ? 'rgba(192,132,252,0.12)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.12)' : `${captureNotif.creature.color}15`,
                border: `1px solid ${captureNotif.creature.isShiny ? 'rgba(192,132,252,0.3)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.3)' : `${captureNotif.creature.color}30`}`,
                boxShadow: (captureNotif.isNewSpecies || captureNotif.creature.isAlpha || captureNotif.creature.isShiny) ? `0 0 12px ${captureNotif.creature.isShiny ? 'rgba(192,132,252,0.2)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.2)' : `${captureNotif.creature.color}20`}` : 'none',
                filter: captureNotif.creature.isShiny ? 'hue-rotate(180deg) saturate(1.3)' : 'none',
              }}>
                {captureNotif.creature.sprite}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs font-bold">{captureNotif.creature.name}</span>
                  <span className="text-[8px] px-1.5 py-px rounded-full" style={{
                    background: captureNotif.creature.rarity === 'legendary' ? 'rgba(192,132,252,0.15)' :
                      captureNotif.creature.rarity === 'rare' ? 'rgba(251,191,36,0.15)' :
                      captureNotif.creature.rarity === 'uncommon' ? 'rgba(96,165,250,0.15)' : 'rgba(156,163,175,0.15)',
                    color: captureNotif.creature.rarity === 'legendary' ? '#c084fc' :
                      captureNotif.creature.rarity === 'rare' ? '#fbbf24' :
                      captureNotif.creature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af',
                  }}>{captureNotif.creature.rarity}</span>
                </div>
                <p className="text-white/40 text-[9px] mt-0.5">
                  {captureNotif.teamFull
                    ? 'Team full — stored in reserves'
                    : 'Added to your team!'}
                </p>
                <p className="text-white/25 text-[8px]">
                  {gameState.player.captured.length}/{56} species documented
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nickname prompt after capture */}
      {gameState.screen === 'world' && nicknamePrompt && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }} onClick={() => setNicknamePrompt(null)} />
          <div className="relative rounded-xl p-4 w-[260px] border shadow-lg" style={{
            background: 'linear-gradient(135deg, rgba(10,22,40,0.97), rgba(8,16,30,0.98))',
            borderColor: 'rgba(74,222,128,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'notif-enter 0.3s ease-out',
          }}>
            <div className="text-center mb-3">
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-3xl mb-2" style={{
                background: `${nicknamePrompt.creature.color}12`,
                border: `1px solid ${nicknamePrompt.creature.color}25`,
                filter: nicknamePrompt.creature.isShiny ? 'hue-rotate(180deg) saturate(1.3)' : 'none',
              }}>
                {nicknamePrompt.creature.sprite}
              </div>
              <p className="text-white/50 text-[10px]">Give a nickname to</p>
              <p className="text-white font-bold text-sm">{nicknamePrompt.creature.name}</p>
            </div>
            <input
              type="text"
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value.slice(0, 16))}
              placeholder="Enter nickname..."
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none mb-3"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const name = nicknameInput.trim()
                  if (name) {
                    setGameState(prev => ({
                      ...prev,
                      player: {
                        ...prev.player,
                        team: prev.player.team.map((c, i) =>
                          i === nicknamePrompt.teamIndex ? { ...c, nickname: name } : c
                        ),
                      },
                    }))
                  }
                  setNicknamePrompt(null)
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNicknamePrompt(null)}
                className="flex-1 px-3 py-1.5 rounded-lg text-[10px] text-white/40 transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Skip
              </button>
              <button
                disabled={!nicknameInput.trim()}
                onClick={() => {
                  const name = nicknameInput.trim()
                  if (name) {
                    setGameState(prev => ({
                      ...prev,
                      player: {
                        ...prev.player,
                        team: prev.player.team.map((c, i) =>
                          i === nicknamePrompt.teamIndex ? { ...c, nickname: name } : c
                        ),
                      },
                    }))
                  }
                  setNicknamePrompt(null)
                }}
                className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-30"
                style={{
                  background: 'rgba(74,222,128,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.25)',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fishing prompt near water */}
      {gameState.screen === 'world' && !nearbyRangerId && !nearbyDock && (() => {
        const px = gameState.player.x
        const py = gameState.player.y
        const nearWater = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
          const t = map[py+dy]?.[px+dx]
          return t && t.biome === 'water'
        }) || map[py]?.[px]?.biome === 'beach' || map[py]?.[px]?.biome === 'marsh'
        if (!nearWater) return null
        return (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-sky-500/20">
              <p className="text-sky-300/60 text-[9px] font-medium whitespace-nowrap">
                🎣 Press F to fish
              </p>
            </div>
          </div>
        )
      })()}

      {/* Encounter transition */}
      {gameState.screen === 'encounter' && gameState.battle.wildCreature && (
        <EncounterTransition
          creature={gameState.battle.wildCreature}
          biome={gameState.currentBiome}
          timeOfDay={gameState.timeOfDay}
          onComplete={handleEncounterComplete}
        />
      )}

      {/* Battle overlay */}
      {gameState.screen === 'battle' && gameState.battle.wildCreature && gameState.player.team[0] && (
        <BattleScreen
          wildCreature={gameState.battle.wildCreature}
          playerCreature={gameState.player.team[0]}
          team={gameState.player.team}
          inventory={gameState.player.inventory}
          weather={gameState.weather}
          timeOfDay={gameState.timeOfDay}
          mood={encounterMood}
          encounterType={encounterType}
          onWin={handleBattleWin}
          onLose={handleBattleLose}
          onCapture={handleCapture}
          onFlee={handleFlee}
          onUseItem={handleUseItem}
          onSwitch={handleBattleSwitch}
          onFriendlyGift={handleFriendlyGift}
          onCreatureFled={handleCreatureFled}
          biome={gameState.currentBiome}
          subregion={gameState.currentSubregion}
        />
      )}

      {gameState.screen === 'catalog' && (
        <div className="menu-screen-enter">
        <CatalogScreen catalogSeen={gameState.player.catalog} catalogCaptured={gameState.player.captured} onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))} />
        </div>
      )}

      {gameState.screen === 'baydex' && (
        <div className="menu-screen-enter">
        <BayDex catalogSeen={gameState.player.catalog} catalogCaptured={gameState.player.captured} defaultSelectedId={gameState.player.team[0]?.id ?? null} playerTeam={gameState.player.team} onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))} />
        </div>
      )}

      {gameState.screen === 'inventory' && (
        <div className="menu-screen-enter">
        <TeamScreen team={gameState.player.team} inventory={gameState.player.inventory} coins={gameState.player.coins ?? 0} onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))} onSwapLead={handleSwapLead} onNickname={(idx, name) => {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              team: prev.player.team.map((c, i) => i === idx ? { ...c, nickname: name } : c),
            },
          }))
        }} onEvolve={handleManualEvolve} onHealAll={() => {
          setGameState(prev => {
            if ((prev.player.coins ?? 0) < 50) return prev
            return {
              ...prev,
              player: {
                ...prev.player,
                coins: (prev.player.coins ?? 0) - 50,
                team: prev.player.team.map(c => ({ ...c, stats: { ...c.stats, hp: c.stats.maxHp } })),
              },
            }
          })
        }} onAssignHeldItem={(creatureIdx, itemId) => {
          setGameState(prev => {
            const creature = prev.player.team[creatureIdx]
            if (!creature) return prev
            const previouslyHeld = creature.heldItem ?? null
            // Build new inventory: refund previous, consume new
            const newInventory = prev.player.inventory.map(it => ({ ...it }))
            if (previouslyHeld) {
              const existing = newInventory.find(it => it.id === previouslyHeld)
              if (existing) {
                existing.quantity += 1
              } else {
                // Look up the held item def to recreate the inventory entry
                // (could happen if the user used the last copy and we filtered the slot)
                const meta = HELD_ITEMS[previouslyHeld]
                if (meta) {
                  newInventory.push({
                    id: meta.id,
                    name: meta.name,
                    type: 'held',
                    quantity: 1,
                    description: meta.description,
                    sprite: meta.sprite,
                  })
                }
              }
            }
            if (itemId) {
              const slot = newInventory.find(it => it.id === itemId)
              if (!slot || slot.quantity < 1) return prev
              slot.quantity -= 1
            }
            // Drop empty held-item slots so they don't show as "x0"
            const filteredInventory = newInventory.filter(it => it.quantity > 0 || it.type !== 'held')
            const newTeam = prev.player.team.map((c, i) => i === creatureIdx ? { ...c, heldItem: itemId ?? undefined } : c)
            return { ...prev, player: { ...prev.player, inventory: filteredInventory, team: newTeam } }
          })
        }} onPetCreature={(idx) => {
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              team: prev.player.team.map((c, i) => i === idx ? adjustHappiness(c, PET_GAIN) : c),
            },
          }))
        }} onUseHealItem={(itemId, creatureIndex) => {
          setGameState(prev => {
            const item = prev.player.inventory.find(i => i.id === itemId)
            if (!item || item.quantity <= 0) return prev
            const target = prev.player.team[creatureIndex]
            if (!target) return prev
            if (target.stats.hp >= target.stats.maxHp) return prev

            const { hp, fullHeal } = getHealAmount(itemId)
            const newHp = fullHeal ? target.stats.maxHp : Math.min(target.stats.maxHp, target.stats.hp + hp)
            if (newHp <= target.stats.hp) return prev

            const newInventory = prev.player.inventory
              .map(it => it.id === itemId ? { ...it, quantity: it.quantity - 1 } : it)
              .filter(it => it.quantity > 0 || it.type === 'held')
            const newTeam = prev.player.team.map((c, i) =>
              i === creatureIndex ? { ...c, stats: { ...c.stats, hp: newHp } } : c
            )
            return { ...prev, player: { ...prev.player, inventory: newInventory, team: newTeam } }
          })
        }} />
        </div>
      )}

      {gameState.screen === 'journal' && (
        <div className="menu-screen-enter">
        <FieldJournal journal={gameState.player.journal} currentSubregion={gameState.currentSubregion} onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))} weatherAlmanac={gameState.weatherAlmanac} currentWeather={gameState.weather} gameDay={gameState.gameDay} visitedLandmarks={gameState.visitedLandmarks} />
        </div>
      )}

      {gameState.screen === 'breeding' && (
        <div className="menu-screen-enter">
        <BreedingScreen
          team={gameState.player.team} nursery={gameState.player.nursery}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onStartBreeding={handleStartBreeding} onHatch={handleHatchCreature} onCancelBreeding={handleCancelBreeding}
        />
        </div>
      )}

      {/* Interaction prompts — priority matches the Space-key handler:
          dock > BART > surf > ranger > boardwalk */}
      {gameState.screen === 'world' && nearbyDock && !boatAnimating && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-sky-400/30 animate-pulse">
            <p className="text-sky-300 text-sm sm:text-xl font-medium">
              ⛴ Press Space to sail to {nearbyDock.destinationName}
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && nearbyBartStation && !nearbyDock && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-yellow-400/30 animate-pulse">
            <p className="text-yellow-300 text-sm sm:text-xl font-medium">
              🚇 Press Space to enter {nearbyBartStation.name} BART Station
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && atSteamerLane && !nearbyDock && !nearbyBartStation && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-cyan-400/30 animate-pulse">
            <p className="text-cyan-300 text-sm sm:text-xl font-medium">
              🏄 Press Space to surf Steamer Lane
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && atBoardwalk && !nearbyDock && !nearbyBartStation && !atSteamerLane && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-amber-400/30 animate-pulse">
            <p className="text-amber-300 text-sm sm:text-xl font-medium">
              🎡 Press Space to enter the Boardwalk
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && nearbyRangerId && !nearbyDock && !nearbyBartStation && !atSteamerLane && !atBoardwalk && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-emerald-500/30 animate-pulse">
            <p className="text-emerald-300 text-sm sm:text-xl font-medium">
              Press Space to talk to {RANGERS.find(r => r.id === nearbyRangerId)?.name}
            </p>
          </div>
        </div>
      )}

      {/* Hotkey legend & fast travel panels — anchored to bottom-left */}
      {gameState.screen === 'world' && (showHotkeys || showFastTravel) && (
        <div className="absolute bottom-16 sm:bottom-4 left-2 sm:left-4 z-30">
          {showHotkeys && (
            <div
              className="rounded-xl p-3 min-w-[200px]"
              style={{
                background: 'rgba(0,0,0,0.75)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'menu-spring-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-2">Keyboard</div>
              <div className="space-y-1 text-[10px]">
                {[
                  { keys: ['WASD', '↑↓←→'], label: 'Move' },
                  { keys: ['Space'], label: 'Interact / Talk' },
                  { keys: ['F'], label: 'Fish (near water)' },
                  { keys: ['C'], label: 'Catalog' },
                  { keys: ['B'], label: 'WildDex' },
                  { keys: ['J'], label: 'Journal' },
                  { keys: ['Q'], label: 'Quests' },
                  { keys: ['T'], label: 'Trade' },
                  { keys: ['N'], label: 'Nursery' },
                  { keys: ['R'], label: 'Craft' },
                  { keys: ['H'], label: 'Habitats' },
                  { keys: ['L'], label: 'Ranks' },
                  { keys: ['M'], label: 'Music toggle' },
                  { keys: ['Esc'], label: 'Back / Close' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <div className="flex gap-1">
                      {row.keys.map(k => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono text-white/70"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-white/55">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showFastTravel && (
            <div
              className="rounded-xl p-3 w-[280px]"
              style={{
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(251,191,36,0.2)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                animation: 'menu-spring-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-amber-400 uppercase tracking-widest font-bold">Fast Travel</div>
                <button
                  onClick={() => setShowFastTravel(false)}
                  className="text-white/30 hover:text-white/60 text-xs"
                  aria-label="Close"
                >✕</button>
              </div>
              <p className="text-[8px] text-white/30 mb-2">Jump to a known location</p>
              <div className="grid grid-cols-1 gap-1 max-h-[280px] overflow-y-auto pr-1">
                {FAST_TRAVEL_DESTINATIONS.map(dest => {
                  const isExplored = exploredTiles.has(`${dest.x},${dest.y}`)
                  const subregionVisited = playerStats.uniqueSubregionsVisited.includes(dest.subregion)
                  const unlocked = isExplored || subregionVisited
                  return (
                    <button
                      key={dest.name}
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return
                        handleFastTravel(dest.x, dest.y, dest.subregion)
                        setShowFastTravel(false)
                      }}
                      className="rounded-lg p-2 text-left transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed group"
                      style={{
                        background: unlocked ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${unlocked ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                      title={unlocked ? `Travel to ${dest.name} — ${dest.description}` : `🔒 Visit this place first to unlock`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none mt-0.5">{unlocked ? dest.emoji : '🔒'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="text-[10px] text-white/80 font-medium truncate">{dest.name}</div>
                            <div className="text-[7px] text-white/25 uppercase tracking-wider flex-shrink-0">{dest.region}</div>
                          </div>
                          <div className="text-[8px] text-white/40 leading-snug mt-0.5 line-clamp-2">
                            {unlocked ? dest.description : 'Visit to unlock'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Landmark info popup */}
      {gameState.screen === 'world' && currentLandmark && !nearbyRangerId && !nearbyDock && (() => {
        const info = LANDMARK_INFO[currentLandmark]
        if (!info) return null
        const lm = getLandmarkAt(gameState.player.x, gameState.player.y)
        return (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10 shadow-xl max-w-[560px]">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl">{lm?.emoji}</span>
                <h3 className="text-white font-bold text-xl">{currentLandmark}</h3>
              </div>
              <p className="text-white/50 text-lg leading-relaxed mb-4">{info.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-base text-white/30 uppercase tracking-wider">Local species</span>
                <div className="flex gap-1">
                  {info.creatures.map((c, i) => (
                    <span key={i} className="text-2xl">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {boatAnimating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-sky-950/80 transition-opacity">
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl animate-bounce">⛴</span>
            <p className="text-sky-200 text-sm font-medium">Sailing across the Bay...</p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {gameState.screen === 'ranger' && gameState.activeRangerId && (() => {
        const ranger = RANGERS.find(r => r.id === gameState.activeRangerId)
        if (!ranger) return null
        const isTutorial = showTutorialDialog && ranger.id === 'ranger-golden-gate'
        return (
          <RangerDialog
            ranger={ranger} questProgress={gameState.questProgress} player={gameState.player}
            onClose={() => {
              setShowTutorialDialog(false)
              setGameState(prev => ({ ...prev, screen: 'world', activeRangerId: null }))
            }}
            onAcceptQuest={handleAcceptQuest} onClaimReward={handleClaimReward} onTrade={handleTrade}
            onChallenge={ranger.battleTeam ? () => handleStartRangerBattle(ranger.id) : undefined}
            defeated={(playerStats.defeatedRangers ?? []).includes(ranger.id)}
            defeatedRangers={playerStats.defeatedRangers ?? []}
            subregionsVisited={playerStats.uniqueSubregionsVisited ?? []}
            timeOfDay={gameState.timeOfDay}
            isTutorial={isTutorial}
            starterName={isTutorial ? gameState.player.team[0]?.name : undefined}
            onTutorialComplete={isTutorial ? () => {
              setShowTutorialDialog(false)
              handleAcceptQuest('tutorial-first-catch')
              setTimeout(() => {
                triggerTutorial('move_hint', 'Use arrow keys or WASD to explore. Follow the paw prints!')
              }, 500)
            } : undefined}
          />
        )
      })()}

      {gameState.screen === 'ranger_battle' && gameState.activeRangerId && (() => {
        // Check if this is a roaming trainer or a regular ranger
        const ranger = RANGERS.find(r => r.id === gameState.activeRangerId)
        if (ranger && ranger.battleTeam) {
          return (
            <RangerBattleScreen
              ranger={ranger}
              playerTeam={gameState.player.team}
              weather={gameState.weather}
              timeOfDay={gameState.timeOfDay}
              onWin={handleRangerBattleWin}
              onLose={handleRangerBattleLose}
              onClose={handleRangerBattleClose}
            />
          )
        }
        // Roaming trainer battle
        if (pendingTrainer) {
          const trainerAsRanger = {
            id: pendingTrainer.id,
            name: pendingTrainer.name,
            title: pendingTrainer.title,
            greeting: pendingTrainer.quote,
            sprite: pendingTrainer.sprite,
            x: 0, y: 0,
            subregion: '',
            quests: [],
            trades: [],
            battleTeam: pendingTrainer.team,
            battleQuote: pendingTrainer.quote,
            defeatQuote: pendingTrainer.defeatQuote,
            battleReward: { xp: pendingTrainer.rewardXp },
          } satisfies import('@/types/game').Ranger
          return (
            <RangerBattleScreen
              ranger={trainerAsRanger}
              playerTeam={gameState.player.team}
              weather={gameState.weather}
              timeOfDay={gameState.timeOfDay}
              onWin={handleTrainerBattleWin}
              onLose={() => { handleRangerBattleLose(); setPendingTrainer(null) }}
              onClose={() => { handleRangerBattleClose(); setPendingTrainer(null) }}
            />
          )
        }
        return null
      })()}

      {gameState.screen === 'trade' && (
        <div className="menu-screen-enter">
        <TradeCenter
          team={gameState.player.team}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onImportCreature={handleImportCreature} onRemoveCreature={handleTradeRemoveCreature}
        />
        </div>
      )}

      {gameState.screen === 'questlog' && (
        <div className="menu-screen-enter">
        <QuestLog
          questProgress={gameState.questProgress}
          player={gameState.player}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
        </div>
      )}

      {gameState.screen === 'fishing' && (
        <FishingScreen
          biome={gameState.currentBiome}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onCatch={handleFishCatch}
          fishLog={fishLog}
        />
      )}

      {gameState.screen === 'habitat_map' && (
        <HabitatMap
          catalogSeen={gameState.player.catalog}
          catalogCaptured={gameState.player.captured}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'trainer_encounter' && pendingTrainer && (
        <TrainerEncounter
          trainer={pendingTrainer}
          onAccept={handleAcceptTrainer}
          onDecline={handleDeclineTrainer}
        />
      )}

      {gameState.screen === 'adoption' && (
        <AdoptionCenter
          team={gameState.player.team}
          reserves={gameState.player.reserves}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onRelease={handleReleaseFromTeam}
          onSwapFromReserve={handleSwapFromReserve}
          onAdoptFromReserve={handleAdoptFromReserve}
          onReleaseFromReserve={handleReleaseFromReserve}
        />
      )}

      {gameState.screen === 'leaderboard' && (
        <div className="menu-screen-enter">
        <Leaderboard
          playerName={playerName}
          playerLevel={gameState.player.level}
          speciesCaught={gameState.player.captured.length}
          totalSpecies={56}
          stats={playerStats}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onRename={handleRenamePlayer}
        />
        </div>
      )}

      {gameState.screen === 'alcatraz_escape' && (
        <AlcatrazEscape
          playerTeam={gameState.player.team}
          playerLevel={gameState.player.level}
          stage={alcatrazStage}
          cellBlockProgress={alcatrazCellProgress}
          onSetStage={setAlcatrazStage}
          onComplete={handleAlcatrazComplete}
          onClose={() => { setAlcatrazEscapeActive(false); setGameState(prev => ({ ...prev, screen: 'world' })) }}
          onStartBattle={handleAlcatrazBattle}
        />
      )}

      {gameState.screen === 'crafting' && (
        <div className="menu-screen-enter">
        <CraftingScreen
          inventory={gameState.player.inventory}
          playerLevel={gameState.player.level}
          onCraft={handleCraft}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
        </div>
      )}

      {gameState.screen === 'achievements' && (
        <div className="menu-screen-enter">
        <AchievementsScreen
          gameState={gameState}
          stats={playerStats}
          unlockedIds={unlockedAchievements}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
        </div>
      )}

      {gameState.screen === 'fusion' && (
        <FusionLab
          team={gameState.player.team}
          onFuse={handleFusion}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'diving' && (
        <DivingMinigame
          playerLevel={gameState.player.level}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onEncounter={handleDiveEncounter}
          onCollect={handleDiveCollect}
          captured={gameState.player.captured}
        />
      )}

      {gameState.screen === 'bart' && (
        <BartSystem
          playerX={gameState.player.x}
          playerY={gameState.player.y}
          playerCoins={gameState.player.coins ?? 0}
          onTravel={(destX, destY, destName, fare) => {
            setGameState(prev => ({
              ...prev,
              screen: 'world',
              player: { ...prev.player, x: destX, y: destY, coins: Math.max(0, (prev.player.coins ?? 0) - fare) },
              currentSubregion: destName,
            }))
          }}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'shop' && (
        <Shop
          coins={gameState.player.coins ?? 0}
          inventory={gameState.player.inventory}
          onBuy={(item, totalPrice) => {
            setGameState(prev => {
              const newInventory = [...prev.player.inventory]
              const existing = newInventory.find(i => i.id === item.id)
              if (existing) {
                existing.quantity += item.quantity
              } else {
                newInventory.push({ ...item })
              }
              return {
                ...prev,
                player: {
                  ...prev.player,
                  coins: Math.max(0, (prev.player.coins ?? 0) - totalPrice),
                  inventory: newInventory,
                },
              }
            })
          }}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'arena' && (
        <ArenaScreen
          team={gameState.player.team}
          weather={gameState.weather}
          timeOfDay={gameState.timeOfDay}
          arenaWins={gameState.arenaWins as Record<ArenaTier, number>}
          onWin={handleArenaWin}
          onLose={handleArenaLose}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'move_tutor' && (
        <MoveTutorScreen
          team={gameState.player.team}
          coins={gameState.player.coins ?? 0}
          onTeachMove={handleTeachMove}
          onLearnAbility={handleLearnAbility}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'daily_challenges' && (
        <DailyChallenges
          dailyState={dailyState}
          onClaimReward={(challengeId) => {
            const { newState, reward } = claimChallengeReward(dailyState, challengeId)
            setDailyState(newState)
            if (reward > 0) {
              setGameState(prev => ({
                ...prev,
                player: { ...prev.player, coins: (prev.player.coins ?? 0) + reward },
              }))
            }
          }}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
        />
      )}

      {gameState.screen === 'surfing' && (
        <SurfingMinigame
          playerLevel={gameState.player.level}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onReward={(item) => {
            setGameState(prev => {
              const existing = prev.player.inventory.find(i => i.name === item.name)
              return {
                ...prev,
                player: {
                  ...prev.player,
                  inventory: existing
                    ? prev.player.inventory.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
                    : [...prev.player.inventory, item],
                },
              }
            })
          }}
          onXp={(amount) => {
            setGameState(prev => ({
              ...prev,
              player: { ...prev.player, xp: prev.player.xp + amount },
            }))
          }}
        />
      )}

      {gameState.screen === 'boardwalk' && (
        <BoardwalkMinigame
          playerLevel={gameState.player.level}
          team={gameState.player.team}
          inventory={gameState.player.inventory}
          onClose={() => setGameState(prev => ({ ...prev, screen: 'world' }))}
          onWinPrize={(item) => {
            setGameState(prev => {
              const existing = prev.player.inventory.find(i => i.name === item.name)
              return {
                ...prev,
                player: {
                  ...prev.player,
                  inventory: existing
                    ? prev.player.inventory.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
                    : [...prev.player.inventory, item],
                },
              }
            })
          }}
          onHealTeam={() => {
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                team: prev.player.team.map(c => ({
                  ...c,
                  stats: { ...c.stats, hp: c.stats.maxHp },
                })),
              },
            }))
          }}
        />
      )}

      {pendingEvolution && (
        <EvolutionScreen
          fromCreature={pendingEvolution.from} toCreature={pendingEvolution.to}
          description={pendingEvolution.description} onComplete={() => setPendingEvolution(null)}
        />
      )}

      {/* Champion victory screen */}
      {showChampion && (
        <ChampionScreen
          playerName={playerName}
          playerLevel={gameState.player.level}
          team={gameState.player.team}
          stats={playerStats}
          isGrand={(playerStats.defeatedRangers ?? []).includes(GRAND_CHAMPION_ID)}
          onClose={() => setShowChampion(false)}
        />
      )}

      {/* Battle reward toast */}
      {gameState.screen === 'world' && battleReward && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60]">
          <style>{`
            @keyframes reward-pop {
              0% { opacity: 0; transform: translateY(10px) scale(0.9); }
              20% { opacity: 1; transform: translateY(0) scale(1); }
              80% { opacity: 1; }
              100% { opacity: 0; transform: translateY(-10px); }
            }
            @keyframes levelup-glow {
              0%, 100% { box-shadow: 0 0 10px rgba(168,85,247,0.3), 0 4px 16px rgba(0,0,0,0.4); }
              50% { box-shadow: 0 0 25px rgba(168,85,247,0.5), 0 0 50px rgba(168,85,247,0.2), 0 4px 16px rgba(0,0,0,0.4); }
            }
            @keyframes levelup-stars {
              0% { opacity: 0; transform: translateY(0) scale(0); }
              40% { opacity: 1; transform: translateY(-15px) scale(1); }
              100% { opacity: 0; transform: translateY(-35px) scale(0.5); }
            }
          `}</style>
          {/* Level-up star particles */}
          {battleReward.levelUp && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute text-sm" style={{
              left: `${10 + i * 12}%`,
              bottom: '100%',
              animation: `levelup-stars 1.5s ease-out ${0.2 + i * 0.1}s forwards`,
              opacity: 0,
            }}>
              {['⭐', '✨', '💫', '🌟'][i % 4]}
            </div>
          ))}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{
              background: battleReward.isBoss
                ? 'linear-gradient(135deg, rgba(100,100,180,0.8), rgba(30,30,80,0.7))'
                : battleReward.levelUp
                  ? 'linear-gradient(135deg, rgba(88,28,135,0.8), rgba(0,0,0,0.7))'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.6))',
              backdropFilter: 'blur(12px)',
              border: battleReward.isBoss
                ? '1px solid rgba(200,200,255,0.4)'
                : battleReward.levelUp
                  ? '1px solid rgba(168,85,247,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
              animation: battleReward.levelUp || battleReward.isBoss
                ? 'reward-pop 3s ease-out forwards, levelup-glow 1s ease-in-out 3'
                : 'reward-pop 3s ease-out forwards',
            }}
          >
            {battleReward.isBoss && (
              <>
                <span className="text-xs font-bold tracking-wider" style={{
                  color: 'rgba(200,210,255,0.9)',
                  textShadow: '0 0 8px rgba(200,210,255,0.4)',
                }}>🌕 BOSS SLAIN</span>
                <span className="text-white/20">|</span>
              </>
            )}
            <span className="text-xs text-emerald-400 font-medium">+{battleReward.xp} XP</span>
            <span className="text-white/20">|</span>
            <span className="text-xs text-yellow-400 font-medium">+{battleReward.coins} 💰</span>
            {battleReward.levelUp && (
              <>
                <span className="text-white/20">|</span>
                <span className="text-xs text-purple-400 font-bold" style={{
                  textShadow: '0 0 10px rgba(168,85,247,0.6)',
                }}>LEVEL UP!</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Achievement toast notification */}
      {achievementToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top duration-300">
          <div className="bg-black/80 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
            <span className="text-lg">{achievementToast.icon}</span>
            <div>
              <p className="text-amber-400 text-[10px] uppercase tracking-wider font-semibold">Achievement Unlocked</p>
              <p className="text-white text-xs font-medium">{achievementToast.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Evolution-ready hint toast */}
      {evolveReadyToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top duration-300">
          <div
            className="backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2.5 shadow-lg"
            style={{
              background: 'rgba(20,10,40,0.85)',
              border: '1px solid rgba(192,132,252,0.4)',
              boxShadow: '0 0 24px rgba(192,132,252,0.25)',
            }}
          >
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(192,132,252,0.8))' }}>
              {evolveReadyToast.sprite}
            </span>
            <div>
              <p className="text-purple-300 text-[10px] uppercase tracking-wider font-bold">✨ Almost Ready to Evolve</p>
              <p className="text-white text-xs font-medium">
                {evolveReadyToast.name} → {evolveReadyToast.toName}
                <span className="text-white/50 ml-1">({evolveReadyToast.gap} {evolveReadyToast.gap === 1 ? 'lvl' : 'lvls'} to go)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quest reward popup */}
      {questReward && (
        <QuestRewardPopup
          questTitle={questReward.title}
          reward={{ xp: questReward.xp, coins: questReward.coins, items: questReward.items?.map(i => ({ ...i, type: 'capture' as const, description: '' })) }}
          onDone={() => setQuestReward(null)}
        />
      )}

      {lunarBoss && (
        <LunarBossPopup
          boss={lunarBoss}
          onReady={handleBossChallenge}
          onFlee={handleBossFlee}
        />
      )}

      {shadowBoss && (
        <ShadowBossPopup
          boss={shadowBoss}
          onReady={handleShadowBossChallenge}
          onFlee={handleBossFlee}
        />
      )}

      {/* Screen transition overlay */}
      {screenTransition !== 'none' && (
        <div className="absolute inset-0 z-[80] pointer-events-none bg-black" style={{
          opacity: screenTransition === 'fade-out' ? 1 : 0,
          transition: screenTransition === 'fade-out' ? 'opacity 0.3s ease-in' : 'opacity 0.4s ease-out',
        }} />
      )}

      <style>{`
        @keyframes menu-spring-in {
          0% { opacity: 0; transform: scale(0.96) translateY(8px); }
          60% { opacity: 1; transform: scale(1.01) translateY(-1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .menu-screen-enter {
          position: absolute;
          inset: 0;
          opacity: 1;
          animation: menu-spring-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Overlay panels — render above everything */}
      {showMigrationCalendar && (
        <MigrationCalendar
          gameDay={gameState.gameDay ?? 75}
          onClose={() => setShowMigrationCalendar(false)}
        />
      )}
      {showFieldNotes && (
        <BiomeFieldNotesPanel
          player={gameState.player}
          onClose={() => setShowFieldNotes(false)}
        />
      )}
      {showTrophyRoom && (
        <BossTrophyRoom
          defeats={gameState.bossDefeats ?? []}
          onClose={() => setShowTrophyRoom(false)}
        />
      )}
      {showConservation && (
        <ConservationPrompt onDismiss={() => {
          setShowConservation(false)
          conservationDismissals.current += 1
          try { localStorage.setItem('bioquest-conservation-dismissed', String(conservationDismissals.current)) } catch {}
        }} />
      )}
      {biokeaPromptOpen && (
        <BiokeaLeaderboardPrompt
          trigger="game-start"
          gameSlug="3d-biodiversity-collect-em-all"
          gameTitle="WildCal"
          defaultHandle={playerName === 'Explorer' ? '' : playerName}
          onSubmit={(result) => {
            handleRenamePlayer(result.handle)
            setBiokeaPromptOpen(false)
          }}
        />
      )}
    </div>
  )
}
