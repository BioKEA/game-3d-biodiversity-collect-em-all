import { useState, useEffect } from 'react'
import type { CapturedCreature, BreedingSlot } from '@/types/game'
import { canBreed, startBreeding, isBreedingReady, getBreedingTimeLeft, hatchOffspring, getBreedingTypeLabel } from './breeding'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  team: CapturedCreature[]
  nursery: BreedingSlot | null
  onClose: () => void
  onStartBreeding: (slot: BreedingSlot, idx1: number, idx2: number) => void
  onHatch: (creature: CapturedCreature) => void
  onCancelBreeding: () => void
}

export default function BreedingScreen({ team, nursery, onClose, onStartBreeding, onHatch, onCancelBreeding }: Props) {
  const [parent1Idx, setParent1Idx] = useState<number | null>(null)
  const [parent2Idx, setParent2Idx] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hatched, setHatched] = useState<CapturedCreature | null>(null)

  // Update timer
  useEffect(() => {
    if (!nursery) return
    const tick = () => setTimeLeft(getBreedingTimeLeft(nursery))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [nursery])

  const handleStartBreeding = () => {
    if (parent1Idx === null || parent2Idx === null) return
    const p1 = team[parent1Idx]
    const p2 = team[parent2Idx]
    if (!p1 || !p2) return
    const slot = startBreeding(p1, p2)
    onStartBreeding(slot, parent1Idx, parent2Idx)
    setParent1Idx(null)
    setParent2Idx(null)
  }

  const handleHatch = () => {
    if (!nursery) return
    const offspring = hatchOffspring(nursery)
    if (offspring) {
      setHatched(offspring)
    }
  }

  const handleCollect = () => {
    if (hatched) {
      onHatch(hatched)
      setHatched(null)
    }
  }

  const p1 = parent1Idx !== null ? team[parent1Idx] : null
  const p2 = parent2Idx !== null ? team[parent2Idx] : null
  const breedCheck = p1 && p2 ? canBreed(p1, p2) : null

  const ready = nursery ? isBreedingReady(nursery) : false

  return (
    <FloatingPanel
      title="Nursery"
      subtitle="Breed creatures to discover new species"
      onClose={onClose}
      width="md"
    >
      <div className="p-3">
        {/* Hatched result */}
        {hatched ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-bounce">
              <PixelCreatureToken creature={hatched} size={72} selected />
            </div>
            <div className="text-center">
              <p className="text-pink-400 text-xs tracking-widest uppercase mb-1">A new creature hatched!</p>
              <h3 className="text-white text-xl font-bold">{hatched.name}</h3>
              <p className="text-white/40 text-xs italic">{hatched.scientificName}</p>
              <p className="text-white/50 text-xs mt-2 max-w-xs">{hatched.description}</p>
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'HP', value: hatched.stats.maxHp, color: '#22c55e' },
                { label: 'ATK', value: hatched.stats.attack, color: '#ef4444' },
                { label: 'DEF', value: hatched.stats.defense, color: '#3b82f6' },
                { label: 'SPD', value: hatched.stats.speed, color: '#eab308' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-[9px] text-white/30">{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            {hatched.parentIds && (
              <p className="text-white/30 text-[10px] mt-1">
                Bred from {hatched.parentIds[0].replace(/-/g, ' ')} + {hatched.parentIds[1].replace(/-/g, ' ')}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {hatched.moves.map(m => (
                <span key={m.name} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60">
                  {m.name}
                </span>
              ))}
            </div>
            <button
              onClick={handleCollect}
              className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm active:scale-95 transition-transform"
            >
              Add to Team!
            </button>
          </div>
        ) : nursery ? (
          /* Active breeding */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <PixelCreatureToken creature={nursery.parent1} size={48} />
                </div>
                <p className="text-white text-xs">{nursery.parent1.name}</p>
                <p className="text-white/40 text-[10px]">Lv.{nursery.parent1.level}</p>
              </div>
              <div className="text-pink-400 text-2xl">+</div>
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <PixelCreatureToken creature={nursery.parent2} size={48} />
                </div>
                <p className="text-white text-xs">{nursery.parent2.name}</p>
                <p className="text-white/40 text-[10px]">Lv.{nursery.parent2.level}</p>
              </div>
            </div>

            <div className="text-center mt-4">
              {ready ? (
                <>
                  <PixelIcon icon="🥚" size={64} variant="mystic" selected className="mb-3 animate-pulse mx-auto" />
                  <p className="text-emerald-400 text-sm font-bold">Ready to hatch!</p>
                  <button
                    onClick={handleHatch}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm active:scale-95 transition-transform"
                  >
                    Hatch Egg
                  </button>
                </>
              ) : (
                <>
                  <PixelIcon icon="🥚" size={64} variant="mystic" className="mb-3 mx-auto" />
                  <p className="text-white/60 text-sm">Incubating...</p>
                  <p className="text-cyan-400 text-2xl font-mono font-bold mt-2">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </p>
                  {/* Progress bar */}
                  <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden mt-3 mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, 100 - (timeLeft / 120) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-white/30 text-[10px] mt-1">Come back soon!</p>
                </>
              )}
            </div>

            <button
              onClick={onCancelBreeding}
              className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs"
            >
              Cancel Breeding
            </button>
          </div>
        ) : (
          /* Selection mode */
          <>
            {/* Selection area */}
            <div className="flex items-center justify-center gap-4 mb-6 py-4">
              <div
                className="w-24 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{
                  borderColor: parent1Idx !== null ? '#ec4899' : 'rgba(255,255,255,0.15)',
                  background: parent1Idx !== null ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.02)',
                }}
              >
                {p1 ? (
                  <>
                    <PixelCreatureToken creature={p1} size={40} selected />
                    <p className="text-white text-[10px] mt-1 truncate w-full text-center px-1">{p1.name}</p>
                    <p className="text-white/40 text-[9px]">Lv.{p1.level}</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl text-white/20">?</span>
                    <p className="text-white/30 text-[9px] mt-1">Parent 1</p>
                  </>
                )}
              </div>

              <div className="text-pink-400 text-xl">+</div>

              <div
                className="w-24 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{
                  borderColor: parent2Idx !== null ? '#a855f7' : 'rgba(255,255,255,0.15)',
                  background: parent2Idx !== null ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.02)',
                }}
              >
                {p2 ? (
                  <>
                    <PixelCreatureToken creature={p2} size={40} selected />
                    <p className="text-white text-[10px] mt-1 truncate w-full text-center px-1">{p2.name}</p>
                    <p className="text-white/40 text-[9px]">Lv.{p2.level}</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl text-white/20">?</span>
                    <p className="text-white/30 text-[9px] mt-1">Parent 2</p>
                  </>
                )}
              </div>
            </div>

            {/* Compatibility indicator */}
            {breedCheck && (
              <div className={`text-center mb-4 text-xs ${breedCheck.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {breedCheck.ok ? (
                  <>
                    <span className="text-sm">Compatible!</span>
                    <span className="text-white/30 ml-2">{getBreedingTypeLabel(p1!.type, p2!.type)}</span>
                  </>
                ) : breedCheck.reason}
              </div>
            )}

            {/* Breed button */}
            {p1 && p2 && breedCheck?.ok && team.length < 6 && (
              <div className="text-center mb-4">
                <button
                  onClick={handleStartBreeding}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm active:scale-95 transition-transform"
                >
                  Start Breeding
                </button>
              </div>
            )}
            {team.length >= 6 && p1 && p2 && (
              <p className="text-center text-yellow-400/60 text-xs mb-4">Team is full (6/6) — make room first</p>
            )}

            {/* Team selection grid */}
            <h3 className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wider">Select Parents</h3>
            <div className="space-y-1.5">
              {team.map((creature, idx) => {
                const isP1 = parent1Idx === idx
                const isP2 = parent2Idx === idx
                const isSelected = isP1 || isP2
                const tooLow = creature.level < 5

                return (
                  <button
                    key={`${creature.id}-${idx}`}
                    onClick={() => {
                      if (tooLow) return
                      if (isP1) { setParent1Idx(null); return }
                      if (isP2) { setParent2Idx(null); return }
                      if (parent1Idx === null) setParent1Idx(idx)
                      else if (parent2Idx === null) setParent2Idx(idx)
                      else { setParent1Idx(parent2Idx); setParent2Idx(idx) }
                    }}
                    disabled={tooLow}
                    className="w-full rounded-lg border p-2.5 flex items-center gap-3 transition-all text-left disabled:opacity-40"
                    style={{
                      background: isSelected ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.02)',
                      borderColor: isP1 ? '#ec4899' : isP2 ? '#a855f7' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <PixelCreatureToken creature={creature} size={34} selected={isSelected} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-semibold truncate">{creature.nickname || creature.name}</span>
                        <span className="text-emerald-400 text-[10px]">Lv.{creature.level}</span>
                        {isP1 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">P1</span>}
                        {isP2 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">P2</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 text-[9px]">{creature.type}</span>
                        {tooLow && <span className="text-red-400/60 text-[9px]">Lv.5 required</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {team.length < 2 && (
              <p className="text-center text-white/30 text-xs mt-6">Need at least 2 creatures to breed</p>
            )}
          </>
        )}
      </div>
    </FloatingPanel>
  )
}
