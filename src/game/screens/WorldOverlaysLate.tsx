// World-only overlays that sit *after* <ScreenRouter /> in the tree: the
// hotkey legend / fast-travel panel and the landmark info card. Kept in a
// separate component so their DOM order (and therefore z-stacking) is
// unchanged.
import { getLandmarkAt, LANDMARK_INFO } from '@/game/landmarks'
import { FAST_TRAVEL_DESTINATIONS } from '@/game/features/world/fastTravelDestinations'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function WorldOverlaysLate() {
  const { gameState, playerStats, exploredTiles, ui } = useGameState()
  const { showHotkeys, showFastTravel, currentLandmark, nearbyRangerId, nearbyDock } = ui
  const { handleFastTravel, setShowFastTravel } = useGameActions()

  return (
    <>
      {/* Hotkey legend & fast travel panels — anchored to bottom-left */}
      {gameState.screen === 'world' && (showHotkeys || showFastTravel) && (
        <div className="absolute bottom-16 sm:bottom-4 left-2 sm:left-4 z-30">
          {showHotkeys && (
            <div
              className="rounded-xl p-3 min-w-[200px]"
              style={{
                background: 'rgba(0,0,0,0.75)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'menu-spring-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-2">Keyboard</div>
              <div className="space-y-1 text-[10px]">
                {[
                  { keys: ['WASD', '↑↓←→'], label: 'Move' },
                  { keys: ['Space'], label: 'Interact / Talk' },
                  { keys: ['F'], label: 'Fish (near water)' },
                  { keys: ['C'], label: 'Catalog' },
                  { keys: ['B'], label: 'WildDex' },
                  { keys: ['J'], label: 'Journal' },
                  { keys: ['Q'], label: 'Quests' },
                  { keys: ['T'], label: 'Trade' },
                  { keys: ['N'], label: 'Nursery' },
                  { keys: ['R'], label: 'Craft' },
                  { keys: ['H'], label: 'Habitats' },
                  { keys: ['L'], label: 'Ranks' },
                  { keys: ['M'], label: 'Music toggle' },
                  { keys: ['Esc'], label: 'Back / Close' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <div className="flex gap-1">
                      {row.keys.map(k => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono text-white/70"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-white/55">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showFastTravel && (
            <div
              className="rounded-xl p-3 w-[280px]"
              style={{
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(251,191,36,0.2)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                animation: 'menu-spring-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-amber-400 uppercase tracking-widest font-bold">Fast Travel</div>
                <button
                  onClick={() => setShowFastTravel(false)}
                  className="text-white/30 hover:text-white/60 text-xs"
                  aria-label="Close"
                >✕</button>
              </div>
              <p className="text-[8px] text-white/30 mb-2">Jump to a known location</p>
              <div className="grid grid-cols-1 gap-1 max-h-[280px] overflow-y-auto pr-1">
                {FAST_TRAVEL_DESTINATIONS.map(dest => {
                  const isExplored = exploredTiles.has(`${dest.x},${dest.y}`)
                  const subregionVisited = playerStats.uniqueSubregionsVisited.includes(dest.subregion)
                  const unlocked = isExplored || subregionVisited
                  return (
                    <button
                      key={dest.name}
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return
                        handleFastTravel(dest.x, dest.y, dest.subregion)
                        setShowFastTravel(false)
                      }}
                      className="rounded-lg p-2 text-left transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed group"
                      style={{
                        background: unlocked ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${unlocked ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                      title={unlocked ? `Travel to ${dest.name} — ${dest.description}` : `🔒 Visit this place first to unlock`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none mt-0.5">{unlocked ? dest.emoji : '🔒'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="text-[10px] text-white/80 font-medium truncate">{dest.name}</div>
                            <div className="text-[7px] text-white/25 uppercase tracking-wider flex-shrink-0">{dest.region}</div>
                          </div>
                          <div className="text-[8px] text-white/40 leading-snug mt-0.5 line-clamp-2">
                            {unlocked ? dest.description : 'Visit to unlock'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Landmark info popup */}
      {gameState.screen === 'world' && currentLandmark && !nearbyRangerId && !nearbyDock && (() => {
        const info = LANDMARK_INFO[currentLandmark]
        if (!info) return null
        const lm = getLandmarkAt(gameState.player.x, gameState.player.y)
        return (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10 shadow-xl max-w-[560px]">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl">{lm?.emoji}</span>
                <h3 className="text-white font-bold text-xl">{currentLandmark}</h3>
              </div>
              <p className="text-white/50 text-lg leading-relaxed mb-4">{info.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-base text-white/30 uppercase tracking-wider">Local species</span>
                <div className="flex gap-1">
                  {info.creatures.map((c, i) => (
                    <span key={i} className="text-2xl">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
