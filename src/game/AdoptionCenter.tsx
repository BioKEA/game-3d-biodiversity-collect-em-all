import { useState } from 'react'
import type { CapturedCreature } from '@/types/game'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  team: CapturedCreature[]
  reserves: CapturedCreature[]
  onClose: () => void
  onRelease: (teamIndex: number) => void
  onSwapFromReserve: (reserveIndex: number, teamIndex: number) => void
  onAdoptFromReserve: (reserveIndex: number) => void
  onReleaseFromReserve: (reserveIndex: number) => void
}

export default function AdoptionCenter({ team, reserves, onClose, onRelease, onSwapFromReserve, onAdoptFromReserve, onReleaseFromReserve }: Props) {
  const [confirmRelease, setConfirmRelease] = useState<{ type: 'team' | 'reserve'; index: number } | null>(null)
  const [swapTarget, setSwapTarget] = useState<number | null>(null) // reserve index to swap in

  return (
    <FloatingPanel
      title="Adoption Center"
      subtitle="Manage your creatures"
      onClose={onClose}
      width="lg"
    >
      <div className="p-3 space-y-3">
        {/* Active team */}
        <div className="space-y-1.5">
          <h3 className="text-white/40 text-[10px] uppercase tracking-wider px-1 flex items-center gap-1.5">
            <PixelIcon icon="🎒" size={18} variant="item" /> Active Team ({team.length}/6)
          </h3>
          {team.map((creature, i) => (
            <div
              key={`team-${creature.id}-${i}`}
              className="rounded-lg border p-2 transition-all"
              style={{
                background: i === 0 ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
                borderColor: swapTarget !== null ? 'rgba(56,189,248,0.3)' : i === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2">
                <PixelCreatureToken creature={creature} size={30} selected={i === 0} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white text-[10px] font-semibold truncate">{creature.nickname || creature.name}</span>
                    <span className="text-emerald-400 text-[9px]">Lv.{creature.level}</span>
                    {i === 0 && <span className="text-[7px] px-1 py-px rounded-full bg-emerald-500/15 text-emerald-400">LEAD</span>}
                    {creature.isAlpha && <PixelIcon icon="⭐" size={14} variant="gold" />}
                    {creature.isShiny && <PixelIcon icon="✨" size={14} variant="mystic" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-white/30 capitalize">{creature.type}</span>
                    <span className="text-[8px] text-white/15">·</span>
                    <span className="text-[8px] text-white/25">{creature.stats.hp}/{creature.stats.maxHp} HP</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {swapTarget !== null ? (
                    <button
                      onClick={() => { onSwapFromReserve(swapTarget, i); setSwapTarget(null) }}
                      className="px-2.5 py-1.5 text-[9px] rounded font-semibold transition-all hover:scale-105"
                      style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                    >
                      Swap Here
                    </button>
                  ) : (
                    <>
                      {i > 0 && team.length > 1 && (
                        <button
                          onClick={() => setConfirmRelease({ type: 'team', index: i })}
                          className="px-2 py-1.5 text-[9px] rounded transition-all hover:bg-red-500/15"
                          style={{ color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.1)' }}
                        >
                          Release
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reserves */}
        <div className="space-y-1.5">
          <h3 className="text-white/40 text-[10px] uppercase tracking-wider px-1 flex items-center gap-1.5">
            <PixelIcon icon="🏠" size={18} variant="nature" /> Reserves ({reserves.length})
          </h3>
          {reserves.length === 0 ? (
            <div className="rounded-lg border border-white/5 p-4 text-center">
              <p className="text-white/20 text-[10px]">No creatures in reserves</p>
              <p className="text-white/10 text-[8px] mt-1">Creatures captured when your team is full go here</p>
            </div>
          ) : (
            reserves.map((creature, i) => (
              <div
                key={`reserve-${creature.id}-${i}`}
                className="rounded-lg border border-white/5 p-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2">
                  <PixelCreatureToken creature={creature} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-white text-[10px] font-semibold truncate">{creature.nickname || creature.name}</span>
                      <span className="text-emerald-400 text-[9px]">Lv.{creature.level}</span>
                      {creature.isAlpha && <PixelIcon icon="⭐" size={14} variant="gold" />}
                      {creature.isShiny && <PixelIcon icon="✨" size={14} variant="mystic" />}
                    </div>
                    <span className="text-[8px] text-white/25 capitalize">{creature.type}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {team.length < 6 && (
                      <button
                        onClick={() => onAdoptFromReserve(i)}
                        className="px-2.5 py-1.5 text-[9px] rounded font-semibold transition-all hover:scale-105"
                        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
                      >
                        Add
                      </button>
                    )}
                    <button
                      onClick={() => setSwapTarget(i)}
                      className="px-2.5 py-1.5 text-[9px] rounded transition-all hover:scale-105"
                      style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}
                    >
                      Swap
                    </button>
                    <button
                      onClick={() => setConfirmRelease({ type: 'reserve', index: i })}
                      className="px-2 py-1.5 text-[9px] rounded transition-all hover:bg-red-500/15"
                      style={{ color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.1)' }}
                    >
                      Release
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cancel swap mode */}
        {swapTarget !== null && (
          <button
            onClick={() => setSwapTarget(null)}
            className="w-full py-2 rounded-lg text-[10px] text-white/40 transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel Swap
          </button>
        )}
      </div>

      {/* Release confirmation dialog */}
      {confirmRelease && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmRelease(null)} />
          <div className="relative rounded-xl p-4 w-[260px] border shadow-lg" style={{
            background: 'linear-gradient(135deg, rgba(20,10,10,0.97), rgba(15,5,5,0.98))',
            borderColor: 'rgba(239,68,68,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {(() => {
              const creature = confirmRelease.type === 'team'
                ? team[confirmRelease.index]
                : reserves[confirmRelease.index]
              if (!creature) return null
              return (
                <>
                  <div className="text-center mb-3">
                    <span className="flex justify-center mb-2"><PixelCreatureToken creature={creature} size={56} /></span>
                    <p className="text-white/50 text-[10px]">Release</p>
                    <p className="text-white font-bold text-sm">{creature.nickname || creature.name}?</p>
                  </div>
                  <p className="text-red-400/60 text-[9px] text-center mb-3">
                    This creature will be set free and cannot be recovered.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRelease(null)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-[10px] text-white/40 hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => {
                        if (confirmRelease.type === 'team') {
                          onRelease(confirmRelease.index)
                        } else {
                          onReleaseFromReserve(confirmRelease.index)
                        }
                        setConfirmRelease(null)
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      Release
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </FloatingPanel>
  )
}
