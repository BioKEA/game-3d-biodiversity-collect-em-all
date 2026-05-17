import { useMemo, useState } from 'react'
import type { CapturedCreature } from '@/types/game'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'
import TitleBackdropCanvas from './TitleBackdropCanvas'

interface StarterOption {
  creature: CapturedCreature
  tagline: string
  strength: string
}

const STARTERS: StarterOption[] = [
  {
    creature: {
      id: 'pacific-tree-frog',
      name: 'Pacific Tree Frog',
      scientificName: 'Pseudacris regilla',
      description: 'Tiny but loud! Their chorus fills Bay Area wetlands every spring evening.',
      type: 'amphibian',
      rarity: 'common',
      biomes: ['marsh', 'forest', 'redwood'],
      subregions: ['Muir Woods', 'Don Edwards Wildlife Refuge', 'Tilden Regional Park', 'Redwood Regional Park', 'Baylands Nature Preserve'],
      stats: { hp: 30, maxHp: 30, attack: 22, defense: 18, speed: 38 },
      isFantasy: false,
      sprite: '🐸',
      color: '#22c55e',
      activeTime: ['dawn', 'dusk', 'night'],
      moves: [
        { name: 'Tongue Lash', power: 20, type: 'attack', description: 'Sticky tongue snaps out' },
        { name: 'Chorus Call', power: 15, type: 'special', description: 'Deafening group ribbit' },
        { name: 'Leap', power: 0, type: 'defend', description: 'Leaps high to dodge' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'marsh',
    },
    tagline: 'The Classic Choice',
    strength: 'Balanced & fast — great for learning the ropes',
  },
  {
    creature: {
      id: 'gray-fox',
      name: 'Gray Fox',
      scientificName: 'Urocyon cinereoargenteus',
      description: 'A nimble nocturnal fox that can climb trees. Often spotted in the Marin Headlands at dusk.',
      type: 'beast',
      rarity: 'uncommon',
      biomes: ['forest', 'grassland', 'mountain'],
      subregions: ['Marin Headlands', 'Mt. Tamalpais', 'Tilden Regional Park', 'Oakland Hills', 'Rancho San Antonio'],
      stats: { hp: 40, maxHp: 40, attack: 35, defense: 22, speed: 45 },
      isFantasy: false,
      sprite: '🦊',
      color: '#9ca3af',
      activeTime: ['dusk', 'night'],
      moves: [
        { name: 'Quick Pounce', power: 30, type: 'attack', description: 'Lightning-fast tackle' },
        { name: 'Tree Climb', power: 0, type: 'defend', description: 'Climbs a tree to safety' },
        { name: 'Night Howl', power: 25, type: 'special', description: 'A chilling howl under the moon' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'forest',
    },
    tagline: 'The Bold Hunter',
    strength: 'High attack & speed — hits hard and fast',
  },
  {
    creature: {
      id: 'scrub-jay',
      name: 'California Scrub-Jay',
      scientificName: 'Aphelocoma californica',
      description: 'Bold and intelligent, these blue jays remember thousands of acorn hiding spots.',
      type: 'bird',
      rarity: 'common',
      biomes: ['urban', 'forest', 'grassland'],
      subregions: ['Berkeley', 'Palo Alto / Menlo Park', 'San Jose', 'Oakland Hills', 'Twin Peaks'],
      stats: { hp: 28, maxHp: 28, attack: 24, defense: 16, speed: 40 },
      isFantasy: false,
      sprite: '🐦',
      color: '#2563eb',
      activeTime: ['dawn', 'day'],
      moves: [
        { name: 'Acorn Barrage', power: 22, type: 'attack', description: 'Pelts foe with cached acorns' },
        { name: 'Mimic Call', power: 20, type: 'special', description: 'Copies a hawk cry to scare' },
        { name: 'Quick Hop', power: 0, type: 'defend', description: 'Hops rapidly to dodge' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'forest',
    },
    tagline: 'The Clever Scout',
    strength: 'Smart & versatile — type advantage against insects',
  },
  {
    creature: {
      id: 'mission-blue-butterfly',
      name: 'Mission Blue Butterfly',
      scientificName: 'Icaricia icarioides missionensis',
      description: 'A flash of iridescent blue on the lupine-covered hills of the Bay Area.',
      type: 'insect',
      rarity: 'uncommon',
      biomes: ['forest', 'grassland', 'beach'],
      subregions: ['Muir Woods', 'Presidio', 'Pacifica / Devil\'s Slide', 'Half Moon Bay'],
      stats: { hp: 22, maxHp: 22, attack: 18, defense: 14, speed: 48 },
      isFantasy: false,
      sprite: '🦋',
      color: '#3b82f6',
      activeTime: ['day', 'dawn'],
      moves: [
        { name: 'Wing Dust', power: 18, type: 'special', description: 'Scatters blinding wing scales' },
        { name: 'Azure Gust', power: 22, type: 'attack', description: 'Whips up a swirling hillside wind' },
        { name: 'Flutter Dodge', power: 0, type: 'defend', description: 'Erratic flight evades attacks' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'forest',
    },
    tagline: 'The Swift Traveler',
    strength: 'Fastest starter — dodges first, strikes second',
  },
  {
    creature: {
      id: 'harbor-seal',
      name: 'Harbor Seal',
      scientificName: 'Phoca vitulina',
      description: 'Lounging on the rocks at Pier 39 or diving through the cold Bay waters hunting fish.',
      type: 'marine',
      rarity: 'uncommon',
      biomes: ['beach', 'water'],
      subregions: ['Fisherman\'s Wharf / Pier 39', 'Sausalito Waterfront', 'Half Moon Bay'],
      stats: { hp: 48, maxHp: 48, attack: 28, defense: 30, speed: 20 },
      isFantasy: false,
      sprite: '🦭',
      color: '#06b6d4',
      activeTime: ['day', 'dawn', 'dusk'],
      moves: [
        { name: 'Fish Slap', power: 22, type: 'attack', description: 'Whacks with a fresh catch' },
        { name: 'Tidal Wave', power: 28, type: 'special', description: 'Summons a crashing wave' },
        { name: 'Blubber Shield', power: 0, type: 'defend', description: 'Thick blubber absorbs hits' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'beach',
    },
    tagline: 'The Sturdy Diver',
    strength: 'Highest HP & defense — a true tank',
  },
  {
    creature: {
      id: 'bay-wisp',
      name: 'Bay Wisp',
      scientificName: 'Lux bayanensis',
      description: 'Tiny orbs of light that dance over the Bay at twilight. Hard to catch, harder to keep.',
      type: 'mystic',
      rarity: 'rare',
      biomes: ['marsh', 'beach'],
      subregions: ['Richardson Bay', 'Don Edwards Wildlife Refuge', 'Baylands Nature Preserve'],
      stats: { hp: 20, maxHp: 20, attack: 32, defense: 10, speed: 42 },
      isFantasy: true,
      sprite: '✨',
      color: '#fbbf24',
      activeTime: ['dusk', 'night'],
      moves: [
        { name: 'Spark Burst', power: 28, type: 'attack', description: 'Releases a flash of raw light' },
        { name: 'Will-o-Wisp', power: 18, type: 'special', description: 'Lures foe into a daze' },
        { name: 'Phase Shift', power: 0, type: 'defend', description: 'Becomes briefly intangible' },
      ],
      level: 5,
      xp: 0,
      capturedAt: new Date().toISOString(),
      capturedBiome: 'marsh',
    },
    tagline: 'The Wild Card',
    strength: 'Glass cannon — devastating power, fragile body',
  },
]

const STARTER_FLOATERS = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 9) % 100,
  top: (i * 53 + 12) % 100,
  size: 2 + (i % 4),
  delay: ((i * 0.23) % 4).toFixed(2),
  duration: (4.2 + (i % 5) * 0.55).toFixed(2),
  color: ['#6ee7b7', '#67e8f9', '#fbbf24', '#fb7185'][i % 4],
}))

interface Props {
  onSelect: (creature: CapturedCreature) => void
}

export default function StarterSelect({ onSelect }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [phase] = useState(4)
  const previewIndex = selected ?? 0
  const preview = STARTERS[previewIndex]
  const accent = preview.creature.color
  const fieldId = useMemo(() => `WC-${preview.creature.type.toUpperCase().slice(0, 3)}-${String(previewIndex + 1).padStart(2, '0')}`, [preview.creature.type, previewIndex])

  const handleConfirm = () => {
    if (selected === null) return
    onSelect(STARTERS[selected].creature)
  }

  return (
    <div className="absolute inset-0 z-50 overflow-hidden overflow-y-auto select-none bg-[#020711] text-white">
      <style>{`
        @keyframes starter-panel-in {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes starter-token-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes starter-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 22px rgba(34,211,238,0.25)) drop-shadow(0 0 44px rgba(251,191,36,0.1)); }
          50% { filter: drop-shadow(0 0 34px rgba(110,231,183,0.34)) drop-shadow(0 0 72px rgba(251,191,36,0.16)); }
        }
        @keyframes starter-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.18; }
          50% { transform: translateY(-18px) scale(1.35); opacity: 0.48; }
        }
        @keyframes starter-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          35% { opacity: 0.28; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes starter-shimmer {
          0% { background-position: -180% center; }
          100% { background-position: 180% center; }
        }
        .starter-scrollbar::-webkit-scrollbar { width: 5px; }
        .starter-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .starter-scrollbar::-webkit-scrollbar-thumb { background: rgba(103,232,249,0.2); border-radius: 999px; }
      `}</style>

      <TitleBackdropCanvas phase={phase} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(2,7,17,0.1), rgba(2,7,17,0.22) 34%, rgba(2,7,17,0.72) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(2,7,17,0.84), transparent)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
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
          animation: 'starter-scan 5.2s ease-in-out 1.2s infinite',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STARTER_FLOATERS.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              boxShadow: `0 0 ${particle.size * 5}px ${particle.color}66`,
              animation: `starter-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-10">
        <header className="shrink-0 text-center">
          <div
            className="mx-auto mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: 'rgba(3, 10, 16, 0.46)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 14px 32px rgba(0,0,0,0.22)',
            }}
          >
            <PixelIcon icon="✦" size={24} variant="gold" selected title="Field guide" />
            <span className="text-xs sm:text-sm font-bold uppercase text-white/60" style={{ letterSpacing: 0 }}>
              California Field Guide
            </span>
          </div>

          <div style={{ animation: 'starter-glow-pulse 4.5s ease-in-out infinite' }}>
            <h1 className="text-4xl sm:text-6xl font-black" style={{ lineHeight: 0.95, letterSpacing: 0 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #d9f99d 0%, #6ee7b7 24%, #67e8f9 52%, #fbbf24 78%, #fb7185 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 5px 0 rgba(0,0,0,0.42)',
                }}
              >
                Choose Your Companion
              </span>
            </h1>
          </div>
          <div className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(103,232,249,0.45))' }} />
            <p className="text-sm sm:text-base font-bold text-cyan-100/60" style={{ letterSpacing: 0 }}>Starter Field Log</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.45), transparent)' }} />
          </div>
        </header>

        <section className="mt-5 sm:mt-7 grid flex-1 min-h-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(310px,390px)_minmax(0,1fr)]">
          <aside
            className="relative overflow-hidden rounded-lg p-4 sm:p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(4, 12, 24, 0.92), rgba(8, 30, 34, 0.88) 52%, rgba(32, 22, 42, 0.86))',
              border: `1px solid ${accent}55`,
              boxShadow: `0 20px 54px rgba(0,0,0,0.34), 0 0 34px ${accent}22, inset 0 0 0 1px rgba(255,255,255,0.04)`,
              animation: 'starter-panel-in 0.42s ease-out both',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `linear-gradient(${accent}12 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-bold uppercase text-white/45" style={{ letterSpacing: 0 }}>
                <span>{selected === null ? 'Preview Specimen' : 'Selected Specimen'}</span>
                <span style={{ color: accent }}>{fieldId}</span>
              </div>

              <div className="flex items-center gap-4">
                <div style={{ animation: 'starter-token-bob 3.6s ease-in-out infinite' }}>
                  <PixelCreatureToken creature={preview.creature} size={92} selected title={preview.creature.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl sm:text-3xl font-black text-white leading-tight">{preview.creature.name}</p>
                  <p className="mt-1 text-xs italic text-white/42">{preview.creature.scientificName}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase"
                      style={{ color: accent, background: `${accent}1c`, border: `1px solid ${accent}45`, letterSpacing: 0 }}
                    >
                      {preview.creature.type}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase text-white/45" style={{ letterSpacing: 0 }}>
                      Lv.{preview.creature.level}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-white/62 leading-relaxed">{preview.creature.description}</p>
              <p className="mt-2 text-xs font-bold" style={{ color: accent }}>{preview.tagline}</p>
              <p className="mt-1 text-xs text-white/40">{preview.strength}</p>

              <div className="mt-5 space-y-2.5">
                {[
                  { label: 'HP', value: preview.creature.stats.hp, color: '#6ee7b7' },
                  { label: 'ATK', value: preview.creature.stats.attack, color: '#fb7185' },
                  { label: 'DEF', value: preview.creature.stats.defense, color: '#67e8f9' },
                  { label: 'SPD', value: preview.creature.stats.speed, color: '#fbbf24' },
                ].map(stat => (
                  <div key={stat.label} className="grid grid-cols-[38px_1fr_28px] items-center gap-2">
                    <span className="text-[10px] font-black text-white/38">{stat.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-black/45">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (stat.value / 50) * 100)}%`,
                          background: `linear-gradient(90deg, ${stat.color}, ${accent})`,
                          boxShadow: `0 0 14px ${stat.color}55`,
                        }}
                      />
                    </span>
                    <span className="text-right text-xs font-black" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {preview.creature.moves.map(m => (
                  <span
                    key={m.name}
                    className="rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 text-[10px] font-semibold text-white/48"
                  >
                    {m.name} {m.power > 0 ? `(${m.power})` : '(DEF)'}
                  </span>
                ))}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                {selected === null ? (
                  <button
                    disabled
                    className="w-full rounded-lg py-3 text-sm font-black text-white/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Select a Companion
                  </button>
                ) : !confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full rounded-lg py-3 text-sm font-black transition-all active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(90deg, ${accent}24, rgba(251,191,36,0.16), ${accent}24)`,
                      backgroundSize: '180% 100%',
                      color: '#fff7d6',
                      border: `1px solid ${accent}55`,
                      boxShadow: `0 0 24px ${accent}24`,
                      animation: 'starter-shimmer 3.2s linear infinite',
                    }}
                  >
                    Choose {preview.creature.name}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-xs text-white/52">
                      {preview.creature.name} will be your first companion. Ready?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setConfirming(false)}
                        className="rounded-lg py-2.5 text-sm font-bold text-white/48 transition-colors hover:bg-white/[0.06]"
                        style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)' }}
                      >
                        Wait...
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="rounded-lg py-2.5 text-sm font-black transition-all active:scale-[0.99]"
                        style={{
                          background: `${accent}28`,
                          color: accent,
                          border: `1px solid ${accent}55`,
                          boxShadow: `0 0 18px ${accent}22`,
                        }}
                      >
                        Let&apos;s Go!
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div
            className="relative min-h-0 overflow-hidden rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(5, 16, 28, 0.72), rgba(9, 32, 36, 0.6))',
              border: '1px solid rgba(103,232,249,0.16)',
              boxShadow: '0 18px 42px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.035)',
              animation: 'starter-panel-in 0.42s ease-out 0.08s both',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                backgroundImage: 'linear-gradient(rgba(103,232,249,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.06) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-white/42" style={{ letterSpacing: 0 }}>Available Starters</p>
                <p className="text-sm font-bold text-white/72">Pick the partner that fits your expedition style.</p>
              </div>
              <PixelIcon icon="🧭" size={34} variant="travel" selected title="Starter roster" />
            </div>

            <div className="starter-scrollbar relative grid max-h-none gap-2 overflow-y-auto p-3 sm:grid-cols-2 lg:max-h-[calc(100vh-235px)]">
              {STARTERS.map((starter, i) => {
                const isSelected = selected === i
                return (
                  <button
                    key={starter.creature.id}
                    onClick={() => {
                      setSelected(i)
                      setConfirming(false)
                    }}
                    className="group relative overflow-hidden rounded-lg p-3 text-left transition-all duration-300 active:scale-[0.99]"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${starter.creature.color}24, rgba(4,12,24,0.86))`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
                      border: `1px solid ${isSelected ? `${starter.creature.color}66` : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isSelected ? `0 0 28px ${starter.creature.color}22, inset 0 0 0 1px rgba(255,255,255,0.05)` : 'inset 0 0 0 1px rgba(255,255,255,0.02)',
                      transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${starter.creature.color}, transparent)` }} />
                    <div className="relative flex items-center gap-3">
                      <div className="shrink-0">
                        <PixelCreatureToken creature={starter.creature} size={54} selected={isSelected} title={starter.creature.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-black text-white">{starter.creature.name}</span>
                          <span className="shrink-0 text-[10px] font-black" style={{ color: starter.creature.color }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase"
                            style={{
                              background: `${starter.creature.color}18`,
                              color: starter.creature.color,
                              border: `1px solid ${starter.creature.color}35`,
                              letterSpacing: 0,
                            }}
                          >
                            {starter.creature.type}
                          </span>
                          <span className="text-[10px] font-semibold text-white/38">{starter.tagline}</span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-snug text-white/40">{starter.strength}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
