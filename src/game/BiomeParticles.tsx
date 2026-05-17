import { useMemo } from 'react'
import type { BiomeType, TimeOfDay, WeatherType } from '@/types/game'

interface Props {
  biome: BiomeType
  timeOfDay: TimeOfDay
  weather: WeatherType
}

interface Particle {
  kind: 'bubble' | 'droplet' | 'dust' | 'firefly' | 'leaf' | 'reed' | 'wind'
  x: number
  y: number
  delay: number
  duration: number
  size: number
}

function getParticles(biome: BiomeType, timeOfDay: TimeOfDay, weather: WeatherType): { particles: Particle[]; animation: string } {
  // Night fireflies everywhere
  if (timeOfDay === 'night' && weather === 'clear') {
    return {
      animation: 'firefly',
      particles: Array.from({ length: 15 }, (_, i) => ({
        kind: 'firefly',
        x: (i * 23 + 7) % 100,
        y: (i * 31 + 11) % 80 + 10,
        delay: (i * 0.7) % 4,
        duration: 3 + (i % 3),
        size: 3 + (i % 2) * 2,
      })),
    }
  }

  switch (biome) {
    case 'forest':
      return {
        animation: 'leaf-fall',
        particles: Array.from({ length: 8 }, (_, i) => ({
          kind: i % 3 === 2 ? 'reed' : 'leaf',
          x: (i * 29 + 5) % 100,
          y: -5,
          delay: i * 1.5,
          duration: 6 + (i % 3) * 2,
          size: 10 + (i % 3) * 4,
        })),
      }

    case 'beach':
    case 'marsh':
      return {
        animation: 'float-up',
        particles: Array.from({ length: 6 }, (_, i) => ({
          kind: biome === 'beach' ? 'bubble' : 'droplet',
          x: (i * 31 + 10) % 90 + 5,
          y: 90,
          delay: i * 2,
          duration: 5 + (i % 3) * 2,
          size: 8 + (i % 3) * 3,
        })),
      }

    case 'mountain':
      return {
        animation: 'wind-drift',
        particles: Array.from({ length: 5 }, (_, i) => ({
          kind: 'wind',
          x: -10,
          y: (i * 19 + 15) % 70 + 10,
          delay: i * 2.5,
          duration: 8 + (i % 3) * 3,
          size: 4,
        })),
      }

    default:
      if (weather === 'sunny' && timeOfDay === 'day') {
        return {
          animation: 'dust-mote',
          particles: Array.from({ length: 6 }, (_, i) => ({
            kind: 'dust',
            x: (i * 27 + 8) % 90 + 5,
            y: (i * 19 + 20) % 60 + 20,
            delay: i * 1.3,
            duration: 4 + (i % 3) * 2,
            size: 2 + (i % 2),
          })),
        }
      }
      return { animation: '', particles: [] }
  }
}

export default function BiomeParticles({ biome, timeOfDay, weather }: Props) {
  const { particles, animation } = useMemo(
    () => getParticles(biome, timeOfDay, weather),
    [biome, timeOfDay, weather],
  )

  if (particles.length === 0) return null

  function ParticleSprite({ particle }: { particle: Particle }) {
    const px = particle.size
    if (particle.kind === 'leaf') {
      return (
        <span
          className="absolute block"
          style={{
            width: px,
            height: Math.max(2, px * 0.55),
            background: 'linear-gradient(135deg, #b7f06a 0%, #55a64f 55%, #275f35 100%)',
            borderRadius: '55% 0 55% 0',
            boxShadow: '1px 1px 0 rgba(8,30,18,0.7)',
            transform: 'rotate(-24deg)',
          }}
        />
      )
    }
    if (particle.kind === 'reed') {
      return (
        <span className="absolute block" style={{ width: px, height: px }}>
          <span className="absolute" style={{ left: px * 0.45, top: 0, width: Math.max(1, px * 0.12), height: px, background: '#7fbf5d' }} />
          <span className="absolute" style={{ left: px * 0.18, top: px * 0.18, width: px * 0.45, height: Math.max(2, px * 0.16), background: '#b8d66a', transform: 'rotate(-34deg)' }} />
          <span className="absolute" style={{ right: px * 0.08, top: px * 0.35, width: px * 0.42, height: Math.max(2, px * 0.16), background: '#4c8f48', transform: 'rotate(28deg)' }} />
        </span>
      )
    }
    if (particle.kind === 'bubble') {
      return (
        <span
          className="absolute block rounded-full"
          style={{
            width: px,
            height: px,
            border: `${Math.max(1, Math.round(px * 0.12))}px solid rgba(180,245,255,0.72)`,
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.45), 0 0 6px rgba(80,220,255,0.28)',
          }}
        />
      )
    }
    if (particle.kind === 'droplet') {
      return (
        <span
          className="absolute block"
          style={{
            width: px * 0.72,
            height: px,
            background: 'linear-gradient(180deg, #b6f5ff, #38bdf8 56%, #0f6f94)',
            clipPath: 'polygon(50% 0, 84% 45%, 64% 100%, 28% 100%, 10% 45%)',
            boxShadow: '0 0 6px rgba(56,189,248,0.35)',
          }}
        />
      )
    }
    if (particle.kind === 'wind') {
      return (
        <span
          className="absolute block"
          style={{
            width: px * 8,
            height: Math.max(2, px * 0.65),
            background: 'linear-gradient(90deg, transparent, rgba(220,240,255,0.62), transparent)',
            boxShadow: `0 ${px * 1.4}px 0 rgba(180,210,235,0.18)`,
          }}
        />
      )
    }
    return (
      <span
        className="absolute block rounded-full"
        style={{
          width: px,
          height: px,
          background: particle.kind === 'firefly'
            ? 'radial-gradient(circle, rgba(250,240,100,0.95), rgba(175,230,70,0.35))'
            : 'rgba(255,255,255,0.34)',
          boxShadow: particle.kind === 'firefly'
            ? '0 0 6px rgba(250,240,100,0.6), 0 0 12px rgba(200,230,50,0.3)'
            : 'none',
        }}
      />
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-[8] overflow-hidden">
      <style>{`
        @keyframes firefly-anim {
          0%, 100% { opacity: 0; transform: translate(0, 0); }
          20% { opacity: 0.8; }
          50% { opacity: 1; transform: translate(15px, -10px); }
          80% { opacity: 0.6; transform: translate(-10px, 5px); }
        }
        @keyframes leaf-fall-anim {
          0% { opacity: 0; transform: translateY(0) translateX(0) rotate(0deg); }
          10% { opacity: 0.7; }
          50% { transform: translateY(50vh) translateX(30px) rotate(180deg); }
          90% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(100vh) translateX(-10px) rotate(360deg); }
        }
        @keyframes float-up-anim {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 0.6; transform: translateY(-10vh) scale(1); }
          80% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-70vh) scale(0.3); }
        }
        @keyframes wind-drift-anim {
          0% { opacity: 0; transform: translateX(0) translateY(0); }
          20% { opacity: 0.3; }
          80% { opacity: 0.2; }
          100% { opacity: 0; transform: translateX(110vw) translateY(-20px); }
        }
        @keyframes dust-mote-anim {
          0%, 100% { opacity: 0; }
          30% { opacity: 0.4; transform: translate(5px, -3px); }
          60% { opacity: 0.3; transform: translate(-3px, 5px); }
          90% { opacity: 0.1; }
        }
      `}</style>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animation: `${animation}-anim ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: 0,
          }}
        >
          <ParticleSprite particle={p} />
        </div>
      ))}
    </div>
  )
}
