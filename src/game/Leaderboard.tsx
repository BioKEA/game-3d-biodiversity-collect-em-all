import { useState, useEffect, useMemo, useRef } from 'react'
import type { PlayerStats } from './achievements'
import FloatingPanel from './FloatingPanel'
import { GAME_ID, leaderboard } from '@/lib/leaderboard-client'

interface Props {
  playerName: string
  playerLevel: number
  speciesCaught: number
  totalSpecies: number
  stats: PlayerStats
  onClose: () => void
  onRename?: (name: string) => void
}

interface LeaderboardEntry {
  rank: number
  name: string
  title: string
  level: number
  species: number
  score: number
  isPlayer?: boolean
  isRemote?: boolean
}

const MODE = 'endless'
const DAILY_MODE = 'daily'
const DAILY_SUBMIT_KEY = 'wildcal:daily-submitted-v1'

function sanitizeHandle(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().slice(0, 16) || 'anon'
}

function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Submit today's snapshot to the cross-game BKP leaderboard. Idempotent
// per (day, score) — short-circuits when the score hasn't risen since
// the last submit, so this can fire on every state change without
// hammering Supabase. Returns silently on any failure.
async function submitDailyIfBetter(args: {
  handle: string
  score: number
  level: number
  species: number
  battlesWon: number
}): Promise<void> {
  if (!args.handle || args.handle === 'anon') return
  if (args.score <= 0) return
  const day = todayKey()
  let prevScore = 0
  let prevDay = ''
  try {
    const raw = localStorage.getItem(DAILY_SUBMIT_KEY)
    if (raw) {
      const prev = JSON.parse(raw) as { day?: string; score?: number }
      if (prev.day === day && typeof prev.score === 'number') prevScore = prev.score
      prevDay = prev.day ?? ''
    }
  } catch { /* ignore */ }
  if (prevDay === day && args.score <= prevScore) return

  const result = await leaderboard.submitScore({
    gameId: GAME_ID,
    mode: DAILY_MODE,
    seed: day,
    score: args.score,
    playerHandle: args.handle,
    metadata: {
      level: args.level,
      species: args.species,
      battlesWon: args.battlesWon,
    },
  }).catch(() => null)

  if (result?.ok) {
    try {
      localStorage.setItem(DAILY_SUBMIT_KEY, JSON.stringify({ day, score: args.score }))
    } catch { /* ignore */ }
  }
}

function computeScore(level: number, species: number, battlesWon: number): number {
  return level * 100 + species * 50 + battlesWon * 10
}

// Generate plausible NPC leaderboard entries based on player progress
function generateNPCEntries(playerLevel: number, speciesCaught: number): LeaderboardEntry[] {
  const npcs: { name: string; title: string; skillFactor: number }[] = [
    { name: 'Dr. Marina Bay', title: 'Marine Biologist', skillFactor: 1.3 },
    { name: 'Ranger Elena', title: 'Presidio Naturalist', skillFactor: 1.15 },
    { name: 'Prof. Redwood', title: 'Ecology Professor', skillFactor: 1.1 },
    { name: 'Birder Mei', title: 'Avid Birdwatcher', skillFactor: 0.95 },
    { name: 'Hiker Sam', title: 'Trail Runner', skillFactor: 0.85 },
    { name: 'Luna Chen', title: 'Wildlife Photographer', skillFactor: 0.8 },
    { name: 'Surfer Kai', title: 'Wave Chaser', skillFactor: 0.7 },
    { name: 'Night Owl Raven', title: 'Nocturnal Researcher', skillFactor: 0.6 },
    { name: 'Jogger Priya', title: 'Park Runner', skillFactor: 0.5 },
  ]

  return npcs.map(npc => {
    const lvl = Math.max(1, Math.floor(playerLevel * npc.skillFactor + (Math.random() - 0.5) * 3))
    const sp = Math.max(1, Math.floor(speciesCaught * npc.skillFactor + (Math.random() - 0.5) * 5))
    return {
      rank: 0,
      name: npc.name,
      title: npc.title,
      level: lvl,
      species: Math.min(sp, 56),
      score: lvl * 100 + sp * 50,
    }
  })
}

type SortKey = 'score' | 'species' | 'level'

export default function Leaderboard({ playerName, playerLevel, speciesCaught, totalSpecies, stats, onClose, onRename }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(playerName)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNameDraft(playerName) }, [playerName])
  useEffect(() => { if (editingName) nameRef.current?.focus() }, [editingName])

  const commitName = () => {
    const clean = nameDraft.trim().slice(0, 16)
    if (clean && clean !== playerName && onRename) onRename(clean)
    setEditingName(false)
  }

  // Submit current run + fetch remote top scores; fall back to NPC entries on failure / unconfigured.
  useEffect(() => {
    let cancelled = false
    const battlesWon = stats.totalBattlesWon ?? 0
    const playerScore = computeScore(playerLevel, speciesCaught, battlesWon)
    const playerEntry: LeaderboardEntry = {
      rank: 0,
      name: playerName,
      title: 'Explorer',
      level: playerLevel,
      species: speciesCaught,
      score: playerScore,
      isPlayer: true,
    }

    const npcs = generateNPCEntries(playerLevel, speciesCaught)
    // Show NPCs immediately so the panel never feels empty.
    setEntries([playerEntry, ...npcs])

    async function syncRemote() {
      if (!leaderboard.configured) return

      // Best-effort submission to the in-game endless leaderboard.
      void leaderboard.submitScore({
        gameId: GAME_ID,
        mode: MODE,
        score: playerScore,
        playerHandle: sanitizeHandle(playerName),
        metadata: {
          level: playerLevel,
          species: speciesCaught,
          totalSpecies,
          battlesWon,
          creaturesCaught: stats.totalCreaturesCaught ?? 0,
          stepsWalked: stats.totalStepsWalked ?? 0,
          title: 'Explorer',
        },
      })

      // Parallel daily submission for cross-game BKP standings. Daily mode
      // uses YYYY-MM-DD as the seed so it matches the BKP `ranked_modes`
      // lookup in website-biokea migration 0003.
      void submitDailyIfBetter({
        handle: sanitizeHandle(playerName),
        score: playerScore,
        level: playerLevel,
        species: speciesCaught,
        battlesWon,
      })

      const top = await leaderboard.getTopScores({ gameId: GAME_ID, mode: MODE, limit: 25 })
      if (cancelled || top.length === 0) return

      const remoteEntries: LeaderboardEntry[] = top.map(row => {
        const meta = row.metadata ?? {}
        const level = typeof meta.level === 'number' ? meta.level : 1
        const species = typeof meta.species === 'number' ? meta.species : 0
        const title = typeof meta.title === 'string' ? meta.title : 'Explorer'
        return {
          rank: 0,
          name: row.player_handle,
          title,
          level,
          species,
          score: row.score,
          isRemote: true,
        }
      })

      // Merge: keep local player entry, fill rest with remote then NPCs (dedup by name).
      const seen = new Set<string>([playerName])
      const merged: LeaderboardEntry[] = [playerEntry]
      for (const e of remoteEntries) {
        if (seen.has(e.name)) continue
        seen.add(e.name)
        merged.push(e)
      }
      for (const e of npcs) {
        if (merged.length >= 10) break
        if (seen.has(e.name)) continue
        seen.add(e.name)
        merged.push(e)
      }
      setEntries(merged)
    }

    void syncRemote()
    return () => { cancelled = true }
  }, [playerLevel, speciesCaught, playerName, totalSpecies, stats.totalBattlesWon, stats.totalCreaturesCaught, stats.totalStepsWalked])

  const sorted = useMemo(() => {
    const s = [...entries].sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'species') return b.species - a.species
      return b.level - a.level
    })
    return s.map((e, i) => ({ ...e, rank: i + 1 }))
  }, [entries, sortBy])

  const playerRank = sorted.find(e => e.isPlayer)?.rank ?? 0
  const medalColors = ['', '#fbbf24', '#9ca3af', '#cd7f32'] // gold, silver, bronze

  return (
    <FloatingPanel
      title="Leaderboard"
      subtitle="Top Bay Area Explorers"
      onClose={onClose}
      width="md"
    >
      <div className="p-3 space-y-3">
        {/* Player summary card */}
        <div className="rounded-xl p-3 text-center" style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.03))',
          border: '1px solid rgba(251,191,36,0.15)',
        }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl">🏆</span>
            <span className="text-amber-400 text-lg font-bold">#{playerRank}</span>
          </div>
          {editingName && onRename ? (
            <input
              ref={nameRef}
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value.slice(0, 16))}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitName() }
                else if (e.key === 'Escape') { e.preventDefault(); setNameDraft(playerName); setEditingName(false) }
                else e.stopPropagation()
              }}
              placeholder="Your name"
              className="bg-transparent text-white text-xs font-semibold text-center outline-none border-b border-amber-400/50 px-1 min-w-[120px]"
            />
          ) : (
            <button
              onClick={() => onRename && setEditingName(true)}
              disabled={!onRename}
              className="text-white text-xs font-semibold hover:text-amber-200 transition-colors group inline-flex items-center gap-1"
              title={onRename ? 'Click to rename' : ''}
            >
              {playerName}
              {onRename && <span className="text-white/25 text-[9px] group-hover:text-amber-400/60">✎</span>}
            </button>
          )}
          <div className="flex justify-center gap-4 mt-1.5">
            <div className="text-center">
              <p className="text-amber-400 text-sm font-bold">{playerLevel}</p>
              <p className="text-white/25 text-[7px] uppercase">Level</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-400 text-sm font-bold">{speciesCaught}/{totalSpecies}</p>
              <p className="text-white/25 text-[7px] uppercase">Species</p>
            </div>
            <div className="text-center">
              <p className="text-cyan-400 text-sm font-bold">{sorted.find(e => e.isPlayer)?.score ?? 0}</p>
              <p className="text-white/25 text-[7px] uppercase">Score</p>
            </div>
          </div>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {([
            { key: 'score' as SortKey, label: '⭐ Score' },
            { key: 'species' as SortKey, label: '📚 Species' },
            { key: 'level' as SortKey, label: '⚡ Level' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className="flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all"
              style={{
                background: sortBy === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: sortBy === tab.key ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rankings */}
        <div className="space-y-1">
          {sorted.map((entry) => (
            <div
              key={entry.name}
              className="rounded-lg border p-2 transition-all"
              style={{
                background: entry.isPlayer ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: entry.isPlayer ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
                boxShadow: entry.rank <= 3 ? `0 0 8px ${medalColors[entry.rank]}15` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {entry.rank <= 3 ? (
                    <span className="text-base">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-white/30 text-xs font-mono">#{entry.rank}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[10px] font-semibold truncate">{entry.name}</span>
                    {entry.isPlayer && (
                      <span className="text-[7px] px-1 py-px rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">YOU</span>
                    )}
                  </div>
                  <span className="text-white/25 text-[8px]">{entry.title}</span>
                </div>

                {/* Stats */}
                <div className="flex gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-white/60 text-[9px] font-semibold">{entry.level}</p>
                    <p className="text-white/15 text-[6px]">LVL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-400/80 text-[9px] font-semibold">{entry.species}</p>
                    <p className="text-white/15 text-[6px]">SPE</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-[9px] font-bold ${sortBy === 'score' ? 'text-amber-400' : 'text-white/40'}`}>{entry.score}</p>
                    <p className="text-white/15 text-[6px]">PTS</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stat summary */}
        <div className="rounded-lg border border-white/5 p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-white/25 text-[8px] uppercase tracking-wider">Your Stats</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-white/50 text-[10px] font-semibold">{stats.totalBattlesWon ?? 0}</p>
              <p className="text-white/20 text-[7px]">Battles Won</p>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[10px] font-semibold">{stats.totalCreaturesCaught ?? 0}</p>
              <p className="text-white/20 text-[7px]">Caught</p>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[10px] font-semibold">{stats.totalStepsWalked ?? 0}</p>
              <p className="text-white/20 text-[7px]">Steps</p>
            </div>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}
