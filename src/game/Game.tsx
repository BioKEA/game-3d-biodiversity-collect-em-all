import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { GameState, Creature, CapturedCreature, MapTile, BreedingSlot } from '@/types/game'

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
import { createInitialState } from './core/state'
import {
  saveGame, loadGame, clearSave, saveStats, loadStats, saveExplored, loadExplored, loadPlayerName, savePlayerName, loadBayDexAck,
  loadAlcatrazEscaped, saveAlcatrazEscaped, loadDefeatedTrainers, saveDefeatedTrainers, loadFishLog, saveFishLog, loadConservationDismissed, saveConservationDismissed,
} from './core/persistence'
import { applyBackwardCompat, runtimeDeps } from './core/state'
import { captureCreature } from './features/capture/logic'
import { applyBattleWin, applyBattleLose, endBattle, applyUseItem, applyBattleSwitch, applyFriendlyGift } from './features/battle/logic'
import { startRangerBattle, applyRangerBattleWin, applyRangerBattleLose, leaveRangerScreen, applyArenaWin, applyArenaLose, applyDeclineTrainer, applyTrainerBattleWin } from './features/trainers/logic'
import { recordRangerDefeat, recordStepStats } from './features/progression/logic'
import { stepPlayer, revealTiles, boatTravel, fastTravel, selectStarter } from './features/world/logic'
import { acceptQuest, claimQuestReward } from './features/quests/logic'
import { applyTrade, importCreature, removeTeamMember } from './features/trade/logic'
import { applyCraft } from './features/crafting/logic'
import { swapLead, teachMove, learnAbility, manualEvolve, releaseFromTeam, swapFromReserve, adoptFromReserve, releaseFromReserve } from './features/team/logic'
import { startBreeding, hatchCreature, cancelBreeding } from './features/breeding/logic'
import { applyFishCatch, startDiveEncounter, applyDiveCollect } from './features/minigames/logic'
import { challengeBoss, startAlcatrazBattle, applyAlcatrazComplete, applyFusion } from './features/bosses/logic'
import { BiokeaLeaderboardPrompt } from '@/components/BiokeaLeaderboardPrompt'
import { reportCreatureEncountered } from '@/lib/golden-sample'
import type { SaveSlotIndex } from './core/persistence'
import { generateMap, getBoatDockAt, getSignpostAt, type BoatDock } from './bayAreaMap'
import { RANGERS, getNearbyRanger } from './rangers'
import { getRangerActivity, getRangerPosition, type RangerActivity } from './npcSchedules'
import {
  rollMood, rollEncounterType, type CreatureMood, type EncounterType,
  type FriendlyGift, type Personality,
} from './encounterSystem'
import EvolutionScreen from './EvolutionScreen'
import { createInitialStats, getNewAchievements, getUnlockedAchievements, type PlayerStats } from './achievements'
import MigrationCalendar from './MigrationCalendar'
import BiomeFieldNotesPanel from './BiomeFieldNotesPanel'
import type { FishDef } from './FishingScreen'
import ChampionScreen from './ChampionScreen'
import { getLandmarkAt } from './landmarks'
import { FINAL_BOSS_ID, GRAND_CHAMPION_ID, canChallengeGrandChampion } from './rangers'
import { useWorldEvents } from './WorldEvents'
import { SFX, Music } from './sounds'
import { type RoamingTrainer } from './roamingTrainers'
import ScreenRouter from './screens/ScreenRouter'
import WorldScreen from './screens/WorldScreen'
import WorldPrompts from './screens/WorldPrompts'
import WorldOverlaysLate from './screens/WorldOverlaysLate'
import type { EscapeStage } from './AlcatrazEscape'
import { getBartStationAt } from './BartSystem'
import type { ArenaTier } from './arena'
import { loadDailyState, updateChallengeProgress, type DailyState } from './dailyChallengesData'
import { exposeTestHook } from './testHook'
import QuestRewardPopup from './QuestRewardPopup'
import LunarBossPopup from './LunarBossPopup'
import ShadowBossPopup from './ShadowBossPopup'
import BossTrophyRoom from './BossTrophyRoom'
import ConservationPrompt from './ConservationPrompt'
import { GameStateContext, GameActionsContext } from './core/GameContext'
import type { GameStateValue, GameActions } from './core/GameContext'

// Screens that Escape should back out of, returning to the world map.
const OVERLAY_SCREENS: GameState['screen'][] = ['catalog', 'inventory', 'journal', 'ranger', 'trade', 'baydex', 'breeding', 'questlog', 'crafting', 'fishing', 'ranger_battle', 'habitat_map', 'adoption', 'leaderboard', 'fusion', 'diving', 'bart', 'boardwalk', 'surfing', 'shop', 'daily_challenges', 'arena', 'move_tutor']

export default function Game() {
  const [activeSlot, setActiveSlot] = useState<SaveSlotIndex>(1)
  const [gameState, setGameState] = useState<GameState>(() => createInitialState())
  const [playerName, setPlayerName] = useState<string>(() => loadPlayerName())
  const [bayDexAck, setBayDexAck] = useState<string[]>([])

  const handleRenamePlayer = useCallback((name: string) => {
    savePlayerName(name)
    setPlayerName(name)
  }, [])

  const openScreen = useCallback((screen: GameState['screen']) => {
    setGameState(prev => ({ ...prev, screen }))
  }, [])

  const closeOverlay = useCallback(() => {
    setGameState(prev => OVERLAY_SCREENS.includes(prev.screen) ? { ...prev, screen: 'world', activeRangerId: null } : prev)
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
  // Friendly gift notification — surfaces the item the creature gave
  // when the player accepts a gift in a friendly encounter. Without
  // this the gift just lands silently in inventory ("Animals give you
  // gifts but it is not clear what they gave you" — player feedback).
  const [giftNotif, setGiftNotif] = useState<FriendlyGift | null>(null)
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
  const [alcatrazCompleted, setAlcatrazCompleted] = useState(() => loadAlcatrazEscaped())

  // Roaming trainer state
  const [pendingTrainer, setPendingTrainer] = useState<RoamingTrainer | null>(null)
  const [defeatedTrainers, setDefeatedTrainers] = useState<string[]>(() => loadDefeatedTrainers())
  const [fishLog, setFishLog] = useState<string[]>(() => loadFishLog())

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

  // Achievement stats — persisted per slot (see core/persistence saveStats/loadStats)
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => createInitialStats())
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [achievementToast, setAchievementToast] = useState<{ name: string; icon: string } | null>(null)
  const [evolveReadyToast, setEvolveReadyToast] = useState<{ name: string; sprite: string; toName: string; gap: number } | null>(null)

  // Conservation prompt — show after sustained engagement, up to 3 times total
  const [showConservation, setShowConservation] = useState(false)
  const conservationDismissals = useRef<number>(loadConservationDismissed())
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
    saveDefeatedTrainers(defeatedTrainers)
  }, [defeatedTrainers])
  useEffect(() => {
    saveFishLog(fishLog)
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

  const movePlayer = useCallback((dx: number, dy: number) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 120) return
    lastMoveTime.current = now

    setGameState(prev => {
      const { state: next, events: ev } = stepPlayer(prev, map, dx, dy, {
        borderPeek,
        lastWeatherChange: lastWeatherChange.current,
        lunarTriggeredDay: lunarBossTriggeredRef.current,
        shadowTriggeredDay: shadowBossTriggeredRef.current,
        defeatedTrainers,
      }, runtimeDeps)

      switch (ev.kind) {
        case 'blocked':
          if (ev.clearBorderPeek) setBorderPeek(null)
          // Same reference as the input: skips a rerender, as the original did.
          return prev
        case 'border-enter':
          setBorderPeek({ state: ev.state, stepsLeft: ev.stepsLeft, returnX: prev.player.x, returnY: prev.player.y })
          setBorderMessage(ev.message)
          setTimeout(() => setBorderMessage(null), 2500)
          return next
        case 'border-step':
          setBorderPeek(bp => bp ? { ...bp, stepsLeft: bp.stepsLeft - 1 } : null)
          setBorderMessage(ev.message)
          setTimeout(() => setBorderMessage(null), 2000)
          return next
        case 'border-return':
          setBorderPeek(null)
          setBorderMessage(ev.message)
          setTimeout(() => setBorderMessage(null), 3000)
          return next
        case 'moved': {
          if (ev.clearBorderPeek) setBorderPeek(null)
          setDailyState(ds => updateChallengeProgress(ds, 'steps'))
          setPlayerStats(ps => recordStepStats(ps, ev.tile))
          setExploredTiles(explored => {
            const { next: revealed, changed } = revealTiles(explored, next.player.x, next.player.y)
            if (!changed) return explored
            // Persist periodically (every ~20 new tiles)
            if (revealed.size % 20 < 5) saveExplored(revealed, activeSlot)
            return revealed
          })
          if (ev.sfxStep) SFX.step()
          if (ev.enteredNewSubregion) {
            setDailyState(ds => updateChallengeProgress(ds, 'explore'))
            if (ev.enteredNewBiome) {
              triggerTutorial('new_biome', `You entered ${ev.tile.biome.replace('_', ' ')} terrain. Different biomes have different creatures!`)
            }
          }
          if (ev.weatherChangedAt !== null) lastWeatherChange.current = ev.weatherChangedAt
          if (ev.encounter) SFX.battleStart()
          if (ev.lunarBoss) { lunarBossTriggeredRef.current = next.gameDay ?? 0; setLunarBoss(ev.lunarBoss) }
          if (ev.shadowBoss) { shadowBossTriggeredRef.current = next.gameDay ?? 0; setShadowBoss(ev.shadowBoss) }
          if (ev.trainer) setPendingTrainer(ev.trainer)
          return next
        }
      }
    })
    // `borderPeek` and `activeSlot` are deliberately read through a stale closure — the
    // pre-refactor deps did the same, and listing them would change behavior (see the
    // border-peek known issue in docs/ARCHITECTURE.md: the 3-step cap effectively never fires).
  }, [map, defeatedTrainers, triggerTutorial])

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
      setGameState(prev => boatTravel(prev, nearbyDock))
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
        closeOverlay()
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
  }, [gameState.screen, gameState.battle.active, movePlayer, nearbyRangerId, nearbyBartStation, atSteamerLane, atBoardwalk, nearbyDock, boatAnimating, handleBoatTravel, closeOverlay])


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
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => {
      const r = applyBattleWin(prev, xpGained, { alcatrazEscapeActive })
      setBattleReward(r.reward)
      setTimeout(() => setBattleReward(null), 3000)
      if (r.evolveReadyHint) {
        setEvolveReadyToast(r.evolveReadyHint)
        setTimeout(() => setEvolveReadyToast(null), 4000)
      }
      if (r.evolution) {
        pendingEvolutionRef.current = r.evolution
        setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
        SFX.evolution()
        setTimeout(() => {
          if (pendingEvolutionRef.current) {
            setPendingEvolution(pendingEvolutionRef.current)
            pendingEvolutionRef.current = null
          }
        }, 100)
      }
      if (alcatrazEscapeActive) {
        if (alcatrazStage === 'cellblock') {
          setAlcatrazCellProgress(p => p + 1)
        } else if (alcatrazStage === 'boss') {
          setAlcatrazStage('freedom')
        }
      }
      return r.state
    })
  }, [alcatrazEscapeActive, alcatrazStage])

  const handleBattleLose = useCallback(() => {
    SFX.defeat()
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => applyBattleLose(prev, { alcatrazEscapeActive }))
  }, [alcatrazEscapeActive])

  const handleCapture = useCallback((creature: Creature, _personality: Personality) => {
    setPlayerStats(ps => ({ ...ps, totalCreaturesCaught: ps.totalCreaturesCaught + 1 }))
    setDailyState(ds => updateChallengeProgress(ds, 'catch'))
    setTimeout(() => {
      triggerTutorial('first_catch', 'Great catch! Check your team with T and open the WildDex with B to learn more.')
    }, 1500)
    setGameState(prev => {
      const r = captureCreature(prev, creature, runtimeDeps)
      setCaptureNotif({ creature, isNewSpecies: r.isNewSpecies, teamFull: r.teamFull })
      setTimeout(() => setCaptureNotif(null), 4000)
      if (r.teamIndex !== null) {
        const idx = r.teamIndex
        setTimeout(() => { setNicknamePrompt({ creature, teamIndex: idx }); setNicknameInput('') }, 2000)
      }
      return r.state
    })
  }, [triggerTutorial])

  const handleFlee = useCallback(() => {
    SFX.flee()
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => endBattle(prev, 8))
  }, [])

  const handleCreatureFled = useCallback(() => {
    setScreenTransition('fade-out')
    setTimeout(() => {
      setScreenTransition('fade-in')
      setTimeout(() => setScreenTransition('none'), 400)
    }, 300)
    setGameState(prev => endBattle(prev, 6))
  }, [])

  const handleBossChallenge = useCallback(() => {
    if (!lunarBoss) return
    SFX.battleStart()
    setGameState(prev => challengeBoss(prev, lunarBoss))
    setLunarBoss(null)
  }, [lunarBoss])

  const handleBossFlee = useCallback(() => {
    SFX.flee()
    setLunarBoss(null)
    setShadowBoss(null)
  }, [])

  const handleShadowBossChallenge = useCallback(() => {
    if (!shadowBoss) return
    SFX.battleStart()
    setGameState(prev => challengeBoss(prev, shadowBoss))
    setShadowBoss(null)
  }, [shadowBoss])

  const handleFriendlyGift = useCallback((gift: FriendlyGift) => {
    setGameState(prev => applyFriendlyGift(prev, gift))
    setGiftNotif(gift)
    setTimeout(() => setGiftNotif(null), 4000)
  }, [])

  // Ranger battle handlers
  const handleStartRangerBattle = useCallback((rangerId: string) => {
    setGameState(prev => startRangerBattle(prev, rangerId))
  }, [])

  const handleRangerBattleWin = useCallback((xp: number) => {
    SFX.victory()
    const isFinalBoss = gameState.activeRangerId === FINAL_BOSS_ID
    const isGrandChampion = gameState.activeRangerId === GRAND_CHAMPION_ID
    const alreadyChampion = (playerStats.defeatedRangers ?? []).includes(FINAL_BOSS_ID)
    const alreadyGrandChampion = (playerStats.defeatedRangers ?? []).includes(GRAND_CHAMPION_ID)
    setPlayerStats(ps => recordRangerDefeat(ps, gameState.activeRangerId))
    setDailyState(ds => updateChallengeProgress(ds, 'battle'))
    setGameState(prev => applyRangerBattleWin(prev, xp))
    // Show champion screen on first final/grand boss defeat
    if ((isFinalBoss && !alreadyChampion) || (isGrandChampion && !alreadyGrandChampion)) {
      setTimeout(() => setShowChampion(true), 500)
    }
  }, [gameState.activeRangerId, playerStats.defeatedRangers])

  const handleRangerBattleLose = useCallback(() => {
    setGameState(prev => applyRangerBattleLose(prev))
  }, [])

  const handleRangerBattleClose = useCallback(() => {
    setGameState(prev => leaveRangerScreen(prev))
  }, [])

  const handleArenaWin = useCallback((xp: number, coins: number, tier: ArenaTier) => {
    SFX.victory()
    setGameState(prev => applyArenaWin(prev, xp, coins, tier))
  }, [])

  const handleArenaLose = useCallback(() => {
    setGameState(prev => applyArenaLose(prev))
  }, [])

  const handleTeachMove = useCallback((creatureIndex: number, updatedCreature: import('@/types/game').CapturedCreature, cost: number) => {
    setGameState(prev => teachMove(prev, creatureIndex, updatedCreature, cost))
  }, [])

  const handleLearnAbility = useCallback((creatureIndex: number, abilityId: string, cost: number) => {
    setGameState(prev => learnAbility(prev, creatureIndex, abilityId, cost))
  }, [])

  const handleUseItem = useCallback((itemId: string) => {
    setGameState(prev => applyUseItem(prev, itemId))
  }, [])

  const handleBattleSwitch = useCallback((index: number) => {
    setGameState(prev => applyBattleSwitch(prev, index))
  }, [])

  const handleSwapLead = useCallback((index: number) => {
    setGameState(prev => swapLead(prev, index))
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

  const handleAcceptQuest = useCallback((questId: string) => { setGameState(prev => acceptQuest(prev, questId)) }, [])
  const handleClaimReward = useCallback((questId: string) => {
    setGameState(prev => {
      const r = claimQuestReward(prev, questId)
      if (r.reward) setQuestReward(r.reward)
      return r.state
    })
  }, [])
  const handleTrade = useCallback((tradeId: string) => { setGameState(prev => applyTrade(prev, tradeId)) }, [])
  const handleCraft = useCallback((recipeId: string) => { setGameState(prev => applyCraft(prev, recipeId)) }, [])
  const handleImportCreature = useCallback((creature: CapturedCreature) => { setGameState(prev => importCreature(prev, creature)) }, [])
  const handleTradeRemoveCreature = useCallback((index: number) => { setGameState(prev => removeTeamMember(prev, index)) }, [])

  // Breeding handlers
  const handleStartBreeding = useCallback((slot: BreedingSlot, _idx1: number, _idx2: number) => {
    setGameState(prev => startBreeding(prev, slot))
  }, [])

  const handleHatchCreature = useCallback((creature: CapturedCreature) => {
    SFX.hatch()
    setPlayerStats(ps => ({ ...ps, totalBreedsCompleted: ps.totalBreedsCompleted + 1 }))
    setGameState(prev => hatchCreature(prev, creature))
  }, [])

  const handleCancelBreeding = useCallback(() => {
    setGameState(prev => cancelBreeding(prev))
  }, [])

  const handleFishCatch = useCallback((fish: FishDef) => {
    SFX.capture()
    setPlayerStats(ps => ({ ...ps, totalFishCaught: (ps.totalFishCaught ?? 0) + 1 }))
    setDailyState(ds => updateChallengeProgress(ds, 'fish'))
    setFishLog(prev => [...new Set([...prev, fish.id])])
    setGameState(prev => applyFishCatch(prev, fish))
  }, [])

  // Accept trainer challenge → go to ranger battle
  const handleAcceptTrainer = useCallback(() => {
    if (!pendingTrainer) return
    setGameState(prev => startRangerBattle(prev, pendingTrainer.id))
  }, [pendingTrainer])

  // Decline trainer challenge
  const handleDeclineTrainer = useCallback(() => {
    SFX.flee()
    setPendingTrainer(null)
    setGameState(prev => applyDeclineTrainer(prev))
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
      const r = applyTrainerBattleWin(prev, xp, trainer)
      if (r.evolution) {
        pendingEvolutionRef.current = r.evolution
        setPlayerStats(ps2 => ({ ...ps2, totalEvolutions: ps2.totalEvolutions + 1 }))
        SFX.evolution()
        setTimeout(() => {
          if (pendingEvolutionRef.current) {
            setPendingEvolution(pendingEvolutionRef.current)
            pendingEvolutionRef.current = null
          }
        }, 100)
      }
      return r.state
    })
    setPendingTrainer(null)
  }, [pendingTrainer])

  // Manual evolution from team screen
  const handleManualEvolve = useCallback((teamIndex: number) => {
    setGameState(prev => {
      const r = manualEvolve(prev, teamIndex)
      if (r.evolution) {
        pendingEvolutionRef.current = r.evolution
        setPlayerStats(ps => ({ ...ps, totalEvolutions: ps.totalEvolutions + 1 }))
        SFX.evolution()
        setTimeout(() => {
          if (pendingEvolutionRef.current) {
            setPendingEvolution(pendingEvolutionRef.current)
            pendingEvolutionRef.current = null
          }
        }, 100)
      }
      return r.state
    })
  }, [])

  // Adoption center handlers
  const handleReleaseFromTeam = useCallback((index: number) => {
    setGameState(prev => releaseFromTeam(prev, index))
  }, [])

  const handleSwapFromReserve = useCallback((reserveIndex: number, teamIndex: number) => {
    setGameState(prev => swapFromReserve(prev, reserveIndex, teamIndex))
  }, [])

  const handleAdoptFromReserve = useCallback((reserveIndex: number) => {
    setGameState(prev => adoptFromReserve(prev, reserveIndex))
  }, [])

  const handleReleaseFromReserve = useCallback((reserveIndex: number) => {
    setGameState(prev => releaseFromReserve(prev, reserveIndex))
  }, [])

  // Alcatraz escape handlers
  const handleAlcatrazBattle = useCallback((creature: Creature) => {
    setGameState(prev => startAlcatrazBattle(prev, creature))
  }, [])

  const handleAlcatrazComplete = useCallback((rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => {
    setAlcatrazEscapeActive(false)
    setAlcatrazCompleted(true)
    saveAlcatrazEscaped()
    setPlayerStats(ps => ({ ...ps, totalBattlesWon: ps.totalBattlesWon + 1 }))
    setGameState(prev => applyAlcatrazComplete(prev, rewards))
  }, [])

  // Fusion handler
  const handleFusion = useCallback((idx1: number, idx2: number, result: CapturedCreature) => {
    setGameState(prev => applyFusion(prev, idx1, idx2, result))
  }, [])

  // Diving handlers
  const handleDiveEncounter = useCallback((creature: Creature) => {
    setGameState(prev => startDiveEncounter(prev, creature))
  }, [])

  const handleDiveCollect = useCallback((item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => {
    setGameState(prev => applyDiveCollect(prev, item))
  }, [])

  const handleFastTravel = useCallback((x: number, y: number, subregion: string) => {
    const isExplored = exploredTiles.has(`${x},${y}`)
    const subregionVisited = playerStats.uniqueSubregionsVisited.includes(subregion)
    if (!isExplored && !subregionVisited) return
    setBoatAnimating(true)
    SFX.step()
    setTimeout(() => {
      setGameState(prev => fastTravel(prev, map, x, y, subregion))
      // Reveal tiles around destination
      setExploredTiles(prev => revealTiles(prev, x, y).next)
      setBoatAnimating(false)
    }, 1500)
  }, [map, exploredTiles, playerStats.uniqueSubregionsVisited])

  const handleLoadSlot = useCallback((slot: SaveSlotIndex) => {
    setActiveSlot(slot)
    const saved = loadGame(slot)
    if (saved) {
      const loaded = { ...applyBackwardCompat(saved, map), screen: 'world' as const }
      setGameState(loaded)
      tutorialFlagsRef.current = new Set(loaded.tutorialFlags ?? [])
      const stats = loadStats(slot)
      if (stats) setPlayerStats({ ...createInitialStats(), ...stats })
      setExploredTiles(loadExplored(slot))
      setBayDexAck(loadBayDexAck(slot))
    }
  }, [map])

  const handleNewGame = useCallback((slot: SaveSlotIndex) => {
    setActiveSlot(slot)
    clearSave(slot)
    setExploredTiles(new Set())
    setPlayerStats(createInitialStats())
    tutorialFlagsRef.current = new Set()
    setShowTutorialDialog(false)
    const fresh = createInitialState()
    setGameState({ ...fresh, screen: 'starter' })
    setBayDexAck([])
  }, [])

  const handleDeleteSlot = useCallback((slot: SaveSlotIndex) => {
    clearSave(slot)
  }, [])

  const handleSelectStarter = useCallback((creature: CapturedCreature) => {
    setGameState(prev => selectStarter(prev, map, creature))
  }, [map])

  // Conservation prompt dismissal — closes the prompt and bumps the
  // persisted dismissal counter (the prompt shows at most 3 times).
  const dismissConservation = useCallback(() => {
    setShowConservation(false)
    conservationDismissals.current += 1
    saveConservationDismissed(conservationDismissals.current)
  }, [])

  useEffect(() => {
    exposeTestHook({
      getState: () => gameState,
      getStats: () => playerStats,
      getExploredCount: () => exploredTiles.size,
      getDefeatedTrainers: () => defeatedTrainers,
      getFishLog: () => fishLog,
      handleNewGame, handleLoadSlot, handleSelectStarter, movePlayer, openScreen, closeOverlay,
      handleEncounterComplete, handleBattleWin, handleBattleLose, handleCapture, handleFlee, handleCreatureFled,
      handleFriendlyGift, handleAcceptTrainer, handleDeclineTrainer, handleTrainerBattleWin,
      handleStartRangerBattle, handleRangerBattleWin, handleRangerBattleLose, handleArenaWin, handleArenaLose,
      handleAcceptQuest, handleClaimReward, handleTrade, handleCraft, handleUseItem, handleSwapLead, handleBattleSwitch,
      handleFishCatch, handleStartBreeding, handleHatchCreature, handleCancelBreeding, handleImportCreature,
      handleTradeRemoveCreature, handleManualEvolve, handleReleaseFromTeam, handleSwapFromReserve,
      handleAdoptFromReserve, handleReleaseFromReserve, handleAlcatrazComplete, handleFusion, handleDiveCollect,
      handleDiveEncounter, handleFastTravel, handleTeachMove, handleLearnAbility,
    })
  })

  // ---- Context values -------------------------------------------------
  // Built once, before the early returns, so every screen (title, starter
  // and the main tree) is wrapped in the same providers.
  const stateValue: GameStateValue = {
    gameState, playerStats, dailyState, map: memoizedMap, exploredTiles, activeSlot, playerName,
    unlockedAchievements, bayDexNewCount, rangerPositions, worldEvents, grandChampionUnlocked,
    ui: {
      nearbyRangerId, currentLandmark, nearbyDock, boatAnimating, nearbyBartStation,
      atSteamerLane, atBoardwalk, nearbySignpost, borderMessage, borderPeek,
      captureNotif, giftNotif, nicknamePrompt, nicknameInput, battleReward, screenTransition,
      pendingEvolution, pendingTrainer, defeatedTrainers, fishLog,
      alcatrazEscapeActive, alcatrazStage, alcatrazCellProgress, alcatrazCompleted,
      showMigrationCalendar, showFieldNotes, showTrophyRoom, showHotkeys, showFastTravel,
      showChampion, showConservation, showTutorialDialog, tutorialTip,
      achievementToast, evolveReadyToast, questReward, lunarBoss, shadowBoss,
      encounterMood, encounterType, biokeaPromptOpen,
    },
  }

  // React setters are stable, but they are listed in the dependency array
  // alongside the handlers so the list mirrors the object exactly.
  const actions = useMemo<GameActions>(() => ({
    movePlayer, openScreen, closeOverlay, handleBoatTravel, handleFastTravel, triggerTutorial,
    handleNewGame, handleLoadSlot, handleDeleteSlot, handleSelectStarter, handleRenamePlayer,
    handleEncounterComplete, handleBattleWin, handleBattleLose, handleCapture, handleFlee,
    handleCreatureFled, handleFriendlyGift, handleUseItem, handleBattleSwitch,
    handleBossChallenge, handleBossFlee, handleShadowBossChallenge,
    handleStartRangerBattle, handleRangerBattleWin, handleRangerBattleLose, handleRangerBattleClose,
    handleAcceptTrainer, handleDeclineTrainer, handleTrainerBattleWin, handleArenaWin, handleArenaLose,
    handleSwapLead, handleTeachMove, handleLearnAbility, handleManualEvolve, handleReleaseFromTeam,
    handleSwapFromReserve, handleAdoptFromReserve, handleReleaseFromReserve,
    handleAcceptQuest, handleClaimReward, handleTrade, handleCraft, handleImportCreature,
    handleTradeRemoveCreature, handleStartBreeding, handleHatchCreature, handleCancelBreeding,
    handleFishCatch, handleDiveEncounter, handleDiveCollect,
    handleAlcatrazBattle, handleAlcatrazComplete, handleFusion, dismissConservation,
    setGameState, setDailyState, setNicknameInput, setNicknamePrompt, setCaptureNotif,
    setPendingEvolution, setPendingTrainer, setQuestReward,
    setShowMigrationCalendar, setShowFieldNotes, setShowTrophyRoom, setShowHotkeys, setShowFastTravel,
    setShowChampion, setShowConservation, setShowTutorialDialog, setTutorialTip, setBiokeaPromptOpen,
    setAlcatrazStage, setAlcatrazCellProgress, setAlcatrazEscapeActive, setBayDexAck,
  }), [
    movePlayer, openScreen, closeOverlay, handleBoatTravel, handleFastTravel, triggerTutorial,
    handleNewGame, handleLoadSlot, handleDeleteSlot, handleSelectStarter, handleRenamePlayer,
    handleEncounterComplete, handleBattleWin, handleBattleLose, handleCapture, handleFlee,
    handleCreatureFled, handleFriendlyGift, handleUseItem, handleBattleSwitch,
    handleBossChallenge, handleBossFlee, handleShadowBossChallenge,
    handleStartRangerBattle, handleRangerBattleWin, handleRangerBattleLose, handleRangerBattleClose,
    handleAcceptTrainer, handleDeclineTrainer, handleTrainerBattleWin, handleArenaWin, handleArenaLose,
    handleSwapLead, handleTeachMove, handleLearnAbility, handleManualEvolve, handleReleaseFromTeam,
    handleSwapFromReserve, handleAdoptFromReserve, handleReleaseFromReserve,
    handleAcceptQuest, handleClaimReward, handleTrade, handleCraft, handleImportCreature,
    handleTradeRemoveCreature, handleStartBreeding, handleHatchCreature, handleCancelBreeding,
    handleFishCatch, handleDiveEncounter, handleDiveCollect,
    handleAlcatrazBattle, handleAlcatrazComplete, handleFusion, dismissConservation,
    setGameState, setDailyState, setNicknameInput, setNicknamePrompt, setCaptureNotif,
    setPendingEvolution, setPendingTrainer, setQuestReward,
    setShowMigrationCalendar, setShowFieldNotes, setShowTrophyRoom, setShowHotkeys, setShowFastTravel,
    setShowChampion, setShowConservation, setShowTutorialDialog, setTutorialTip, setBiokeaPromptOpen,
    setAlcatrazStage, setAlcatrazCellProgress, setAlcatrazEscapeActive, setBayDexAck,
  ])

  // Title / starter selection screens — render before the world canvas, HUD
  // and world effects mount so they never appear behind these screens.
  if (gameState.screen === 'title' || gameState.screen === 'starter') {
    return (
      <GameStateContext.Provider value={stateValue}>
      <GameActionsContext.Provider value={actions}>
      <ScreenRouter />
      </GameActionsContext.Provider>
      </GameStateContext.Provider>
    )
  }

  return (
    <GameStateContext.Provider value={stateValue}>
    <GameActionsContext.Provider value={actions}>
    <div className="w-full h-screen bg-[#0e1a2e] relative overflow-hidden select-none">
      <WorldScreen />

      <ScreenRouter />

      <WorldPrompts />

      <WorldOverlaysLate />

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
        <ConservationPrompt onDismiss={dismissConservation} />
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
    </GameActionsContext.Provider>
    </GameStateContext.Provider>
  )
}
