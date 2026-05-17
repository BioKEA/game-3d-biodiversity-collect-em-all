import { useState, useEffect, useCallback, useRef } from 'react'
import type { SaveSlotIndex } from './gameState'
import { getAllSaveSlots, migrateLegacySave, saveSlotName } from './gameState'
import type { SaveSlotSummary } from './gameState'
import { ALL_CREATURES } from './creatures'
import { MINI_BOSS_IDS, RANGERS } from './rangers'
import { createInitialStats } from './achievements'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'
import TitleBackdropCanvas from './TitleBackdropCanvas'

interface Props {
  onLoadSlot: (slot: SaveSlotIndex) => void
  onNewGame: (slot: SaveSlotIndex) => void
  onDeleteSlot: (slot: SaveSlotIndex) => void
}

const TITLE = 'WildCal'

const CREATURES = [
  { creatureId: 'golden-eagle', x: 8, y: 52, size: 42, delay: 1.2, from: 'left' as const },
  { creatureId: 'gray-fox', x: 82, y: 58, size: 36, delay: 1.8, from: 'right' as const },
  { creatureId: 'mission-blue-butterfly', x: 60, y: 38, size: 30, delay: 2.4, from: 'right' as const },
  { creatureId: 'harbor-seal', x: 20, y: 72, size: 34, delay: 2.0, from: 'left' as const },
  { creatureId: 'pacific-tree-frog', x: 45, y: 68, size: 30, delay: 2.8, from: 'left' as const },
  { creatureId: 'fog-serpent', x: 72, y: 30, size: 36, delay: 3.2, from: 'right' as const },
  { creatureId: 'raccoon', x: 15, y: 35, size: 28, delay: 3.6, from: 'left' as const },
  { creatureId: 'wave-spirit', x: 90, y: 75, size: 30, delay: 3.0, from: 'right' as const },
]

const SLOT_ACCENTS = ['#6ee7b7', '#67e8f9', '#fbbf24'] as const

function useIsCompact() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isCompact
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function CircleProgress({ pct, size = 64, color = '#4ade80' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 1))
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em" fill="white" fontSize={15} fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

function SaveSlotCard({ summary, slot, onLoad, onNew, onDelete, onRename }: {
  summary: SaveSlotSummary | null
  slot: SaveSlotIndex
  onLoad: () => void
  onNew: () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(summary?.name ?? '')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isCompact = useIsCompact()
  const slotAccent = SLOT_ACCENTS[slot - 1] ?? SLOT_ACCENTS[0]

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  const commitRename = () => {
    onRename(nameDraft)
    setEditingName(false)
  }

  if (!summary) {
    return (
      <button
        onClick={onNew}
        aria-label={`Start a new expedition in slot ${slot}`}
        className="group relative w-full overflow-hidden rounded-lg p-4 sm:p-6 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 16, 28, 0.78), rgba(9, 32, 36, 0.68))',
          border: `1px dashed ${slotAccent}55`,
          boxShadow: `0 18px 38px rgba(0,0,0,0.24), inset 0 0 0 1px rgba(255,255,255,0.035)`,
        }}
      >
        <span
          className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-70"
          style={{
            backgroundImage: `linear-gradient(${slotAccent}24 1px, transparent 1px), linear-gradient(90deg, ${slotAccent}18 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }}
        />
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${slotAccent}, transparent)` }} />
        <span className="relative z-10 flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3 sm:gap-4">
            <PixelIcon icon="🧭" size={isCompact ? 40 : 50} color={slotAccent} selected title="New expedition" />
            <span className="min-w-0">
              <span className="block text-base sm:text-lg font-black text-white">New Expedition</span>
              <span className="block text-xs sm:text-sm text-white/40 truncate">Slot {slot} is ready for a fresh field log</span>
            </span>
          </span>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-2xl font-black text-white transition-transform group-hover:scale-105"
            style={{ background: `${slotAccent}20`, border: `1px solid ${slotAccent}55` }}
            aria-hidden="true"
          >
            +
          </span>
        </span>
      </button>
    )
  }

  const { state, stats: rawStats, exploredCount } = summary
  const stats = rawStats ? { ...createInitialStats(), ...rawStats } : createInitialStats()
  const totalCreatures = ALL_CREATURES.length
  const speciesPct = totalCreatures > 0 ? state.player.captured.length / totalCreatures : 0
  const mapPct = exploredCount / 3600
  const rangersDefeated = (stats.defeatedRangers ?? []).length
  const miniBossCount = (MINI_BOSS_IDS as readonly string[]).filter(id => (stats.defeatedRangers ?? []).includes(id)).length
  const questsDone = Object.values(state.questProgress).filter(q => q.status === 'completed' || q.status === 'rewarded').length
  const overallPct = (speciesPct * 0.4 + mapPct * 0.3 + (rangersDefeated / RANGERS.length) * 0.3)
  const glowColor = overallPct > 0.7 ? '#fbbf24' : overallPct > 0.3 ? '#4ade80' : '#22d3ee'
  const xpPct = state.player.maxXp > 0 ? Math.min(1, state.player.xp / state.player.maxXp) : 0
  const statItems = [
    { icon: '🧬', label: 'Species', value: `${state.player.captured.length}/${totalCreatures}`, pct: speciesPct },
    { icon: '🗺️', label: 'Map', value: `${Math.round(mapPct * 100)}%`, pct: mapPct },
    { icon: '⚔️', label: 'Rangers', value: `${rangersDefeated}/${RANGERS.length}`, pct: rangersDefeated / RANGERS.length },
    { icon: '👑', label: 'Bosses', value: `${miniBossCount}/${MINI_BOSS_IDS.length}`, pct: miniBossCount / MINI_BOSS_IDS.length },
    { icon: '📋', label: 'Quests', value: `${questsDone}`, pct: Math.min(questsDone / 10, 1) },
    { icon: '📍', label: 'Area', value: state.currentSubregion || state.currentBiome, pct: -1 },
  ]

  return (
    <div
      className="group relative w-full overflow-hidden rounded-lg transition-all hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, rgba(4, 12, 24, 0.92), rgba(8, 30, 34, 0.88) 52%, rgba(32, 22, 42, 0.86))',
        border: `1px solid ${glowColor}40`,
        boxShadow: `0 20px 54px rgba(0,0,0,0.34), 0 0 32px ${glowColor}18, inset 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(${glowColor}12 1px, transparent 1px), linear-gradient(90deg, ${glowColor}10 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: `linear-gradient(180deg, ${glowColor}, transparent 70%)` }} />
      <div className="relative h-12 overflow-hidden border-b border-white/5">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${glowColor}20, transparent 44%), repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 10px)`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}66, transparent)` }} />
        <div className="relative flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase text-white/50" style={{ letterSpacing: 0 }}>
            <PixelIcon icon="📓" size={isCompact ? 20 : 24} color={glowColor} title={`Slot ${slot}`} />
            <span className="truncate">Slot {slot} Field Log</span>
          </div>
          <span className="shrink-0 text-xs sm:text-sm text-white/40">{timeAgo(summary.lastPlayed)}</span>
        </div>
      </div>

      <div className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 min-w-0">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value.slice(0, 20))}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                    else if (e.key === 'Escape') { e.preventDefault(); setNameDraft(summary.name ?? ''); setEditingName(false) }
                    else e.stopPropagation()
                  }}
                  placeholder={`Save ${slot}`}
                  className="min-w-0 flex-1 bg-transparent text-lg sm:text-2xl font-black text-white outline-none border-b-2 pb-1"
                  style={{ borderColor: `${glowColor}70` }}
                />
              ) : (
                <button
                  onClick={() => { setNameDraft(summary.name ?? ''); setEditingName(true) }}
                  className="min-w-0 flex-1 text-left text-lg sm:text-2xl font-black text-white truncate transition-colors hover:text-white/80"
                  title="Rename this save"
                >
                  {summary.name || `Save ${slot}`}
                  <span className="text-white/20 text-sm ml-2">✎</span>
                </button>
              )}
              <span
                className="shrink-0 rounded-lg px-2.5 py-1 text-sm sm:text-base font-black"
                style={{ color: glowColor, background: `${glowColor}16`, border: `1px solid ${glowColor}35` }}
              >
                Lv.{state.player.level}
              </span>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-white/40" style={{ letterSpacing: 0 }}>
                <span>XP SIGNAL</span>
                <span>{state.player.xp}/{state.player.maxXp}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/50" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.42)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct * 100}%`,
                    background: `linear-gradient(90deg, ${glowColor}, #fbbf24)`,
                    boxShadow: `0 0 16px ${glowColor}66`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <CircleProgress pct={overallPct} size={isCompact ? 54 : 68} color={glowColor} />
              <span className="text-[11px] font-bold text-white/40">Complete</span>
            </div>
            <div className="hidden sm:flex max-w-[148px] flex-wrap justify-end gap-1.5">
              {state.player.team.slice(0, 6).map((c, i) => (
                <PixelCreatureToken key={i} creature={c} size={30} title={c.nickname || c.name} />
              ))}
              {state.player.team.length === 0 && <span className="text-sm text-white/25">No team</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 sm:hidden">
          {state.player.team.slice(0, 6).map((c, i) => (
            <PixelCreatureToken key={i} creature={c} size={28} title={c.nickname || c.name} />
          ))}
          {state.player.team.length === 0 && <span className="text-sm text-white/25">No team</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-3 min-w-0">
          {statItems.map((s, i) => (
            <div key={i} className="flex min-w-0 items-center gap-2">
              <PixelIcon icon={s.icon} size={isCompact ? 20 : 24} color={glowColor} title={s.label} />
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 leading-tight uppercase" style={{ letterSpacing: 0 }}>{s.label}</p>
                <p className="text-sm text-white/75 font-semibold leading-tight truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex border-t border-white/5 bg-black/20">
        <button onClick={onLoad} className="flex flex-1 items-center justify-center gap-2 py-3 sm:py-4 text-base sm:text-lg font-black transition-colors hover:bg-white/5"
          style={{ color: glowColor }}>
          <PixelIcon icon="✓" size={isCompact ? 22 : 26} color={glowColor} title="Continue" />
          Continue
        </button>
        <div className="w-px bg-white/5" />
        {confirmDel ? (
          <div className="flex">
            <button onClick={() => { onDelete(); setConfirmDel(false) }}
              className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-colors">
              Confirm
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-white/30 hover:bg-white/5 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default function TitleScreen({ onLoadSlot, onNewGame, onDeleteSlot }: Props) {
  const [slots, setSlots] = useState<(SaveSlotSummary | null)[]>([null, null, null])
  const [phase, setPhase] = useState(0)
  const [titleChars, setTitleChars] = useState(0)
  const isCompact = useIsCompact()

  useEffect(() => {
    migrateLegacySave()
    setSlots(getAllSaveSlots())
  }, [])

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase < 2) return
    const interval = setInterval(() => {
      setTitleChars(prev => {
        if (prev >= TITLE.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 70)
    return () => clearInterval(interval)
  }, [phase])

  const handleDelete = useCallback((slot: SaveSlotIndex) => {
    onDeleteSlot(slot)
    setSlots(getAllSaveSlots())
  }, [onDeleteSlot])

  return (
    <div className="relative min-h-screen overflow-hidden overflow-y-auto select-none bg-[#020711] text-white">
      <style>{`
        @keyframes title-glow-pulse { 0%, 100% { filter: drop-shadow(0 0 20px rgba(34,211,238,0.28)) drop-shadow(0 0 44px rgba(251,191,36,0.1)); } 50% { filter: drop-shadow(0 0 34px rgba(110,231,183,0.34)) drop-shadow(0 0 70px rgba(251,191,36,0.16)); } }
        @keyframes creature-enter-left { 0% { opacity: 0; transform: translateX(-60px) scale(0.6); } 60% { opacity: 0.7; } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes creature-enter-right { 0% { opacity: 0; transform: translateX(60px) scale(0.6); } 60% { opacity: 0.7; } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes creature-idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes slot-enter { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes scanline-sweep { 0% { transform: translateY(-100%); opacity: 0; } 35% { opacity: 0.32; } 100% { transform: translateY(100%); opacity: 0; } }
        @keyframes pixel-caret { 0%, 44% { opacity: 1; } 45%, 100% { opacity: 0; } }
      `}</style>

      <TitleBackdropCanvas phase={phase} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(2,7,17,0.08), rgba(2,7,17,0.18) 38%, rgba(2,7,17,0.52) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(2,7,17,0.78), transparent)' }}
      />
      <div
        className="absolute inset-x-0 top-0 h-full pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '100% 5px',
          mixBlendMode: 'screen',
          opacity: 0.16,
        }}
      />
      <div
        className="absolute left-0 right-0 top-0 h-28 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(125,211,252,0.16), transparent)',
          animation: phase >= 2 ? 'scanline-sweep 5.2s ease-in-out 1.6s infinite' : 'none',
        }}
      />

      {/* Floating creatures */}
      {CREATURES.map((c, i) => (
        <div key={i} className="absolute z-[2] pointer-events-none" style={{
          left: `${c.x}%`, top: `${c.y}%`,
          opacity: phase >= 3 ? 1 : 0,
          animation: phase >= 3
            ? `${c.from === 'left' ? 'creature-enter-left' : 'creature-enter-right'} 0.8s ease-out ${c.delay - 1.6}s both, creature-idle ${3 + (i % 2)}s ease-in-out ${c.delay}s infinite`
            : 'none',
          filter: `drop-shadow(0 0 16px rgba(34,211,238,0.18)) drop-shadow(0 9px 16px rgba(0,0,0,0.28))`,
        }}>
          {(() => {
            const creature = ALL_CREATURES.find(candidate => candidate.id === c.creatureId)
            return creature ? <PixelCreatureToken creature={creature} size={isCompact ? Math.round(c.size * 0.82) : c.size} selected title={creature.name} /> : null
          })()}
        </div>
      ))}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-3 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-14">
        <div
          className="mb-5 sm:mb-7 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(3, 10, 16, 0.42)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 14px 32px rgba(0,0,0,0.22)',
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 800ms ease, transform 800ms ease',
          }}
        >
          <PixelIcon icon="✦" size={isCompact ? 22 : 26} variant="gold" selected title="Field guide" />
          <span className="text-xs sm:text-sm font-bold uppercase text-white/60" style={{ letterSpacing: 0 }}>
            California Field Guide
          </span>
        </div>

        <section className="relative w-full text-center mb-7 sm:mb-9">
          <div style={{ animation: phase >= 2 ? 'title-glow-pulse 4.5s ease-in-out 1.8s infinite' : 'none' }}>
            <h1 className="relative text-6xl sm:text-8xl font-black" style={{ lineHeight: 0.95, letterSpacing: 0 }} aria-label={TITLE}>
              <span
                className="absolute inset-x-0 top-2 text-transparent"
                style={{
                  WebkitTextStroke: isCompact ? '2px rgba(2,7,17,0.76)' : '3px rgba(2,7,17,0.76)',
                }}
                aria-hidden="true"
              >
                {TITLE}
              </span>
              {TITLE.split('').map((char, i) => (
                <span
                  key={i}
                  style={{
                    background: 'linear-gradient(135deg, #d9f99d 0%, #6ee7b7 24%, #67e8f9 52%, #fbbf24 78%, #fb7185 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: i < titleChars ? 1 : 0,
                    transition: 'opacity 0.15s ease, transform 0.2s ease',
                    transform: i < titleChars ? 'translateY(0)' : 'translateY(8px)',
                    display: 'inline-block',
                    textShadow: '0 5px 0 rgba(0,0,0,0.42)',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              {titleChars >= TITLE.length && (
                <span
                  className="ml-1 inline-block h-10 w-2 sm:h-16 sm:w-3 align-middle"
                  style={{
                    background: '#fbbf24',
                    boxShadow: '0 0 18px rgba(251,191,36,0.64)',
                    animation: 'pixel-caret 1.1s steps(1) infinite',
                  }}
                  aria-hidden="true"
                />
              )}
            </h1>
          </div>
          <p className="mt-3 text-base sm:text-xl font-black uppercase" style={{
            color: 'rgba(218, 255, 228, 0.74)',
            letterSpacing: 0,
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 1s ease 0.35s',
            textShadow: '0 2px 10px rgba(0,0,0,0.55)',
          }}>
            Creatures of California
          </p>
          <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-3" style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 1s ease 0.65s',
          }}>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(103,232,249,0.45))' }} />
            <p className="text-sm sm:text-base font-bold text-cyan-100/60" style={{ letterSpacing: 0 }}>Explore · Discover · Collect</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.45), transparent)' }} />
          </div>
        </section>

        <div
          className="relative z-10 w-full max-w-2xl px-0 sm:px-2 space-y-3 sm:space-y-4"
          style={{
            opacity: phase >= 4 ? 1 : 0,
          }}
        >
          {([1, 2, 3] as SaveSlotIndex[]).map((slot, i) => (
            <div key={slot} style={{ animation: phase >= 4 ? `slot-enter 0.42s ease-out ${i * 0.12}s both` : 'none' }}>
              <SaveSlotCard
                summary={slots[i]}
                slot={slot}
                onLoad={() => onLoadSlot(slot)}
                onNew={() => onNewGame(slot)}
                onDelete={() => handleDelete(slot)}
                onRename={(name) => {
                  saveSlotName(slot, name)
                  setSlots(prev => prev.map((s, idx) => idx === i && s ? { ...s, name: name.trim() || null } : s))
                }}
              />
            </div>
          ))}
        </div>

        <div
          className="relative z-10 mt-5 sm:mt-7 flex max-w-full flex-wrap items-center justify-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white/40"
          style={{
            background: 'rgba(2, 7, 17, 0.36)',
            border: '1px solid rgba(255,255,255,0.06)',
            letterSpacing: 0,
            opacity: phase >= 4 ? 1 : 0,
            transition: 'opacity 1s ease 0.45s',
          }}
        >
          <span>WASD or Arrow Keys to move</span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span>Space to interact</span>
        </div>
      </main>
    </div>
  )
}
