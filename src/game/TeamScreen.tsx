import { useState, useCallback } from 'react'
import type { CapturedCreature, InventoryItem } from '@/types/game'
import { getEvolutionTarget } from './evolutions'
import { ALL_CREATURES } from './creatures'
import { HELD_ITEMS, getHeldItem } from './heldItems'
import { getHappiness, getHappinessLabel, MAX_HAPPINESS } from './happiness'
import FloatingPanel from './FloatingPanel'

interface Props {
  team: CapturedCreature[]
  inventory: InventoryItem[]
  coins?: number
  onClose: () => void
  onSwapLead: (index: number) => void
  onNickname?: (index: number, nickname: string | undefined) => void
  onEvolve?: (index: number) => void
  onHealAll?: () => void
  onAssignHeldItem?: (creatureIndex: number, itemId: string | null) => void
  onPetCreature?: (creatureIndex: number) => void
  onUseHealItem?: (itemId: string, creatureIndex: number) => void
}

const HEAL_COST = 50

/** How much a heal item restores. `fullHeal` means top off to maxHp. */
export function getHealAmount(itemId: string): { hp: number; fullHeal: boolean } {
  switch (itemId) {
    case 'herb-potion': return { hp: 30, fullHeal: false }
    case 'kelp-wrap': return { hp: 40, fullHeal: false }
    case 'super-potion': return { hp: 80, fullHeal: false }
    case 'max-potion': return { hp: 0, fullHeal: true }
    case 'full-restore': return { hp: 0, fullHeal: true }
    case 'mystic-elixir': return { hp: 0, fullHeal: true }
    case 'cotton-candy': return { hp: 15, fullHeal: false }
    case 'boardwalk-funnel-cake': return { hp: 30, fullHeal: false }
    default: return { hp: 25, fullHeal: false }
  }
}

function formatHealAmount(itemId: string): string {
  const h = getHealAmount(itemId)
  return h.fullHeal ? 'Full HP' : `+${h.hp} HP`
}

export default function TeamScreen({ team, inventory, coins = 0, onClose, onSwapLead, onNickname, onEvolve, onHealAll, onAssignHeldItem, onPetCreature, onUseHealItem }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [heldItemPickerIdx, setHeldItemPickerIdx] = useState<number | null>(null)
  const [healItemPickerId, setHealItemPickerId] = useState<string | null>(null)
  const [petHearts, setPetHearts] = useState<{ id: number; idx: number }[]>([])
  const [petBounce, setPetBounce] = useState<number | null>(null)

  const handlePet = useCallback((idx: number) => {
    onPetCreature?.(idx)
    setPetBounce(idx)
    setTimeout(() => setPetBounce(null), 500)
    const id = Date.now()
    setPetHearts(prev => [...prev, { id, idx }])
    setTimeout(() => setPetHearts(prev => prev.filter(h => h.id !== id)), 1500)
  }, [onPetCreature])
  const injured = team.some(c => c.stats.hp < c.stats.maxHp)
  const canAfford = coins >= HEAL_COST
  // Available held items in inventory (qty > 0)
  const availableHeldItems = inventory.filter(i => i.type === 'held' && i.quantity > 0)
  return (
    <FloatingPanel
      title="Your Team"
      subtitle={`${team.length}/6 creatures`}
      onClose={onClose}
      width="md"
    >
      <div className="p-3 space-y-3">
        {/* Quick heal */}
        {onHealAll && (
          <button
            onClick={() => { if (injured && canAfford) onHealAll() }}
            disabled={!injured || !canAfford}
            className="w-full rounded-lg p-2.5 flex items-center justify-between transition-all disabled:opacity-40 enabled:active:scale-[0.98] enabled:hover:brightness-110"
            style={{
              background: injured && canAfford ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.08))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${injured && canAfford ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">❤️</span>
              <div className="text-left">
                <p className="text-white text-xs font-bold">Heal Team</p>
                <p className="text-white/40 text-[9px]">
                  {!injured ? 'All creatures at full HP' : !canAfford ? `Need ${HEAL_COST} coins` : 'Restore all HP'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-300 text-[11px] font-bold">
              <span>💰</span>
              <span>{HEAL_COST}</span>
            </div>
          </button>
        )}

        {/* Team */}
        <div className="space-y-1.5">
          <h3 className="text-white/40 text-[10px] uppercase tracking-wider px-1">Active Team</h3>
          {team.map((creature, i) => (
            <div
              key={`${creature.id}-${i}`}
              className="rounded-lg border p-2.5 transition-all"
              style={{
                background: i === 0 ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
                borderColor: i === 0 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 relative"
                  style={{
                    background: creature.isShiny ? 'rgba(192,132,252,0.12)' : creature.isAlpha ? 'rgba(251,191,36,0.12)' : `${creature.color}15`,
                    filter: creature.isShiny ? 'hue-rotate(180deg) saturate(1.3)' : 'none',
                    transform: petBounce === i ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {creature.sprite}
                  {creature.isAlpha && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                  {creature.isShiny && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                  {petHearts.filter(h => h.idx === i).map(h => (
                    <span key={h.id} className="absolute text-sm pointer-events-none" style={{
                      animation: 'pet-heart-float 1.2s ease-out forwards',
                      left: '50%',
                      top: '-4px',
                    }}>❤️</span>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {editingIdx === i ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value.slice(0, 16))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            onNickname?.(i, editValue.trim() || undefined)
                            setEditingIdx(null)
                          } else if (e.key === 'Escape') {
                            setEditingIdx(null)
                          }
                        }}
                        onBlur={() => {
                          onNickname?.(i, editValue.trim() || undefined)
                          setEditingIdx(null)
                        }}
                        className="text-white text-xs font-semibold bg-white/5 border border-white/15 rounded px-1.5 py-0.5 outline-none w-24"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-white text-xs font-semibold truncate">
                          {creature.nickname || creature.name}
                        </span>
                        {onNickname && (
                          <button
                            onClick={() => { setEditingIdx(i); setEditValue(creature.nickname || '') }}
                            className="text-[9px] text-white/20 hover:text-white/50 transition-colors"
                            title="Edit nickname"
                          >
                            ✏️
                          </button>
                        )}
                      </>
                    )}
                    <span className="text-emerald-400 text-[10px]">Lv.{creature.level}</span>
                    {i === 0 && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        LEAD
                      </span>
                    )}
                  </div>
                  {creature.nickname && (
                    <p className="text-[8px] text-white/25 italic">{creature.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(creature.stats.hp / creature.stats.maxHp) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/40">
                      {creature.stats.hp}/{creature.stats.maxHp}
                    </span>
                  </div>
                  <div className="flex gap-2.5 mt-0.5">
                    <span className="text-[8px] text-red-400">ATK {creature.stats.attack}</span>
                    <span className="text-[8px] text-blue-400">DEF {creature.stats.defense}</span>
                    <span className="text-[8px] text-yellow-400">SPD {creature.stats.speed}</span>
                  </div>
                  {(() => {
                    const h = getHappiness(creature)
                    const label = getHappinessLabel(h)
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px]">{label.emoji}</span>
                        <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(h / MAX_HAPPINESS) * 100}%`,
                              background: `linear-gradient(90deg, ${label.color}, #f472b6)`,
                            }}
                          />
                        </div>
                        <span className="text-[8px]" style={{ color: label.color }}>{label.label}</span>
                        {onPetCreature && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePet(i) }}
                            title="Pet — raise happiness"
                            disabled={h >= MAX_HAPPINESS}
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold transition-all enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-40"
                            style={{
                              background: h >= MAX_HAPPINESS ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(236,72,153,0.1))',
                              border: `1px solid ${h >= MAX_HAPPINESS ? 'rgba(255,255,255,0.08)' : 'rgba(244,114,182,0.35)'}`,
                              color: h >= MAX_HAPPINESS ? 'rgba(255,255,255,0.3)' : '#f9a8d4',
                            }}
                          >
                            ❤️ Pet
                          </button>
                        )}
                      </div>
                    )
                  })()}
                  {(() => {
                    const evo = getEvolutionTarget(creature.id)
                    if (!evo) return null
                    const target = ALL_CREATURES.find(c => c.id === evo.toId)
                    if (!target) return null
                    const ready = creature.level >= evo.level
                    return (
                      <div className={`flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[8px] ${ready ? 'bg-amber-500/10 text-amber-300' : 'bg-white/[0.02] text-white/30'}`}>
                        <span>{ready ? '✨' : '→'}</span>
                        <span>{ready ? `Ready → ${target.sprite} ${target.name}` : `Lv.${evo.level} → ${target.sprite} ${target.name}`}</span>
                        {ready && onEvolve && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEvolve(i) }}
                            className="ml-auto px-2 py-0.5 rounded text-[8px] font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))',
                              border: '1px solid rgba(251,191,36,0.35)',
                              color: '#fbbf24',
                              boxShadow: '0 0 8px rgba(251,191,36,0.15)',
                            }}
                          >
                            Evolve!
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {onAssignHeldItem && (() => {
                    const held = getHeldItem(creature)
                    return (
                      <button
                        onClick={() => setHeldItemPickerIdx(i)}
                        title={held ? `Held: ${held.name}` : 'Equip held item'}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-base transition-all hover:scale-110"
                        style={{
                          background: held ? `linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.1))` : 'rgba(255,255,255,0.04)',
                          border: held ? '1px solid rgba(251,191,36,0.4)' : '1px dashed rgba(255,255,255,0.15)',
                          boxShadow: held ? '0 0 8px rgba(251,191,36,0.15)' : 'none',
                        }}
                      >
                        {held ? held.sprite : <span className="text-white/25 text-[9px]">＋</span>}
                      </button>
                    )
                  })()}
                  {i > 0 && (
                    <button
                      onClick={() => onSwapLead(i)}
                      className="px-1.5 py-1 text-[9px] rounded bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                    >
                      Lead
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Held item picker modal */}
        {heldItemPickerIdx !== null && onAssignHeldItem && (() => {
          const creature = team[heldItemPickerIdx]
          if (!creature) return null
          const currentlyHeld = getHeldItem(creature)
          return (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setHeldItemPickerIdx(null)}>
              <div className="w-full max-w-xs rounded-xl p-3 space-y-2"
                style={{
                  background: 'linear-gradient(180deg, #1a2744 0%, #0f1729 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl">{creature.sprite}</span>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{creature.nickname || creature.name}</p>
                    <p className="text-white/40 text-[9px]">{currentlyHeld ? `Holding: ${currentlyHeld.name}` : 'No held item'}</p>
                  </div>
                  <button onClick={() => setHeldItemPickerIdx(null)} className="text-white/40 hover:text-white/80 text-sm w-6 h-6">✕</button>
                </div>

                {currentlyHeld && (
                  <button
                    onClick={() => { onAssignHeldItem(heldItemPickerIdx, null); setHeldItemPickerIdx(null) }}
                    className="w-full text-left rounded-lg p-2 transition-all hover:brightness-110"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <p className="text-red-300 text-[10px] font-bold">↺ Remove held item</p>
                    <p className="text-red-300/50 text-[8px]">Returns {currentlyHeld.name} to inventory</p>
                  </button>
                )}

                {availableHeldItems.length === 0 && !currentlyHeld && (
                  <div className="text-center py-6">
                    <p className="text-white/40 text-[10px] mb-1">No held items in inventory</p>
                    <p className="text-white/25 text-[9px]">Buy held items at the Shop</p>
                  </div>
                )}

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {availableHeldItems.map(invItem => {
                    const heldDef = HELD_ITEMS[invItem.id]
                    if (!heldDef) return null
                    const isCurrent = currentlyHeld?.id === invItem.id
                    return (
                      <button
                        key={invItem.id}
                        onClick={() => { if (!isCurrent) { onAssignHeldItem(heldItemPickerIdx, invItem.id); setHeldItemPickerIdx(null) } }}
                        disabled={isCurrent}
                        className="w-full text-left rounded-lg p-2 transition-all enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-50"
                        style={{
                          background: isCurrent ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isCurrent ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{heldDef.sprite}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white text-[11px] font-bold">{heldDef.name}</p>
                              <span className="text-white/30 text-[9px]">x{invItem.quantity}</span>
                              {isCurrent && <span className="text-emerald-400 text-[8px] font-bold">EQUIPPED</span>}
                            </div>
                            <p className="text-white/40 text-[9px]">{heldDef.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Inventory */}
        <div className="space-y-1.5">
          <h3 className="text-white/40 text-[10px] uppercase tracking-wider px-1">Inventory</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {inventory.map(item => {
              const isHeal = item.type === 'heal' && onUseHealItem
              return (
                <button
                  key={item.id}
                  onClick={() => { if (isHeal) setHealItemPickerId(item.id) }}
                  disabled={!isHeal}
                  title={isHeal ? `Use ${item.name} on a team member` : item.description}
                  className="rounded-lg border p-2 text-left transition-all enabled:hover:brightness-125 enabled:active:scale-[0.98] enabled:cursor-pointer disabled:cursor-default"
                  style={{
                    background: isHeal ? 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(34,197,94,0.03))' : 'rgba(255,255,255,0.02)',
                    borderColor: isHeal ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{item.sprite}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[10px] font-semibold truncate">{item.name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-white/30 text-[9px]">x{item.quantity}</p>
                        {isHeal && (
                          <p className="text-emerald-400/80 text-[9px] font-medium">· {formatHealAmount(item.id)}</p>
                        )}
                      </div>
                    </div>
                    {isHeal && <span className="text-emerald-400 text-[9px]">▸</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Heal item creature picker */}
        {healItemPickerId !== null && onUseHealItem && (() => {
          const item = inventory.find(i => i.id === healItemPickerId)
          if (!item) return null
          const healInfo = getHealAmount(item.id)
          return (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setHealItemPickerId(null)}>
              <div className="w-full max-w-xs rounded-xl p-3 space-y-2"
                style={{
                  background: 'linear-gradient(180deg, #1a2744 0%, #0f1729 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl">{item.sprite}</span>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">Use {item.name}</p>
                    <p className="text-emerald-400/80 text-[9px]">
                      {healInfo.fullHeal ? 'Fully restores HP' : `Restores ${healInfo.hp} HP`} · x{item.quantity} left
                    </p>
                  </div>
                  <button onClick={() => setHealItemPickerId(null)} className="text-white/40 hover:text-white/80 text-sm w-6 h-6">✕</button>
                </div>

                <p className="text-white/40 text-[9px] uppercase tracking-wider">Choose a creature</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {team.map((c, i) => {
                    const atFull = c.stats.hp >= c.stats.maxHp
                    const missing = c.stats.maxHp - c.stats.hp
                    return (
                      <button
                        key={`heal-pick-${i}`}
                        onClick={() => {
                          if (atFull) return
                          onUseHealItem(item.id, i)
                          // If this was the last one, close the picker
                          if (item.quantity <= 1) setHealItemPickerId(null)
                        }}
                        disabled={atFull}
                        className="w-full text-left rounded-lg p-2 transition-all enabled:hover:brightness-125 enabled:active:scale-[0.98] disabled:opacity-40"
                        style={{
                          background: atFull ? 'rgba(255,255,255,0.02)' : 'rgba(74,222,128,0.06)',
                          border: `1px solid ${atFull ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.25)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.sprite}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white text-[11px] font-bold truncate">{c.nickname || c.name}</p>
                              <span className="text-emerald-400 text-[9px]">Lv.{c.level}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.stats.hp / c.stats.maxHp) * 100}%` }} />
                              </div>
                              <span className="text-[9px] text-white/50 tabular-nums">{c.stats.hp}/{c.stats.maxHp}</span>
                            </div>
                          </div>
                          {atFull ? (
                            <span className="text-white/30 text-[8px] font-medium">FULL</span>
                          ) : (
                            <span className="text-emerald-300 text-[9px] font-bold tabular-nums">
                              +{healInfo.fullHeal ? missing : Math.min(missing, healInfo.hp)}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
      <style>{`
        @keyframes pet-heart-float {
          0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 1; }
          50% { transform: translateX(-50%) translateY(-20px) scale(1.2); opacity: 0.8; }
          100% { transform: translateX(-50%) translateY(-40px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </FloatingPanel>
  )
}
