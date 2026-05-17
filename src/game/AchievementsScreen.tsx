import { ACHIEVEMENTS, type PlayerStats } from './achievements'
import type { GameState } from '@/types/game'
import FloatingPanel from './FloatingPanel'
import PixelIcon from './PixelIcon'

interface Props {
  gameState: GameState
  stats: PlayerStats
  unlockedIds: string[]
  onClose: () => void
}

const CATEGORY_INFO: Record<string, { label: string; color: string; icon: string }> = {
  exploration: { label: 'Exploration', color: '#22c55e', icon: '🗺️' },
  collection: { label: 'Collection', color: '#eab308', icon: '📦' },
  battle: { label: 'Battle', color: '#ef4444', icon: '⚔️' },
  breeding: { label: 'Breeding', color: '#ec4899', icon: '🥚' },
  mastery: { label: 'Mastery', color: '#8b5cf6', icon: '💎' },
}

export default function AchievementsScreen({ gameState, stats, unlockedIds, onClose }: Props) {
  const categories = ['exploration', 'collection', 'battle', 'breeding', 'mastery']
  const totalUnlocked = unlockedIds.length
  const totalAchievements = ACHIEVEMENTS.length

  return (
    <FloatingPanel
      title="Achievements"
      subtitle={`${totalUnlocked}/${totalAchievements} unlocked`}
      onClose={onClose}
      width="md"
    >
      <div className="shrink-0 px-4 pt-2">
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(totalUnlocked / totalAchievements) * 100}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #eab308)',
            }}
          />
        </div>
      </div>

      {/* Achievement list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {categories.map(cat => {
          const info = CATEGORY_INFO[cat]
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat)
          const catUnlocked = catAchievements.filter(a => unlockedIds.includes(a.id)).length

          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon icon={info.icon} size={20} color={info.color} selected />
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  {info.label}
                </span>
                <span className="text-white/30 text-[10px]">
                  {catUnlocked}/{catAchievements.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {catAchievements.map(achievement => {
                  const unlocked = unlockedIds.includes(achievement.id)
                  // Calculate progress for certain achievements
                  const progress = getProgress(achievement.id, gameState, stats)

                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border transition-all"
                      style={{
                        background: unlocked ? `${info.color}08` : 'rgba(255,255,255,0.01)',
                        borderColor: unlocked ? `${info.color}25` : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: unlocked ? `${info.color}15` : 'rgba(255,255,255,0.03)',
                          filter: unlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                        }}
                      >
                        <PixelIcon icon={achievement.icon} size={28} color={info.color} selected={unlocked} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: unlocked ? info.color : 'rgba(255,255,255,0.3)' }}
                        >
                          {achievement.name}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {achievement.description}
                        </p>
                        {!unlocked && progress !== null && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, progress.percent)}%`,
                                  background: info.color,
                                  opacity: 0.5,
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-white/20 shrink-0">
                              {progress.label}
                            </span>
                          </div>
                        )}
                      </div>
                      {unlocked && (
                        <PixelIcon icon="✓" size={16} color={info.color} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </FloatingPanel>
  )
}

function getProgress(
  id: string,
  state: GameState,
  stats: PlayerStats
): { percent: number; label: string } | null {
  switch (id) {
    case 'first-steps':
      return { percent: (stats.totalStepsWalked / 50) * 100, label: `${stats.totalStepsWalked}/50` }
    case 'marathon-walker':
      return { percent: (stats.totalStepsWalked / 1000) * 100, label: `${stats.totalStepsWalked}/1000` }
    case 'urban-explorer':
      return { percent: (stats.uniqueSubregionsVisited.length / 5) * 100, label: `${stats.uniqueSubregionsVisited.length}/5` }
    case 'cartographer':
      return { percent: (stats.uniqueSubregionsVisited.length / 15) * 100, label: `${stats.uniqueSubregionsVisited.length}/15` }
    case 'biome-hopper':
      return { percent: (stats.uniqueBiomesVisited.length / 8) * 100, label: `${stats.uniqueBiomesVisited.length}/8` }
    case 'first-catch':
      return { percent: stats.totalCreaturesCaught > 0 ? 100 : 0, label: `${stats.totalCreaturesCaught}/1` }
    case 'budding-collector':
      return { percent: (state.player.captured.length / 5) * 100, label: `${state.player.captured.length}/5` }
    case 'naturalist':
      return { percent: (state.player.catalog.length / 15) * 100, label: `${state.player.catalog.length}/15` }
    case 'completionist':
      return { percent: (state.player.captured.length / 34) * 100, label: `${state.player.captured.length}/34` }
    case 'first-victory':
      return { percent: stats.totalBattlesWon > 0 ? 100 : 0, label: `${stats.totalBattlesWon}/1` }
    case 'battle-hardened':
      return { percent: (stats.totalBattlesWon / 25) * 100, label: `${stats.totalBattlesWon}/25` }
    case 'champion':
      return { percent: (stats.totalBattlesWon / 100) * 100, label: `${stats.totalBattlesWon}/100` }
    case 'level-10':
      return { percent: (state.player.level / 10) * 100, label: `Lv.${state.player.level}/10` }
    case 'level-25':
      return { percent: (state.player.level / 25) * 100, label: `Lv.${state.player.level}/25` }
    case 'first-hatch':
      return { percent: stats.totalBreedsCompleted > 0 ? 100 : 0, label: `${stats.totalBreedsCompleted}/1` }
    case 'nursery-master':
      return { percent: (stats.totalBreedsCompleted / 10) * 100, label: `${stats.totalBreedsCompleted}/10` }
    case 'first-evolution':
      return { percent: stats.totalEvolutions > 0 ? 100 : 0, label: `${stats.totalEvolutions}/1` }
    case 'full-team':
      return { percent: (state.player.team.length / 6) * 100, label: `${state.player.team.length}/6` }
    default:
      return null
  }
}
