import { useState } from 'react'
import type { PlayerState, QuestProgress, Quest } from '@/types/game'
import { RANGERS } from './rangers'
import { ALL_CREATURES } from './creatures'
import { getQuestProgress, getObjectiveTarget } from './questHelpers'

interface Props {
  questProgress: Record<string, QuestProgress>
  player: PlayerState
  onOpenQuestLog: () => void
}

function shortObjective(obj: Quest['objective']): string {
  switch (obj.type) {
    case 'catch': {
      const creature = ALL_CREATURES.find(c => c.id === obj.creatureId)
      return `Catch ${creature?.name ?? obj.creatureId}`
    }
    case 'catch_any':
      return `Catch ${obj.count} creature${obj.count > 1 ? 's' : ''}`
    case 'visit':
      return `Visit ${obj.subregion}`
    case 'catch_type':
      return `Catch ${obj.count} ${obj.creatureType}`
    case 'catch_rarity':
      return `Catch ${obj.count} ${obj.rarity}`
    case 'catch_conservation':
      return `Document ${obj.count} ${obj.status}`
    case 'remove_invasive':
      return `Remove ${obj.count} invasives`
  }
}

export default function QuestTracker({ questProgress, player, onOpenQuestLog }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  // Get active quests
  const activeQuests: { quest: Quest; rangerSprite: string }[] = []
  for (const ranger of RANGERS) {
    for (const quest of ranger.quests) {
      if (questProgress[quest.id]?.status === 'active') {
        activeQuests.push({ quest, rangerSprite: ranger.sprite })
      }
    }
  }

  if (activeQuests.length === 0) return null

  // Show at most 3 quests in the tracker
  const shown = activeQuests.slice(0, 3)

  return (
    <div className="absolute top-[80px] sm:top-[170px] left-1.5 sm:left-3 z-20 pointer-events-auto hidden sm:block" style={{ maxWidth: 'min(360px, calc(100vw - 100px))' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-lg">📋</span>
            <span className="text-white/60 text-xs sm:text-base uppercase tracking-wider font-semibold">
              Quests ({activeQuests.length})
            </span>
          </div>
          <span className="text-white/30 text-xs sm:text-base">{collapsed ? '▼' : '▲'}</span>
        </button>

        {/* Quest entries */}
        {!collapsed && (
          <div className="px-3 pb-3 space-y-2">
            {shown.map(({ quest, rangerSprite }) => {
              const current = getQuestProgress(quest.objective, player)
              const target = getObjectiveTarget(quest.objective)
              const pct = Math.min(100, (current / target) * 100)
              const isComplete = current >= target

              return (
                <div
                  key={quest.id}
                  className="rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={onOpenQuestLog}
                  style={{
                    background: isComplete ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isComplete ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-base">{rangerSprite}</span>
                    <span className="text-white text-xs sm:text-base font-medium truncate flex-1">{quest.title}</span>
                    {isComplete && <span className="text-[10px] sm:text-sm">✅</span>}
                  </div>
                  <p className="text-white/35 text-[10px] sm:text-sm truncate mb-0.5 sm:mb-1">
                    {shortObjective(quest.objective)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isComplete
                            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                            : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                          boxShadow: isComplete ? '0 0 4px rgba(34,197,94,0.3)' : 'none',
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono" style={{
                      color: isComplete ? '#4ade80' : 'rgba(255,255,255,0.3)',
                    }}>
                      {current}/{target}
                    </span>
                  </div>
                </div>
              )
            })}

            {activeQuests.length > 3 && (
              <button
                onClick={onOpenQuestLog}
                className="w-full text-center text-white/25 text-sm hover:text-white/40 transition-colors py-1"
              >
                +{activeQuests.length - 3} more quests
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
