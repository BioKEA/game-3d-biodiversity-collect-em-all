import { useState, useEffect } from 'react'
import type { Creature, BiomeType, TimeOfDay } from '@/types/game'

interface Props {
  creature: Creature
  biome: BiomeType
  timeOfDay: TimeOfDay
  onComplete: () => void
}

const BIOME_FLASH: Record<BiomeType, string> = {
  forest: '#22c55e',
  marsh: '#84cc16',
  beach: '#eab308',
  rocky_beach: '#a8a29e',
  urban: '#6b7280',
  water: '#38bdf8',
  mountain: '#78716c',
  grassland: '#4ade80',
  redwood: '#166534',
  tidepool: '#67e8f9',
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

const TYPE_LABEL: Record<string, string> = {
  beast: 'Beast',
  bird: 'Bird',
  insect: 'Insect',
  marine: 'Marine',
  amphibian: 'Amphibian',
  mystic: 'Mystic',
  reptile: 'Reptile',
  plant: 'Plant',
}

export default function EncounterTransition({ creature, biome, timeOfDay, onComplete }: Props) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'text' | 'done'>('flash')

  const isRare = creature.rarity === 'rare' || creature.rarity === 'legendary'
  const isLegendary = creature.rarity === 'legendary'
  const rareAccent: string = isLegendary ? '#c084fc' : isRare ? '#fbbf24' : '#ffffff'
  const extendedTiming = isRare ? 600 : 0

  useEffect(() => {
    // Rare encounters get a longer pre-reveal so the aura has time to build.
    const t1 = setTimeout(() => setPhase('reveal'), 400 + extendedTiming)
    const t2 = setTimeout(() => setPhase('text'), 1000 + extendedTiming)
    const t3 = setTimeout(() => setPhase('done'), 2200 + extendedTiming)
    const t4 = setTimeout(onComplete, 2400 + extendedTiming)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete, extendedTiming])

  const flashColor = rareAccent || BIOME_FLASH[biome] || '#ffffff'
  const isNight = timeOfDay === 'night'
  const bgBase = isNight ? '#060a14' : timeOfDay === 'dusk' ? '#1a1020' : '#0e1a2e'
  const sparkleCount = isLegendary ? 16 : isRare ? 12 : 6

  return (
    <div className="absolute inset-0 z-[60] overflow-hidden" style={{ background: bgBase }}>
      {/* Diagonal slash lines — the classic encounter effect */}
      <div
        className="absolute inset-0"
        style={{
          opacity: phase === 'flash' ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: 0,
              left: `${i * 14 - 10}%`,
              width: '12%',
              height: '100%',
              background: `linear-gradient(135deg, transparent 0%, ${flashColor} 40%, white 50%, ${flashColor} 60%, transparent 100%)`,
              opacity: 0.8,
              animation: `encounter-slash 0.4s ease-out ${i * 0.03}s both`,
              transform: 'skewX(-15deg)',
            }}
          />
        ))}
      </div>

      {/* Screen flash */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${flashColor}40 0%, transparent 70%)`,
          opacity: phase === 'flash' ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      />

      {/* Creature reveal */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: phase === 'flash' ? 0 : 1,
          transition: 'opacity 0.4s ease-in',
        }}
      >
        {/* Radial glow behind creature */}
        <div
          className="absolute"
          style={{
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: isRare
              ? `radial-gradient(circle, ${rareAccent}35 0%, ${rareAccent}15 40%, ${creature.color}08 60%, transparent 75%)`
              : `radial-gradient(circle, ${creature.color}25 0%, ${creature.color}08 50%, transparent 70%)`,
            opacity: phase === 'reveal' || phase === 'text' ? 1 : 0,
            transition: 'opacity 0.5s ease-in',
            animation: phase !== 'flash' ? 'encounter-glow-pulse 2s ease-in-out infinite' : undefined,
          }}
        />

        {/* Rotating rarity aura rings — rare & legendary only */}
        {isRare && (phase === 'reveal' || phase === 'text' || phase === 'flash') && (
          <>
            <div
              className="absolute"
              style={{
                width: 340,
                height: 340,
                borderRadius: '50%',
                border: `2px solid ${rareAccent}60`,
                boxShadow: `0 0 40px ${rareAccent}50, inset 0 0 30px ${rareAccent}30`,
                animation: 'encounter-rare-ring 3s linear infinite',
                opacity: 0.7,
              }}
            />
            <div
              className="absolute"
              style={{
                width: 400,
                height: 400,
                borderRadius: '50%',
                border: `1px dashed ${rareAccent}40`,
                animation: 'encounter-rare-ring-reverse 5s linear infinite',
                opacity: 0.5,
              }}
            />
          </>
        )}

        {/* Sea otter special: swaying kelp fronds behind the creature */}
        {creature.id === 'southern-sea-otter' && (phase === 'reveal' || phase === 'text') && (
          <>
            {Array.from({ length: 7 }).map((_, i) => {
              const angle = -60 + i * 20 // fan out -60deg to +60deg from vertical
              const len = 140 + (i % 2) * 20
              const delay = i * 0.18
              return (
                <div
                  key={`kelp-${i}`}
                  className="absolute"
                  style={{
                    width: 8,
                    height: len,
                    left: '50%',
                    top: '50%',
                    marginLeft: -4,
                    marginTop: -len + 20,
                    transformOrigin: '50% 100%',
                    background: 'linear-gradient(180deg, rgba(15,118,110,0) 0%, rgba(16,185,129,0.25) 20%, rgba(4,120,87,0.5) 60%, rgba(6,78,59,0.7) 100%)',
                    borderRadius: 8,
                    filter: 'blur(0.6px) drop-shadow(0 0 6px rgba(16,185,129,0.35))',
                    animation: `otter-kelp-sway 4.5s ease-in-out ${delay}s infinite`,
                    ['--a' as string]: `${angle}deg`,
                    opacity: 0.8,
                  } as React.CSSProperties}
                />
              )
            })}
            {/* Kelp bulbs — little floats at the top of each frond */}
            {Array.from({ length: 7 }).map((_, i) => {
              const angle = -60 + i * 20
              const len = 140 + (i % 2) * 20
              const rad = (angle * Math.PI) / 180
              const bx = Math.sin(rad) * (len - 20)
              const by = -Math.cos(rad) * (len - 20) + 20
              return (
                <div
                  key={`bulb-${i}`}
                  className="absolute"
                  style={{
                    width: 10,
                    height: 10,
                    left: `calc(50% + ${bx}px - 5px)`,
                    top: `calc(50% + ${by}px - 5px)`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #fbbf24, #b45309 70%, #78350f)',
                    boxShadow: '0 0 10px rgba(251,191,36,0.5)',
                    animation: `otter-kelp-bulb 4.5s ease-in-out ${i * 0.18}s infinite`,
                    opacity: 0.85,
                  }}
                />
              )
            })}
            {/* Rippling water rings below the otter */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`ripple-${i}`}
                className="absolute"
                style={{
                  width: 140,
                  height: 30,
                  left: '50%',
                  top: '50%',
                  marginLeft: -70,
                  marginTop: 40,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(103,232,249,0.45)',
                  animation: `otter-ripple 2.4s ease-out ${i * 0.7}s infinite`,
                }}
              />
            ))}
            {/* Drifting bubbles */}
            {Array.from({ length: 10 }).map((_, i) => {
              const offX = (i - 5) * 22 + ((i % 3) - 1) * 10
              const size = 3 + (i % 3) * 2
              return (
                <div
                  key={`bubble-${i}`}
                  className="absolute"
                  style={{
                    width: size,
                    height: size,
                    left: `calc(50% + ${offX}px)`,
                    top: '50%',
                    marginTop: 50,
                    borderRadius: '50%',
                    background: 'rgba(186,230,253,0.6)',
                    boxShadow: 'inset -1px -1px 2px rgba(14,116,144,0.4), 0 0 4px rgba(125,211,252,0.5)',
                    animation: `otter-bubble 3s ease-in ${i * 0.25}s infinite`,
                  }}
                />
              )
            })}
          </>
        )}

        {/* Radiating light rays for legendary encounters */}
        {isLegendary && (phase === 'reveal' || phase === 'text') && (
          <div
            className="absolute"
            style={{
              width: 600,
              height: 600,
              background: `conic-gradient(from 0deg, transparent 0deg, ${rareAccent}30 20deg, transparent 40deg, transparent 80deg, ${rareAccent}20 100deg, transparent 120deg, transparent 160deg, ${rareAccent}30 180deg, transparent 200deg, transparent 240deg, ${rareAccent}20 260deg, transparent 280deg, transparent 320deg, ${rareAccent}30 340deg, transparent 360deg)`,
              animation: 'encounter-rays-spin 8s linear infinite',
              opacity: 0.6,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Creature sprite */}
        <div
          className="relative flex flex-col items-center"
          style={{
            transform: phase === 'reveal' || phase === 'text' ? 'scale(1) translateY(0)' : 'scale(0.3) translateY(40px)',
            opacity: phase === 'reveal' || phase === 'text' ? 1 : 0,
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Sprite with bounce */}
          <div
            className="text-8xl"
            style={{
              filter: `drop-shadow(0 0 20px ${creature.color}60)`,
              animation: phase === 'reveal' || phase === 'text' ? 'encounter-creature-bounce 0.6s ease-out' : undefined,
            }}
          >
            {creature.sprite}
          </div>

          {/* Sparkle particles around creature */}
          {(phase === 'reveal' || phase === 'text') && (
            <>
              {Array.from({ length: sparkleCount }).map((_, i) => {
                const angle = (i / sparkleCount) * Math.PI * 2
                const dist = 60 + Math.random() * (isRare ? 60 : 30)
                const size = isRare ? 5 + Math.random() * 3 : 4
                const color = creature.isFantasy || isLegendary ? '#c084fc' : isRare ? '#fbbf24' : flashColor
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: isRare ? `0 0 8px ${color}` : 'none',
                      left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                      top: `calc(50% + ${Math.sin(angle) * dist - 20}px)`,
                      animation: isRare
                        ? `encounter-sparkle-rare ${1.2 + Math.random() * 0.6}s ease-out ${0.1 + i * 0.05}s infinite`
                        : `encounter-sparkle 0.8s ease-out ${0.1 + i * 0.08}s both`,
                    }}
                  />
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Text overlay */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-[25%]"
        style={{
          opacity: phase === 'text' ? 1 : 0,
          transform: phase === 'text' ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.4s ease-out',
        }}
      >
        {isRare && (
          <div
            className="mb-2 px-4 py-1 rounded-full font-black tracking-[0.25em] uppercase text-xs"
            style={{
              background: `linear-gradient(135deg, ${rareAccent}25, ${rareAccent}10)`,
              border: `1.5px solid ${rareAccent}80`,
              color: rareAccent,
              textShadow: `0 0 12px ${rareAccent}`,
              boxShadow: `0 0 24px ${rareAccent}60, inset 0 0 12px ${rareAccent}20`,
              animation: 'encounter-rare-banner 1.2s ease-in-out infinite',
            }}
          >
            {isLegendary ? '✦ Legendary Encounter ✦' : '✨ Rare Find ✨'}
          </div>
        )}
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-2">
          {creature.isFantasy
            ? (isNight ? 'Something stirs in the darkness' : 'A mysterious creature appeared')
            : isNight
              ? (creature.type === 'bird' ? 'A nocturnal call pierces the dark'
                : creature.type === 'beast' ? 'Eyes gleam in the moonlight'
                : creature.type === 'insect' ? 'Wings flutter in the dark'
                : creature.type === 'amphibian' ? 'A splash breaks the silence'
                : 'Night encounter')
              : timeOfDay === 'dawn'
                ? (creature.type === 'bird' ? 'A dawn chorus rings out'
                  : 'Something stirs at first light')
                : timeOfDay === 'dusk'
                  ? (creature.type === 'bird' ? 'A silhouette against the sunset'
                    : 'Movement in the fading light')
                  : 'Wild encounter'}
        </p>
        <h2
          className="text-3xl font-bold tracking-wide"
          style={{
            color: creature.isFantasy ? '#c084fc' : '#ffffff',
            textShadow: `0 0 20px ${creature.color}60, 0 2px 10px rgba(0,0,0,0.5)`,
          }}
        >
          {creature.name}
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{
              background: `${creature.color}20`,
              color: creature.color,
              border: `1px solid ${creature.color}40`,
            }}
          >
            {TYPE_LABEL[creature.type] || creature.type}
          </span>
          <span className="text-white/30 text-xs">
            {creature.rarity === 'legendary' ? '★★★' : creature.rarity === 'rare' ? '★★' : creature.rarity === 'uncommon' ? '★' : ''}
          </span>
        </div>
      </div>

      {/* Fade to black at the end */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: phase === 'done' ? 1 : 0,
          transition: 'opacity 0.2s ease-in',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes encounter-slash {
          from { transform: skewX(-15deg) translateY(-100%); opacity: 0; }
          50% { opacity: 0.9; }
          to { transform: skewX(-15deg) translateY(100%); opacity: 0; }
        }
        @keyframes encounter-creature-bounce {
          0% { transform: scale(0.2) translateY(30px); opacity: 0; }
          50% { transform: scale(1.15) translateY(-10px); opacity: 1; }
          70% { transform: scale(0.95) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes encounter-sparkle {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes encounter-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes encounter-rare-ring {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes encounter-rare-ring-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes encounter-rays-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes encounter-sparkle-rare {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          20% { transform: scale(1.4) rotate(90deg); opacity: 1; }
          60% { transform: scale(1) rotate(180deg); opacity: 0.9; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes encounter-rare-banner {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.3); }
        }
        @keyframes otter-kelp-sway {
          0%, 100% { transform: rotate(var(--a, 0deg)) translateY(0); }
          50% { transform: rotate(calc(var(--a, 0deg) + 8deg)) translateY(-4px); }
        }
        @keyframes otter-kelp-bulb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(4px, -6px); }
        }
        @keyframes otter-ripple {
          0% { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes otter-bubble {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: translateY(-140px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
