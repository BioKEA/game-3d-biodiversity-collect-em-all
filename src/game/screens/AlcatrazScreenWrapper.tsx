import AlcatrazEscape from '@/game/AlcatrazEscape'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function AlcatrazScreenWrapper() {
  const { gameState, ui } = useGameState()
  const { openScreen, setAlcatrazStage, setAlcatrazEscapeActive, handleAlcatrazComplete, handleAlcatrazBattle } = useGameActions()
  return (
    <AlcatrazEscape
      playerTeam={gameState.player.team}
      playerLevel={gameState.player.level}
      stage={ui.alcatrazStage}
      cellBlockProgress={ui.alcatrazCellProgress}
      onSetStage={setAlcatrazStage}
      onComplete={handleAlcatrazComplete}
      onClose={() => { setAlcatrazEscapeActive(false); openScreen('world') }}
      onStartBattle={handleAlcatrazBattle}
    />
  )
}
