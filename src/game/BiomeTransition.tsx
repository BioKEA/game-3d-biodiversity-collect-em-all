import { useEffect, useState, useRef } from 'react'
import type { BiomeType } from '@/types/game'

interface Props {
  biome: BiomeType
}

const BIOME_COLORS: Record<string, string> = {
  grassland: 'rgba(34,197,94,0.15)',
  forest: 'rgba(22,163,74,0.18)',
  wetland: 'rgba(14,116,144,0.15)',
  urban: 'rgba(148,163,184,0.12)',
  coastal: 'rgba(56,189,248,0.12)',
  chaparral: 'rgba(234,179,8,0.12)',
  'oak-woodland': 'rgba(101,163,13,0.15)',
  'kelp-forest': 'rgba(6,182,212,0.15)',
  tidepool: 'rgba(59,130,246,0.12)',
  'rocky-beach': 'rgba(120,113,108,0.12)',
  mountain: 'rgba(148,163,184,0.15)',
  redwood: 'rgba(21,128,61,0.18)',
  marsh: 'rgba(22,163,74,0.12)',
  bay: 'rgba(37,99,235,0.12)',
}

const BIOME_LABELS: Record<string, string> = {
  grassland: '🌾 Grassland',
  forest: '🌲 Forest',
  wetland: '🌿 Wetland',
  urban: '🏙️ Urban',
  coastal: '🏖️ Coastline',
  chaparral: '☀️ Chaparral',
  'oak-woodland': '🌳 Oak Woodland',
  'kelp-forest': '🌊 Kelp Forest',
  tidepool: '🦀 Tidepool',
  'rocky-beach': '🪨 Rocky Beach',
  mountain: '⛰️ Mountain',
  redwood: '🌲 Redwood Grove',
  marsh: '🌿 Salt Marsh',
  bay: '🌊 Bay Waters',
}

export default function BiomeTransition({ biome }: Props) {
  const [transitioning, setTransitioning] = useState(false)
  const [displayBiome, setDisplayBiome] = useState(biome)
  const prevBiomeRef = useRef(biome)

  useEffect(() => {
    if (biome !== prevBiomeRef.current) {
      prevBiomeRef.current = biome
      setDisplayBiome(biome)
      setTransitioning(true)
      const timer = setTimeout(() => setTransitioning(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [biome])

  if (!transitioning) return null

  const color = BIOME_COLORS[displayBiome] || 'rgba(255,255,255,0.08)'
  const label = BIOME_LABELS[displayBiome] || displayBiome

  return (
    <div className="absolute inset-0 pointer-events-none z-[8] overflow-hidden">
      <style>{`
        @keyframes biome-fade {
          0% { opacity: 1; }
          40% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes biome-sweep {
          0% { transform: translateX(-100%); }
          30% { transform: translateX(0); }
          70% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes biome-label-in {
          0% { opacity: 0; transform: translateY(6px); }
          20% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
      {/* Color sweep across screen */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation: 'biome-sweep 1.2s ease-in-out forwards',
      }} />
      {/* Soft edge vignette */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`,
        animation: 'biome-fade 1.2s ease-out forwards',
      }} />
      {/* Biome name label */}
      <div className="absolute top-[38%] left-0 right-0 flex justify-center">
        <div className="px-4 py-1.5 rounded-lg" style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'biome-label-in 1.2s ease-out forwards',
        }}>
          <span className="text-white/80 text-xs font-medium tracking-wide">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}
