import type { GameState, Creature, CapturedCreature, BreedingSlot } from '@/types/game'
import type { PlayerStats } from './achievements'
import type { SaveSlotIndex } from './gameState'
import type { FriendlyGift, Personality } from './encounterSystem'
import type { FishDef } from './FishingScreen'
import type { ArenaTier } from './arena'

/** Test-only surface the replay oracle drives. No-op outside vitest. */
export interface WildcalTestHook {
  getState: () => GameState
  getStats: () => PlayerStats
  getExploredCount: () => number
  getDefeatedTrainers: () => string[]
  getFishLog: () => string[]
  handleNewGame: (slot: SaveSlotIndex) => void
  handleLoadSlot: (slot: SaveSlotIndex) => void
  handleSelectStarter: (creature: CapturedCreature) => void
  movePlayer: (dx: number, dy: number) => void
  openScreen: (screen: GameState['screen']) => void
  closeOverlay: () => void
  handleEncounterComplete: () => void
  handleBattleWin: (xp: number) => void
  handleBattleLose: () => void
  handleCapture: (creature: Creature, personality: Personality) => void
  handleFlee: () => void
  handleCreatureFled: () => void
  handleFriendlyGift: (gift: FriendlyGift) => void
  handleAcceptTrainer: () => void
  handleDeclineTrainer: () => void
  handleTrainerBattleWin: (xp: number) => void
  handleStartRangerBattle: (rangerId: string) => void
  handleRangerBattleWin: (xp: number) => void
  handleRangerBattleLose: () => void
  handleArenaWin: (xp: number, coins: number, tier: ArenaTier) => void
  handleArenaLose: () => void
  handleAcceptQuest: (questId: string) => void
  handleClaimReward: (questId: string) => void
  handleTrade: (tradeId: string) => void
  handleCraft: (recipeId: string) => void
  handleUseItem: (itemId: string) => void
  handleSwapLead: (index: number) => void
  handleBattleSwitch: (index: number) => void
  handleFishCatch: (fish: FishDef) => void
  handleStartBreeding: (slot: BreedingSlot, i1: number, i2: number) => void
  handleHatchCreature: (creature: CapturedCreature) => void
  handleCancelBreeding: () => void
  handleImportCreature: (creature: CapturedCreature) => void
  handleTradeRemoveCreature: (index: number) => void
  handleManualEvolve: (teamIndex: number) => void
  handleReleaseFromTeam: (index: number) => void
  handleSwapFromReserve: (reserveIndex: number, teamIndex: number) => void
  handleAdoptFromReserve: (reserveIndex: number) => void
  handleReleaseFromReserve: (reserveIndex: number) => void
  handleAlcatrazComplete: (rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => void
  handleFusion: (i1: number, i2: number, result: CapturedCreature) => void
  handleDiveCollect: (item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => void
  handleDiveEncounter: (creature: Creature) => void
  handleFastTravel: (x: number, y: number, subregion: string) => void
  handleTeachMove: (i: number, c: CapturedCreature, cost: number) => void
  handleLearnAbility: (i: number, abilityId: string, cost: number) => void
}

export function exposeTestHook(hook: WildcalTestHook): void {
  if (import.meta.env.MODE !== 'test') return
  ;(window as unknown as { __wildcal?: WildcalTestHook }).__wildcal = hook
}
