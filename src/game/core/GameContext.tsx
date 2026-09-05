// Game context — the seam between Game.tsx's state/handlers and the
// per-screen wrapper components that will replace its ~1,300-line JSX
// block (see the ScreenRouter tasks).
//
// Deliberately TWO contexts:
//   - GameStateContext  changes on every render (it carries `gameState`)
//   - GameActionsContext is memoised on the handler identities, so a
//     component that only needs actions does not re-render with state.
//
// Nothing consumes these yet; Game.tsx only provides them.
import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CapturedCreature, Creature, GameState, MapTile, BreedingSlot } from '@/types/game'
import type { PlayerStats } from '../achievements'
import type { DailyState } from '../dailyChallengesData'
import type { SaveSlotIndex } from './persistence'
import type { BoatDock } from '../bayAreaMap'
import type { RangerActivity } from '../npcSchedules'
import type { useWorldEvents } from '../WorldEvents'
import type { getBartStationAt } from '../BartSystem'
import type { EscapeStage } from '../AlcatrazEscape'
import type { RoamingTrainer } from '../roamingTrainers'
import type { FriendlyGift, CreatureMood, EncounterType, Personality } from '../encounterSystem'
import type { EvolutionData } from '../features/progression/logic'
import type { EvolveReadyHint } from '../features/battle/logic'
import type { QuestRewardSummary } from '../features/quests/logic'
import type { FishDef } from '../FishingScreen'
import type { ArenaTier } from '../arena'

/** Transient UI state — the flags, toasts and prompts the screens render on top of `gameState`. */
export interface GameUiState {
  nearbyRangerId: string | null
  currentLandmark: string | null
  nearbyDock: BoatDock | null
  boatAnimating: boolean
  nearbyBartStation: ReturnType<typeof getBartStationAt>
  atSteamerLane: boolean
  atBoardwalk: boolean
  nearbySignpost: { state: string; message: string; fact: string } | null
  borderMessage: string | null
  borderPeek: { state: string; stepsLeft: number; returnX: number; returnY: number } | null
  captureNotif: { creature: Creature; isNewSpecies: boolean; teamFull: boolean } | null
  giftNotif: FriendlyGift | null
  nicknamePrompt: { creature: Creature; teamIndex: number } | null
  nicknameInput: string
  battleReward: { xp: number; coins: number; levelUp: boolean; isBoss?: boolean } | null
  screenTransition: 'none' | 'fade-out' | 'fade-in'
  pendingEvolution: EvolutionData | null
  pendingTrainer: RoamingTrainer | null
  defeatedTrainers: string[]
  fishLog: string[]
  alcatrazEscapeActive: boolean
  alcatrazStage: EscapeStage
  alcatrazCellProgress: number
  alcatrazCompleted: boolean
  showMigrationCalendar: boolean
  showFieldNotes: boolean
  showTrophyRoom: boolean
  showHotkeys: boolean
  showFastTravel: boolean
  showChampion: boolean
  showConservation: boolean
  showTutorialDialog: boolean
  tutorialTip: string | null
  achievementToast: { name: string; icon: string } | null
  evolveReadyToast: EvolveReadyHint | null
  questReward: QuestRewardSummary | null
  lunarBoss: Creature | null
  shadowBoss: Creature | null
  encounterMood: CreatureMood
  encounterType: EncounterType
  biokeaPromptOpen: boolean
}

/** Everything the screens read. A fresh object every render — `gameState` changes anyway. */
export interface GameStateValue {
  gameState: GameState
  playerStats: PlayerStats
  dailyState: DailyState
  map: MapTile[][]
  exploredTiles: Set<string>
  activeSlot: SaveSlotIndex
  playerName: string
  unlockedAchievements: string[]
  bayDexNewCount: number
  rangerPositions: { x: number; y: number; sprite: string; activity: RangerActivity }[]
  worldEvents: ReturnType<typeof useWorldEvents>
  grandChampionUnlocked: boolean
  ui: GameUiState
}

/** Every callback and setter the screens invoke. Memoised on the handler identities. */
export interface GameActions {
  // Navigation / world
  movePlayer: (dx: number, dy: number) => void
  openScreen: (screen: GameState['screen']) => void
  closeOverlay: () => void
  handleBoatTravel: () => void
  handleFastTravel: (x: number, y: number, subregion: string) => void
  triggerTutorial: (flag: string, tip: string) => void

  // Save slots / identity
  handleNewGame: (slot: SaveSlotIndex) => void
  handleLoadSlot: (slot: SaveSlotIndex) => void
  handleDeleteSlot: (slot: SaveSlotIndex) => void
  handleSelectStarter: (creature: CapturedCreature) => void
  handleRenamePlayer: (name: string) => void

  // Encounters and battle
  handleEncounterComplete: () => void
  handleBattleWin: (xpGained: number) => void
  handleBattleLose: () => void
  handleCapture: (creature: Creature, personality: Personality) => void
  handleFlee: () => void
  handleCreatureFled: () => void
  handleFriendlyGift: (gift: FriendlyGift) => void
  handleUseItem: (itemId: string) => void
  handleBattleSwitch: (index: number) => void

  // Bosses
  handleBossChallenge: () => void
  handleBossFlee: () => void
  handleShadowBossChallenge: () => void

  // Rangers, trainers, arena
  handleStartRangerBattle: (rangerId: string) => void
  handleRangerBattleWin: (xp: number) => void
  handleRangerBattleLose: () => void
  handleRangerBattleClose: () => void
  handleAcceptTrainer: () => void
  handleDeclineTrainer: () => void
  handleTrainerBattleWin: (xp: number) => void
  handleArenaWin: (xp: number, coins: number, tier: ArenaTier) => void
  handleArenaLose: () => void

  // Team
  handleSwapLead: (index: number) => void
  handleTeachMove: (creatureIndex: number, updatedCreature: CapturedCreature, cost: number) => void
  handleLearnAbility: (creatureIndex: number, abilityId: string, cost: number) => void
  handleManualEvolve: (teamIndex: number) => void
  handleReleaseFromTeam: (index: number) => void
  handleSwapFromReserve: (reserveIndex: number, teamIndex: number) => void
  handleAdoptFromReserve: (reserveIndex: number) => void
  handleReleaseFromReserve: (reserveIndex: number) => void

  // Quests, trade, crafting, breeding
  handleAcceptQuest: (questId: string) => void
  handleClaimReward: (questId: string) => void
  handleTrade: (tradeId: string) => void
  handleCraft: (recipeId: string) => void
  handleImportCreature: (creature: CapturedCreature) => void
  handleTradeRemoveCreature: (index: number) => void
  handleStartBreeding: (slot: BreedingSlot, idx1: number, idx2: number) => void
  handleHatchCreature: (creature: CapturedCreature) => void
  handleCancelBreeding: () => void

  // Minigames
  handleFishCatch: (fish: FishDef) => void
  handleDiveEncounter: (creature: Creature) => void
  handleDiveCollect: (item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => void

  // Alcatraz + fusion
  handleAlcatrazBattle: (creature: Creature) => void
  handleAlcatrazComplete: (rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => void
  handleFusion: (idx1: number, idx2: number, result: CapturedCreature) => void

  /** Records a conservation-prompt dismissal (bumps the persisted counter). */
  dismissConservation: () => void

  // Setters the JSX calls directly.
  setGameState: Dispatch<SetStateAction<GameState>>
  setDailyState: Dispatch<SetStateAction<DailyState>>
  setNicknameInput: Dispatch<SetStateAction<string>>
  setNicknamePrompt: Dispatch<SetStateAction<{ creature: Creature; teamIndex: number } | null>>
  setCaptureNotif: Dispatch<SetStateAction<{ creature: Creature; isNewSpecies: boolean; teamFull: boolean } | null>>
  setPendingEvolution: Dispatch<SetStateAction<EvolutionData | null>>
  setPendingTrainer: Dispatch<SetStateAction<RoamingTrainer | null>>
  setQuestReward: Dispatch<SetStateAction<QuestRewardSummary | null>>
  setShowMigrationCalendar: Dispatch<SetStateAction<boolean>>
  setShowFieldNotes: Dispatch<SetStateAction<boolean>>
  setShowTrophyRoom: Dispatch<SetStateAction<boolean>>
  setShowHotkeys: Dispatch<SetStateAction<boolean>>
  setShowFastTravel: Dispatch<SetStateAction<boolean>>
  setShowChampion: Dispatch<SetStateAction<boolean>>
  setShowConservation: Dispatch<SetStateAction<boolean>>
  setShowTutorialDialog: Dispatch<SetStateAction<boolean>>
  setTutorialTip: Dispatch<SetStateAction<string | null>>
  setBiokeaPromptOpen: Dispatch<SetStateAction<boolean>>
  setAlcatrazStage: Dispatch<SetStateAction<EscapeStage>>
  setAlcatrazCellProgress: Dispatch<SetStateAction<number>>
  setAlcatrazEscapeActive: Dispatch<SetStateAction<boolean>>
  setBayDexAck: Dispatch<SetStateAction<string[]>>
}

export const GameStateContext = createContext<GameStateValue | null>(null)
export const GameActionsContext = createContext<GameActions | null>(null)

export function useGameState(): GameStateValue {
  const value = useContext(GameStateContext)
  if (value === null) throw new Error('useGameState must be used inside <Game>')
  return value
}

export function useGameActions(): GameActions {
  const value = useContext(GameActionsContext)
  if (value === null) throw new Error('useGameActions must be used inside <Game>')
  return value
}
