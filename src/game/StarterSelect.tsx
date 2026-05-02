import { useState } from 'react'
import type { CapturedCreature } from '@/types/game'

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
      id: 'monarch-butterfly',
      name: 'Monarch Butterfly',
      scientificName: 'Danaus plexippus',
      description: 'Migrating through the Bay on ancient routes. Their orange wings light up the coastal groves.',
      type: 'insect',
      rarity: 'uncommon',
      biomes: ['forest', 'grassland', 'beach'],
      subregions: ['Muir Woods', 'Presidio', 'Pacifica / Devil\'s Slide', 'Half Moon Bay'],
      stats: { hp: 22, maxHp: 22, attack: 18, defense: 14, speed: 48 },
      isFantasy: false,
      sprite: '🦋',
      color: '#f97316',
      activeTime: ['day', 'dawn'],
      moves: [
        { name: 'Wing Dust', power: 18, type: 'special', description: 'Scatters toxic wing scales' },
        { name: 'Monarch Gust', power: 22, type: 'attack', description: 'Whips up a swirling wind' },
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

interface Props {
  onSelect: (creature: CapturedCreature) => void
}

export default function StarterSelect({ onSelect }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = () => {
    if (selected === null) return
    onSelect(STARTERS[selected].creature)
  }

  return (
    <div className="absolute inset-0 bg-[#0a1628] z-50 flex flex-col items-center overflow-hidden">
      {/* Particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-sm w-full flex flex-col h-full pt-6 pb-4 px-4">
        <h1 className="text-white text-xl font-bold text-center mb-1">Choose Your Companion</h1>
        <p className="text-white/40 text-xs text-center mb-4">
          This creature will join you on your Bay Area expedition
        </p>

        {/* Scrollable creature list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {STARTERS.map((starter, i) => {
            const isSelected = selected === i
            return (
              <button
                key={starter.creature.id}
                onClick={() => {
                  setSelected(i)
                  setConfirming(false)
                }}
                className="w-full rounded-xl border p-3 text-left transition-all duration-300"
                style={{
                  background: isSelected ? `${starter.creature.color}15` : 'rgba(255,255,255,0.02)',
                  borderColor: isSelected ? `${starter.creature.color}50` : 'rgba(255,255,255,0.06)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all shrink-0"
                    style={{
                      background: isSelected ? `${starter.creature.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSelected ? `0 0 20px ${starter.creature.color}30` : 'none',
                    }}
                  >
                    {starter.creature.sprite}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm truncate">{starter.creature.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: isSelected ? `${starter.creature.color}20` : 'rgba(255,255,255,0.05)',
                          color: isSelected ? starter.creature.color : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {starter.creature.type}
                      </span>
                    </div>
                    <p className="text-orange-400/80 text-[10px] font-medium mt-0.5">{starter.tagline}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">{starter.strength}</p>
                  </div>
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in duration-300">
                    <p className="text-white/50 text-[10px] italic mb-2">{starter.creature.description}</p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[
                        { label: 'HP', value: starter.creature.stats.hp, color: '#22c55e' },
                        { label: 'ATK', value: starter.creature.stats.attack, color: '#ef4444' },
                        { label: 'DEF', value: starter.creature.stats.defense, color: '#3b82f6' },
                        { label: 'SPD', value: starter.creature.stats.speed, color: '#eab308' },
                      ].map(stat => (
                        <div key={stat.label} className="text-center">
                          <p className="text-[8px] text-white/30">{stat.label}</p>
                          <p className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {starter.creature.moves.map(m => (
                        <span key={m.name} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                          {m.name} {m.power > 0 ? `(${m.power})` : '(DEF)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Confirm button — pinned to bottom */}
        {selected !== null && (
          <div className="mt-3 shrink-0">
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{
                  background: `${STARTERS[selected].creature.color}25`,
                  color: STARTERS[selected].creature.color,
                  border: `1px solid ${STARTERS[selected].creature.color}40`,
                }}
              >
                Choose {STARTERS[selected].creature.name}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-white/50 text-xs text-center">
                  {STARTERS[selected].creature.name} will be your first companion. Ready?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm"
                  >
                    Wait...
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{
                      background: `${STARTERS[selected].creature.color}30`,
                      color: STARTERS[selected].creature.color,
                      border: `1px solid ${STARTERS[selected].creature.color}50`,
                    }}
                  >
                    Let&apos;s Go!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}
