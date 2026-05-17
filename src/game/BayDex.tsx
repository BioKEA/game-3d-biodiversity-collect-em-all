import { useState, useMemo } from 'react'
import type { CapturedCreature } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { getEvolutionTarget, getPreEvolution } from './evolutions'
import {
  compareCreatureArtEvolution,
  getCreatureArtProfile,
  type ActiveCreatureAdaptation,
} from './creatureArt'
import FloatingPanel from './FloatingPanel'
import TypeChart from './TypeChart'
import CreatureCard from './CreatureCard'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  catalogSeen: string[]
  catalogCaptured: string[]
  onClose: () => void
  defaultSelectedId?: string | null
  playerTeam?: CapturedCreature[]
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

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', uncommon: '#60a5fa', rare: '#fbbf24', legendary: '#c084fc',
}

/** Ideal catch rate at full HP depletion, neutral mood — mirrors BattleScreen formula */
function idealCatchRate(rarity: string): number {
  const mod = rarity === 'common' ? 1.5 : rarity === 'uncommon' ? 1.0 : rarity === 'rare' ? 0.5 : 0.25
  return Math.max(0.05, Math.min(0.95, 1 * mod * 1 + 0.1))
}

const BIOME_ICONS: Record<string, string> = {
  forest: '🌳', marsh: '🌿', beach: '🏖️', urban: '🏙️',
  water: '🌊', mountain: '⛰️', grassland: '🌾', redwood: '🌲',
  tidepool: '🪸', chaparral: '🌵', oak_woodland: '🌳', kelp_forest: '🌿',
}

const TIME_ICONS: Record<string, string> = {
  dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙',
}

const ADAPTATION_COLORS: Record<ActiveCreatureAdaptation['intensityLabel'], string> = {
  subtle: '#67e8f9',
  strong: '#c084fc',
  major: '#fbbf24',
}

function MiniAdaptationChip({ adaptation }: { adaptation: ActiveCreatureAdaptation }) {
  const color = ADAPTATION_COLORS[adaptation.intensityLabel]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8px] font-semibold"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}2f`,
        color,
      }}
      title={`${adaptation.label}: ${Math.round(adaptation.intensity * 100)}% intensity`}
    >
      <span className="h-1.5 w-1.5 rounded-sm" style={{ background: color, boxShadow: `0 0 5px ${color}66` }} />
      {adaptation.label}
    </span>
  )
}

// IUCN-style conservation status display
const CONSERVATION_INFO: Record<string, { label: string; color: string; bg: string; description: string }> = {
  LC:       { label: 'Least Concern',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  description: 'Widespread and abundant — population stable.' },
  NT:       { label: 'Near Threatened', color: '#a3e635', bg: 'rgba(163,230,53,0.12)',  description: 'Likely to become threatened in the near future.' },
  VU:       { label: 'Vulnerable',      color: '#facc15', bg: 'rgba(250,204,21,0.14)',  description: 'High risk of extinction in the wild.' },
  EN:       { label: 'Endangered',      color: '#fb923c', bg: 'rgba(251,146,60,0.14)',  description: 'Very high risk of extinction in the wild.' },
  CR:       { label: 'Critically Endangered', color: '#ef4444', bg: 'rgba(239,68,68,0.16)', description: 'Extremely high risk of extinction.' },
  EX:       { label: 'Extinct',         color: '#991b1b', bg: 'rgba(153,27,27,0.18)',   description: 'No known living individuals remain.' },
  INV:      { label: 'Invasive',        color: '#e879f9', bg: 'rgba(232,121,249,0.14)', description: 'Non-native species causing ecological harm.' },
  NA:       { label: 'Naturalized',     color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', description: 'Non-native but established without major harm.' },
  fantasy:  { label: 'Mythic',          color: '#c084fc', bg: 'rgba(192,132,252,0.12)', description: 'A creature of Bay Area folklore.' },
}

const BORDER_CREATURE_IDS = new Set([
  'oregon-gray-wolf', 'nevada-horned-lizard', 'arizona-condor',
  'great-basin-rattlesnake', 'pronghorn-antelope', 'gila-monster',
])

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatMigrationWindow(w: { startMonth: number; endMonth: number }): string {
  return `${MONTH_NAMES[w.startMonth]} – ${MONTH_NAMES[w.endMonth]}`
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'caught' | 'seen' | 'unknown' | 'evolves' | 'team' | 'border'
type SortType = 'number' | 'type' | 'rarity' | 'recent' | 'evolve'

function CompletionRing({ percent, size, color, label, count, total }: {
  percent: number; size: number; color: string; label: string; count: number; total: number
}) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(percent, 100)) / 100

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold" style={{ color }}>{Math.round(percent)}%</span>
        </div>
      </div>
      <span className="text-[8px] text-white/40">{label}</span>
      <span className="text-[7px] text-white/20">{count}/{total}</span>
    </div>
  )
}

function StatsHeader({ catalogSeen, catalogCaptured }: { catalogSeen: string[]; catalogCaptured: string[] }) {
  const total = ALL_CREATURES.length
  const caught = catalogCaptured.length
  const seen = catalogSeen.length
  const percent = Math.round((caught / total) * 100)

  const typeStats = useMemo(() => {
    const types = ['beast', 'bird', 'marine', 'amphibian', 'insect', 'reptile', 'plant', 'mystic']
    return types.map(t => {
      const creatures = ALL_CREATURES.filter(c => c.type === t)
      const caughtCount = creatures.filter(c => catalogCaptured.includes(c.id)).length
      return { type: t, total: creatures.length, caught: caughtCount }
    })
  }, [catalogCaptured])

  return (
    <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {/* Main progress */}
      <div className="flex items-center gap-3 mb-3">
        <CompletionRing
          percent={(caught / total) * 100} size={52} color="#22d3ee"
          label="Caught" count={caught} total={total}
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-white font-bold text-lg">{caught}</span>
            <span className="text-white/20 text-xs">/ {total} species</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
            }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-white/30">{seen} seen</span>
            <span className="text-[8px] text-white/30">{total - seen} undiscovered</span>
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-8 gap-1">
        {typeStats.map(ts => (
          <div key={ts.type} className="text-center rounded-lg py-1.5 px-1" style={{
            background: `${TYPE_COLORS[ts.type]}08`,
            border: `1px solid ${TYPE_COLORS[ts.type]}15`,
          }}>
            <PixelIcon icon={TYPE_ICONS[ts.type]} size={20} variant="nature" className="mx-auto" />
            <div className="text-[8px] font-semibold mt-0.5" style={{ color: TYPE_COLORS[ts.type] }}>
              {ts.caught}/{ts.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreatureGrid({ creatures, catalogSeen, catalogCaptured, selectedId, onSelect }: {
  creatures: typeof ALL_CREATURES
  catalogSeen: string[]
  catalogCaptured: string[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-1 p-2">
      {creatures.map((creature, idx) => {
        const caught = catalogCaptured.includes(creature.id)
        const seen = catalogSeen.includes(creature.id)
        const isActive = selectedId === creature.id
        const canEvolve = seen && !!getEvolutionTarget(creature.id)

        return (
          <button
            key={creature.id}
            onClick={() => onSelect(creature.id)}
            className="relative flex flex-col items-center p-1.5 rounded-lg transition-all"
            style={{
              background: isActive
                ? `${caught ? TYPE_COLORS[creature.type] : 'rgba(255,255,255,'}${caught ? '15' : '0.08)'}`
                : caught ? `${TYPE_COLORS[creature.type]}08` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive
                ? (caught ? `${TYPE_COLORS[creature.type]}40` : 'rgba(255,255,255,0.15)')
                : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {/* Entry number */}
            <span className="absolute top-0.5 left-1 text-[7px] text-white/15 font-mono">
              #{String(idx + 1).padStart(3, '0')}
            </span>
            {/* Evolution marker */}
            {canEvolve && (
              <span
                className="absolute bottom-2 left-0.5 leading-none"
                title="Can evolve"
              >
                <PixelIcon icon="✨" size={14} variant="mystic" selected title="Can evolve" />
              </span>
            )}
            {/* Sprite */}
            <div className="mt-1" style={{ filter: seen ? 'none' : 'grayscale(1) brightness(0.3)' }}>
              {seen ? <PixelCreatureToken creature={creature} size={32} selected={isActive} /> : <span className="text-xl text-white/20">?</span>}
            </div>
            {/* Name */}
            <span className="text-[7px] text-white/50 truncate w-full text-center mt-0.5">
              {seen ? creature.name.split(' ').slice(-1)[0] : '???'}
            </span>
            {/* Status dot */}
            {caught && (
              <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
            {seen && !caught && (
              <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
            )}
            {/* Rarity strip */}
            {seen && (
              <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full" style={{
                background: RARITY_COLORS[creature.rarity],
                opacity: 0.4,
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function CreatureList({ creatures, catalogSeen, catalogCaptured, selectedId, onSelect }: {
  creatures: typeof ALL_CREATURES
  catalogSeen: string[]
  catalogCaptured: string[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div>
      {creatures.map((creature, idx) => {
        const caught = catalogCaptured.includes(creature.id)
        const seen = catalogSeen.includes(creature.id)
        const isActive = selectedId === creature.id

        return (
          <button
            key={creature.id}
            onClick={() => onSelect(creature.id)}
            className="w-full p-2 flex items-center gap-2.5 text-left transition-all border-b"
            style={{
              background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
              borderColor: 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Number */}
            <span className="text-[8px] text-white/15 font-mono w-5 shrink-0">
              #{String(idx + 1).padStart(3, '0')}
            </span>
            {/* Sprite */}
            {seen ? (
              <PixelCreatureToken creature={creature} size={38} selected={isActive || caught} />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                ?
              </div>
            )}
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-white text-[10px] font-semibold truncate">
                {seen ? creature.name : '???'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {caught && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {seen && !caught && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />}
                {!seen && <span className="w-1.5 h-1.5 rounded-full bg-white/15" />}
                <span className="text-[8px]" style={{ color: TYPE_COLORS[creature.type] || 'rgba(255,255,255,0.3)' }}>
                  {creature.type}
                </span>
                {seen && (
                  <span className="text-[8px] px-1.5 py-px rounded-full" style={{
                    background: `${RARITY_COLORS[creature.rarity]}15`,
                    color: RARITY_COLORS[creature.rarity],
                  }}>
                    {creature.rarity}
                  </span>
                )}
                {seen && getEvolutionTarget(creature.id) && (
                  <span
                    className="inline-flex items-center gap-1 text-[8px] px-1.5 py-px rounded-full border"
                    style={{
                      background: 'rgba(192,132,252,0.1)',
                      color: '#c084fc',
                      borderColor: 'rgba(192,132,252,0.3)',
                    }}
                    title="Can evolve"
                  >
                    <PixelIcon icon="✨" size={12} variant="mystic" selected />
                    evolves
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DetailPanel({ creature, caught, seen, catalogSeen, onSelect, teamMember, onViewCard }: {
  creature: typeof ALL_CREATURES[0]
  caught: boolean
  seen: boolean
  catalogSeen: string[]
  onSelect: (id: string) => void
  teamMember?: CapturedCreature
  onViewCard: () => void
}) {
  const evoTarget = getEvolutionTarget(creature.id)
  const preEvo = getPreEvolution(creature.id)
  const evoTargetCreature = evoTarget ? ALL_CREATURES.find(c => c.id === evoTarget.toId) : null
  const preEvoCreature = preEvo ? ALL_CREATURES.find(c => c.id === preEvo.fromId) : null
  const artProfile = getCreatureArtProfile(creature)
  const evoArtPreview = evoTargetCreature ? compareCreatureArtEvolution(creature, evoTargetCreature) : null
  const nextFormAdaptations = evoArtPreview
    ? [...evoArtPreview.gainedAdaptations, ...evoArtPreview.intensifiedAdaptations].slice(0, 4)
    : []

  if (!seen) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-4xl opacity-20">?</span>
        </div>
        <p className="text-white/40 text-sm font-medium">Undiscovered</p>
        <p className="text-white/20 text-[10px] mt-1.5 max-w-[200px]">
          Explore the Bay Area to find this creature. Try different biomes and times of day.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Hero */}
      <div className="flex items-start gap-3">
        <PixelCreatureToken creature={creature} size={66} selected={caught} />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">{creature.name}</h3>
          <p className="text-white/30 text-[10px] italic">{creature.scientificName}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${TYPE_COLORS[creature.type]}15`,
                color: TYPE_COLORS[creature.type],
                border: `1px solid ${TYPE_COLORS[creature.type]}30`,
              }}
            >
              <span className="inline-flex items-center gap-1">
                <PixelIcon icon={TYPE_ICONS[creature.type]} size={14} variant="nature" />
                {creature.type}
              </span>
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${RARITY_COLORS[creature.rarity]}15`,
                color: RARITY_COLORS[creature.rarity],
              }}
            >{creature.rarity}</span>
            {(() => {
              const rate = idealCatchRate(creature.rarity)
              const pct = Math.round(rate * 100)
              const catchColor = rate >= 0.9 ? '#4ade80' : rate >= 0.6 ? '#fbbf24' : rate >= 0.4 ? '#fb923c' : '#f87171'
              return (
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                  title={`Best-case catch rate with a Bio Capsule when the target is at 1 HP. Actual chance varies with remaining HP and mood.`}
                  style={{
                    background: `${catchColor}12`,
                    color: catchColor,
                    border: `1px solid ${catchColor}30`,
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <PixelIcon icon="🎯" size={13} variant="danger" selected />
                  {pct}%
                </span>
              </span>
              )
            })()}
            {creature.conservationStatus && CONSERVATION_INFO[creature.conservationStatus] && (
              <span
                title={CONSERVATION_INFO[creature.conservationStatus].description}
                className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  background: CONSERVATION_INFO[creature.conservationStatus].bg,
                  color: CONSERVATION_INFO[creature.conservationStatus].color,
                  border: `1px solid ${CONSERVATION_INFO[creature.conservationStatus].color}40`,
                }}
              >
                {creature.conservationStatus}
              </span>
            )}
            {creature.isEndemic && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Found nowhere else on Earth">
                <span className="inline-flex items-center gap-1">
                  <PixelIcon icon="⭐" size={13} variant="gold" selected />
                  Endemic
                </span>
              </span>
            )}
            {creature.isNative === false && !creature.isFantasy && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Not native to California">
                Non-native
              </span>
            )}
            {creature.isFantasy && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">fantasy</span>
            )}
            {caught && (
              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                <PixelIcon icon="✓" size={12} variant="nature" selected />
                Caught
              </span>
            )}
          </div>
          {seen && (
            <button
              onClick={onViewCard}
              className="mt-1.5 text-[9px] px-2.5 py-1 rounded-lg font-semibold transition-all hover:brightness-125"
              style={{
                background: 'linear-gradient(135deg, rgba(192,132,252,0.12), rgba(168,85,247,0.08))',
                color: '#c084fc',
                border: '1px solid rgba(192,132,252,0.25)',
              }}
            >
              <span className="inline-flex items-center gap-1">
                <PixelIcon icon="📖" size={13} variant="mystic" selected />
                View Card
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Evolve next hint — shows when player has this creature in their team */}
      {evoTarget && evoTargetCreature && teamMember && (() => {
        const ready = teamMember.level >= evoTarget.level
        const gap = evoTarget.level - teamMember.level
        return (
          <div className="rounded-lg p-2.5 flex items-center gap-2.5" style={{
            background: ready
              ? 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(168,85,247,0.08))'
              : 'rgba(192,132,252,0.06)',
            border: `1px solid rgba(192,132,252,${ready ? 0.4 : 0.18})`,
            boxShadow: ready ? '0 0 16px rgba(192,132,252,0.2)' : 'none',
          }}>
            <span className="shrink-0" style={{
              filter: ready ? 'drop-shadow(0 0 6px rgba(192,132,252,0.8))' : 'none',
              animation: ready ? 'pulse 2s ease-in-out infinite' : 'none',
            }}>
              <PixelIcon icon="✨" size={34} variant="mystic" selected={ready} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                {ready ? 'Ready to Evolve!' : 'Evolve Next'}
              </p>
              <p className="text-white/70 text-[10px] mt-0.5">
                {ready ? (
                  <>Your Lv.{teamMember.level} <span className="font-semibold text-white">{teamMember.nickname || creature.name}</span> can evolve into <span className="text-purple-300 font-semibold">{evoTargetCreature.name}</span> now.</>
                ) : (
                  <>Your Lv.{teamMember.level} <span className="font-semibold text-white">{teamMember.nickname || creature.name}</span> will evolve into <span className="text-purple-300 font-semibold">{evoTargetCreature.name}</span> at Lv.{evoTarget.level} <span className="text-white/40">({gap} {gap === 1 ? 'level' : 'levels'} to go)</span></>
                )}
              </p>
              {!ready && (
                <div className="h-1 mt-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(100, (teamMember.level / evoTarget.level) * 100)}%`,
                    background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                  }} />
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Adaptive anatomy */}
      <div className="p-2.5 rounded-lg" style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.045), rgba(192,132,252,0.045))',
        border: '1px solid rgba(34,211,238,0.12)',
      }}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <h4 className="text-cyan-300/70 text-[9px] font-semibold uppercase tracking-wider">Adaptive Anatomy</h4>
            <p className="text-[9px] text-white/38 mt-0.5">{artProfile.bodyPlanLabel} · {artProfile.stageLabel}</p>
          </div>
          <span className="rounded-md px-1.5 py-0.5 text-[8px] font-mono text-white/45" style={{ background: 'rgba(0,0,0,0.24)' }}>
            {artProfile.scaleLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {artProfile.dominantAdaptations.length > 0
            ? artProfile.dominantAdaptations.map(adaptation => <MiniAdaptationChip key={adaptation.key} adaptation={adaptation} />)
            : <span className="text-[8px] text-white/28">Clean base silhouette</span>}
        </div>
        {evoTargetCreature && evoArtPreview && (
          <div className="mt-2 rounded-md p-2" style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <PixelCreatureToken creature={evoTargetCreature} size={24} />
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold text-purple-200">Next: {evoTargetCreature.name}</p>
                  <p className="text-[7px] uppercase tracking-wider text-purple-300/45">{evoArtPreview.silhouetteShift} silhouette shift</p>
                </div>
              </div>
              <span className="text-[8px] text-purple-300/60">Lv.{evoTarget!.level}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {nextFormAdaptations.length > 0
                ? nextFormAdaptations.map(adaptation => <MiniAdaptationChip key={adaptation.key} adaptation={adaptation} />)
                : <span className="text-[8px] text-white/28">Refines the same core silhouette</span>}
            </div>
          </div>
        )}
      </div>

      {/* Conservation status detail */}
      {caught && creature.conservationStatus && CONSERVATION_INFO[creature.conservationStatus] && (
        <div className="p-2.5 rounded-lg" style={{
          background: CONSERVATION_INFO[creature.conservationStatus].bg,
          border: `1px solid ${CONSERVATION_INFO[creature.conservationStatus].color}30`,
        }}>
          <h4 className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: CONSERVATION_INFO[creature.conservationStatus].color }}>
            {CONSERVATION_INFO[creature.conservationStatus].label}
          </h4>
          <p className="text-white/50 text-[10px] leading-relaxed">
            {CONSERVATION_INFO[creature.conservationStatus].description}
          </p>
        </div>
      )}

      {/* Description */}
      <p className="text-white/50 text-[10px] leading-relaxed">{creature.description}</p>

      {/* Lore */}
      {caught && creature.lore && (
        <div className="p-2.5 rounded-lg" style={{
          background: 'rgba(34,211,238,0.04)',
          border: '1px solid rgba(34,211,238,0.1)',
        }}>
          <h4 className="text-cyan-400 text-[9px] font-semibold uppercase tracking-wider mb-1">Field Notes</h4>
          <p className="text-white/40 text-[10px] leading-relaxed">{creature.lore}</p>
        </div>
      )}

      {/* Stats (only caught) */}
      {caught && (
        <div>
          <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Base Stats</h4>
          <div className="space-y-1">
            {[
              { label: 'HP', value: creature.stats.hp, max: 100, color: '#22c55e' },
              { label: 'ATK', value: creature.stats.attack, max: 60, color: '#ef4444' },
              { label: 'DEF', value: creature.stats.defense, max: 60, color: '#3b82f6' },
              { label: 'SPD', value: creature.stats.speed, max: 60, color: '#eab308' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 w-6">{stat.label}</span>
                <span className="text-[9px] font-semibold w-5 text-right" style={{ color: stat.color }}>{stat.value}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (stat.value / stat.max) * 100)}%`,
                    background: stat.color, opacity: 0.6,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moves */}
      {caught && (
        <div>
          <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Moves</h4>
          <div className="grid grid-cols-2 gap-1">
            {creature.moves.map(move => (
              <div key={move.name} className="rounded-lg p-1.5 border"
                style={{
                  background: move.type === 'attack' ? 'rgba(239,68,68,0.05)' :
                    move.type === 'special' ? 'rgba(168,85,247,0.05)' : 'rgba(34,197,94,0.05)',
                  borderColor: move.type === 'attack' ? 'rgba(239,68,68,0.12)' :
                    move.type === 'special' ? 'rgba(168,85,247,0.12)' : 'rgba(34,197,94,0.12)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-[9px] font-semibold">{move.name}</span>
                  <span className="text-white/25 text-[8px]">
                    {move.power > 0 ? `${move.power}` : 'DEF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habitat */}
      <div>
        <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Habitat</h4>
        <div className="flex gap-1 flex-wrap">
          {creature.biomes.map(b => (
            <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-md" style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.45)',
            }}>
              <span className="inline-flex items-center gap-1">
                <PixelIcon icon={BIOME_ICONS[b] || '🌍'} size={14} variant="nature" />
                {b}
              </span>
            </span>
          ))}
        </div>
        {caught && creature.subregions.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {creature.subregions.map(s => (
              <span key={s} className="text-[8px] px-1 py-0.5 rounded" style={{
                background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.25)',
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active time */}
      {creature.activeTime && creature.activeTime.length > 0 && (
        <div>
          <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Active Hours</h4>
          <div className="flex gap-2">
            {(['dawn', 'day', 'dusk', 'night'] as const).map(t => {
              const active = creature.activeTime?.includes(t)
              return (
                <div key={t} className="text-center">
                  <PixelIcon icon={TIME_ICONS[t]} size={22} variant="mystic" selected={active} className={active ? 'mx-auto' : 'mx-auto opacity-20 grayscale'} />
                  <p className={`text-[7px] mt-0.5 ${active ? 'text-white/50' : 'text-white/10'}`}>{t}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Migration window */}
      {creature.migrationWindow && (
        <div>
          <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Seasonal Window</h4>
          <div className="rounded-lg p-2" style={{
            background: 'rgba(96,165,250,0.06)',
            border: '1px solid rgba(96,165,250,0.15)',
          }}>
            <div className="flex items-center gap-2">
              <PixelIcon icon="📅" size={24} variant="water" />
              <div>
                <p className="text-blue-300 text-[10px] font-semibold">{formatMigrationWindow(creature.migrationWindow)}</p>
                <p className="text-white/30 text-[8px]">Only appears during these months in the Bay Area.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolution chain */}
      {(preEvoCreature || evoTargetCreature) && (
        <div>
          <h4 className="text-white/30 text-[9px] font-semibold uppercase tracking-wider mb-1.5">Evolution</h4>
          <div className="flex items-center gap-1.5">
            {preEvoCreature && catalogSeen.includes(preEvoCreature.id) && (
              <>
                <button onClick={() => onSelect(preEvoCreature.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <PixelCreatureToken creature={preEvoCreature} size={22} />
                  <div>
                    <p className="text-white text-[9px] font-semibold">{preEvoCreature.name}</p>
                    <p className="text-white/25 text-[7px]">Lv.{preEvo!.level}+</p>
                  </div>
                </button>
                <span className="text-white/15 text-[10px]">→</span>
              </>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.05)' }}>
              <PixelCreatureToken creature={creature} size={22} selected />
              <p className="text-cyan-400 text-[9px] font-semibold">{creature.name}</p>
            </div>
            {evoTargetCreature && (
              <>
                <span className="text-white/15 text-[10px]">→</span>
                <button onClick={() => catalogSeen.includes(evoTargetCreature.id) ? onSelect(evoTargetCreature.id) : undefined}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {catalogSeen.includes(evoTargetCreature.id) ? <PixelCreatureToken creature={evoTargetCreature} size={22} /> : <span className="text-base">?</span>}
                  <div>
                    <p className="text-white text-[9px] font-semibold">
                      {catalogSeen.includes(evoTargetCreature.id) ? evoTargetCreature.name : '???'}
                    </p>
                    <p className="text-white/25 text-[7px]">Lv.{evoTarget!.level}</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Type chart */}
      {caught && (
        <TypeChart highlightType={creature.type} />
      )}
    </div>
  )
}

export default function BayDex({ catalogSeen, catalogCaptured, onClose, defaultSelectedId = null, playerTeam = [] }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('number')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [showCard, setShowCard] = useState(false)

  const teamIds = useMemo(() => new Set(playerTeam.map(c => c.id)), [playerTeam])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = ALL_CREATURES.filter(c => {
      const caught = catalogCaptured.includes(c.id)
      const seen = catalogSeen.includes(c.id)
      if (filter === 'caught' && !caught) return false
      if (filter === 'seen' && !(seen && !caught)) return false
      if (filter === 'unknown' && seen) return false
      if (filter === 'evolves' && !(seen && getEvolutionTarget(c.id))) return false
      if (filter === 'team' && !teamIds.has(c.id)) return false
      if (filter === 'border' && !BORDER_CREATURE_IDS.has(c.id)) return false
      if (q) {
        // Undiscovered creatures shouldn't leak via search
        if (!seen) return false
        const haystack = `${c.name} ${c.scientificName} ${c.type}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    if (sortBy === 'type') {
      const typeOrder = ['beast', 'bird', 'marine', 'amphibian', 'insect', 'reptile', 'plant', 'mystic']
      list = [...list].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))
    } else if (sortBy === 'rarity') {
      const rarityOrder = { legendary: 0, rare: 1, uncommon: 2, common: 3 }
      list = [...list].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
    } else if (sortBy === 'recent') {
      list = [...list].sort((a, b) => {
        const aCaught = catalogCaptured.includes(a.id) ? 0 : catalogSeen.includes(a.id) ? 1 : 2
        const bCaught = catalogCaptured.includes(b.id) ? 0 : catalogSeen.includes(b.id) ? 1 : 2
        return aCaught - bCaught
      })
    } else if (sortBy === 'evolve') {
      // Proximity to evolution: team members with smallest gap first, then remaining
      // evolution-capable species by required level, then everything else.
      const score = (id: string): number => {
        const evo = getEvolutionTarget(id)
        if (!evo) return 9999 // no evolution — push to end
        const member = playerTeam.find(m => m.id === id)
        if (member) {
          const gap = evo.level - member.level
          return gap <= 0 ? -1 : gap // ready-to-evolve: very top
        }
        // Not in team — sort by absolute threshold, behind team members
        return 100 + evo.level
      }
      list = [...list].sort((a, b) => score(a.id) - score(b.id))
    }
    return list
  }, [filter, sortBy, catalogSeen, catalogCaptured, search, teamIds, playerTeam])

  const selected = selectedId ? ALL_CREATURES.find(c => c.id === selectedId) : null
  const selectedCaught = selectedId ? catalogCaptured.includes(selectedId) : false
  const selectedSeen = selectedId ? catalogSeen.includes(selectedId) : false
  const selectedTeamMember = selectedId ? playerTeam.find(c => c.id === selectedId) : undefined

  return (
    <FloatingPanel
      title="WildDex"
      subtitle={`${catalogCaptured.length}/${ALL_CREATURES.length} documented`}
      onClose={onClose}
      width="xl"
    >
      {/* Stats header */}
      <StatsHeader catalogSeen={catalogSeen} catalogCaptured={catalogCaptured} />

      {/* Search bar */}
      <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${search ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <PixelIcon icon="🔍" size={18} variant="neutral" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, genus, or type…"
            className="flex-1 bg-transparent text-white text-[11px] placeholder-white/25 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-white/30 hover:text-white/60 text-[11px] leading-none px-1"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <span className="text-[9px] text-white/30 font-mono tabular-nums">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Filters */}
        <div className="flex gap-1 flex-1 flex-wrap">
          {([
            ['all', 'All', null, null],
            ['caught', 'Caught', null, '✓'],
            ['seen', 'Seen', null, '👁️'],
            ['unknown', '???', null, null],
            ['evolves', 'Evolves', 'purple', '✨'],
            ['team', 'My Team', 'amber', '🤝'],
            ['border', 'Border', 'red', '🗺️'],
          ] as const).map(([key, label, accent, icon]) => {
            const active = filter === key
            const accentColor = accent === 'purple' ? '192,132,252' : accent === 'amber' ? '251,191,36' : accent === 'red' ? '239,68,68' : '34,211,238'
            const textColor = accent === 'purple' ? '#c084fc' : accent === 'amber' ? '#fbbf24' : accent === 'red' ? '#ef4444' : '#22d3ee'
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                disabled={key === 'team' && playerTeam.length === 0}
                className="px-2 py-0.5 rounded-full text-[9px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: active ? `rgba(${accentColor},0.12)` : 'transparent',
                  color: active ? textColor : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${active ? `rgba(${accentColor},0.25)` : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {icon && <PixelIcon icon={icon} size={12} variant={accent === 'purple' ? 'mystic' : accent === 'amber' ? 'gold' : accent === 'red' ? 'danger' : 'neutral'} selected={active} />}
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortType)}
          className="text-[9px] rounded-md px-1.5 py-0.5 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <option value="number">#</option>
          <option value="type">Type</option>
          <option value="rarity">Rarity</option>
          <option value="recent">Status</option>
          <option value="evolve">Evolve soon</option>
        </select>

        {/* View toggle */}
        <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className="px-1.5 py-0.5 text-[10px] transition-all"
            style={{
              background: viewMode === 'grid' ? 'rgba(34,211,238,0.12)' : 'transparent',
              color: viewMode === 'grid' ? '#22d3ee' : 'rgba(255,255,255,0.3)',
            }}
          >⊞</button>
          <button
            onClick={() => setViewMode('list')}
            className="px-1.5 py-0.5 text-[10px] transition-all"
            style={{
              background: viewMode === 'list' ? 'rgba(34,211,238,0.12)' : 'transparent',
              color: viewMode === 'list' ? '#22d3ee' : 'rgba(255,255,255,0.3)',
            }}
          >≡</button>
        </div>
      </div>

      {/* Border species banner */}
      {filter === 'border' && (() => {
        const borderCreatures = ALL_CREATURES.filter(c => BORDER_CREATURE_IDS.has(c.id))
        const caughtBorder = borderCreatures.filter(c => catalogCaptured.includes(c.id)).length
        const seenBorder = borderCreatures.filter(c => catalogSeen.includes(c.id)).length
        const total = borderCreatures.length
        const allCaught = caughtBorder === total
        return (
          <div className="px-3 py-2 border-b flex items-center gap-3" style={{
            borderColor: 'rgba(239,68,68,0.15)',
            background: allCaught ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.04)',
          }}>
            <CompletionRing
              percent={(caughtBorder / total) * 100} size={40}
              color={allCaught ? '#4ade80' : '#ef4444'}
              label="Border" count={caughtBorder} total={total}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold" style={{ color: allCaught ? '#4ade80' : '#ef4444' }}>
                {allCaught ? (
                  <span className="inline-flex items-center gap-1">
                    <PixelIcon icon="🏆" size={16} variant="gold" selected />
                    Border Species Complete!
                  </span>
                ) : `Border Species: ${caughtBorder}/${total}`}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">
                {seenBorder} seen · Rare creatures found near California&apos;s borders with Oregon, Nevada, Arizona &amp; Mexico
              </div>
            </div>
            <div className="flex gap-1">
              {borderCreatures.map(c => {
                const caught = catalogCaptured.includes(c.id)
                const seen = catalogSeen.includes(c.id)
                return (
                  <div key={c.id} className="w-6 h-6 rounded flex items-center justify-center text-sm"
                    style={{
                      background: caught ? 'rgba(74,222,128,0.15)' : seen ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${caught ? 'rgba(74,222,128,0.3)' : seen ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      filter: seen ? 'none' : 'grayscale(1) brightness(0.3)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <PixelCreatureToken creature={c} size={24} selected={caught} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Creature browser */}
        <div className={viewMode === 'grid' ? 'w-2/5 overflow-y-auto' : 'w-1/3 overflow-y-auto'} style={{
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {viewMode === 'grid' ? (
            <CreatureGrid
              creatures={filtered} catalogSeen={catalogSeen} catalogCaptured={catalogCaptured}
              selectedId={selectedId} onSelect={setSelectedId}
            />
          ) : (
            <CreatureList
              creatures={filtered} catalogSeen={catalogSeen} catalogCaptured={catalogCaptured}
              selectedId={selectedId} onSelect={setSelectedId}
            />
          )}
        </div>

        {/* Detail panel */}
        <div className={viewMode === 'grid' ? 'w-3/5 overflow-y-auto' : 'flex-1 overflow-y-auto'}>
          {selected ? (
            <DetailPanel
              creature={selected}
              caught={selectedCaught}
              seen={selectedSeen}
              catalogSeen={catalogSeen}
              onSelect={setSelectedId}
              teamMember={selectedTeamMember}
              onViewCard={() => setShowCard(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <PixelIcon icon="📖" size={44} variant="neutral" className="mb-2 opacity-30" />
              <p className="text-white/25 text-xs">Select a creature to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Creature card overlay */}
      {showCard && selected && selectedSeen && (
        <CreatureCard
          creature={selected}
          caught={selectedCaught}
          onClose={() => setShowCard(false)}
        />
      )}
    </FloatingPanel>
  )
}
