import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { GameState, Creature, CapturedCreature, MapTile, BreedingSlot } from '@/types/game'
import { createInitialState, applyBackwardCompat, runtimeDeps } from './core/state'
import {
  saveGame, loadGame, clearSave, saveStats, loadStats, saveExplored, loadExplored, loadPlayerName, savePlayerName, loadBayDexAck,
  loadAlcatrazEscaped, saveAlcatrazEscaped, loadDefeatedTrainers, saveDefeatedTrainers, loadFishLog, saveFishLog, loadConservationDismissed, saveConservationDismissed,
} from './core/persistence'
import { captureCreature } from './features/capture/logic'
import { applyBattleWin, applyBattleLose, endBattle, applyUseItem, applyBattleSwitch, applyFriendlyGift } from './features/battle/logic'
import { startRangerBattle, applyRangerBattleWin, applyRangerBattleLose, leaveRangerScreen, applyArenaWin, applyArenaLose, applyDeclineTrainer, applyTrainerBattleWin } from './features/trainers/logic'
import { recordRangerDefeat, recordStepStats } from './features/progression/logic'
import { stepPlayer, revealTiles, boatTravel, fastTravel, selectStarter } from './features/world/logic'
import type { StepEvents } from './features/world/logic'
import { acceptQuest, claimQuestReward } from './features/quests/logic'
import { applyTrade, importCreature, removeTeamMember } from './features/trade/logic'
import { applyCraft } from './features/crafting/logic'
import { swapLead, teachMove, learnAbility, manualEvolve, releaseFromTeam, swapFromReserve, adoptFromReserve, releaseFromReserve } from './features/team/logic'
import { startBreeding, hatchCreature, cancelBreeding } from './features/breeding/logic'
import { applyFishCatch, startDiveEncounter, applyDiveCollect } from './features/minigames/logic'
import { challengeBoss, startAlcatrazBattle, applyAlcatrazComplete, applyFusion } from './features/bosses/logic'
import { reportCreatureEncountered } from '@/lib/golden-sample'
import type { SaveSlotIndex } from './core/persistence'
import { generateMap } from './bayAreaMap'
import { RANGERS } from './rangers'
import { getRangerActivity, getRangerPosition, type RangerActivity } from './npcSchedules'
import {
  rollMood, rollEncounterType, type CreatureMood, type EncounterType,
  type FriendlyGift, type Personality,
} from './encounterSystem'
import { createInitialStats, getNewAchievements, getUnlockedAchievements, type PlayerStats } from './achievements'
import type { FishDef } from './FishingScreen'
import { FINAL_BOSS_ID, GRAND_CHAMPION_ID, canChallengeGrandChampion } from './rangers'
import { useWorldEvents } from './WorldEvents'
import { SFX, Music } from './sounds'
import { type RoamingTrainer } from './roamingTrainers'
import ScreenRouter from './screens/ScreenRouter'
import WorldScreen from './screens/WorldScreen'
import WorldPrompts from './screens/WorldPrompts'
import WorldPanels from './screens/WorldPanels'
import GlobalOverlays from './screens/GlobalOverlays'
import type { EscapeStage } from './AlcatrazEscape'
import { getBartStationAt } from './BartSystem'
import type { ArenaTier } from './arena'
import { loadDailyState, updateChallengeProgress, type DailyState } from './dailyChallengesData'
import { GameStateContext, GameActionsContext } from './core/GameContext'
import type { GameStateValue, GameActions } from './core/GameContext'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useWorldProximity } from './hooks/useWorldProximity'

// Screens that Escape should back out of, returning to the world map.
const OVERLAY_SCREENS: GameState['screen'][] = ['catalog', 'inventory', 'journal', 'ranger', 'trade', 'baydex', 'breeding', 'questlog', 'crafting', 'fishing', 'ranger_battle', 'habitat_map', 'adoption', 'leaderboard', 'fusion', 'diving', 'bart', 'boardwalk', 'surfing', 'shop', 'daily_challenges', 'arena', 'move_tutor']

/** `children` is rendered inside both context providers on every screen. The
 *  app passes nothing; the replay oracle passes `<GameProbe />` to read the
 *  live context values (see `src/game/__replay__/GameProbe.tsx`). */
export default function Game({ children }: { children?: ReactNode }) {
  const [activeSlot, setActiveSlot] = useState<SaveSlotIndex>(1)
  // Mirrored into a ref so `movePlayer` (whose identity must stay stable — the
  // hold-to-move effect re-registers on it) still sees the *current* slot.
  const activeSlotRef = useRef<SaveSlotIndex>(activeSlot)
  activeSlotRef.current = activeSlot
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

  const openRanger = useCallback((id: string) => {
    setGameState(prev => ({ ...prev, screen: 'ranger', activeRangerId: id }))
  }, [])

  const toggleMusic = useCallback(() => { Music.toggle() }, [])

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
  // `nearbyRangerId`, `currentLandmark`, `nearbyDock` and `nearbySignpost` now
  // live in `useWorldProximity` (called below, before `handleBoatTravel`).
  const [showChampion, setShowChampion] = useState(false)
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
  // Same pattern: `stepPlayer` needs the live peek state to count the three
  // steps down, but listing `borderPeek` in `movePlayer`'s deps would recreate
  // the callback on every peek transition and tear down hold-to-move mid-hold.
  const borderPeekRef = useRef(borderPeek)
  borderPeekRef.current = borderPeek

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

  // The side effects of a successful step, lifted out of `movePlayer`'s
  // updater so that function stays short. Statements and order are unchanged.
  // Plain (non-memoised) on purpose: it reads only refs and stable setters, so
  // the copy `movePlayer` closes over never goes stale.
  const applyStepEffects = (next: GameState, ev: Extract<StepEvents, { kind: 'moved' }>) => {
    if (ev.clearBorderPeek) setBorderPeek(null)
    setDailyState(ds => updateChallengeProgress(ds, 'steps'))
    setPlayerStats(ps => recordStepStats(ps, ev.tile))
    setExploredTiles(explored => {
      const { next: revealed, changed } = revealTiles(explored, next.player.x, next.player.y)
      if (!changed) return explored
      // Persist periodically (every ~20 new tiles)
      if (revealed.size % 20 < 5) saveExplored(revealed, activeSlotRef.current)
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
  }

  const movePlayer = useCallback((dx: number, dy: number) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 120) return
    lastMoveTime.current = now

    setGameState(prev => {
      const { state: next, events: ev } = stepPlayer(prev, map, dx, dy, {
        borderPeek: borderPeekRef.current,
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
        case 'moved':
          applyStepEffects(next, ev)
          return next
      }
    })
    // `borderPeek` and `activeSlot` are read through refs (see their declarations), so the
    // callback identity stays stable for the hold-to-move effect while the values stay live.
    // `applyStepEffects` is unlisted for the same reason: it reads only refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const grandChampionUnlocked = canChallengeGrandChampion(
    playerStats.defeatedRangers ?? [],
    playerStats.uniqueSubregionsVisited ?? [],
  )

  // Auto-open Ranger Tomás's tutorial dialog the first time the player comes
  // within his radius. The one-shot guard stays here (it owns
  // `tutorialFlagsRef`); `useWorldProximity` only reports the proximity.
  const onFirstRangerProximity = useCallback(() => {
    if (tutorialFlagsRef.current.has('ranger_tutorial')) return
    tutorialFlagsRef.current.add('ranger_tutorial')
    setShowTutorialDialog(true)
    setGameState(prev => ({
      ...prev,
      screen: 'ranger',
      activeRangerId: 'ranger-golden-gate',
      tutorialFlags: [...(prev.tutorialFlags ?? []), 'ranger_tutorial'],
    }))
  }, [])

  // Proximity detection (ranger / landmark / dock / signpost). Declared here
  // because `handleBoatTravel` and the keyboard shortcuts below read
  // `nearbyDock` and `nearbyRangerId`.
  const { nearbyRangerId, currentLandmark, nearbyDock, nearbySignpost } = useWorldProximity({
    screen: gameState.screen,
    x: gameState.player.x,
    y: gameState.player.y,
    timeOfDay: gameState.timeOfDay,
    grandChampionUnlocked,
    onFirstRangerProximity,
  })

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

  // Keyboard controls (shortcuts + hold-to-move). Both effects moved verbatim
  // into the hook; `teamSize`/`playerX`/`playerY`/`map` keep their original
  // stale-closure semantics (see the note in useKeyboardControls).
  useKeyboardControls({
    screen: gameState.screen,
    battleActive: gameState.battle.active,
    teamSize: gameState.player.team.length,
    playerX: gameState.player.x,
    playerY: gameState.player.y,
    map,
    nearbyDock,
    boatAnimating,
    nearbyBartStation,
    atSteamerLane,
    atBoardwalk,
    nearbyRangerId,
    movePlayer,
    openScreen,
    closeOverlay,
    handleBoatTravel,
    openRanger,
    toggleMusic,
  })

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
      {children}
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

      <WorldPanels />

      <GlobalOverlays />

      {children}
    </div>
    </GameActionsContext.Provider>
    </GameStateContext.Provider>
  )
}
