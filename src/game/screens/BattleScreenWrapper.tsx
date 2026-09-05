import BattleScreen from '@/game/BattleScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function BattleScreenWrapper() {
  const { gameState, ui } = useGameState()
  const a = useGameActions()
  if (!(gameState.battle.wildCreature && gameState.player.team[0])) return null
  return (
    <BattleScreen
      wildCreature={gameState.battle.wildCreature}
      playerCreature={gameState.player.team[0]}
      team={gameState.player.team}
      inventory={gameState.player.inventory}
      weather={gameState.weather}
      timeOfDay={gameState.timeOfDay}
      mood={ui.encounterMood}
      encounterType={ui.encounterType}
      onWin={a.handleBattleWin}
      onLose={a.handleBattleLose}
      onCapture={a.handleCapture}
      onFlee={a.handleFlee}
      onUseItem={a.handleUseItem}
      onSwitch={a.handleBattleSwitch}
      onFriendlyGift={a.handleFriendlyGift}
      onCreatureFled={a.handleCreatureFled}
      biome={gameState.currentBiome}
      subregion={gameState.currentSubregion}
    />
  )
}
