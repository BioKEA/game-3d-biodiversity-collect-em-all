import { useState, useMemo } from 'react'
import type { BiomeType, CreatureType } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  catalogSeen: string[]
  catalogCaptured: string[]
  onClose: () => void
}

const BIOME_INFO: Record<BiomeType, { name: string; icon: string; color: string; description: string }> = {
  forest: { name: 'Forest', icon: '🌲', color: '#22c55e', description: 'Dense woodlands with diverse wildlife' },
  marsh: { name: 'Wetlands', icon: '🌿', color: '#06b6d4', description: 'Misty marshes and tidal flats' },
  beach: { name: 'Coastline', icon: '🏖️', color: '#f59e0b', description: 'Sandy shores and dune scrub' },
  rocky_beach: { name: 'Rocky Shore', icon: '🪨', color: '#a8a29e', description: 'Sandstone arches and wave-carved outcrops' },
  urban: { name: 'City', icon: '🏙️', color: '#f97316', description: 'Urban parks and streets' },
  water: { name: 'Bay Waters', icon: '🌊', color: '#3b82f6', description: 'Open water of the Bay' },
  mountain: { name: 'Hills', icon: '⛰️', color: '#8b5cf6', description: 'Rolling hills and ridgelines' },
  grassland: { name: 'Grasslands', icon: '🌾', color: '#84cc16', description: 'Open meadows and fields' },
  redwood: { name: 'Redwood Grove', icon: '🌳', color: '#15803d', description: 'Ancient coast redwood forests' },
  tidepool: { name: 'Tidepools', icon: '🪸', color: '#0891b2', description: 'Rocky intertidal zones' },
  chaparral: { name: 'Chaparral', icon: '🌵', color: '#a3a056', description: 'Hot, dry shrublands of California' },
  oak_woodland: { name: 'Oak Woodland', icon: '🌳', color: '#65a30d', description: 'Native blue and valley oak savannas' },
  kelp_forest: { name: 'Kelp Forest', icon: '🌿', color: '#0f766e', description: 'Underwater giant kelp groves' },
  desert: { name: 'Desert', icon: '🏜️', color: '#d4a574', description: 'Arid expanses of sand and rock' },
  alpine: { name: 'Alpine', icon: '🏔️', color: '#94a3b8', description: 'High-elevation rocky meadows above treeline' },
  snow: { name: 'Snowfield', icon: '❄️', color: '#e2e8f0', description: 'Snow-covered peaks and glacial terrain' },
  valley: { name: 'Valley', icon: '🌾', color: '#7cb342', description: 'Fertile agricultural flatlands' },
  volcanic: { name: 'Volcanic', icon: '🌋', color: '#5c4033', description: 'Lava fields and geothermal vents' },
  scrubland: { name: 'Scrubland', icon: '🌿', color: '#c4a882', description: 'Sparse desert brush and sage' },
  dunes: { name: 'Sand Dunes', icon: '🏖️', color: '#e8d5a3', description: 'Shifting sand formations' },
  canyon: { name: 'Canyon', icon: '🏜️', color: '#c07040', description: 'Deep rock-walled gorges' },
  lakeshore: { name: 'Lakeshore', icon: '🏞️', color: '#5da87e', description: 'Shores of mountain and valley lakes' },
  old_growth: { name: 'Old Growth', icon: '🌲', color: '#0d4a20', description: 'Ancient untouched forest groves' },
}

const BIOME_ORDER: BiomeType[] = ['forest', 'redwood', 'old_growth', 'oak_woodland', 'chaparral', 'grassland', 'valley', 'mountain', 'alpine', 'snow', 'volcanic', 'marsh', 'lakeshore', 'beach', 'rocky_beach', 'tidepool', 'water', 'kelp_forest', 'desert', 'scrubland', 'dunes', 'canyon', 'urban']

const TYPE_COLORS: Record<CreatureType, string> = {
  beast: '#f97316',
  bird: '#60a5fa',
  insect: '#a3e635',
  marine: '#22d3ee',
  amphibian: '#4ade80',
  mystic: '#c084fc',
  reptile: '#facc15',
  plant: '#34d399',
}

type ViewMode = 'biome' | 'type'

export default function HabitatMap({ catalogSeen, catalogCaptured, onClose }: Props) {
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('biome')
  const [selectedType, setSelectedType] = useState<CreatureType | null>(null)

  const biomeData = useMemo(() => {
    return BIOME_ORDER.map(biome => {
      const creatures = ALL_CREATURES.filter(c => c.biomes.includes(biome))
      const seen = creatures.filter(c => catalogSeen.includes(c.id))
      const caught = creatures.filter(c => catalogCaptured.includes(c.id))
      return { biome, creatures, seen: seen.length, caught: caught.length, total: creatures.length }
    })
  }, [catalogSeen, catalogCaptured])

  const typeData = useMemo(() => {
    const types: CreatureType[] = ['beast', 'bird', 'insect', 'marine', 'amphibian', 'reptile', 'plant', 'mystic']
    return types.map(type => {
      const creatures = ALL_CREATURES.filter(c => c.type === type)
      const seen = creatures.filter(c => catalogSeen.includes(c.id))
      const caught = creatures.filter(c => catalogCaptured.includes(c.id))
      return { type, creatures, seen: seen.length, caught: caught.length, total: creatures.length }
    })
  }, [catalogSeen, catalogCaptured])

  const selectedCreatures = useMemo(() => {
    if (viewMode === 'biome' && selectedBiome) {
      return ALL_CREATURES.filter(c => c.biomes.includes(selectedBiome))
    }
    if (viewMode === 'type' && selectedType) {
      return ALL_CREATURES.filter(c => c.type === selectedType)
    }
    return []
  }, [viewMode, selectedBiome, selectedType])

  return (
    <FloatingPanel
      title="Habitat Map"
      subtitle="Creature locations by biome & type"
      onClose={onClose}
      width="lg"
    >
      <div className="p-3 space-y-3">
        {/* View mode toggle */}
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {(['biome', 'type'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setSelectedBiome(null); setSelectedType(null) }}
              className="flex-1 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all"
              style={{
                background: viewMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              {mode === 'biome' ? '🗺️ By Biome' : '🧬 By Type'}
            </button>
          ))}
        </div>

        {/* Biome view */}
        {viewMode === 'biome' && (
          <div className="space-y-1.5">
            {biomeData.map(({ biome, seen, caught, total }) => {
              const info = BIOME_INFO[biome]
              const isSelected = selectedBiome === biome
              const pct = total > 0 ? Math.round((caught / total) * 100) : 0
              return (
                <button
                  key={biome}
                  onClick={() => setSelectedBiome(isSelected ? null : biome)}
                  className="w-full rounded-lg border p-2.5 text-left transition-all"
                  style={{
                    background: isSelected ? `${info.color}10` : 'rgba(255,255,255,0.02)',
                    borderColor: isSelected ? `${info.color}30` : 'rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 12px ${info.color}10` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{
                      background: `${info.color}12`,
                      border: `1px solid ${info.color}20`,
                    }}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-semibold">{info.name}</span>
                        <span className="text-[9px] font-mono" style={{ color: `${info.color}` }}>
                          {caught}/{total}
                        </span>
                      </div>
                      <p className="text-white/30 text-[8px] mb-1">{info.description}</p>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${info.color}60, ${info.color})`,
                        }} />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] text-white/25">{seen} seen</span>
                        <span className="text-[8px]" style={{ color: `${info.color}80` }}>{caught} caught</span>
                        <span className="text-[8px] text-white/15">{pct}% complete</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Type view */}
        {viewMode === 'type' && (
          <div className="grid grid-cols-2 gap-1.5">
            {typeData.map(({ type, caught, total }) => {
              const color = TYPE_COLORS[type]
              const isSelected = selectedType === type
              const pct = total > 0 ? Math.round((caught / total) * 100) : 0
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(isSelected ? null : type)}
                  className="rounded-lg border p-2 text-left transition-all"
                  style={{
                    background: isSelected ? `${color}10` : 'rgba(255,255,255,0.02)',
                    borderColor: isSelected ? `${color}30` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-white text-[10px] font-semibold capitalize">{type}</span>
                    <span className="text-[8px] ml-auto font-mono" style={{ color }}>{caught}/{total}</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${pct}%`,
                      background: color,
                    }} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Creature list for selected biome/type */}
        {selectedCreatures.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-white/40 text-[10px] uppercase tracking-wider px-1">
              {viewMode === 'biome' && selectedBiome ? `${BIOME_INFO[selectedBiome].name} Creatures` : ''}
              {viewMode === 'type' && selectedType ? `${selectedType} Creatures` : ''}
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {selectedCreatures.map(creature => {
                const isSeen = catalogSeen.includes(creature.id)
                const isCaught = catalogCaptured.includes(creature.id)
                return (
                  <div
                    key={creature.id}
                    className="rounded-lg border p-2 transition-all"
                    style={{
                      background: isCaught ? `${creature.color}08` : 'rgba(255,255,255,0.01)',
                      borderColor: isCaught ? `${creature.color}20` : 'rgba(255,255,255,0.04)',
                      opacity: isSeen ? 1 : 0.4,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {isSeen ? (
                        <PixelCreatureToken creature={creature} size={26} selected={isCaught} />
                      ) : (
                        <span className="text-white/15 text-sm">?</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-[9px] font-semibold truncate">
                          {isSeen ? creature.name : '???'}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] capitalize" style={{
                            color: TYPE_COLORS[creature.type],
                            opacity: isSeen ? 1 : 0,
                          }}>
                            {creature.type}
                          </span>
                          {isCaught && (
                            <span className="text-[7px] text-emerald-400">✓</span>
                          )}
                          {isSeen && !isCaught && (
                            <span className="text-[7px] text-white/20">seen</span>
                          )}
                        </div>
                        {isSeen && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {creature.biomes.map(b => (
                              <span key={b} className="text-[6px] px-1 py-px rounded" style={{
                                background: `${BIOME_INFO[b].color}15`,
                                color: `${BIOME_INFO[b].color}80`,
                              }}>
                                {BIOME_INFO[b].name}
                              </span>
                            ))}
                          </div>
                        )}
                        {isSeen && creature.activeTime && creature.activeTime.length > 0 && creature.activeTime.length < 4 && (
                          <p className="text-[6px] text-white/20 mt-0.5">
                            Active: {creature.activeTime.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Overall stats */}
        <div className="rounded-lg border border-white/5 p-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[9px]">Total Discovery</span>
            <span className="text-emerald-400 text-[10px] font-semibold">
              {catalogCaptured.length}/{ALL_CREATURES.length} species caught
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.round((catalogCaptured.length / ALL_CREATURES.length) * 100)}%`,
              background: 'linear-gradient(90deg, #06b6d4, #4ade80)',
            }} />
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}
