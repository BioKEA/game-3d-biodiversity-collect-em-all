import { useState, useEffect, useMemo, memo } from 'react'
import type { MapTile, BiomeType } from '@/types/game'

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
  currentBiome: BiomeType
}

interface FootprintTrail {
  id: string
  x: number  // screen-relative %
  y: number
  angle: number  // rotation pointing toward creature
  age: number   // 0=fresh, higher=older
  biome: BiomeType
}

const BIOME_PRINT_STYLE: Record<BiomeType, { color: string; char: string }> = {
  forest:       { color: 'rgba(34,197,94,0.5)',  char: '🐾' },
  redwood:      { color: 'rgba(21,128,61,0.5)',  char: '🐾' },
  grassland:    { color: 'rgba(74,222,128,0.4)', char: '🐾' },
  beach:        { color: 'rgba(234,179,8,0.5)',  char: '👣' },
  rocky_beach:  { color: 'rgba(120,113,108,0.5)',char: '🐾' },
  marsh:        { color: 'rgba(6,182,212,0.4)',  char: '🐾' },
  mountain:     { color: 'rgba(120,113,108,0.5)',char: '🐾' },
  water:        { color: 'rgba(56,189,248,0.4)', char: '💧' },
  urban:        { color: 'rgba(107,114,128,0.4)',char: '🐾' },
  tidepool:     { color: 'rgba(8,145,178,0.5)',  char: '💧' },
  chaparral:    { color: 'rgba(163,160,86,0.5)', char: '🐾' },
  oak_woodland: { color: 'rgba(101,163,13,0.5)', char: '🐾' },
  kelp_forest:  { color: 'rgba(15,118,110,0.4)', char: '💧' },
  desert:       { color: 'rgba(212,165,116,0.4)',char: '🐾' },
  alpine:       { color: 'rgba(148,163,184,0.4)',char: '🐾' },
  snow:         { color: 'rgba(226,232,240,0.3)',char: '🐾' },
  valley:       { color: 'rgba(124,179,66,0.4)', char: '🐾' },
  volcanic:     { color: 'rgba(92,64,51,0.5)',   char: '🐾' },
  scrubland:    { color: 'rgba(196,168,130,0.4)',char: '🐾' },
  dunes:        { color: 'rgba(232,213,163,0.4)',char: '👣' },
  canyon:       { color: 'rgba(192,112,64,0.5)', char: '🐾' },
  lakeshore:    { color: 'rgba(93,168,126,0.4)', char: '🐾' },
  old_growth:   { color: 'rgba(13,74,32,0.5)',   char: '🐾' },
}

const CreatureFootprints = memo(function CreatureFootprints({ map, playerX, playerY, currentBiome }: Props) {
  const [trails, setTrails] = useState<FootprintTrail[]>([])

  // Find nearby creature tiles and generate footprint trails toward them
  const nearbyCreatures = useMemo(() => {
    const creatures: { x: number; y: number; dist: number }[] = []
    const searchR = 8
    for (let dy = -searchR; dy <= searchR; dy++) {
      for (let dx = -searchR; dx <= searchR; dx++) {
        const tx = playerX + dx
        const ty = playerY + dy
        if (tx < 0 || ty < 0 || ty >= map.length || tx >= (map[0]?.length ?? 0)) continue
        const tile = map[ty]?.[tx]
        if (!tile?.hasCreature) continue
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 1 && dist <= searchR) {
          creatures.push({ x: tx, y: ty, dist })
        }
      }
    }
    // Sort by distance, take closest 3
    return creatures.sort((a, b) => a.dist - b.dist).slice(0, 3)
  }, [map, playerX, playerY])

  useEffect(() => {
    if (nearbyCreatures.length === 0) {
      setTrails([])
      return
    }

    const newTrails: FootprintTrail[] = []
    for (const creature of nearbyCreatures) {
      const dx = creature.x - playerX
      const dy = creature.y - playerY
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const dist = creature.dist

      // Place 2-3 footprints along the direction, closer ones are fresher
      const printCount = Math.min(3, Math.ceil(dist / 3))
      for (let i = 0; i < printCount; i++) {
        const t = (i + 1) / (printCount + 1)
        // Position relative to screen center (player is at ~50%, 58%)
        const fx = 50 + (dx * t) * 4 + (Math.random() - 0.5) * 2
        const fy = 55 + (dy * t) * 4 + (Math.random() - 0.5) * 2
        newTrails.push({
          id: `${creature.x}-${creature.y}-${i}`,
          x: Math.max(5, Math.min(95, fx)),
          y: Math.max(5, Math.min(95, fy)),
          angle,
          age: i,
          biome: currentBiome,
        })
      }
    }
    setTrails(newTrails)
  }, [nearbyCreatures, playerX, playerY, currentBiome])

  if (trails.length === 0) return null

  const style = BIOME_PRINT_STYLE[currentBiome]

  return (
    <div className="absolute inset-0 pointer-events-none z-[4] overflow-hidden">
      <style>{`
        @keyframes footprint-appear {
          0% { opacity: 0; transform: rotate(var(--angle)) scale(0.5); }
          30% { opacity: var(--opacity); transform: rotate(var(--angle)) scale(1.1); }
          100% { opacity: var(--opacity); transform: rotate(var(--angle)) scale(1); }
        }
        @keyframes footprint-pulse {
          0%, 100% { opacity: var(--opacity); }
          50% { opacity: calc(var(--opacity) * 0.6); }
        }
      `}</style>
      {trails.map(trail => {
        const opacity = Math.max(0.15, 0.5 - trail.age * 0.15)
        return (
          <div
            key={trail.id}
            className="absolute"
            style={{
              left: `${trail.x}%`,
              top: `${trail.y}%`,
              fontSize: '10px',
              color: style.color,
              '--angle': `${trail.angle + 90}deg`,
              '--opacity': `${opacity}`,
              animation: `footprint-appear 0.5s ease-out forwards, footprint-pulse 3s ease-in-out ${0.5 + trail.age * 0.3}s infinite`,
              filter: `drop-shadow(0 0 2px ${style.color})`,
            } as React.CSSProperties}
          >
            {style.char}
          </div>
        )
      })}
      {/* Direction hint — "Fresh tracks nearby!" */}
      {trails.length > 0 && nearbyCreatures.length > 0 && nearbyCreatures[0].dist <= 4 && (
        <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(74,222,128,0.8)',
            border: '1px solid rgba(74,222,128,0.15)',
          }}>
            🐾 Fresh tracks nearby!
          </div>
        </div>
      )}
    </div>
  )
})

export default CreatureFootprints
