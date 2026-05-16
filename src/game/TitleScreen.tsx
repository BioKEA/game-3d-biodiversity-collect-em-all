import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { SaveSlotIndex } from './gameState'
import { getAllSaveSlots, migrateLegacySave, saveSlotName } from './gameState'
import type { SaveSlotSummary } from './gameState'
import { ALL_CREATURES } from './creatures'
import { MINI_BOSS_IDS, RANGERS } from './rangers'
import { createInitialStats } from './achievements'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  onLoadSlot: (slot: SaveSlotIndex) => void
  onNewGame: (slot: SaveSlotIndex) => void
  onDeleteSlot: (slot: SaveSlotIndex) => void
}

const TITLE = 'WildCal'

const CREATURES = [
  { emoji: '🦅', x: 8, y: 52, size: 36, delay: 1.2, from: 'left' as const },
  { emoji: '🦊', x: 82, y: 58, size: 30, delay: 1.8, from: 'right' as const },
  { emoji: '🦋', x: 60, y: 38, size: 22, delay: 2.4, from: 'right' as const },
  { emoji: '🦭', x: 20, y: 72, size: 28, delay: 2.0, from: 'left' as const },
  { emoji: '🐸', x: 45, y: 68, size: 20, delay: 2.8, from: 'left' as const },
  { emoji: '🐉', x: 72, y: 30, size: 26, delay: 3.2, from: 'right' as const },
  { emoji: '🦝', x: 15, y: 35, size: 18, delay: 3.6, from: 'left' as const },
  { emoji: '🌊', x: 90, y: 75, size: 20, delay: 3.0, from: 'right' as const },
]

const FOG_LAYERS = [
  { y: 55, opacity: 0.07, speed: 80, height: 60 },
  { y: 45, opacity: 0.05, speed: 120, height: 80 },
  { y: 65, opacity: 0.04, speed: 60, height: 50 },
]

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

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  const commitRename = () => {
    onRename(nameDraft)
    setEditingName(false)
  }

  if (!summary) {
    return (
      <button onClick={onNew} className="w-full rounded-2xl p-5 sm:p-8 text-center transition-all active:scale-[0.98]" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.1)',
      }}>
        <span className="text-white/20 text-4xl sm:text-5xl block mb-2">+</span>
        <span className="text-white/30 text-sm sm:text-base">Empty Slot {slot}</span>
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

  return (
    <div className="w-full rounded-2xl overflow-hidden transition-all" style={{
      background: 'linear-gradient(135deg, rgba(8,20,40,0.85), rgba(6,14,30,0.9))',
      border: `1px solid ${glowColor}25`,
      boxShadow: `0 8px 36px rgba(0,0,0,0.35), 0 0 30px ${glowColor}10`,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 pt-4 sm:pt-5 pb-2 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm font-bold text-white/30 uppercase tracking-wider shrink-0">S{slot}</span>
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
              className="flex-1 min-w-0 bg-transparent text-base sm:text-xl font-semibold text-white outline-none border-b-2 pb-0.5"
              style={{ borderColor: `${glowColor}60` }}
            />
          ) : (
            <button
              onClick={() => { setNameDraft(summary.name ?? ''); setEditingName(true) }}
              className="flex-1 min-w-0 text-left text-base sm:text-xl font-semibold text-white truncate hover:text-white/80 transition-colors"
              title="Rename this save"
            >
              {summary.name || `Save ${slot}`}
              <span className="text-white/20 text-sm ml-2">✎</span>
            </button>
          )}
          <span className="text-base font-medium shrink-0" style={{ color: `${glowColor}90` }}>Lv.{state.player.level}</span>
        </div>
        <span className="text-sm text-white/25 shrink-0">{timeAgo(summary.lastPlayed)}</span>
      </div>

      {/* XP bar */}
      <div className="px-3 sm:px-6 mb-3 sm:mb-4">
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{
            width: `${(state.player.xp / state.player.maxXp) * 100}%`,
            background: 'linear-gradient(90deg, #06b6d4, #4ade80)',
          }} />
        </div>
      </div>

      <div className="px-3 sm:px-6 pb-4 sm:pb-5 flex gap-3 sm:gap-5">
        {/* Left: Team + ring */}
        <div className="flex flex-col items-center gap-2.5">
          <CircleProgress pct={overallPct} size={window.innerWidth < 640 ? 52 : 64} color={glowColor} />
          {/* Team sprites */}
          <div className="flex flex-wrap justify-center gap-1 max-w-[100px] sm:max-w-[140px]">
            {state.player.team.slice(0, 6).map((c, i) => (
              <PixelCreatureToken key={i} creature={c} size={window.innerWidth < 640 ? 26 : 30} title={c.nickname || c.name} />
            ))}
            {state.player.team.length === 0 && <span className="text-sm text-white/20">No team</span>}
          </div>
        </div>

        {/* Right: Stats grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 min-w-0">
          {[
            { icon: '🧬', label: 'Species', value: `${state.player.captured.length}/${totalCreatures}`, pct: speciesPct },
            { icon: '🗺️', label: 'Map', value: `${Math.round(mapPct * 100)}%`, pct: mapPct },
            { icon: '⚔️', label: 'Rangers', value: `${rangersDefeated}/${RANGERS.length}`, pct: rangersDefeated / RANGERS.length },
            { icon: '👑', label: 'Bosses', value: `${miniBossCount}/${MINI_BOSS_IDS.length}`, pct: miniBossCount / MINI_BOSS_IDS.length },
            { icon: '📋', label: 'Quests', value: `${questsDone}`, pct: Math.min(questsDone / 10, 1) },
            { icon: '📍', label: 'Area', value: state.currentSubregion || state.currentBiome, pct: -1 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-base sm:text-xl shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-white/25 leading-tight uppercase tracking-wider">{s.label}</p>
                <p className="text-sm text-white/70 font-semibold leading-tight truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex border-t border-white/5">
        <button onClick={onLoad} className="flex-1 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-colors hover:bg-white/5"
          style={{ color: glowColor }}>
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
  const [driftX, setDriftX] = useState(0)

  const stars = useMemo(() =>
    Array.from({ length: 120 }, () => ({
      x: Math.random() * 100, y: Math.random() * 55,
      size: Math.random() * 2 + 0.3, delay: Math.random() * 5,
      duration: Math.random() * 3 + 2, brightness: Math.random(),
    })), []
  )

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

  useEffect(() => {
    let frame: number; let t = 0
    const tick = () => { t += 0.003; setDriftX(Math.sin(t) * 8); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleDelete = useCallback((slot: SaveSlotIndex) => {
    onDeleteSlot(slot)
    setSlots(getAllSaveSlots())
  }, [onDeleteSlot])

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 pb-16 relative overflow-hidden overflow-y-auto select-none" style={{
      background: 'linear-gradient(180deg, #020810 0%, #081828 20%, #0e2848 40%, #163050 55%, #0d3838 75%, #061a14 100%)',
    }}>
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.8; } }
        @keyframes title-glow-pulse { 0%, 100% { filter: drop-shadow(0 0 20px rgba(34,211,238,0.2)) drop-shadow(0 0 40px rgba(74,222,128,0.1)); } 50% { filter: drop-shadow(0 0 30px rgba(34,211,238,0.35)) drop-shadow(0 0 60px rgba(74,222,128,0.15)); } }
        @keyframes creature-enter-left { 0% { opacity: 0; transform: translateX(-60px) scale(0.6); } 60% { opacity: 0.7; } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes creature-enter-right { 0% { opacity: 0; transform: translateX(60px) scale(0.6); } 60% { opacity: 0.7; } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes creature-idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes fog-drift { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes biolum-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @keyframes slot-enter { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Stars */}
      <div style={{ transform: `translateX(${driftX * 0.15}px)` }} className="absolute inset-0">
        {stars.map((star, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: star.size, height: star.size, left: `${star.x}%`, top: `${star.y}%`,
            background: star.brightness > 0.85 ? '#a5c4e8' : star.brightness > 0.7 ? '#e8d4a5' : '#fff',
            opacity: phase >= 1 ? 0.3 : 0, transition: 'opacity 2s ease',
            animation: phase >= 1 ? `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite` : 'none',
          }} />
        ))}
      </div>

      {/* Moon */}
      <div className="absolute" style={{
        top: '4%', right: '12%', width: 28, height: 28, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #f0e6d4, #b0a080)',
        boxShadow: '0 0 40px rgba(240,230,212,0.1)',
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 2s ease 0.5s',
      }} />

      {/* Landscape */}
      <div style={{ transform: `translateX(${driftX * 0.4}px)` }} className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg style={{ height: '30vh', width: '110%', marginLeft: '-5%' }} viewBox="0 0 880 280" preserveAspectRatio="none">
          <polygon points="0,280 0,160 140,100 260,80 400,65 540,70 680,60 800,75 880,85 880,280"
            fill="#091a2e" opacity={phase >= 1 ? 0.7 : 0} style={{ transition: 'opacity 1.5s ease' }} />
          <rect x="260" y="95" width="5" height="75" fill="#c45030" opacity={phase >= 1 ? 0.35 : 0} style={{ transition: 'opacity 2s ease 0.3s' }} />
          <rect x="400" y="95" width="5" height="75" fill="#c45030" opacity={phase >= 1 ? 0.35 : 0} style={{ transition: 'opacity 2s ease 0.3s' }} />
          <polygon points="0,280 0,200 120,178 240,168 400,155 540,165 700,148 880,172 880,280"
            fill="#082018" opacity={phase >= 1 ? 0.9 : 0} style={{ transition: 'opacity 1.5s ease 0.2s' }} />
        </svg>
      </div>

      {/* Fog */}
      {FOG_LAYERS.map((fog, i) => (
        <div key={i} className="absolute left-0 right-0 pointer-events-none" style={{
          top: `${fog.y}%`, height: fog.height,
          opacity: phase >= 1 ? fog.opacity : 0, transition: 'opacity 3s ease 1s',
        }}>
          <div style={{
            width: '200%', height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,220,240,0.5) 25%, rgba(200,220,240,0.8) 50%, rgba(200,220,240,0.5) 75%, transparent 100%)',
            animation: `fog-drift ${fog.speed}s linear infinite`,
          }} />
        </div>
      ))}

      {/* Bioluminescent particles */}
      {phase >= 1 && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '25%' }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
              left: `${8 + (i * 9) % 84}%`, bottom: `${5 + (i * 7.3) % 25}%`,
              background: i % 3 === 0 ? '#22d3ee' : '#4ade80',
              animation: `biolum-pulse ${2 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Floating creatures */}
      {CREATURES.map((c, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: `${c.x}%`, top: `${c.y}%`, fontSize: c.size,
          opacity: phase >= 3 ? 1 : 0,
          animation: phase >= 3
            ? `${c.from === 'left' ? 'creature-enter-left' : 'creature-enter-right'} 0.8s ease-out ${c.delay - 1.6}s both, creature-idle ${3 + (i % 2)}s ease-in-out ${c.delay}s infinite`
            : 'none',
          filter: `drop-shadow(0 0 12px rgba(34,211,238,0.15))`,
        }}>
          {c.emoji}
        </div>
      ))}

      {/* Title */}
      <div className="relative z-10 text-center mb-10">
        <div style={{ animation: phase >= 2 ? 'title-glow-pulse 4s ease-in-out 2s infinite' : 'none' }}>
          <h1 className="text-5xl sm:text-8xl font-black tracking-tight" style={{ lineHeight: 1.1 }}>
            {TITLE.split('').map((char, i) => (
              <span key={i} style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 35%, #818cf8 65%, #c084fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                opacity: i < titleChars ? 1 : 0, transition: 'opacity 0.15s ease',
                display: 'inline-block',
              }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
        </div>
        <p className="text-xs sm:text-base tracking-[0.3em] sm:tracking-[0.4em] uppercase font-medium mt-2 sm:mt-3" style={{
          color: 'rgba(74,222,128,0.4)', opacity: phase >= 2 ? 1 : 0, transition: 'opacity 1s ease 0.5s',
        }}>
          Creatures of California
        </p>
        <div className="flex items-center justify-center gap-4 mt-3" style={{
          opacity: phase >= 2 ? 1 : 0, transition: 'opacity 1s ease 0.8s',
        }}>
          <div className="h-px flex-1 max-w-28" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15))' }} />
          <p className="text-sm tracking-[0.2em]" style={{ color: 'rgba(34,211,238,0.25)' }}>Explore · Discover · Collect</p>
          <div className="h-px flex-1 max-w-28" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.15), transparent)' }} />
        </div>
      </div>

      {/* Save slots */}
      <div className="relative z-10 w-full max-w-xl px-3 sm:px-6 space-y-4 sm:space-y-5" style={{
        opacity: phase >= 4 ? 1 : 0,
      }}>
        {([1, 2, 3] as SaveSlotIndex[]).map((slot, i) => (
          <div key={slot} style={{ animation: phase >= 4 ? `slot-enter 0.4s ease-out ${i * 0.12}s both` : 'none' }}>
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

      {/* Controls hint */}
      <div className="relative z-10 mt-6 sm:mt-10 px-4" style={{
        opacity: phase >= 4 ? 1 : 0, transition: 'opacity 1s ease 0.5s',
      }}>
        <p className="text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-center" style={{ color: 'rgba(34,211,238,0.2)' }}>
          WASD or Arrow Keys to move · Space to interact
        </p>
      </div>
    </div>
  )
}
