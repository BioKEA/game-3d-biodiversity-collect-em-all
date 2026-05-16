import { useState, useMemo } from 'react'
import type { JournalEntry, BiomeType, WeatherType, Season } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { getWeatherInfo, getSeason, getSeasonInfo } from './timeWeather'
import { LANDMARKS, LANDMARK_INFO, LANDMARK_REGIONS } from './landmarks'
import type { LandmarkRegion, LandmarkDef } from './landmarks'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  journal: Record<string, JournalEntry>
  currentSubregion: string
  onClose: () => void
  weatherAlmanac?: Record<WeatherType, number>
  currentWeather?: WeatherType
  gameDay?: number
  visitedLandmarks?: string[]
}

const BIOME_ICONS: Record<BiomeType, string> = {
  forest: '🌳',
  marsh: '🌿',
  beach: '🏖️',
  rocky_beach: '🪨',
  urban: '🏙️',
  water: '🌊',
  mountain: '⛰️',
  grassland: '🌾',
  redwood: '🌲',
  tidepool: '🪸',
  chaparral: '🌵',
  oak_woodland: '🌳',
  kelp_forest: '🌿',
  desert: '🏜️',
  alpine: '🏔️',
  snow: '❄️',
  valley: '🌾',
  volcanic: '🌋',
  scrubland: '🌿',
  dunes: '🏖️',
  canyon: '🏜️',
  lakeshore: '🏞️',
  old_growth: '🌲',
}

const BIOME_LABELS: Record<BiomeType, string> = {
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

function getExpectedCreatures(subregion: string): typeof ALL_CREATURES {
  return ALL_CREATURES.filter(c => c.subregions.includes(subregion))
}

export default function FieldJournal({ journal, currentSubregion, onClose, weatherAlmanac, currentWeather, gameDay, visitedLandmarks }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(
    currentSubregion && journal[currentSubregion] ? currentSubregion : null
  )
  const [tab, setTab] = useState<'regions' | 'weather' | 'landmarks'>('regions')

  const entries = Object.values(journal).sort((a, b) => {
    if (a.subregion === currentSubregion) return -1
    if (b.subregion === currentSubregion) return 1
    return b.visitCount - a.visitCount
  })

  const selected = selectedEntry ? journal[selectedEntry] : null
  const expectedCreatures = selectedEntry ? getExpectedCreatures(selectedEntry) : []

  return (
    <FloatingPanel
      title="Field Journal"
      subtitle={tab === 'regions' ? `${entries.length} regions explored` : tab === 'weather' ? 'Weather Almanac' : `${(visitedLandmarks ?? []).length}/${LANDMARKS.length} discovered`}
      onClose={onClose}
      width="lg"
    >
      {/* Tab bar */}
      <div className="flex border-b px-3 gap-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {([['regions', '🗺️ Regions'], ['landmarks', '🏛️ Landmarks'], ['weather', '⛈️ Weather']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-3 py-1.5 text-[10px] font-medium transition-all relative"
            style={{
              color: tab === key ? '#22d3ee' : 'rgba(255,255,255,0.35)',
            }}
          >
            {label}
            {tab === key && (
              <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full" style={{ background: '#22d3ee' }} />
            )}
          </button>
        ))}
      </div>

      {tab === 'weather' ? (
        <WeatherAlmanacTab almanac={weatherAlmanac} currentWeather={currentWeather} gameDay={gameDay} />
      ) : tab === 'landmarks' ? (
        <LandmarkGuideTab visitedLandmarks={visitedLandmarks ?? []} />
      ) : (
      <div className="flex flex-1 min-h-0" style={{ minHeight: 300 }}>
        {/* Left: Subregion list */}
        <div className="w-[45%] border-r border-white/10 overflow-y-auto p-2 space-y-1">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs">
              <span className="text-2xl mb-2">🗺️</span>
              <p>No regions explored yet.</p>
              <p>Start walking to fill your journal!</p>
            </div>
          ) : (
            entries.map(entry => {
              const expected = getExpectedCreatures(entry.subregion)
              const encounteredCount = entry.creaturesEncountered.length
              const isCurrent = entry.subregion === currentSubregion
              const isSelected = entry.subregion === selectedEntry

              return (
                <button
                  key={entry.subregion}
                  onClick={() => setSelectedEntry(entry.subregion)}
                  className={`w-full text-left rounded-lg p-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'bg-white/3 border border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{BIOME_ICONS[entry.biome]}</span>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-white/80'}`}>
                      {entry.subregion}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                        HERE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-white/30">
                      {BIOME_LABELS[entry.biome]}
                    </span>
                    <span className="text-[9px] text-white/20">·</span>
                    <span className="text-[9px] text-white/30">
                      {encounteredCount}/{expected.length > 0 ? expected.length : '?'} species
                    </span>
                    {expected.length > 0 && encounteredCount >= expected.length && (
                      <span className="text-[9px] text-yellow-400">★</span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 overflow-y-auto p-3">
          {selected ? (
            <div>
              {/* Region header */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{BIOME_ICONS[selected.biome]}</span>
                  <div>
                    <h3 className="text-white font-bold text-sm">{selected.subregion}</h3>
                    <p className="text-white/30 text-[10px]">{BIOME_LABELS[selected.biome]}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="bg-white/5 rounded-md px-2 py-1">
                    <p className="text-[9px] text-white/30">First Visit</p>
                    <p className="text-white/70 text-[10px]">
                      {new Date(selected.firstVisited).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-md px-2 py-1">
                    <p className="text-[9px] text-white/30">Visits</p>
                    <p className="text-white/70 text-[10px]">{selected.visitCount}</p>
                  </div>
                  <div className="bg-white/5 rounded-md px-2 py-1">
                    <p className="text-[9px] text-white/30">Species Found</p>
                    <p className="text-white/70 text-[10px]">
                      {selected.creaturesEncountered.length}
                      {expectedCreatures.length > 0 && `/${expectedCreatures.length}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Species checklist */}
              <div>
                <h4 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">
                  Local Species
                </h4>
                {expectedCreatures.length === 0 ? (
                  <p className="text-white/20 text-xs italic">No known species specific to this area.</p>
                ) : (
                  <div className="space-y-1">
                    {expectedCreatures.map(creature => {
                      const encountered = selected.creaturesEncountered.includes(creature.id)
                      const captured = selected.creaturesCaptured.includes(creature.id)

                      return (
                        <div
                          key={creature.id}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                            encountered ? 'bg-white/5' : 'bg-white/2'
                          }`}
                        >
                          {encountered ? (
                            <PixelCreatureToken creature={creature} size={24} selected={captured} />
                          ) : (
                            <span className="text-white/15 text-sm">?</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${encountered ? 'text-white/80' : 'text-white/20'}`}>
                              {encountered ? creature.name : '???'}
                            </p>
                            {encountered && (
                              <p className="text-[9px] text-white/30 italic truncate">{creature.scientificName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {encountered && (
                              <span className="text-[8px] bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded-full">
                                SEEN
                              </span>
                            )}
                            {captured && (
                              <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                CAUGHT
                              </span>
                            )}
                            <RarityBadge rarity={creature.rarity} show={encountered} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* General biome creatures */}
              {(() => {
                const biomeCreatures = ALL_CREATURES.filter(
                  c => c.biomes.includes(selected.biome) && !c.subregions.includes(selected.subregion)
                )
                if (biomeCreatures.length === 0) return null

                return (
                  <div className="mt-3">
                    <h4 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">
                      Passing Through ({BIOME_LABELS[selected.biome]})
                    </h4>
                    <div className="space-y-1">
                      {biomeCreatures.map(creature => {
                        const encountered = selected.creaturesEncountered.includes(creature.id)
                        return (
                          <div
                            key={creature.id}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                              encountered ? 'bg-white/3' : 'bg-white/1'
                            }`}
                          >
                            {encountered ? (
                              <PixelCreatureToken creature={creature} size={20} />
                            ) : (
                              <span className="text-white/10 text-xs">?</span>
                            )}
                            <p className={`text-[10px] ${encountered ? 'text-white/50' : 'text-white/15'}`}>
                              {encountered ? creature.name : '???'}
                            </p>
                            {encountered && <RarityBadge rarity={creature.rarity} show />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs">
              <span className="text-3xl mb-2">📓</span>
              <p>Select a region to view details</p>
            </div>
          )}
        </div>
      </div>
      )}
    </FloatingPanel>
  )
}

const ALL_WEATHER_TYPES: WeatherType[] = ['clear', 'sunny', 'fog', 'rain', 'wind', 'thunderstorm']

const WEATHER_COLORS: Record<WeatherType, string> = {
  clear: '#fbbf24',
  sunny: '#f59e0b',
  fog: '#a78bfa',
  rain: '#60a5fa',
  wind: '#94a3b8',
  thunderstorm: '#c084fc',
}

const WEATHER_DESCRIPTIONS: Record<WeatherType, string> = {
  clear: 'Calm skies with mild conditions. No special creature effects.',
  sunny: 'Bright sunshine heats the land. Reptiles, insects, and beasts bask in the warmth — encounter rates increase.',
  fog: 'Karl the Fog rolls in from the Pacific. Mystic creatures emerge from the mist with boosted power.',
  rain: 'Steady rainfall soaks the terrain. Marine and amphibian creatures thrive; birds struggle in the downpour.',
  wind: 'Strong gusts sweep across the landscape. Birds ride the thermals while insects are battered.',
  thunderstorm: 'Violent electrical storm with heavy rain and lightning. Legendary creatures are drawn to the energy — rare spawns spike dramatically.',
}

const SEASON_WEATHER_TIPS: Record<Season, string> = {
  winter: 'Winter storms bring frequent rain and thunderstorms. Fog lingers in valleys.',
  spring: 'Clearing skies with occasional showers. Wind picks up in the afternoons.',
  summer: 'Karl the Fog dominates the coast. Inland areas bake under relentless sun.',
  fall: 'Gusty winds strip the oaks. Clear days alternate with early fog.',
}

function LandmarkGuideTab({ visitedLandmarks }: { visitedLandmarks: string[] }) {
  const visited = new Set(visitedLandmarks)
  const [selectedRegion, setSelectedRegion] = useState<LandmarkRegion | null>(null)
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkDef | null>(null)

  const regionStats = useMemo(() => {
    return (Object.entries(LANDMARK_REGIONS) as [LandmarkRegion, string[]][]).map(([region, names]) => {
      const found = names.filter(n => visited.has(n)).length
      return { region, total: names.length, found, pct: names.length > 0 ? found / names.length : 0 }
    }).filter(r => r.total > 0)
  }, [visited])

  const totalPct = LANDMARKS.length > 0 ? visited.size / LANDMARKS.length : 0

  if (selectedLandmark) {
    const info = LANDMARK_INFO[selectedLandmark.name]
    const isFound = visited.has(selectedLandmark.name)
    return (
      <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 400 }}>
        <button onClick={() => setSelectedLandmark(null)} className="text-[10px] text-cyan-400 hover:text-cyan-300">
          ← Back to {selectedRegion ?? 'regions'}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selectedLandmark.emoji ?? '📍'}</span>
          <div>
            <h3 className="text-sm font-bold text-white">{isFound ? selectedLandmark.name : '???'}</h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
              background: isFound ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
              color: isFound ? '#4ade80' : 'rgba(255,255,255,0.3)',
            }}>{isFound ? 'Discovered' : 'Undiscovered'}</span>
          </div>
        </div>
        {isFound && info && (
          <>
            <p className="text-[11px] text-white/60 leading-relaxed">{info.description}</p>
            <div>
              <h4 className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Associated Creatures</h4>
              <div className="flex gap-1">
                {info.creatures.map((c, i) => (
                  <span key={i} className="text-lg">{c}</span>
                ))}
              </div>
            </div>
          </>
        )}
        {!isFound && (
          <p className="text-[11px] text-white/30 italic">Walk near this landmark to discover it and reveal its secrets.</p>
        )}
      </div>
    )
  }

  if (selectedRegion) {
    const names = LANDMARK_REGIONS[selectedRegion] ?? []
    const regionLandmarks = names.map(n => LANDMARKS.find(l => l.name === n)).filter((l): l is LandmarkDef => !!l)
    const found = names.filter(n => visited.has(n)).length
    return (
      <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
        <button onClick={() => setSelectedRegion(null)} className="text-[10px] text-cyan-400 hover:text-cyan-300">
          ← All Regions
        </button>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{selectedRegion}</h3>
          <span className="text-[10px] text-white/40">{found}/{names.length}</span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-1.5 rounded-full transition-all" style={{
            width: `${(found / Math.max(names.length, 1)) * 100}%`,
            background: found === names.length ? '#4ade80' : '#22d3ee',
          }} />
        </div>
        {found === names.length && names.length > 0 && (
          <div className="text-center text-[10px] py-1 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
            Region Complete!
          </div>
        )}
        <div className="space-y-1 mt-2">
          {regionLandmarks.map(lm => {
            const isFound = visited.has(lm.name)
            return (
              <button
                key={lm.name}
                onClick={() => setSelectedLandmark(lm)}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all hover:bg-white/5"
                style={{ background: isFound ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              >
                <span className="text-lg w-7 text-center">{isFound ? (lm.emoji ?? '📍') : '❓'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: isFound ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }}>
                    {isFound ? lm.name : '???'}
                  </p>
                  <p className="text-[9px]" style={{ color: isFound ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)' }}>
                    {isFound ? lm.label : 'Undiscovered'}
                  </p>
                </div>
                {isFound && <span className="text-[9px]" style={{ color: '#4ade80' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 400 }}>
      {/* Overall progress */}
      <div className="text-center space-y-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative inline-block">
          <svg width={72} height={72} className="transform -rotate-90">
            <circle cx={36} cy={36} r={30} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
            <circle cx={36} cy={36} r={30} fill="none" stroke="#22d3ee" strokeWidth={4}
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - totalPct)}`}
              strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            {visited.size}
          </span>
        </div>
        <p className="text-[10px] text-white/40">{visited.size} of {LANDMARKS.length} landmarks discovered</p>
      </div>

      {/* Region list */}
      <div className="space-y-1">
        {regionStats.map(({ region, total, found, pct }) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className="w-full flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ background: found === total ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-white">{region}</span>
                <span className="text-[9px] font-mono" style={{ color: found === total ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                  {found}/{total}
                </span>
              </div>
              <div className="w-full rounded-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full transition-all" style={{
                  width: `${pct * 100}%`,
                  background: found === total ? '#4ade80' : found > 0 ? '#22d3ee' : 'transparent',
                }} />
              </div>
            </div>
            <span className="text-white/20 text-[10px]">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WeatherAlmanacTab({ almanac, currentWeather, gameDay }: {
  almanac?: Record<WeatherType, number>
  currentWeather?: WeatherType
  gameDay?: number
}) {
  const totalOccurrences = useMemo(() => {
    if (!almanac) return 0
    return Object.values(almanac).reduce((s, n) => s + n, 0)
  }, [almanac])

  const season = getSeason(gameDay ?? 0)
  const seasonInfo = getSeasonInfo(season)

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ minHeight: 300 }}>
      {/* Current conditions */}
      <div className="rounded-xl p-3" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentWeather ? getWeatherInfo(currentWeather).icon : '🌤'}</span>
          <div className="flex-1">
            <p className="text-white/80 text-sm font-semibold">
              {currentWeather ? getWeatherInfo(currentWeather).label : 'Clear'}
            </p>
            <p className="text-white/30 text-[10px]">
              {currentWeather ? getWeatherInfo(currentWeather).description : 'No weather effects'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium" style={{ color: seasonInfo.color }}>
              {seasonInfo.icon} {seasonInfo.label}
            </p>
            <p className="text-[9px] text-white/25">Day {(gameDay ?? 0) % 360 + 1}</p>
          </div>
        </div>
      </div>

      {/* Season tip */}
      <div className="rounded-lg px-3 py-2" style={{
        background: `${seasonInfo.color}08`,
        border: `1px solid ${seasonInfo.color}15`,
      }}>
        <p className="text-[9px] text-white/40 italic">{SEASON_WEATHER_TIPS[season]}</p>
      </div>

      {/* Weather type stats */}
      <div>
        <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Weather Log</h4>
        <div className="space-y-2">
          {ALL_WEATHER_TYPES.map(type => {
            const count = almanac?.[type] ?? 0
            const pct = totalOccurrences > 0 ? (count / totalOccurrences) * 100 : 0
            const info = getWeatherInfo(type)
            const color = WEATHER_COLORS[type]
            const isCurrent = type === currentWeather

            return (
              <div key={type} className="rounded-lg px-3 py-2 transition-all" style={{
                background: isCurrent ? `${color}10` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isCurrent ? `${color}30` : 'rgba(255,255,255,0.04)'}`,
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-white/80 text-xs font-semibold flex-1">{info.label}</span>
                  {isCurrent && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{
                      background: `${color}20`,
                      color: color,
                    }}>NOW</span>
                  )}
                  <span className="text-white/30 text-[10px] font-mono tabular-nums">{count}×</span>
                  <span className="text-white/20 text-[9px] font-mono tabular-nums w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}80)`,
                  }} />
                </div>
                <p className="text-[9px] text-white/25 mt-1">{WEATHER_DESCRIPTIONS[type]}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spawn bonus reference */}
      <div>
        <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Creature Spawn Bonuses</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ['🌧️ Rain', '🐸🌊🌿 ×2.0'],
            ['🌫️ Fog', '✨ Mystic ×2.5'],
            ['💨 Wind', '🪶🦋 ×1.8'],
            ['☀️ Sunny', '🦎🐾🦋 ×1.5'],
            ['⛈️ Storm', '✨🐸🌊 ×2.5'],
            ['⛈️ Storm', '👑 Legendary +50%'],
          ] as const).map(([weather, bonus], i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span className="text-[10px]">{weather}</span>
              <span className="text-[9px] text-white/40">{bonus}</span>
            </div>
          ))}
        </div>
      </div>

      {totalOccurrences === 0 && (
        <div className="text-center py-4">
          <span className="text-2xl opacity-20 block mb-2">📊</span>
          <p className="text-white/25 text-xs">Weather data will appear as you explore!</p>
        </div>
      )}
    </div>
  )
}

function RarityBadge({ rarity, show }: { rarity: string; show: boolean }) {
  if (!show) return null
  const colors: Record<string, string> = {
    common: 'text-white/30 bg-white/5',
    uncommon: 'text-blue-400 bg-blue-500/10',
    rare: 'text-purple-400 bg-purple-500/10',
    legendary: 'text-yellow-400 bg-yellow-500/10',
  }
  return (
    <span className={`text-[7px] uppercase px-1 py-0.5 rounded ${colors[rarity] || colors.common}`}>
      {rarity}
    </span>
  )
}
