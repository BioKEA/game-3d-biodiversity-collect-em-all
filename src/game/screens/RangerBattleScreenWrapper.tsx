import RangerBattleScreen from '@/game/RangerBattleScreen'
import { RANGERS } from '@/game/rangers'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function RangerBattleScreenWrapper() {
  const { gameState, ui } = useGameState()
  const a = useGameActions()
  if (!gameState.activeRangerId) return null
  // Check if this is a roaming trainer or a regular ranger
  const ranger = RANGERS.find(r => r.id === gameState.activeRangerId)
  if (ranger && ranger.battleTeam) {
    return (
      <RangerBattleScreen
        ranger={ranger}
        playerTeam={gameState.player.team}
        weather={gameState.weather}
        timeOfDay={gameState.timeOfDay}
        onWin={a.handleRangerBattleWin}
        onLose={a.handleRangerBattleLose}
        onClose={a.handleRangerBattleClose}
      />
    )
  }
  // Roaming trainer battle
  if (ui.pendingTrainer) {
    const trainerAsRanger = {
      id: ui.pendingTrainer.id,
      name: ui.pendingTrainer.name,
      title: ui.pendingTrainer.title,
      greeting: ui.pendingTrainer.quote,
      sprite: ui.pendingTrainer.sprite,
      x: 0, y: 0,
      subregion: '',
      quests: [],
      trades: [],
      battleTeam: ui.pendingTrainer.team,
      battleQuote: ui.pendingTrainer.quote,
      defeatQuote: ui.pendingTrainer.defeatQuote,
      battleReward: { xp: ui.pendingTrainer.rewardXp },
    } satisfies import('@/types/game').Ranger
    return (
      <RangerBattleScreen
        ranger={trainerAsRanger}
        playerTeam={gameState.player.team}
        weather={gameState.weather}
        timeOfDay={gameState.timeOfDay}
        onWin={a.handleTrainerBattleWin}
        onLose={() => { a.handleRangerBattleLose(); a.setPendingTrainer(null) }}
        onClose={() => { a.handleRangerBattleClose(); a.setPendingTrainer(null) }}
      />
    )
  }
  return null
}
