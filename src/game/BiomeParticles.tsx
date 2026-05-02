import { useMemo } from 'react'
import type { BiomeType, TimeOfDay, WeatherType } from '@/types/game'

interface Props {
  biome: BiomeType
  timeOfDay: TimeOfDay
  weather: WeatherType
}

interface Particle {
  emoji: string
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
        emoji: '',
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
          emoji: ['🍃', '🍂', '🌿'][i % 3],
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
          emoji: biome === 'beach' ? '🫧' : '💧',
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
          emoji: '',
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
            emoji: '',
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
          {p.emoji || (
            <div
              className="rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: animation === 'firefly'
                  ? 'radial-gradient(circle, rgba(250,240,100,0.9), rgba(200,230,50,0.3))'
                  : animation === 'wind-drift'
                  ? 'rgba(200,220,240,0.4)'
                  : 'rgba(255,255,255,0.3)',
                boxShadow: animation === 'firefly'
                  ? '0 0 6px rgba(250,240,100,0.6), 0 0 12px rgba(200,230,50,0.3)'
                  : 'none',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
