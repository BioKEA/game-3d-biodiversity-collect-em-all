import { useState, useEffect, useRef, useCallback } from 'react'
import type { PlayerState, BiomeType, CapturedCreature, TimeOfDay, WeatherType } from '@/types/game'
import { ALL_CREATURES, getWeatherBoostedTypes, WEATHER_TYPE_BONUSES, TIME_RARITY_BONUSES, getMoonPhase, isFullMoon, isNewMoon } from './creatures'
import { getEvolutionTarget } from './evolutions'
import { getTimeLabel, getTimeSky, getWeatherInfo, getWeatherForecast } from './timeWeather'
import { Music } from './sounds'

interface Props {
  player: PlayerState
  currentBiome: BiomeType
  currentSubregion: string
  timeOfDay: TimeOfDay
  weather: WeatherType
  gameMinutes: number
  onOpenCatalog: () => void
  onOpenTeam: () => void
  onOpenJournal: () => void
  onOpenTrade: () => void
  onOpenBayDex: () => void
  onOpenBreeding: () => void
  onOpenQuestLog: () => void
  onOpenCrafting: () => void
  onOpenAchievements: () => void
  onOpenHabitatMap: () => void
  onOpenAdoption: () => void
  onOpenLeaderboard: () => void
  onOpenFusion: () => void
  onOpenDiving: () => void
  onOpenShop: () => void
  onOpenDailyChallenges: () => void
  onOpenArena: () => void
  onOpenMoveTutor: () => void
  onOpenMigrationCalendar: () => void
  onOpenFieldNotes: () => void
  onOpenTrophyRoom: () => void
  gameDay: number
  dailyClaimable: number
  achievementCount: number
  totalAchievements: number
  bayDexNewCount?: number
  activeQuestCount?: number
  onToggleFastTravel?: () => void
  onToggleHotkeys?: () => void
  showFastTravel?: boolean
  showHotkeys?: boolean
  onMove?: (dx: number, dy: number) => void
}

const BIOME_NAMES: Record<BiomeType, string> = {
  forest: 'Forest',
  marsh: 'Wetlands',
  beach: 'Coastline',
  rocky_beach: 'Rocky Shore',
  urban: 'City',
  water: 'Bay Waters',
  mountain: 'Hills',
  grassland: 'Grasslands',
  redwood: 'Redwood Grove',
  tidepool: 'Tidepools',
  chaparral: 'Chaparral',
  oak_woodland: 'Oak Woodland',
  kelp_forest: 'Kelp Forest',
  desert: 'Desert',
  alpine: 'Alpine',
  snow: 'Snowfield',
  valley: 'Valley',
  volcanic: 'Volcanic',
  scrubland: 'Scrubland',
  dunes: 'Sand Dunes',
  canyon: 'Canyon',
  lakeshore: 'Lakeshore',
  old_growth: 'Old Growth',
}

const BIOME_ACCENT: Record<BiomeType, string> = {
  forest: '#22c55e',
  marsh: '#06b6d4',
  beach: '#f59e0b',
  rocky_beach: '#a8a29e',
  urban: '#f59e0b',
  water: '#3b82f6',
  mountain: '#8b5cf6',
  grassland: '#84cc16',
  redwood: '#15803d',
  tidepool: '#0891b2',
  chaparral: '#a3a056',
  oak_woodland: '#65a30d',
  kelp_forest: '#0f766e',
  desert: '#d4a574',
  alpine: '#94a3b8',
  snow: '#e2e8f0',
  valley: '#7cb342',
  volcanic: '#5c4033',
  scrubland: '#c4a882',
  dunes: '#e8d5a3',
  canyon: '#c07040',
  lakeshore: '#5da87e',
  old_growth: '#0d4a20',
}

function HudPanel({ children, className = '', compact = false }: { children: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div
      className={`pointer-events-auto ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 100%)',
        backdropFilter: 'blur(12px)',
        borderRadius: compact ? 10 : 14,
        padding: compact ? '6px 10px' : '10px 16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

function AudioControls() {
  const [musicOn, setMusicOn] = useState(Music.isPlaying())
  const [showPanel, setShowPanel] = useState(false)
  const [musicVol, setMusicVol] = useState(() => Music.getVolume())
  const [sfxVol, setSfxVol] = useState(() => Music.getSfxVolume())

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(p => !p)}
        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
        title="Audio settings"
      >
        {musicOn ? '🔊' : '🔇'}
      </button>

      {showPanel && (
        <div className="absolute bottom-6 right-0 z-50 w-44 rounded-xl p-3 border shadow-lg" style={{
          background: 'linear-gradient(135deg, rgba(10,22,40,0.97), rgba(8,16,30,0.98))',
          borderColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mb-2">Audio</div>

          {/* Music toggle + volume */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                const playing = Music.toggle()
                setMusicOn(playing)
              }}
              className="text-[10px] w-5 text-center"
            >
              🎵
            </button>
            <input
              type="range" min="0" max="100" value={Math.round(musicVol * 100)}
              onChange={e => {
                const v = parseInt(e.target.value) / 100
                setMusicVol(v)
                Music.setVolume(v)
                if (!musicOn && v > 0) {
                  Music.play(Music.isPlaying() ? 'explore' : 'explore', 'forest')
                  setMusicOn(true)
                }
              }}
              className="flex-1 h-1 accent-cyan-400 cursor-pointer"
              style={{ accentColor: '#22d3ee' }}
            />
            <span className="text-[8px] text-white/30 w-5 text-right">{Math.round(musicVol * 100)}</span>
          </div>

          {/* SFX volume */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-5 text-center">🔔</span>
            <input
              type="range" min="0" max="100" value={Math.round(sfxVol * 100)}
              onChange={e => {
                const v = parseInt(e.target.value) / 100
                setSfxVol(v)
                Music.setSfxVolume(v)
              }}
              className="flex-1 h-1 cursor-pointer"
              style={{ accentColor: '#4ade80' }}
            />
            <span className="text-[8px] text-white/30 w-5 text-right">{Math.round(sfxVol * 100)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Radial submenu component ---
interface RadialItem {
  icon: string
  label: string
  color: string
  onClick: () => void
  badge?: number
}

interface RadialGroup {
  label: string
  color: string
  items: RadialItem[]
}

function RadialMenu({ items, groups, open, onClose, anchorRef, mobile }: {
  items: RadialItem[]
  groups?: RadialGroup[]
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  mobile?: boolean
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  const count = items.length
  const useGrid = count >= 7

  if (useGrid) {
    // Grouped grid layout: sections with headers when groups are provided.
    const renderItem = (item: RadialItem, idx: number) => (
      <button
        key={idx}
        onClick={() => { item.onClick(); onClose() }}
        className="flex flex-col items-center gap-0.5 active:scale-90 transition-all"
        style={{ animation: `radial-pop 0.22s ease-out ${idx * 0.025}s both` }}
      >
        <div
          className="w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg relative"
          style={{
            background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)`,
            border: `1px solid ${item.color}40`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 12px ${item.color}15`,
          }}
        >
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                color: '#000',
                boxShadow: `0 0 6px ${item.color}60`,
              }}
            >
              {item.badge}
            </span>
          )}
        </div>
        <span className="text-[6px] sm:text-[7px] text-white/60 font-medium whitespace-nowrap">{item.label}</span>
      </button>
    )

    return (
      <div
        ref={menuRef}
        className={mobile ? "fixed z-50 pointer-events-auto" : "absolute z-50 pointer-events-auto"}
        style={{
          bottom: mobile ? '68px' : 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.08)',
          padding: '8px 8px',
          backdropFilter: 'blur(12px)',
          minWidth: 200,
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
        {groups ? (
          <div className="flex flex-col gap-2">
            {groups.map((group, gi) => (
              <div key={gi}>
                <div
                  className="text-[9px] font-bold tracking-widest uppercase mb-1.5 pl-0.5"
                  style={{ color: `${group.color}cc` }}
                >
                  {group.label}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {group.items.map((item, ii) => renderItem(item, gi * 10 + ii))}
                </div>
                {gi < groups.length - 1 && (
                  <div className="h-px mt-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(count)))}, 50px)` }}
          >
            {items.map((item, i) => renderItem(item, i))}
          </div>
        )}
      </div>
    )
  }

  // Radial fan for small menus.
  const radius = mobile ? 70 : 90
  const totalArc = Math.PI * 0.85
  const arcStart = Math.PI + (Math.PI - totalArc) / 2
  const arcStep = count > 1 ? totalArc / (count - 1) : 0

  return (
    <div ref={menuRef} className={mobile ? "fixed z-50" : "absolute z-50"} style={{
      bottom: mobile ? '68px' : '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: radius * 2 + 80,
      height: radius + 50,
      pointerEvents: 'none',
    }}>
      {items.map((item, i) => {
        const angle = count === 1 ? Math.PI * 1.5 : arcStart + i * arcStep
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose() }}
            className="absolute flex flex-col items-center gap-0.5 pointer-events-auto active:scale-90 transition-all"
            style={{
              left: '50%',
              bottom: 0,
              transform: `translate(calc(-50% + ${x}px), ${y}px)`,
              animation: `radial-pop 0.25s ease-out ${i * 0.04}s both`,
            }}
          >
            <div className={`${mobile ? 'w-11 h-11' : 'w-14 h-14'} rounded-xl flex items-center justify-center ${mobile ? 'text-lg' : 'text-xl'} relative`}
              style={{
                background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
                border: `1px solid ${item.color}35`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.4), 0 0 15px ${item.color}15`,
              }}
            >
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                  color: '#000',
                  boxShadow: `0 0 6px ${item.color}60`,
                }}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[7px] sm:text-[8px] text-white/60 font-medium whitespace-nowrap">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function GameHUD({
  player, currentBiome, currentSubregion, timeOfDay, weather, gameMinutes, gameDay,
  onOpenCatalog, onOpenTeam, onOpenJournal, onOpenTrade, onOpenBayDex, onOpenBreeding, onOpenQuestLog, onOpenCrafting, onOpenAchievements, onOpenHabitatMap, onOpenAdoption, onOpenLeaderboard, onOpenFusion, onOpenDiving, onOpenShop, onOpenDailyChallenges, onOpenArena, onOpenMoveTutor, onOpenMigrationCalendar, onOpenFieldNotes, onOpenTrophyRoom, dailyClaimable,
  achievementCount, totalAchievements: _totalAchievements, bayDexNewCount = 0, activeQuestCount = 0,
  onToggleFastTravel, onToggleHotkeys, showFastTravel: _showFastTravel, showHotkeys: _showHotkeys, onMove,
}: Props) {
  const isMobile = useIsMobile()
  // D-pad hold handling — press and hold to repeat movement
  const dpadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startMove = (dx: number, dy: number) => {
    if (!onMove) return
    onMove(dx, dy)
    if (dpadIntervalRef.current) clearInterval(dpadIntervalRef.current)
    dpadIntervalRef.current = setInterval(() => onMove(dx, dy), 150)
  }
  const stopMove = () => {
    if (dpadIntervalRef.current) { clearInterval(dpadIntervalRef.current); dpadIntervalRef.current = null }
  }
  useEffect(() => {
    const up = () => stopMove()
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (dpadIntervalRef.current) clearInterval(dpadIntervalRef.current)
    }
  }, [])
  const activeCreature: CapturedCreature | undefined = player.team[0]
  const activeEvoTarget = activeCreature ? getEvolutionTarget(activeCreature.id) : null
  const activeReadyToEvolve = !!(activeEvoTarget && activeCreature && activeCreature.level >= activeEvoTarget.level - 1)
  const timeSky = getTimeSky(timeOfDay)
  const weatherInfo = getWeatherInfo(weather)
  const biomeAccent = BIOME_ACCENT[currentBiome]
  const [showForecast, setShowForecast] = useState(false)
  const forecast = getWeatherForecast(gameMinutes, weather, currentBiome, 4, gameDay)
  const boostedTypes = weather !== 'clear' ? getWeatherBoostedTypes(weather).slice(0, 4) : []

  const [openRadial, setOpenRadial] = useState<'collection' | 'activities' | null>(null)
  const collectionRef = useRef<HTMLButtonElement>(null)
  const activitiesRef = useRef<HTMLButtonElement>(null)

  const closeRadial = useCallback(() => setOpenRadial(null), [])

  const collectionItems: RadialItem[] = [
    { icon: '📖', label: 'Catalog', color: '#eab308', onClick: onOpenCatalog },
    { icon: '📓', label: 'Journal', color: '#22c55e', onClick: onOpenJournal },
    { icon: '🗺️', label: 'Habitat', color: '#14b8a6', onClick: onOpenHabitatMap },
    { icon: '📅', label: 'Migration', color: '#38bdf8', onClick: onOpenMigrationCalendar },
    { icon: '📝', label: 'Biome Notes', color: '#34d399', onClick: onOpenFieldNotes },
    { icon: '🏆', label: 'Achieve', color: '#f59e0b', onClick: onOpenAchievements, badge: achievementCount },
    { icon: '🌕', label: 'Bosses', color: '#c0c0ff', onClick: onOpenTrophyRoom },
  ]

  const activityItems: RadialItem[] = [
    { icon: '⚗️', label: 'Craft', color: '#8b5cf6', onClick: onOpenCrafting },
    { icon: '🔄', label: 'Trade', color: '#f97316', onClick: onOpenTrade },
    { icon: '🥚', label: 'Nursery', color: '#ec4899', onClick: onOpenBreeding },
    { icon: '🧬', label: 'Fusion', color: '#c084fc', onClick: onOpenFusion },
    { icon: '🤿', label: 'Dive', color: '#06b6d4', onClick: onOpenDiving },
    { icon: '🏠', label: 'Reserves', color: '#ec4899', onClick: onOpenAdoption },
    { icon: '🏅', label: 'Ranks', color: '#fbbf24', onClick: onOpenLeaderboard },
    { icon: '🏪', label: 'Shop', color: '#22c55e', onClick: onOpenShop },
    { icon: '📋', label: 'Daily', color: '#f59e0b', onClick: onOpenDailyChallenges, badge: dailyClaimable || undefined },
    { icon: '🥊', label: 'Arena', color: '#ef4444', onClick: onOpenArena },
    { icon: '💎', label: 'Tutor', color: '#a855f7', onClick: onOpenMoveTutor },
  ]

  const activityGroups: RadialGroup[] = [
    {
      label: 'Creatures',
      color: '#c084fc',
      items: [
        { icon: '🥚', label: 'Nursery', color: '#ec4899', onClick: onOpenBreeding },
        { icon: '🧬', label: 'Fusion', color: '#c084fc', onClick: onOpenFusion },
        { icon: '💎', label: 'Tutor', color: '#a855f7', onClick: onOpenMoveTutor },
        { icon: '🏠', label: 'Reserves', color: '#ec4899', onClick: onOpenAdoption },
      ],
    },
    {
      label: 'Market',
      color: '#22c55e',
      items: [
        { icon: '🏪', label: 'Shop', color: '#22c55e', onClick: onOpenShop },
        { icon: '🔄', label: 'Trade', color: '#f97316', onClick: onOpenTrade },
        { icon: '⚗️', label: 'Craft', color: '#8b5cf6', onClick: onOpenCrafting },
      ],
    },
    {
      label: 'Battle & Explore',
      color: '#ef4444',
      items: [
        { icon: '🥊', label: 'Arena', color: '#ef4444', onClick: onOpenArena },
        { icon: '🤿', label: 'Dive', color: '#06b6d4', onClick: onOpenDiving },
        { icon: '🏅', label: 'Ranks', color: '#fbbf24', onClick: onOpenLeaderboard },
        { icon: '📋', label: 'Daily', color: '#f59e0b', onClick: onOpenDailyChallenges, badge: dailyClaimable || undefined },
      ],
    },
  ]

  return (
    <>
      <style>{`
        @keyframes radial-pop {
          0% { opacity: 0; transform: translate(calc(-50% + 0px), 0px) scale(0.3); }
          100% { opacity: 1; }
        }
        @keyframes hud-evo-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes hud-evo-sparkle {
          0%, 100% { opacity: 0.6; transform: scale(0.9) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(15deg); }
        }
        @keyframes hud-badge-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
      `}</style>

      {/* Time/weather overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${timeSky.bg} pointer-events-none z-10 transition-all duration-3000`} />

      {/* Top bar — two consolidated panels */}
      <div className="absolute top-0 left-0 right-0 z-20 p-1.5 sm:p-3 flex flex-col sm:flex-row sm:justify-between items-start pointer-events-none gap-1 sm:gap-0">
        {/* Left: Combined player + active creature */}
        <HudPanel compact={isMobile}>
          {activeCreature ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <span
                  className="text-xl sm:text-3xl block"
                  style={{
                    filter: activeReadyToEvolve
                      ? 'drop-shadow(0 0 10px rgba(192,132,252,0.9)) drop-shadow(0 0 18px rgba(192,132,252,0.5))'
                      : 'drop-shadow(0 0 4px rgba(74,222,128,0.2))',
                    animation: activeReadyToEvolve ? 'hud-evo-pulse 1.8s ease-in-out infinite' : 'none',
                  }}
                >
                  {activeCreature.sprite}
                </span>
                {activeReadyToEvolve && (
                  <span
                    className="absolute -top-1 -right-1 text-xs"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.8))',
                      animation: 'hud-evo-sparkle 1.6s ease-in-out infinite',
                    }}
                  >✨</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm sm:text-lg font-semibold leading-tight">{activeCreature.nickname || activeCreature.name}</p>
                  <span className="text-[10px] sm:text-sm font-semibold" style={{ color: '#4ade80' }}>Lv.{activeCreature.level}</span>
                </div>
                <div className="w-20 sm:w-28 h-1.5 sm:h-2 bg-black/50 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(activeCreature.stats.hp / activeCreature.stats.maxHp) * 100}%`,
                      background: (activeCreature.stats.hp / activeCreature.stats.maxHp) > 0.5
                        ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                        : (activeCreature.stats.hp / activeCreature.stats.maxHp) > 0.25
                        ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-14 sm:w-20 h-1 sm:h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${(player.xp / player.maxXp) * 100}%`,
                      background: 'linear-gradient(90deg, #06b6d4, #4ade80)',
                    }} />
                  </div>
                  <span className="text-[10px] sm:text-base text-yellow-400/70 font-mono">💰 {player.coins ?? 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                <span className="text-white text-sm sm:text-xl font-bold tracking-wide">Explorer</span>
                <span className="text-xs sm:text-lg font-semibold" style={{ color: '#4ade80' }}>Lv.{player.level}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20 sm:w-32 h-2 sm:h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${(player.xp / player.maxXp) * 100}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #4ade80)',
                  }} />
                </div>
                <span className="text-[10px] sm:text-base text-yellow-400/70 font-mono">💰 {player.coins ?? 0}</span>
              </div>
            </>
          )}
        </HudPanel>

        {/* Right on desktop, below left on mobile: Combined location + time/weather */}
        <HudPanel className="sm:text-right sm:origin-top-right" compact={isMobile}>
          <p className="text-white text-xs sm:text-xl font-bold leading-tight tracking-wide truncate">{currentSubregion || BIOME_NAMES[currentBiome]}</p>
          <div className="flex items-center sm:justify-end gap-1.5 sm:gap-2 mt-0.5">
            <span className="text-[10px] sm:text-base font-medium" style={{ color: `${biomeAccent}80` }}>{BIOME_NAMES[currentBiome]}</span>
            <span className="text-white/15 text-[10px] sm:text-base">·</span>
            <span className="text-xs sm:text-lg font-semibold" style={{ color: '#4ade80' }}>{player.captured.length}/{ALL_CREATURES.length}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-1 sm:gap-2 mt-0.5">
            <span className="text-sm sm:text-lg">{timeSky.icon}</span>
            <span className="text-white/70 text-[10px] sm:text-base font-medium">{getTimeLabel(gameMinutes)}</span>
            {(() => {
              const moon = getMoonPhase(gameDay)
              const isActive = moon.mysticMultiplier > 1
              return (
                <span
                  className="text-xs sm:text-base"
                  title={`${moon.name} — ${moon.label}`}
                  style={{ opacity: isActive ? 1 : 0.4, filter: isActive ? 'drop-shadow(0 0 4px rgba(200,200,255,0.5))' : undefined }}
                >
                  {moon.icon}
                </span>
              )
            })()}
            <button
              className="flex items-center gap-0.5 sm:gap-1 cursor-pointer"
              onClick={() => setShowForecast(f => !f)}
              title="Weather forecast"
            >
              <span className="text-sm sm:text-lg">{weatherInfo.icon}</span>
              <span className="text-white/20 text-[8px] sm:text-xs">{showForecast ? '▲' : '▼'}</span>
            </button>
            <AudioControls />
          </div>
          {!isMobile && timeOfDay !== 'day' && (() => {
            const trb = TIME_RARITY_BONUSES[timeOfDay]
            if (!trb || trb.rare <= 1) return null
            const rareColor = timeOfDay === 'night' ? '#c084fc' : timeOfDay === 'dawn' ? '#fbbf24' : '#fb923c'
            return (
              <div className="flex sm:justify-end mt-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
                  background: `${rareColor}15`,
                  color: rareColor,
                  border: `1px solid ${rareColor}30`,
                }}>
                  {trb.legendary > 1.5 ? '★ Legendary' : '✦ Rare'} ↑
                </span>
              </div>
            )
          })()}
          {/* Weather forecast dropdown */}
          {showForecast && (
            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 pointer-events-auto text-left" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.55))',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <p className="text-[9px] text-white/30 font-medium tracking-widest mb-1.5 text-center">FORECAST</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">{weatherInfo.icon}</span>
                  <span className="text-[9px] text-white/50 font-medium">Now</span>
                </div>
                {forecast.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-px bg-white/10" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg">{getWeatherInfo(f.weather).icon}</span>
                      <span className="text-[9px] text-white/40">{f.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              {weather !== 'clear' && (() => {
                const weatherCreatures = ALL_CREATURES.filter(c =>
                  c.activeWeather && (c.activeWeather as string[]).includes(weather)
                ).slice(0, 3)
                const typeBonus = WEATHER_TYPE_BONUSES[weather]
                const TYPE_ICONS: Record<string, string> = { beast: '🐾', bird: '🪶', insect: '🦋', marine: '🌊', amphibian: '🐸', mystic: '✨', reptile: '🦎', plant: '🌿' }
                return (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[9px] text-emerald-400/60 font-medium tracking-wider text-center mb-1">WEATHER BONUS</p>
                    {typeBonus && (
                      <>
                        <p className="text-[9px] text-white/40 text-center mb-1.5">{typeBonus.label}</p>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {typeBonus.types.map(type => (
                            <div key={type} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                              background: 'rgba(74,222,128,0.1)',
                              border: '1px solid rgba(74,222,128,0.2)',
                            }}>
                              <span className="text-[10px]">{TYPE_ICONS[type] ?? '✨'}</span>
                              <span className="text-[9px] text-emerald-300/80 font-medium capitalize">{type}</span>
                              <span className="text-[8px] text-emerald-400 font-bold">{typeBonus.multiplier}×</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {boostedTypes.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap mt-1.5">
                        {boostedTypes.map(({ type }) => (
                          <div key={`special-${type}`} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                            background: 'rgba(250,204,21,0.1)',
                            border: '1px solid rgba(250,204,21,0.2)',
                          }}>
                            <span className="text-[10px]">{TYPE_ICONS[type] ?? '✨'}</span>
                            <span className="text-[9px] text-amber-300/80 font-medium capitalize">{type}</span>
                            <span className="text-[8px] text-amber-400 font-bold">3×</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {weatherCreatures.length > 0 && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[8px] text-cyan-400/50 font-medium tracking-wider text-center mb-1">WEATHER-EXCLUSIVE</p>
                        <div className="flex items-center justify-center gap-1">
                          {weatherCreatures.map(c => (
                            <div key={c.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{
                              background: 'rgba(34,211,238,0.06)',
                              border: '1px solid rgba(34,211,238,0.12)',
                            }}>
                              <span className="text-xs">{c.sprite}</span>
                              <span className="text-[8px] text-cyan-300/60">{c.name.split(' ').slice(-1)[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              {timeOfDay !== 'day' && (() => {
                const trb = TIME_RARITY_BONUSES[timeOfDay]
                if (!trb) return null
                const rareColor = timeOfDay === 'night' ? 'rgba(192,132,252,' : timeOfDay === 'dawn' ? 'rgba(251,191,36,' : 'rgba(251,146,60,'
                return (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[9px] font-medium tracking-wider text-center mb-1" style={{ color: `${rareColor}0.6)` }}>
                      {timeOfDay.toUpperCase()} BONUS
                    </p>
                    <p className="text-[9px] text-white/40 text-center mb-1.5">{trb.label}</p>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {trb.rare > 1 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                          background: `${rareColor}0.1)`,
                          border: `1px solid ${rareColor}0.25)`,
                        }}>
                          <span className="text-[10px]">💎</span>
                          <span className="text-[9px] font-medium capitalize" style={{ color: `${rareColor}0.8)` }}>Rare</span>
                          <span className="text-[8px] font-bold" style={{ color: `${rareColor}1)` }}>{trb.rare}×</span>
                        </div>
                      )}
                      {trb.legendary > 1 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                          background: `${rareColor}0.1)`,
                          border: `1px solid ${rareColor}0.25)`,
                        }}>
                          <span className="text-[10px]">⭐</span>
                          <span className="text-[9px] font-medium capitalize" style={{ color: `${rareColor}0.8)` }}>Legendary</span>
                          <span className="text-[8px] font-bold" style={{ color: `${rareColor}1)` }}>{trb.legendary}×</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
              {(() => {
                const moon = getMoonPhase(gameDay)
                const isActive = moon.mysticMultiplier > 1
                return (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[9px] font-medium tracking-wider text-center mb-1" style={{ color: isActive ? 'rgba(200,200,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                      {moon.icon} {moon.name.toUpperCase()}
                    </p>
                    <p className="text-[9px] text-white/40 text-center mb-1.5">{moon.label}</p>
                    {isActive && (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {moon.mysticMultiplier > 1 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                            background: 'rgba(147,130,220,0.1)',
                            border: '1px solid rgba(147,130,220,0.25)',
                          }}>
                            <span className="text-[10px]">✨</span>
                            <span className="text-[9px] font-medium text-purple-300">Mystic</span>
                            <span className="text-[8px] font-bold text-purple-200">{moon.mysticMultiplier}×</span>
                          </div>
                        )}
                        {moon.legendaryMultiplier > 1 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{
                            background: 'rgba(250,204,21,0.1)',
                            border: '1px solid rgba(250,204,21,0.25)',
                          }}>
                            <span className="text-[10px]">⭐</span>
                            <span className="text-[9px] font-medium text-amber-300">Legendary</span>
                            <span className="text-[8px] font-bold text-amber-200">{moon.legendaryMultiplier}×</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              {timeOfDay !== 'day' && (() => {
                const timeCreatures = ALL_CREATURES.filter(c =>
                  c.activeTime && c.activeTime.length > 0 &&
                  c.activeTime.length < 4 &&
                  (c.activeTime as string[]).includes(timeOfDay) &&
                  !(c.activeTime as string[]).includes('day') &&
                  c.biomes.includes(currentBiome)
                ).slice(0, 4)
                if (timeCreatures.length === 0) return null
                const todColor = timeOfDay === 'night' ? 'rgba(147,197,253,' : timeOfDay === 'dawn' ? 'rgba(251,191,36,' : 'rgba(251,146,60,'
                return (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[8px] font-medium tracking-wider text-center mb-1" style={{ color: `${todColor}0.5)` }}>
                      {timeOfDay === 'night' ? '🌙' : timeOfDay === 'dawn' ? '🌅' : '🌇'} ACTIVE NOW
                    </p>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {timeCreatures.map(c => (
                        <div key={c.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{
                          background: `${todColor}0.06)`,
                          border: `1px solid ${todColor}0.12)`,
                        }}>
                          <span className="text-xs">{c.sprite}</span>
                          <span className="text-[8px]" style={{ color: `${todColor}0.6)` }}>{c.name.split(' ').slice(-1)[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </HudPanel>
      </div>

      {/* Nursery indicator */}
      {player.nursery && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto cursor-pointer"
          onClick={onOpenBreeding}
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.35))',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: '4px 12px',
            border: '1px solid rgba(236,72,153,0.15)',
          }}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl">🥚</span>
            <span className="text-pink-400 text-xs sm:text-base font-medium hidden sm:inline">Breeding</span>
          </div>
        </div>
      )}

      {/* Boss alert — full moon or new moon */}
      {timeOfDay === 'night' && (isFullMoon(gameDay) || isNewMoon(gameDay)) && (
        <div className="absolute top-[60px] sm:top-[90px] left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg" style={{
            background: isFullMoon(gameDay)
              ? 'linear-gradient(135deg, rgba(100,100,180,0.3), rgba(60,60,140,0.2))'
              : 'linear-gradient(135deg, rgba(80,20,120,0.3), rgba(30,10,50,0.2))',
            backdropFilter: 'blur(8px)',
            border: isFullMoon(gameDay)
              ? '1px solid rgba(200,200,255,0.25)'
              : '1px solid rgba(168,85,247,0.25)',
            boxShadow: isFullMoon(gameDay)
              ? '0 0 20px rgba(150,150,255,0.15)'
              : '0 0 20px rgba(168,85,247,0.15)',
            animation: 'pulse 3s ease-in-out infinite',
          }}>
            <span className="text-sm sm:text-lg" style={{
              filter: isFullMoon(gameDay)
                ? 'drop-shadow(0 0 6px rgba(200,210,255,0.6))'
                : 'drop-shadow(0 0 6px rgba(168,85,247,0.6))',
            }}>
              {isFullMoon(gameDay) ? '🌕' : '🌑'}
            </span>
            <span className="text-[9px] sm:text-xs font-bold tracking-wider uppercase" style={{
              color: isFullMoon(gameDay) ? 'rgba(200,210,255,0.8)' : 'rgba(168,85,247,0.8)',
              textShadow: isFullMoon(gameDay)
                ? '0 0 8px rgba(200,210,255,0.3)'
                : '0 0 8px rgba(168,85,247,0.3)',
            }}>
              {isFullMoon(gameDay) ? 'Lunar Boss active' : 'Shadow Boss lurking'} — explore to trigger!
            </span>
          </div>
        </div>
      )}

      {/* Radial backdrop overlay — closes radial when tapping outside */}
      {openRadial && (
        <div className="fixed inset-0 z-[29] pointer-events-auto" onClick={closeRadial} />
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-1.5 sm:p-3 pointer-events-none flex justify-center">
        <div className="inline-flex items-center gap-1 sm:gap-2 pointer-events-auto">
          {/* Primary buttons */}
          {[
            { onClick: onOpenTeam, icon: '🎒', color: '#a855f7', label: 'Team' },
            { onClick: onOpenBayDex, icon: '📚', color: '#06b6d4', label: 'WildDex' },
            { onClick: onOpenQuestLog, icon: '📋', color: '#60a5fa', label: 'Quests' },
          ].map((btn, i) => (
            <div key={i} className="relative">
              <button
                onClick={btn.onClick}
                title={btn.label}
                className="w-[52px] h-[52px] sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${btn.color}10, ${btn.color}05)`,
                  border: `1px solid ${btn.color}20`,
                  boxShadow: `0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}
              >
                <span className="text-lg sm:text-2xl">{btn.icon}</span>
                <span className="text-[6px] sm:text-[7px] text-white/40 font-medium">{btn.label}</span>
              </button>
              {btn.label === 'WildDex' && bayDexNewCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 px-0.5 sm:px-1 flex items-center justify-center border-2 border-slate-900 pointer-events-none"
                  style={{ animation: 'hud-badge-pulse 2s ease-in-out infinite' }}
                >
                  {bayDexNewCount > 99 ? '99+' : bayDexNewCount}
                </span>
              )}
              {btn.label === 'Quests' && activeQuestCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 px-0.5 sm:px-1 flex items-center justify-center border-2 border-slate-900 pointer-events-none"
                >
                  {activeQuestCount}
                </span>
              )}
            </div>
          ))}

          {/* Collection radial trigger */}
          <div className="relative">
            <RadialMenu
              items={collectionItems}
              open={openRadial === 'collection'}
              onClose={closeRadial}
              anchorRef={collectionRef}
              mobile={isMobile}
            />
            <button
              ref={collectionRef}
              onClick={() => setOpenRadial(prev => prev === 'collection' ? null : 'collection')}
              title="Collection"
              className="w-[52px] h-[52px] sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              style={{
                background: openRadial === 'collection'
                  ? 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))'
                  : 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.05))',
                border: `1px solid ${openRadial === 'collection' ? 'rgba(234,179,8,0.4)' : 'rgba(234,179,8,0.2)'}`,
                boxShadow: openRadial === 'collection'
                  ? '0 2px 12px rgba(234,179,8,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <span className="text-lg sm:text-2xl">📖</span>
              <span className="text-[6px] sm:text-[7px] text-white/40 font-medium">Collection</span>
            </button>
          </div>

          {/* Activities radial trigger */}
          <div className="relative">
            <RadialMenu
              items={activityItems}
              groups={activityGroups}
              open={openRadial === 'activities'}
              onClose={closeRadial}
              anchorRef={activitiesRef}
              mobile={isMobile}
            />
            <button
              ref={activitiesRef}
              onClick={() => setOpenRadial(prev => prev === 'activities' ? null : 'activities')}
              title="Activities"
              className="w-[52px] h-[52px] sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              style={{
                background: openRadial === 'activities'
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))'
                  : 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
                border: `1px solid ${openRadial === 'activities' ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.2)'}`,
                boxShadow: openRadial === 'activities'
                  ? '0 2px 12px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <span className="text-lg sm:text-2xl">⚡</span>
              <span className="text-[6px] sm:text-[7px] text-white/40 font-medium">Activities</span>
            </button>
          </div>

          {/* Utility buttons — fast travel + hotkeys */}
          <div className="flex flex-col gap-0.5 sm:gap-1 ml-0.5 sm:ml-1">
            {onToggleFastTravel && (
              <button
                onClick={onToggleFastTravel}
                title="Fast travel"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center active:scale-90 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-[10px] sm:text-sm">🗺️</span>
              </button>
            )}
            {onToggleHotkeys && (
              <button
                onClick={onToggleHotkeys}
                title="Keyboard shortcuts"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center active:scale-90 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-[9px] sm:text-xs font-bold text-white/60">?</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* D-pad — anchored to bottom-right, sits above the toolbar on mobile */}
      <div className="absolute bottom-[68px] sm:bottom-3 right-1.5 sm:right-3 z-[35] pointer-events-auto">
        <div className="grid grid-cols-3 gap-0.5" id="dpad">
          {(() => {
            const btnClass = "w-10 h-10 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-white/50 text-sm sm:text-lg active:bg-white/15 transition-colors touch-none select-none"
            const btnStyle: React.CSSProperties = {
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }
            const mkHandlers = (dx: number, dy: number) => ({
              onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); startMove(dx, dy) },
              onPointerUp: stopMove,
              onPointerLeave: stopMove,
              onPointerCancel: stopMove,
              onClick: () => { if (onMove) onMove(dx, dy) },
            })
            return (
              <>
                <div />
                <button data-dir="up" className={btnClass} style={btnStyle} {...mkHandlers(0, -1)}>▲</button>
                <div />
                <button data-dir="left" className={btnClass} style={btnStyle} {...mkHandlers(-1, 0)}>◀</button>
                <div />
                <button data-dir="right" className={btnClass} style={btnStyle} {...mkHandlers(1, 0)}>▶</button>
                <div />
                <button data-dir="down" className={btnClass} style={btnStyle} {...mkHandlers(0, 1)}>▼</button>
                <div />
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}
