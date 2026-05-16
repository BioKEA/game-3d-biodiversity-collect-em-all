import { useState } from 'react'
import type { CapturedCreature } from '@/types/game'
import { ABILITY_STONES, canLearnMove, teachMove, type AbilityStone } from './moveTutor'
import { TEACHABLE_ABILITY_LIST, getEffectiveAbility, type TeachableAbility } from './abilities'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  team: CapturedCreature[]
  coins: number
  onTeachMove: (creatureIndex: number, updatedCreature: CapturedCreature, cost: number) => void
  onLearnAbility: (creatureIndex: number, abilityId: string, cost: number) => void
  onClose: () => void
}

type Tab = 'moves' | 'abilities'

export default function MoveTutorScreen({ team, coins, onTeachMove, onLearnAbility, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('moves')
  const [selectedStone, setSelectedStone] = useState<AbilityStone | null>(null)
  const [selectedAbility, setSelectedAbility] = useState<TeachableAbility | null>(null)
  const [selectedCreature, setSelectedCreature] = useState<number | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [phase, setPhase] = useState<'stones' | 'creature' | 'replace'>('stones')
  const [abilityPhase, setAbilityPhase] = useState<'list' | 'creature'>('list')

  const handleSelectStone = (stone: AbilityStone) => {
    setSelectedStone(stone)
    setSelectedCreature(null)
    setReplaceIndex(null)
    setPhase('creature')
  }

  const handleSelectCreature = (idx: number) => {
    if (!selectedStone) return
    const creature = team[idx]
    const check = canLearnMove(creature, selectedStone)
    if (!check.canLearn) return

    setSelectedCreature(idx)
    if (creature.moves.length >= 4) {
      setPhase('replace')
    } else {
      handleTeach(idx, undefined)
    }
  }

  const handleTeach = (creatureIdx: number, replaceIdx: number | undefined) => {
    if (!selectedStone) return
    const creature = team[creatureIdx]
    if (coins < selectedStone.cost) return

    const updated = teachMove(creature, selectedStone, replaceIdx)
    onTeachMove(creatureIdx, updated, selectedStone.cost)

    setFlash(`${creature.nickname || creature.name} learned ${selectedStone.move.name}!`)
    setTimeout(() => setFlash(null), 2000)
    setPhase('stones')
    setSelectedStone(null)
    setSelectedCreature(null)
    setReplaceIndex(null)
  }

  const handleSelectAbility = (ability: TeachableAbility) => {
    setSelectedAbility(ability)
    setAbilityPhase('creature')
  }

  const handleTeachAbility = (creatureIdx: number) => {
    if (!selectedAbility) return
    if (coins < selectedAbility.price) return
    const creature = team[creatureIdx]
    onLearnAbility(creatureIdx, selectedAbility.id, selectedAbility.price)
    setFlash(`${creature.nickname || creature.name} learned ${selectedAbility.name}!`)
    setTimeout(() => setFlash(null), 2000)
    setAbilityPhase('list')
    setSelectedAbility(null)
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setPhase('stones')
    setAbilityPhase('list')
    setSelectedStone(null)
    setSelectedAbility(null)
    setSelectedCreature(null)
    setReplaceIndex(null)
  }

  return (
    <FloatingPanel title="Move Tutor" subtitle="Teach new moves & abilities" onClose={onClose} width="md">
      {/* Coin display */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-white/30 text-[10px]">Your coins</span>
        <div className="flex items-center gap-1">
          <span className="text-xs">💰</span>
          <span className="text-yellow-400 text-xs font-bold">{coins}</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 px-3 pt-2">
        <button
          onClick={() => switchTab('moves')}
          className="flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all"
          style={{
            background: tab === 'moves' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
            border: tab === 'moves' ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: tab === 'moves' ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
          }}
        >
          ⚔️ Moves
        </button>
        <button
          onClick={() => switchTab('abilities')}
          className="flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all"
          style={{
            background: tab === 'abilities' ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.03)',
            border: tab === 'abilities' ? '1px solid rgba(236,72,153,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: tab === 'abilities' ? '#f9a8d4' : 'rgba(255,255,255,0.4)',
          }}
        >
          ✨ Abilities
        </button>
      </div>

      {flash && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-center text-xs font-medium text-green-300"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
          {flash}
        </div>
      )}

      <div className="p-3">
        {tab === 'moves' && phase === 'stones' && (
          <div className="space-y-2">
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Available Ability Stones</p>
            <div className="grid grid-cols-2 gap-2">
              {ABILITY_STONES.map(stone => {
                const affordable = coins >= stone.cost
                return (
                  <button
                    key={stone.id}
                    onClick={() => affordable && handleSelectStone(stone)}
                    disabled={!affordable}
                    className="text-left rounded-xl p-2.5 transition-all disabled:opacity-40"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{stone.sprite}</span>
                      <span className="text-white text-[10px] font-semibold">{stone.name}</span>
                    </div>
                    <p className="text-white/40 text-[9px] leading-tight">{stone.move.name} — PWR {stone.move.power || 'DEF'}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-yellow-400/70 text-[9px] font-bold">💰 {stone.cost}</span>
                      <span className="text-white/15 text-[8px]">{stone.compatibleTypes.join(', ')}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'moves' && phase === 'creature' && selectedStone && (
          <div className="space-y-2">
            <button onClick={() => setPhase('stones')}
              className="text-white/40 text-[10px] hover:text-white/60 transition-colors">
              ← Back to stones
            </button>
            <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <span className="text-xl">{selectedStone.sprite}</span>
              <div>
                <p className="text-white text-xs font-semibold">{selectedStone.move.name}</p>
                <p className="text-white/40 text-[9px]">{selectedStone.move.description}</p>
              </div>
            </div>

            <p className="text-white/30 text-[10px] uppercase tracking-wider mt-3">Select a creature</p>
            <div className="space-y-1">
              {team.map((creature, idx) => {
                const check = canLearnMove(creature, selectedStone)
                return (
                  <button
                    key={`${creature.id}-${idx}`}
                    onClick={() => check.canLearn && handleSelectCreature(idx)}
                    disabled={!check.canLearn}
                    className="w-full text-left rounded-lg p-2.5 transition-all disabled:opacity-35"
                    style={{
                      background: check.canLearn ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                      border: check.canLearn ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <PixelCreatureToken creature={creature} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-semibold truncate">{creature.nickname || creature.name}</span>
                          <span className="text-white/25 text-[10px]">Lv.{creature.level}</span>
                          <span className="text-white/15 text-[9px]">{creature.type}</span>
                        </div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {creature.moves.map((m, mi) => (
                            <span key={mi} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">
                              {m.name}
                            </span>
                          ))}
                        </div>
                        {!check.canLearn && (
                          <p className="text-red-400/50 text-[8px] mt-0.5">{check.reason}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'moves' && phase === 'replace' && selectedStone && selectedCreature !== null && (
          <div className="space-y-2">
            <button onClick={() => setPhase('creature')}
              className="text-white/40 text-[10px] hover:text-white/60 transition-colors">
              ← Back
            </button>

            <div className="bg-amber-500/10 border border-amber-500/15 rounded-lg p-2.5">
              <p className="text-amber-300/80 text-[10px] leading-relaxed">
                {team[selectedCreature].nickname || team[selectedCreature].name} already knows 4 moves. Choose one to replace:
              </p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.2)',
            }}>
              <span className="text-sm">{selectedStone.sprite}</span>
              <div>
                <p className="text-green-300 text-[10px] font-semibold">New: {selectedStone.move.name}</p>
                <p className="text-white/30 text-[9px]">PWR {selectedStone.move.power || 'DEF'} · {selectedStone.move.type}</p>
              </div>
            </div>

            <div className="space-y-1">
              {team[selectedCreature].moves.map((move, mi) => (
                <button
                  key={mi}
                  onClick={() => {
                    setReplaceIndex(mi)
                    handleTeach(selectedCreature, mi)
                  }}
                  className={`w-full text-left rounded-lg p-2.5 transition-all ${replaceIndex === mi ? 'ring-1 ring-red-500' : ''}`}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white text-[10px] font-semibold">{move.name}</span>
                      <span className="text-white/30 text-[9px] ml-2">
                        PWR {move.power || 'DEF'} · {move.type}
                      </span>
                    </div>
                    <span className="text-red-400/50 text-[9px]">Replace →</span>
                  </div>
                  <p className="text-white/20 text-[8px] mt-0.5">{move.description}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setPhase('creature')}
              className="w-full py-2 rounded-md bg-white/5 border border-white/10 text-white/40 text-xs hover:bg-white/10 transition-colors mt-2"
            >
              Don&apos;t Replace — Go Back
            </button>
          </div>
        )}

        {tab === 'abilities' && abilityPhase === 'list' && (
          <div className="space-y-2">
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Passive Abilities</p>
            <p className="text-white/25 text-[9px] leading-relaxed -mt-1">
              Teach a permanent passive effect. Replaces the creature&apos;s innate ability.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {TEACHABLE_ABILITY_LIST.map(ability => {
                const affordable = coins >= ability.price
                return (
                  <button
                    key={ability.id}
                    onClick={() => affordable && handleSelectAbility(ability)}
                    disabled={!affordable}
                    className="text-left rounded-xl p-2.5 transition-all disabled:opacity-40"
                    style={{
                      background: 'rgba(236,72,153,0.06)',
                      border: '1px solid rgba(236,72,153,0.15)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ability.sprite}</span>
                      <span className="text-white text-[11px] font-semibold">{ability.name}</span>
                      <span className="text-yellow-400/70 text-[9px] font-bold ml-auto">💰 {ability.price}</span>
                    </div>
                    <p className="text-white/45 text-[9px] leading-tight">{ability.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'abilities' && abilityPhase === 'creature' && selectedAbility && (
          <div className="space-y-2">
            <button onClick={() => { setAbilityPhase('list'); setSelectedAbility(null) }}
              className="text-white/40 text-[10px] hover:text-white/60 transition-colors">
              ← Back to abilities
            </button>

            <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{
              background: 'rgba(236,72,153,0.1)',
              border: '1px solid rgba(236,72,153,0.2)',
            }}>
              <span className="text-xl">{selectedAbility.sprite}</span>
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{selectedAbility.name}</p>
                <p className="text-white/40 text-[9px]">{selectedAbility.description}</p>
              </div>
            </div>

            <p className="text-white/30 text-[10px] uppercase tracking-wider mt-3">Select a creature</p>
            <div className="space-y-1">
              {team.map((creature, idx) => {
                const current = getEffectiveAbility(creature)
                const alreadyHas = creature.learnedAbility === selectedAbility.id
                return (
                  <button
                    key={`${creature.id}-${idx}`}
                    onClick={() => !alreadyHas && handleTeachAbility(idx)}
                    disabled={alreadyHas}
                    className="w-full text-left rounded-lg p-2.5 transition-all disabled:opacity-35"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <PixelCreatureToken creature={creature} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-semibold truncate">{creature.nickname || creature.name}</span>
                          <span className="text-white/25 text-[10px]">Lv.{creature.level}</span>
                        </div>
                        <p className="text-white/35 text-[9px] mt-0.5">
                          Current: <span className="text-white/60">{current?.name ?? 'None'}</span>
                        </p>
                        {alreadyHas && (
                          <p className="text-pink-300/70 text-[8px] mt-0.5">Already knows this ability</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </FloatingPanel>
  )
}
