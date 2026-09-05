import BoardwalkMinigame from '@/game/BoardwalkMinigame'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function BoardwalkScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, setGameState } = useGameActions()
  return (
    <BoardwalkMinigame
      playerLevel={gameState.player.level}
      team={gameState.player.team}
      inventory={gameState.player.inventory}
      onClose={() => openScreen('world')}
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
  )
}
