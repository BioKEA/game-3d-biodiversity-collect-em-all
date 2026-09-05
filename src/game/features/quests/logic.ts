import type { GameState } from '@/types/game'
import { RANGERS } from '@/game/rangers'
import { applyPlayerXp, addToInventory } from '@/game/features/progression/logic'

export function acceptQuest(state: GameState, questId: string): GameState {
  return { ...state, questProgress: { ...state.questProgress, [questId]: { questId, status: 'active', progress: 0 } } }
}

export interface QuestRewardSummary { title: string; xp: number; coins: number; items?: { id: string; name: string; sprite: string; quantity: number }[] }

export function claimQuestReward(state: GameState, questId: string): { state: GameState; reward: QuestRewardSummary | null } {
  const ranger = RANGERS.find(r => r.quests.some(q => q.id === questId))
  const quest = ranger?.quests.find(q => q.id === questId)
  if (!quest) return { state, reward: null }
  const coins = 25 + quest.reward.xp
  const reward: QuestRewardSummary = {
    title: quest.title, xp: quest.reward.xp, coins,
    items: quest.reward.items?.map(i => ({ id: i.id, name: i.name, sprite: i.sprite, quantity: i.quantity })),
  }
  const { player } = applyPlayerXp(state.player, quest.reward.xp)
  let inventory = state.player.inventory
  for (const item of quest.reward.items ?? []) inventory = addToInventory(inventory, item)
  return {
    state: {
      ...state,
      player: { ...player, coins: (state.player.coins ?? 0) + coins, inventory },
      questProgress: { ...state.questProgress, [questId]: { questId, status: 'rewarded', progress: 0 } },
    },
    reward,
  }
}
