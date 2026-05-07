import { useState, useEffect, useCallback } from 'react'

export interface WorldEvent {
  id: string
  type: 'rare_spawn' | 'swarm' | 'weather_bonus'
  title: string
  description: string
  icon: string
  location: string
  subregion: string
  durationMinutes: number
  startedAt: number // game minutes
  creatureHint?: string
}

const EVENT_POOL: Omit<WorldEvent, 'id' | 'startedAt'>[] = [
  {
    type: 'rare_spawn',
    title: 'Legendary Sighting!',
    description: 'A legendary creature has been spotted near',
    icon: '⭐',
    location: 'Muir Woods',
    subregion: 'Muir Woods',
    durationMinutes: 30,
    creatureHint: '🌿',
  },
  {
    type: 'rare_spawn',
    title: 'Mysterious Activity',
    description: 'Strange lights have been seen around',
    icon: '👻',
    location: 'Alcatraz Island',
    subregion: 'Alcatraz Island',
    durationMinutes: 25,
    creatureHint: '🌊',
  },
  {
    type: 'swarm',
    title: 'Creature Swarm!',
    description: 'Butterflies are swarming at',
    icon: '🦋',
    location: 'Golden Gate Park',
    subregion: 'Golden Gate Park',
    durationMinutes: 20,
    creatureHint: '🦋',
  },
  {
    type: 'rare_spawn',
    title: 'Rare Encounter!',
    description: 'A rare creature was spotted hunting near',
    icon: '🦅',
    location: 'Mt. Tamalpais',
    subregion: 'Mt. Tamalpais',
    durationMinutes: 30,
    creatureHint: '🦅',
  },
  {
    type: 'swarm',
    title: 'Seal Colony Alert',
    description: 'A huge group of seals has gathered at',
    icon: '🦭',
    location: "Fisherman's Wharf",
    subregion: 'North Beach / Fishermans Wharf',
    durationMinutes: 25,
    creatureHint: '🦭',
  },
  {
    type: 'rare_spawn',
    title: 'Fogcat Sighting',
    description: 'Something ghostly moves through the fog at',
    icon: '🐱',
    location: 'Twin Peaks',
    subregion: 'Twin Peaks',
    durationMinutes: 20,
    creatureHint: '🐱',
  },
  {
    type: 'weather_bonus',
    title: 'Storm Energy!',
    description: 'Electric creatures are more active near',
    icon: '⚡',
    location: 'Tesla Factory',
    subregion: 'Fremont',
    durationMinutes: 30,
    creatureHint: '⚡',
  },
  {
    type: 'rare_spawn',
    title: 'Eagle Watch',
    description: 'A golden eagle has been circling above',
    icon: '🦅',
    location: 'Mt. Diablo',
    subregion: 'Mt. Diablo',
    durationMinutes: 30,
    creatureHint: '🦅',
  },
  {
    type: 'swarm',
    title: 'Tidepool Bonanza!',
    description: 'Creatures are emerging from tidepools at',
    icon: '🦀',
    location: 'Half Moon Bay',
    subregion: 'Half Moon Bay',
    durationMinutes: 20,
    creatureHint: '🦀',
  },
  {
    type: 'rare_spawn',
    title: 'Mystic Convergence',
    description: 'Strange energy emanates from',
    icon: '✨',
    location: 'Angel Island',
    subregion: 'Angel Island',
    durationMinutes: 25,
    creatureHint: '✨',
  },
]

// Seasonal events — gated on gameDay (360-day year)
// Spring Mission Blue flight season: Apr-Jun (days 90-180)
const SEASONAL_EVENT_POOL: (Omit<WorldEvent, 'id' | 'startedAt'> & {
  isActive: (gameDay: number) => boolean
})[] = [
  {
    type: 'swarm',
    title: 'Mission Blue Emergence',
    description: 'Mission Blue Butterflies are fluttering across the lupine-covered hills at',
    icon: '🦋',
    location: 'Natural Bridges',
    subregion: 'Santa Cruz Beach Boardwalk',
    durationMinutes: 45,
    creatureHint: '🦋',
    // Active Apr-Jun (spring flight season matching mission-blue-butterfly)
    isActive: (gameDay: number) => gameDay >= 90 && gameDay < 180,
  },
]

// Roll a new random event, optionally biasing toward seasonal events currently in season
function rollEvent(gameMinutes: number, gameDay: number): WorldEvent {
  // Collect currently-in-season seasonal events
  const activeSeasonal = SEASONAL_EVENT_POOL.filter((e) => e.isActive(gameDay))

  // 35% chance to roll a seasonal event if any are active
  let template: Omit<WorldEvent, 'id' | 'startedAt'>
  if (activeSeasonal.length > 0 && Math.random() < 0.35) {
    const { isActive: _isActive, ...rest } = activeSeasonal[Math.floor(Math.random() * activeSeasonal.length)]
    template = rest
  } else {
    template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
  }

  return {
    ...template,
    id: `evt-${gameMinutes}-${Math.random().toString(36).slice(2, 6)}`,
    startedAt: gameMinutes,
  }
}

interface BannerProps {
  activeEvent: WorldEvent | null
  remainingMinutes: number
  dismissed: boolean
  dismiss: () => void
  currentSubregion: string
  // Optional jump handler — when present, the banner shows a clearly
  // labeled "Go see what's happening" button that warps the player
  // to the event location. Player feedback: "include clear shortcut
  // to 'go see what's happening' and fast-travel to that location."
  onJumpToEvent?: () => void
}

export function useWorldEvents(gameMinutes: number, gameDay: number) {
  const [activeEvent, setActiveEvent] = useState<WorldEvent | null>(null)
  const [lastEventTime, setLastEventTime] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  // Check for new event every ~60 game minutes (roughly every 20 player steps)
  useEffect(() => {
    if (gameMinutes - lastEventTime < 60) return
    // Don't stack events
    if (activeEvent) {
      // Check if expired
      const elapsed = gameMinutes - activeEvent.startedAt
      if (elapsed >= activeEvent.durationMinutes) {
        setActiveEvent(null)
        setDismissed(false)
      }
      return
    }
    // 30% chance to spawn event each check
    if (Math.random() < 0.3) {
      setActiveEvent(rollEvent(gameMinutes, gameDay))
      setLastEventTime(gameMinutes)
      setDismissed(false)
    } else {
      setLastEventTime(gameMinutes)
    }
  }, [gameMinutes, gameDay, lastEventTime, activeEvent])

  const dismiss = useCallback(() => setDismissed(true), [])

  const remainingMinutes = activeEvent
    ? Math.max(0, activeEvent.durationMinutes - (gameMinutes - activeEvent.startedAt))
    : 0

  return { activeEvent, remainingMinutes, dismissed, dismiss }
}

export default function WorldEventBanner({ activeEvent, remainingMinutes, dismissed, dismiss, currentSubregion, onJumpToEvent }: BannerProps) {
  if (!activeEvent || dismissed) return null

  const isAtLocation = currentSubregion === activeEvent.subregion
  const urgency = remainingMinutes < 10

  return (
    <div className="absolute top-16 sm:top-28 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-24px)] max-w-[560px]">
      <div
        className="rounded-xl sm:rounded-2xl px-3 py-3 sm:px-6 sm:py-5 border shadow-lg transition-all"
        style={{
          background: isAtLocation
            ? 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,211,238,0.08))'
            : 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.06))',
          borderColor: isAtLocation
            ? 'rgba(74,222,128,0.25)'
            : urgency ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
          <span className="text-lg sm:text-2xl">{activeEvent.icon}</span>
          <span className="text-sm sm:text-xl font-bold uppercase tracking-wider" style={{
            color: isAtLocation ? '#4ade80' : urgency ? '#f87171' : '#fbbf24',
          }}>
            {activeEvent.title}
          </span>
          {activeEvent.creatureHint && (
            <span className="text-lg sm:text-2xl ml-auto">{activeEvent.creatureHint}</span>
          )}
        </div>
        <p className="text-white/50 text-xs sm:text-lg leading-relaxed">
          {activeEvent.description} <span className="text-white/70 font-medium">{activeEvent.location}</span>
          {isAtLocation && <span className="text-emerald-400"> — You're here!</span>}
        </p>
        <div className="flex items-center justify-between gap-2 mt-1.5 sm:mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-base" style={{ color: urgency ? '#f87171' : 'rgba(255,255,255,0.3)' }}>⏱</span>
            <span className="text-xs sm:text-base" style={{ color: urgency ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
              {remainingMinutes}m remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isAtLocation && onJumpToEvent && (
              <button
                onClick={onJumpToEvent}
                className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all hover:scale-[1.04] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,184,166,0.35), rgba(20,184,166,0.18))',
                  border: '1px solid rgba(20,184,166,0.55)',
                  color: '#a7f3d0',
                  boxShadow: '0 0 14px rgba(20,184,166,0.18)',
                }}
              >
                Go there →
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-[10px] sm:text-sm text-white/30 hover:text-white/60 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
