import type { Creature } from '@/types/game'
import { getEvolutionTarget, getPreEvolution } from './evolutions'
import { ALL_CREATURES } from './creatures'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  creature: Creature
  caught: boolean
  onClose: () => void
}

const TYPE_COLORS: Record<string, string> = {
  beast: '#f97316', bird: '#60a5fa', insect: '#eab308',
  marine: '#22d3ee', amphibian: '#22c55e', mystic: '#c084fc',
  reptile: '#facc15', plant: '#34d399',
}

const TYPE_ICONS: Record<string, string> = {
  beast: '🐾', bird: '🪶', insect: '🦋',
  marine: '🌊', amphibian: '🐸', mystic: '✨',
  reptile: '🦎', plant: '🌿',
}

const RARITY_GRADIENTS: Record<string, { border: string; bg: string; glow: string }> = {
  common: {
    border: 'linear-gradient(135deg, #9ca3af, #6b7280, #9ca3af)',
    bg: 'linear-gradient(160deg, rgba(156,163,175,0.08), rgba(107,114,128,0.04))',
    glow: 'rgba(156,163,175,0.15)',
  },
  uncommon: {
    border: 'linear-gradient(135deg, #60a5fa, #3b82f6, #60a5fa)',
    bg: 'linear-gradient(160deg, rgba(96,165,250,0.08), rgba(59,130,246,0.04))',
    glow: 'rgba(96,165,250,0.2)',
  },
  rare: {
    border: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24, #eab308)',
    bg: 'linear-gradient(160deg, rgba(251,191,36,0.1), rgba(245,158,11,0.04))',
    glow: 'rgba(251,191,36,0.25)',
  },
  legendary: {
    border: 'linear-gradient(135deg, #c084fc, #a855f7, #ec4899, #c084fc)',
    bg: 'linear-gradient(160deg, rgba(192,132,252,0.12), rgba(168,85,247,0.06))',
    glow: 'rgba(192,132,252,0.3)',
  },
}

const CONSERVATION_LABELS: Record<string, { label: string; color: string }> = {
  LC: { label: 'Least Concern', color: '#4ade80' },
  NT: { label: 'Near Threatened', color: '#a3e635' },
  VU: { label: 'Vulnerable', color: '#facc15' },
  EN: { label: 'Endangered', color: '#fb923c' },
  CR: { label: 'Critically Endangered', color: '#ef4444' },
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-white/30 w-7 text-right font-mono">{label}</span>
      <span className="text-[9px] font-bold w-5 text-right" style={{ color }}>{value}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
        }} />
      </div>
    </div>
  )
}

export default function CreatureCard({ creature, caught, onClose }: Props) {
  const rarity = RARITY_GRADIENTS[creature.rarity] || RARITY_GRADIENTS.common
  const typeColor = TYPE_COLORS[creature.type] || '#9ca3af'
  const evoTarget = getEvolutionTarget(creature.id)
  const preEvo = getPreEvolution(creature.id)
  const evoTargetCreature = evoTarget ? ALL_CREATURES.find(c => c.id === evoTarget.toId) : null
  const preEvoCreature = preEvo ? ALL_CREATURES.find(c => c.id === preEvo.fromId) : null
  const isLegendary = creature.rarity === 'legendary'
  const isRare = creature.rarity === 'rare' || isLegendary

  const totalStats = creature.stats.maxHp + creature.stats.attack + creature.stats.defense + creature.stats.speed

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative w-[280px] max-h-[90vh] overflow-y-auto rounded-2xl"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a0a12',
          boxShadow: `0 0 40px ${rarity.glow}, 0 0 80px ${rarity.glow}`,
        }}
      >
        {/* Border gradient */}
        <div className="absolute inset-0 rounded-2xl p-[2px]" style={{
          background: rarity.border,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }} />

        {/* Holographic shimmer for rare+ */}
        {isRare && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-[0.07]" style={{
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, transparent 55%, rgba(255,255,255,0.2) 70%, transparent 80%)',
              animation: 'shimmer 3s ease-in-out infinite',
            }} />
          </div>
        )}

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base leading-tight">{creature.name}</h2>
              <p className="text-white/25 text-[9px] italic">{creature.scientificName}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: `${typeColor}18`,
                  color: typeColor,
                  border: `1px solid ${typeColor}35`,
                }}
              >{TYPE_ICONS[creature.type]} {creature.type}</span>
            </div>
          </div>

          {/* Sprite showcase */}
          <div className="relative rounded-xl p-6 mb-3 flex items-center justify-center"
            style={{
              background: rarity.bg,
              border: `1px solid ${typeColor}18`,
              minHeight: 120,
            }}
          >
            {/* Ambient glow behind sprite */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full" style={{
                background: `radial-gradient(circle, ${typeColor}15, transparent 70%)`,
              }} />
            </div>
            <PixelCreatureToken creature={creature} size={88} selected={isRare || isLegendary} className="relative z-10" />
            {/* Rarity badge */}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
              style={{
                background: `${typeColor}15`,
                color: creature.rarity === 'legendary' ? '#c084fc'
                  : creature.rarity === 'rare' ? '#fbbf24'
                    : creature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af',
                border: `1px solid ${creature.rarity === 'legendary' ? 'rgba(192,132,252,0.3)'
                  : creature.rarity === 'rare' ? 'rgba(251,191,36,0.3)'
                    : creature.rarity === 'uncommon' ? 'rgba(96,165,250,0.3)' : 'rgba(156,163,175,0.2)'}`,
              }}
            >
              {creature.rarity}
            </div>
            {/* Conservation badge */}
            {creature.conservationStatus && CONSERVATION_LABELS[creature.conservationStatus] && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider"
                style={{
                  background: `${CONSERVATION_LABELS[creature.conservationStatus].color}15`,
                  color: CONSERVATION_LABELS[creature.conservationStatus].color,
                  border: `1px solid ${CONSERVATION_LABELS[creature.conservationStatus].color}30`,
                }}
              >
                {creature.conservationStatus} · {CONSERVATION_LABELS[creature.conservationStatus].label}
              </div>
            )}
            {creature.isEndemic && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[7px] font-bold"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                ⭐ Endemic
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-white/50 text-[10px] leading-relaxed mb-3">{creature.description}</p>

          {/* Stats */}
          {caught && (
            <div className="rounded-lg p-3 mb-3" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Base Stats</h3>
                <span className="text-[8px] font-mono" style={{ color: typeColor }}>BST {totalStats}</span>
              </div>
              <div className="space-y-1.5">
                <StatBar label="HP" value={creature.stats.maxHp} max={100} color="#22c55e" />
                <StatBar label="ATK" value={creature.stats.attack} max={60} color="#ef4444" />
                <StatBar label="DEF" value={creature.stats.defense} max={60} color="#3b82f6" />
                <StatBar label="SPD" value={creature.stats.speed} max={60} color="#eab308" />
              </div>
            </div>
          )}

          {/* Moves */}
          {caught && (
            <div className="mb-3">
              <h3 className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">Moves</h3>
              <div className="space-y-1">
                {creature.moves.map(move => {
                  const moveColor = move.type === 'attack' ? '#ef4444'
                    : move.type === 'special' ? '#a855f7' : '#22c55e'
                  return (
                    <div key={move.name} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                      style={{
                        background: `${moveColor}06`,
                        border: `1px solid ${moveColor}12`,
                      }}
                    >
                      <span className="text-[8px] uppercase font-bold w-7" style={{ color: moveColor }}>
                        {move.type === 'attack' ? 'ATK' : move.type === 'special' ? 'SPL' : 'DEF'}
                      </span>
                      <span className="text-white text-[10px] font-semibold flex-1">{move.name}</span>
                      <span className="text-white/30 text-[9px] font-mono">
                        {move.power > 0 ? move.power : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Evolution chain */}
          {(preEvoCreature || evoTargetCreature) && (
            <div className="rounded-lg p-3 mb-3" style={{
              background: 'rgba(192,132,252,0.04)',
              border: '1px solid rgba(192,132,252,0.12)',
            }}>
              <h3 className="text-purple-400/60 text-[9px] font-bold uppercase tracking-wider mb-2">Evolution Chain</h3>
              <div className="flex items-center justify-center gap-2">
                {preEvoCreature && (
                  <>
                    <div className="flex flex-col items-center gap-0.5">
                      <PixelCreatureToken creature={preEvoCreature} size={34} />
                      <span className="text-[8px] text-white/40">{preEvoCreature.name}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-white/15 text-xs">→</span>
                      <span className="text-[7px] text-purple-400/50">Lv.{preEvo!.level}</span>
                    </div>
                  </>
                )}
                <div className="flex flex-col items-center gap-0.5">
                  <PixelCreatureToken creature={creature} size={40} selected />
                  <span className="text-[8px] text-white/60 font-semibold">{creature.name}</span>
                </div>
                {evoTargetCreature && (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="text-white/15 text-xs">→</span>
                      <span className="text-[7px] text-purple-400/50">Lv.{evoTarget!.level}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <PixelCreatureToken creature={evoTargetCreature} size={34} />
                      <span className="text-[8px] text-white/40">{evoTargetCreature.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Habitat & activity */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 rounded-lg p-2" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <h4 className="text-white/25 text-[7px] font-bold uppercase tracking-wider mb-1">Biomes</h4>
              <div className="flex flex-wrap gap-1">
                {creature.biomes.map(b => (
                  <span key={b} className="text-[8px] text-white/40">{b}</span>
                ))}
              </div>
            </div>
            {creature.activeTime && creature.activeTime.length > 0 && (
              <div className="rounded-lg p-2" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <h4 className="text-white/25 text-[7px] font-bold uppercase tracking-wider mb-1">Active</h4>
                <div className="flex gap-1">
                  {creature.activeTime.map(t => (
                    <span key={t} className="text-xs">
                      {t === 'dawn' ? '🌅' : t === 'day' ? '☀️' : t === 'dusk' ? '🌇' : '🌙'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card number */}
          <div className="text-center">
            <span className="text-[8px] text-white/15 font-mono">
              #{String(ALL_CREATURES.findIndex(c => c.id === creature.id) + 1).padStart(3, '0')} / {ALL_CREATURES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
