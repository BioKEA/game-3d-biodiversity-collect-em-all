// World-only toasts and prompts that sit between the HUD and <ScreenRouter />:
// world-event banner, border message/peek counter/signpost, capture and gift
// notifications, the post-capture nickname prompt and the fishing hint.
// Rendered by WorldScreen; every block keeps its `screen === 'world'` guard.
import WorldEventBanner from '@/game/WorldEvents'
import { FAST_TRAVEL_DESTINATIONS } from '@/game/features/world/fastTravelDestinations'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function WorldOverlays() {
  const { gameState, map, worldEvents, ui } = useGameState()
  const {
    borderMessage, borderPeek, nearbySignpost, captureNotif, giftNotif,
    nicknamePrompt, nicknameInput, nearbyRangerId, nearbyDock,
  } = ui
  const { handleFastTravel, setGameState, setNicknamePrompt, setNicknameInput } = useGameActions()

  return (
    <>
      {/* World event banner */}
      {gameState.screen === 'world' && (
        <WorldEventBanner
          activeEvent={worldEvents.activeEvent}
          remainingMinutes={worldEvents.remainingMinutes}
          dismissed={worldEvents.dismissed}
          dismiss={worldEvents.dismiss}
          currentSubregion={gameState.currentSubregion}
          onJumpToEvent={() => {
            const evt = worldEvents.activeEvent
            if (!evt) return
            const dest = FAST_TRAVEL_DESTINATIONS.find((d) => d.subregion === evt.subregion)
            if (dest) {
              handleFastTravel(dest.x, dest.y, dest.subregion)
              worldEvents.dismiss()
            }
          }}
        />
      )}

      {/* State border message */}
      {gameState.screen === 'world' && borderMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[320px]">
          <div className="rounded-xl p-2 sm:p-3 border shadow-lg text-center text-xs sm:text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
              borderColor: 'rgba(251,191,36,0.35)',
              backdropFilter: 'blur(12px)',
              color: '#92400e',
              animation: 'notif-enter 0.3s ease-out',
            }}>
            🚧 {borderMessage}
          </div>
        </div>
      )}

      {/* Border peek counter */}
      {gameState.screen === 'world' && borderPeek && (
        <div className="absolute top-12 right-3 z-30">
          <div className="rounded-lg px-3 py-2 text-xs font-bold"
            style={{
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              backdropFilter: 'blur(8px)',
              color: '#dc2626',
            }}>
            ⚠️ {borderPeek.state} — {borderPeek.stepsLeft} step{borderPeek.stepsLeft !== 1 ? 's' : ''} left
          </div>
        </div>
      )}

      {/* Border signpost */}
      {gameState.screen === 'world' && nearbySignpost && !borderMessage && (
        <div className="absolute bottom-20 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[300px]">
          <div className="rounded-xl p-2 sm:p-3 border shadow-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(6,95,70,0.9), rgba(4,120,87,0.85))',
              borderColor: 'rgba(251,191,36,0.5)',
              backdropFilter: 'blur(12px)',
            }}>
            <div className="text-[10px] tracking-widest text-emerald-300 font-bold mb-1">WELCOME TO CALIFORNIA</div>
            <div className="text-sm font-bold text-white">{nearbySignpost.message}</div>
            <div className="text-[11px] text-emerald-200 mt-1.5 italic">{nearbySignpost.fact}</div>
          </div>
        </div>
      )}

      {/* Post-capture notification */}
      {gameState.screen === 'world' && captureNotif && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[300px]">
          <style>{`
            @keyframes notif-enter {
              0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes notif-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
          <div className="rounded-xl p-3 border shadow-lg" style={{
            background: captureNotif.isNewSpecies
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,211,238,0.1))'
              : 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,197,94,0.06))',
            borderColor: captureNotif.isNewSpecies
              ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: captureNotif.isNewSpecies
              ? '0 0 30px rgba(74,222,128,0.15), 0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'notif-enter 0.4s ease-out',
          }}>
            {/* New species / variant badge */}
            {(captureNotif.isNewSpecies || captureNotif.creature.isAlpha || captureNotif.creature.isShiny) && (
              <div className="text-center mb-2">
                <span className="text-[9px] font-black uppercase tracking-[3px] px-3 py-0.5 rounded-full" style={{
                  background: captureNotif.creature.isShiny
                    ? 'linear-gradient(90deg, #c084fc, #e879f9, #c084fc)'
                    : captureNotif.creature.isAlpha
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #22d3ee, #4ade80, #22d3ee)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'notif-shimmer 2s linear infinite',
                }}>
                  {captureNotif.creature.isShiny ? '✨ Shiny Catch!'
                    : captureNotif.creature.isAlpha ? '⭐ Alpha Catch!'
                    : 'New WildDex Entry!'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Creature sprite */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{
                background: captureNotif.creature.isShiny ? 'rgba(192,132,252,0.12)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.12)' : `${captureNotif.creature.color}15`,
                border: `1px solid ${captureNotif.creature.isShiny ? 'rgba(192,132,252,0.3)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.3)' : `${captureNotif.creature.color}30`}`,
                boxShadow: (captureNotif.isNewSpecies || captureNotif.creature.isAlpha || captureNotif.creature.isShiny) ? `0 0 12px ${captureNotif.creature.isShiny ? 'rgba(192,132,252,0.2)' : captureNotif.creature.isAlpha ? 'rgba(251,191,36,0.2)' : `${captureNotif.creature.color}20`}` : 'none',
                filter: captureNotif.creature.isShiny ? 'hue-rotate(180deg) saturate(1.3)' : 'none',
              }}>
                {captureNotif.creature.sprite}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs font-bold">{captureNotif.creature.name}</span>
                  <span className="text-[8px] px-1.5 py-px rounded-full" style={{
                    background: captureNotif.creature.rarity === 'legendary' ? 'rgba(192,132,252,0.15)' :
                      captureNotif.creature.rarity === 'rare' ? 'rgba(251,191,36,0.15)' :
                      captureNotif.creature.rarity === 'uncommon' ? 'rgba(96,165,250,0.15)' : 'rgba(156,163,175,0.15)',
                    color: captureNotif.creature.rarity === 'legendary' ? '#c084fc' :
                      captureNotif.creature.rarity === 'rare' ? '#fbbf24' :
                      captureNotif.creature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af',
                  }}>{captureNotif.creature.rarity}</span>
                </div>
                <p className="text-white/40 text-[9px] mt-0.5">
                  {captureNotif.teamFull
                    ? 'Team full — stored in reserves'
                    : 'Added to your team!'}
                </p>
                <p className="text-white/25 text-[8px]">
                  {gameState.player.captured.length}/{56} species documented
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Friendly-gift notification — what the creature gave you */}
      {gameState.screen === 'world' && giftNotif && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-[300px]">
          <div
            className="rounded-xl p-3 border shadow-lg flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(244,182,52,0.18), rgba(251,191,36,0.10))',
              borderColor: 'rgba(251,191,36,0.4)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 24px rgba(251,191,36,0.18), 0 8px 24px rgba(0,0,0,0.3)',
              animation: 'notif-enter 0.4s ease-out',
            }}
          >
            <div className="text-3xl leading-none flex-shrink-0">{giftNotif.sprite}</div>
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[3px] text-amber-400/90">
                Gift received
              </div>
              <div className="text-white text-sm font-bold leading-tight mt-0.5">
                {giftNotif.itemName}
              </div>
              <div className="text-white/55 text-[10px] mt-0.5">
                Added to inventory · +1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nickname prompt after capture */}
      {gameState.screen === 'world' && nicknamePrompt && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }} onClick={() => setNicknamePrompt(null)} />
          <div className="relative rounded-xl p-4 w-[260px] border shadow-lg" style={{
            background: 'linear-gradient(135deg, rgba(10,22,40,0.97), rgba(8,16,30,0.98))',
            borderColor: 'rgba(74,222,128,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'notif-enter 0.3s ease-out',
          }}>
            <div className="text-center mb-3">
              <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-3xl mb-2" style={{
                background: `${nicknamePrompt.creature.color}12`,
                border: `1px solid ${nicknamePrompt.creature.color}25`,
                filter: nicknamePrompt.creature.isShiny ? 'hue-rotate(180deg) saturate(1.3)' : 'none',
              }}>
                {nicknamePrompt.creature.sprite}
              </div>
              <p className="text-white/50 text-[10px]">Give a nickname to</p>
              <p className="text-white font-bold text-sm">{nicknamePrompt.creature.name}</p>
            </div>
            <input
              type="text"
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value.slice(0, 16))}
              placeholder="Enter nickname..."
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none mb-3"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const name = nicknameInput.trim()
                  if (name) {
                    setGameState(prev => ({
                      ...prev,
                      player: {
                        ...prev.player,
                        team: prev.player.team.map((c, i) =>
                          i === nicknamePrompt.teamIndex ? { ...c, nickname: name } : c
                        ),
                      },
                    }))
                  }
                  setNicknamePrompt(null)
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNicknamePrompt(null)}
                className="flex-1 px-3 py-1.5 rounded-lg text-[10px] text-white/40 transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Skip
              </button>
              <button
                disabled={!nicknameInput.trim()}
                onClick={() => {
                  const name = nicknameInput.trim()
                  if (name) {
                    setGameState(prev => ({
                      ...prev,
                      player: {
                        ...prev.player,
                        team: prev.player.team.map((c, i) =>
                          i === nicknamePrompt.teamIndex ? { ...c, nickname: name } : c
                        ),
                      },
                    }))
                  }
                  setNicknamePrompt(null)
                }}
                className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-30"
                style={{
                  background: 'rgba(74,222,128,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.25)',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fishing prompt near water */}
      {gameState.screen === 'world' && !nearbyRangerId && !nearbyDock && (() => {
        const px = gameState.player.x
        const py = gameState.player.y
        const nearWater = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
          const t = map[py+dy]?.[px+dx]
          return t && t.biome === 'water'
        }) || map[py]?.[px]?.biome === 'beach' || map[py]?.[px]?.biome === 'marsh'
        if (!nearWater) return null
        return (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-sky-500/20">
              <p className="text-sky-300/60 text-[9px] font-medium whitespace-nowrap">
                🎣 Press F to fish
              </p>
            </div>
          </div>
        )
      })()}
    </>
  )
}
