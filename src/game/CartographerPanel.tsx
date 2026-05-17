import { useMemo } from 'react'
import type { MapTile, PlayerState, TimeOfDay, WeatherType } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'
import PixelLandmarkIcon from './PixelLandmarkIcon'
import { MAP_HEIGHT, MAP_WIDTH } from './bayAreaMap'
import { FIELD_GUIDE_BIOME_COLORS } from './artDirection'
import { getCreatureArtSpec } from './creatureArt'
import { getLandmarkAt, getLandmarkRegion, LANDMARKS } from './landmarks'
import { WILDCAL_OVERHAUL_TRACKS } from './overhaulRoadmap'

interface Props {
  map: MapTile[][]
  player: PlayerState
  timeOfDay: TimeOfDay
  weather: WeatherType
  currentBiome: MapTile['biome']
  currentSubregion: string
  exploredTiles: Set<string>
  visitedLandmarks?: string[]
  activeQuestCount: number
  onClose: () => void
}

interface TileStats {
  samples: MapTile[]
  walkable: number
  water: number
  bridges: string[]
  minElevation: number
  maxElevation: number
  avgElevation: number
}

function formatBiome(value: string): string {
  return value.replace(/_/g, ' ')
}

function sampleLocalTiles(map: MapTile[][], x: number, y: number, radius = 5): TileStats {
  const samples: MapTile[] = []
  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      const tile = map[yy]?.[xx]
      if (tile) samples.push(tile)
    }
  }

  const elevations = samples.map(tile => tile.elevation)
  const bridges = [...new Set(samples.map(tile => tile.bridge).filter(Boolean) as string[])]
  const totalElevation = elevations.reduce((sum, elevation) => sum + elevation, 0)

  return {
    samples,
    walkable: samples.filter(tile => tile.isWalkable).length,
    water: samples.filter(tile => tile.biome === 'water' || tile.biome === 'kelp_forest').length,
    bridges,
    minElevation: Math.min(...elevations),
    maxElevation: Math.max(...elevations),
    avgElevation: totalElevation / Math.max(1, elevations.length),
  }
}

function heightBars(stats: TileStats): number[] {
  const stride = Math.max(1, Math.floor(stats.samples.length / 18))
  return stats.samples.filter((_, index) => index % stride === 0).slice(0, 18).map(tile => tile.elevation)
}

export default function CartographerPanel({
  map,
  player,
  timeOfDay,
  weather,
  currentBiome,
  currentSubregion,
  exploredTiles,
  visitedLandmarks = [],
  activeQuestCount,
  onClose,
}: Props) {
  const tile = map[player.y]?.[player.x]
  const palette = tile ? FIELD_GUIDE_BIOME_COLORS[tile.biome] : FIELD_GUIDE_BIOME_COLORS[currentBiome]
  const localStats = useMemo(() => sampleLocalTiles(map, player.x, player.y), [map, player.x, player.y])
  const localLandmarks = useMemo(() => {
    return LANDMARKS
      .map(landmark => ({
        landmark,
        distance: Math.hypot(landmark.x - player.x, landmark.y - player.y),
      }))
      .filter(entry => entry.distance <= 9)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
  }, [player.x, player.y])

  const currentLandmark = getLandmarkAt(player.x, player.y)
  const localCreatures = useMemo(() => {
    const bySubregion = ALL_CREATURES.filter(creature => creature.subregions.includes(currentSubregion))
    const byBiome = ALL_CREATURES.filter(creature => creature.biomes.includes(currentBiome))
    return [...bySubregion, ...byBiome.filter(creature => !bySubregion.some(match => match.id === creature.id))]
      .slice(0, 6)
  }, [currentBiome, currentSubregion])

  const creatureAdaptations = useMemo(() => {
    const slots = new Set<string>()
    for (const creature of localCreatures.slice(0, 4)) {
      const spec = getCreatureArtSpec(creature)
      for (const [name, value] of Object.entries(spec.adaptations)) {
        if (value >= 0.45) slots.add(name)
      }
    }
    return [...slots].slice(0, 6)
  }, [localCreatures])

  const explorableTiles = useMemo(() => {
    let total = 0
    for (const row of map) {
      for (const entry of row) {
        if (entry.isWalkable && !entry.borderState) total++
      }
    }
    return Math.max(1, total)
  }, [map])

  const visitedLandmarkCount = new Set(visitedLandmarks).size
  const exploredPct = Math.round((exploredTiles.size / explorableTiles) * 100)
  const bars = heightBars(localStats)
  const maxBarElevation = Math.max(1, ...bars)

  const trackSignals: Record<string, { signal: string; detail: string }> = {
    'map-accuracy': {
      signal: tile ? `${tile.x},${tile.y}` : 'Unknown',
      detail: tile ? `${tile.subregion || currentSubregion} | ${tile.isWalkable ? 'walkable' : 'blocked'}` : 'No tile data',
    },
    'regional-identity': {
      signal: formatBiome(currentBiome),
      detail: `Elevation ${tile?.elevation.toFixed(2) ?? '--'} | ${timeOfDay}`,
    },
    'creature-art': {
      signal: `${localCreatures.length} local`,
      detail: creatureAdaptations.length > 0 ? creatureAdaptations.join(', ') : 'base silhouettes',
    },
    'encounter-presentation': {
      signal: weather,
      detail: `${formatBiome(currentBiome)} arena | ${timeOfDay}`,
    },
    'field-guide': {
      signal: `${player.captured.length}/${ALL_CREATURES.length}`,
      detail: `${Object.keys(player.journal).length} journal regions`,
    },
    'landmarks-traversal': {
      signal: `${visitedLandmarkCount}/${LANDMARKS.length}`,
      detail: currentLandmark ? currentLandmark.name : `${localLandmarks.length} nearby`,
    },
    'map-interaction': {
      signal: `${exploredPct}%`,
      detail: `${localStats.bridges.length} local bridge route${localStats.bridges.length === 1 ? '' : 's'}`,
    },
    'progression-loop': {
      signal: `Lv.${player.level}`,
      detail: `${activeQuestCount} active quest${activeQuestCount === 1 ? '' : 's'}`,
    },
    'animation-juice': {
      signal: timeOfDay,
      detail: `${weather} particles | renderer-ready`,
    },
    'quality-regression': {
      signal: `${localStats.samples.length} tiles`,
      detail: `${localStats.walkable} walkable | ${localStats.water} water`,
    },
  }

  return (
    <aside
      className="absolute left-2 top-20 sm:left-4 sm:top-24 z-50 w-[min(360px,calc(100vw-16px))] max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl border p-3 text-white shadow-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(5,10,18,0.88), rgba(8,13,24,0.78))',
        borderColor: `${palette.detail}55`,
        boxShadow: `0 18px 48px rgba(0,0,0,0.45), 0 0 24px ${palette.top}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
        backdropFilter: 'blur(14px)',
      }}
      aria-label="Cartographer survey"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <PixelIcon icon="+" size={34} variant="travel" color={palette.top} selected title="Survey" />
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: palette.detail }}>
              Cartographer
            </div>
            <h2 className="truncate text-sm font-black text-white">{tile?.subregion || currentSubregion || 'California'}</h2>
            <p className="text-[10px] text-white/45">
              {tile ? `x${tile.x} y${tile.y} | ${formatBiome(tile.biome)} | elev ${tile.elevation.toFixed(2)}` : 'No tile selected'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-2 py-1 text-[10px] font-bold text-white/55 transition-colors hover:text-white"
          style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Close cartographer survey"
        >
          Close
        </button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        <div className="rounded-lg border p-2" style={{ background: `${palette.top}14`, borderColor: `${palette.detail}35` }}>
          <div className="text-[8px] uppercase tracking-wider text-white/35">Walk</div>
          <div className="text-sm font-black">{tile?.isWalkable ? 'Yes' : 'No'}</div>
        </div>
        <div className="rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-[8px] uppercase tracking-wider text-white/35">Bridge</div>
          <div className="truncate text-sm font-black">{tile?.bridge ?? 'None'}</div>
        </div>
        <div className="rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-[8px] uppercase tracking-wider text-white/35">Range</div>
          <div className="text-sm font-black">{localStats.minElevation.toFixed(1)}-{localStats.maxElevation.toFixed(1)}</div>
        </div>
        <div className="rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-[8px] uppercase tracking-wider text-white/35">Atlas</div>
          <div className="text-sm font-black">{exploredPct}%</div>
        </div>
      </div>

      <div className="mb-3 rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Local Relief</span>
          <span className="text-[9px] text-white/40">avg {localStats.avgElevation.toFixed(2)}</span>
        </div>
        <div className="flex h-12 items-end gap-1">
          {bars.map((elevation, index) => (
            <span
              key={`${index}-${elevation}`}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${Math.max(6, (elevation / maxBarElevation) * 44)}px`,
                background: `linear-gradient(180deg, ${palette.detail}, ${palette.side})`,
                opacity: 0.5 + Math.min(0.5, elevation / 8),
              }}
            />
          ))}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {WILDCAL_OVERHAUL_TRACKS.map(track => {
          const signal = trackSignals[track.id]
          return (
            <div
              key={track.id}
              className="rounded-lg border p-2"
              style={{
                background: `linear-gradient(135deg, ${track.accent}12, rgba(255,255,255,0.025))`,
                borderColor: `${track.accent}30`,
              }}
              title={track.summary}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: track.accent }}>
                  {track.number}
                </span>
                <span className="truncate text-[8px] text-white/35">{signal.signal}</span>
              </div>
              <div className="mt-0.5 truncate text-[10px] font-bold text-white/78">{track.title}</div>
              <div className="mt-0.5 truncate text-[8px] text-white/35">{signal.detail}</div>
            </div>
          )
        })}
      </div>

      {(localCreatures.length > 0 || localLandmarks.length > 0) && (
        <div className="grid grid-cols-1 gap-2">
          {localCreatures.length > 0 && (
            <div className="rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Local Creatures</span>
                <span className="text-[8px] text-white/35">{creatureAdaptations.length} adaptation slots</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {localCreatures.map(creature => (
                  <PixelCreatureToken
                    key={creature.id}
                    creature={creature}
                    size={32}
                    selected={player.captured.includes(creature.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {localLandmarks.length > 0 && (
            <div className="rounded-lg border p-2" style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Nearby Landmarks</div>
              <div className="grid grid-cols-2 gap-1.5">
                {localLandmarks.map(({ landmark, distance }) => (
                  <div key={landmark.name} className="flex min-w-0 items-center gap-1.5 rounded-md bg-white/[0.03] p-1.5">
                    <PixelLandmarkIcon landmark={landmark} size={24} selected={visitedLandmarks.includes(landmark.name)} />
                    <div className="min-w-0">
                      <div className="truncate text-[9px] font-semibold text-white/75">{landmark.name}</div>
                      <div className="truncate text-[7px] text-white/30">{getLandmarkRegion(landmark.name)} | {distance.toFixed(1)} tiles</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[8px] uppercase tracking-wider text-white/25">
        <span>{MAP_WIDTH}x{MAP_HEIGHT} atlas</span>
        <span>{weather} | {timeOfDay}</span>
      </div>
    </aside>
  )
}
