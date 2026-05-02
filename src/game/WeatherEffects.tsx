import { useMemo, useState, useEffect, useCallback } from 'react'
import type { WeatherType, TimeOfDay } from '@/types/game'

interface Props {
  weather: WeatherType
  timeOfDay: TimeOfDay
}

export default function WeatherEffects({ weather, timeOfDay }: Props) {
  // Generate stable rain particle positions
  const rainDrops = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      left: `${(i * 13 + 7) % 100}%`,
      delay: `${(i * 0.11) % 1.8}s`,
      duration: `${0.35 + (i % 6) * 0.06}s`,
      opacity: 0.15 + (i % 5) * 0.08,
      height: 10 + (i % 4) * 4,
      angle: -8 + (i % 3) * 2, // slight wind angle variation
    })), [])

  // Rain splash positions (ground-level impact splashes)
  const rainSplashes = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left: `${(i * 23 + 11) % 100}%`,
      bottom: `${8 + (i % 5) * 3}%`,
      delay: `${(i * 0.19) % 2}s`,
      duration: `${0.5 + (i % 3) * 0.15}s`,
    })), [])

  const fogPatches = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      top: `${10 + i * 12}%`,
      delay: `${i * 2.5}s`,
      size: 180 + (i % 4) * 100,
      opacity: 0.12 + (i % 3) * 0.06,
      speed: 20 + i * 5,
    })), [])

  // Wind debris particles
  const windDebris = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      top: `${(i * 29 + 5) % 90}%`,
      delay: `${(i * 0.45) % 3}s`,
      duration: `${2 + (i % 4) * 0.5}s`,
      char: ['🍃', '🍂', '·', '·', '·', '·'][i % 6],
      size: i % 6 < 2 ? 12 : 3,
      wobble: (i % 3) * 15,
    })), [])

  // Shooting stars for night
  const shootingStars = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      top: `${5 + i * 12}%`,
      left: `${15 + i * 22}%`,
      delay: `${i * 8 + 3}s`,
      duration: `${0.8 + (i % 2) * 0.4}s`,
      angle: 25 + (i % 3) * 10,
      length: 50 + i * 15,
    })), [])

  // Lightning state for rain
  const [lightningFlash, setLightningFlash] = useState(false)
  const [lightningPos, setLightningPos] = useState({ x: 50, segments: [] as { x: number; y: number }[] })

  const triggerLightning = useCallback(() => {
    const x = 20 + Math.random() * 60
    const segments: { x: number; y: number }[] = []
    let curX = x
    let curY = 0
    for (let i = 0; i < 6; i++) {
      curX += (Math.random() - 0.5) * 15
      curY += 12 + Math.random() * 8
      segments.push({ x: curX, y: curY })
    }
    setLightningPos({ x, segments })
    setLightningFlash(true)
    setTimeout(() => setLightningFlash(false), 150)
    // Double flash
    setTimeout(() => setLightningFlash(true), 200)
    setTimeout(() => setLightningFlash(false), 280)
  }, [])

  // Screen shake for thunderstorm
  const [shaking, setShaking] = useState(false)

  const triggerShake = useCallback(() => {
    setShaking(true)
    setTimeout(() => setShaking(false), 300)
  }, [])

  useEffect(() => {
    if (weather !== 'rain' && weather !== 'thunderstorm') return
    const isStorm = weather === 'thunderstorm'
    const scheduleNext = () => {
      const delay = isStorm ? (1500 + Math.random() * 4000) : (4000 + Math.random() * 12000)
      return setTimeout(() => {
        triggerLightning()
        if (isStorm) triggerShake()
        timerRef = scheduleNext()
      }, delay)
    }
    let timerRef = scheduleNext()
    return () => clearTimeout(timerRef)
  }, [weather, triggerLightning, triggerShake])

  if (weather === 'clear' && timeOfDay !== 'night') return null

  const isNight = timeOfDay === 'night'
  const isStorm = weather === 'thunderstorm'
  const isRaining = weather === 'rain' || isStorm

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      style={shaking ? { animation: 'screen-shake 0.3s ease-out' } : undefined}
    >
      {/* Screen shake keyframes */}
      {isStorm && (
        <style>{`
          @keyframes screen-shake {
            0% { transform: translate(0, 0); }
            20% { transform: translate(-3px, 2px); }
            40% { transform: translate(3px, -2px); }
            60% { transform: translate(-2px, 3px); }
            80% { transform: translate(2px, -1px); }
            100% { transform: translate(0, 0); }
          }
        `}</style>
      )}
      {/* Rain effect — enhanced with angle, splashes, and puddle shimmer */}
      {isRaining && (
        <>
          <style>{`
            @keyframes rain-fall-angled {
              0% { transform: translateY(-10px) translateX(0); opacity: 0; }
              8% { opacity: 1; }
              100% { transform: translateY(100vh) translateX(-20px); opacity: 0.2; }
            }
            @keyframes rain-splash {
              0% { transform: scale(0); opacity: 0.7; }
              50% { transform: scale(1); opacity: 0.4; }
              100% { transform: scale(1.5); opacity: 0; }
            }
            @keyframes puddle-shimmer {
              0%, 100% { opacity: 0.03; transform: scaleX(1); }
              50% { opacity: 0.08; transform: scaleX(1.02); }
            }
          `}</style>
          {/* Rain drops with slight wind angle */}
          {rainDrops.map((drop, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: drop.left,
                top: '-10px',
                width: isStorm ? '1.5px' : '1px',
                height: `${drop.height * (isStorm ? 1.4 : 1)}px`,
                background: `linear-gradient(to bottom, transparent, rgba(${isNight ? '120,160,220' : '160,200,255'},${drop.opacity * (isStorm ? 1.5 : 1)}))`,
                animation: `rain-fall-angled ${parseFloat(drop.duration) * (isStorm ? 0.7 : 1)}s ${drop.delay} linear infinite`,
                transform: `rotate(${drop.angle - (isStorm ? 5 : 0)}deg)`,
              }}
            />
          ))}
          {/* Ground-level impact splashes */}
          {rainSplashes.map((splash, i) => (
            <div
              key={`splash-${i}`}
              className="absolute"
              style={{
                left: splash.left,
                bottom: splash.bottom,
                width: '6px',
                height: '2px',
                borderRadius: '50%',
                background: `rgba(${isNight ? '100,150,200' : '180,210,240'},0.3)`,
                boxShadow: `0 0 3px rgba(${isNight ? '100,150,200' : '180,210,240'},0.2)`,
                animation: `rain-splash ${splash.duration} ${splash.delay} ease-out infinite`,
              }}
            />
          ))}
          {/* Puddle shimmer on ground */}
          <div className="absolute bottom-0 left-0 right-0 h-[15%]" style={{
            background: `linear-gradient(to top, rgba(${isNight ? '30,50,90' : '60,100,160'},0.08), transparent)`,
            animation: 'puddle-shimmer 3s ease-in-out infinite',
          }} />
          {/* Rain overlay tint — deeper in storms and at night */}
          <div className="absolute inset-0" style={{
            background: isStorm
              ? (isNight ? 'rgba(10,15,35,0.30)' : 'rgba(20,30,60,0.22)')
              : (isNight ? 'rgba(15,25,50,0.18)' : 'rgba(30,50,80,0.12)'),
          }} />
          {/* Lightning flash overlay */}
          {lightningFlash && (
            <div className="absolute inset-0" style={{
              background: 'rgba(200,220,255,0.25)',
              transition: 'opacity 0.05s',
            }} />
          )}
          {/* Lightning bolt SVG */}
          {lightningFlash && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: 'blur(0.5px)' }}>
              <polyline
                points={[
                  `${lightningPos.x},0`,
                  ...lightningPos.segments.map(s => `${s.x},${s.y}`),
                ].join(' ')}
                fill="none"
                stroke="rgba(200,220,255,0.9)"
                strokeWidth="0.5"
                style={{ filter: 'drop-shadow(0 0 2px rgba(180,200,255,0.8))' }}
              />
              {/* Branch */}
              {lightningPos.segments.length > 2 && (
                <polyline
                  points={`${lightningPos.segments[1].x},${lightningPos.segments[1].y} ${lightningPos.segments[1].x + 8},${lightningPos.segments[1].y + 10}`}
                  fill="none"
                  stroke="rgba(200,220,255,0.5)"
                  strokeWidth="0.3"
                />
              )}
            </svg>
          )}
        </>
      )}

      {/* Thunderstorm extras — electric glow pulses along horizon */}
      {isStorm && (
        <>
          <style>{`
            @keyframes storm-pulse {
              0%, 100% { opacity: 0; }
              5% { opacity: 0.15; }
              10% { opacity: 0; }
              15% { opacity: 0.1; }
              20% { opacity: 0; }
            }
            @keyframes cloud-churn {
              0% { transform: translateX(0) scaleX(1); }
              50% { transform: translateX(-30px) scaleX(1.05); }
              100% { transform: translateX(0) scaleX(1); }
            }
          `}</style>
          {/* Dark churning clouds at top */}
          <div className="absolute top-0 left-0 right-0 h-[25%]" style={{
            background: 'linear-gradient(180deg, rgba(15,20,40,0.35), rgba(20,25,50,0.15), transparent)',
            animation: 'cloud-churn 8s ease-in-out infinite',
          }} />
          {/* Distant lightning glow on horizon */}
          {[0, 1, 2].map(i => (
            <div key={`glow-${i}`} className="absolute" style={{
              bottom: '10%',
              left: `${15 + i * 30}%`,
              width: '120px',
              height: '60px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,200,255,0.15), transparent)',
              animation: `storm-pulse ${3 + i * 2}s ${i * 1.5}s ease-in-out infinite`,
              filter: 'blur(15px)',
            }} />
          ))}
        </>
      )}

      {/* Fog effect — volumetric layered patches */}
      {weather === 'fog' && (
        <>
          <style>{`
            @keyframes fog-drift-layer {
              0% { transform: translateX(-40%) scaleX(1.8); opacity: 0; }
              15% { opacity: var(--fog-peak); }
              85% { opacity: var(--fog-peak); }
              100% { transform: translateX(120%) scaleX(1.8); opacity: 0; }
            }
            @keyframes fog-vertical-sway {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
          {fogPatches.map((patch, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: patch.top,
                left: '-40%',
                width: `${patch.size}px`,
                height: `${patch.size * 0.35}px`,
                background: `radial-gradient(ellipse, rgba(${isNight ? '150,160,180' : '210,220,230'},${patch.opacity}), transparent)`,
                filter: `blur(${35 + i * 5}px)`,
                animation: `fog-drift-layer ${patch.speed}s ${patch.delay} linear infinite, fog-vertical-sway ${6 + i * 2}s ease-in-out infinite`,
                '--fog-peak': `${patch.opacity}`,
              } as React.CSSProperties}
            />
          ))}
          {/* Static fog base layer */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(180deg, rgba(${isNight ? '100,110,130' : '190,200,215'},0.05) 0%, rgba(${isNight ? '100,110,130' : '190,200,215'},0.12) 60%, rgba(${isNight ? '100,110,130' : '190,200,215'},0.04) 100%)`,
          }} />
          {/* Fog visibility reduction */}
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(${isNight ? '40,50,70' : '180,195,210'},0.1) 100%)`,
          }} />
        </>
      )}

      {/* Wind — debris particles + horizontal gusts */}
      {weather === 'wind' && (
        <>
          <style>{`
            @keyframes wind-gust {
              0% { transform: translateX(-30px) translateY(0); opacity: 0; }
              15% { opacity: 0.25; }
              85% { opacity: 0.15; }
              100% { transform: translateX(100vw) translateY(calc(var(--wobble) * 1px)); opacity: 0; }
            }
            @keyframes wind-debris-tumble {
              0% { transform: translateX(-20px) translateY(0) rotate(0deg); opacity: 0; }
              10% { opacity: 0.7; }
              50% { transform: translateX(50vw) translateY(calc(var(--wobble) * -1px)) rotate(180deg); opacity: 0.5; }
              90% { opacity: 0.3; }
              100% { transform: translateX(100vw) translateY(calc(var(--wobble) * 0.5px)) rotate(360deg); opacity: 0; }
            }
          `}</style>
          {/* Horizontal gust streaks */}
          {rainDrops.slice(0, 25).map((drop, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: '-30px',
                top: drop.left,
                width: `${20 + (i % 4) * 8}px`,
                height: '1px',
                background: `rgba(200,220,240,${drop.opacity * 0.5})`,
                animation: `wind-gust ${1.5 + (i % 5) * 0.3}s ${drop.delay} linear infinite`,
                '--wobble': `${(i % 3 - 1) * 20}`,
              } as React.CSSProperties}
            />
          ))}
          {/* Flying debris — leaves, dots */}
          {windDebris.map((debris, i) => (
            <div
              key={`debris-${i}`}
              className="absolute"
              style={{
                left: '-20px',
                top: debris.top,
                fontSize: `${debris.size}px`,
                color: 'rgba(180,200,160,0.6)',
                animation: `wind-debris-tumble ${debris.duration} ${debris.delay} ease-in-out infinite`,
                '--wobble': `${debris.wobble}`,
              } as React.CSSProperties}
            >
              {debris.char}
            </div>
          ))}
        </>
      )}

      {/* Sunny — warm golden glow with lens flare + heat shimmer */}
      {weather === 'sunny' && !isNight && (
        <>
          <style>{`
            @keyframes heat-shimmer {
              0% { transform: translateX(0) scaleY(1); }
              25% { transform: translateX(2px) scaleY(1.005); }
              50% { transform: translateX(-1px) scaleY(0.998); }
              75% { transform: translateX(1px) scaleY(1.003); }
              100% { transform: translateX(0) scaleY(1); }
            }
            @keyframes sun-ray-rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 85% 8%, rgba(255,220,120,0.14) 0%, rgba(255,200,80,0.06) 30%, transparent 60%)',
          }} />
          {/* Rotating sun rays */}
          <div className="absolute" style={{
            top: '2%', right: '8%',
            width: '80px', height: '80px',
            animation: 'sun-ray-rotate 30s linear infinite',
          }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={`ray-${i}`} className="absolute" style={{
                left: '50%', top: '50%',
                width: '1px', height: '40px',
                background: 'linear-gradient(to bottom, rgba(255,220,120,0.12), transparent)',
                transformOrigin: 'top center',
                transform: `translateX(-50%) rotate(${i * 60}deg)`,
              }} />
            ))}
          </div>
          {/* Sun glare */}
          <div className="absolute" style={{
            top: '5%', right: '10%',
            width: '60px', height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,240,200,0.18) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }} />
          {/* Heat shimmer on lower portion */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] overflow-hidden">
            {[0,1,2].map(i => (
              <div key={`shimmer-${i}`} className="absolute left-0 right-0" style={{
                bottom: `${i * 10}%`,
                height: '10%',
                background: `linear-gradient(90deg, transparent, rgba(255,200,100,${0.02 + i * 0.01}), transparent, rgba(255,200,100,${0.02 + i * 0.01}), transparent)`,
                animation: `heat-shimmer ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }} />
            ))}
          </div>
          {/* Lens flare dots */}
          {[0, 1, 2].map(i => (
            <div key={`flare-${i}`} className="absolute rounded-full" style={{
              top: `${12 + i * 8}%`,
              right: `${15 - i * 3}%`,
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              background: `rgba(255,${220 - i * 30},${120 - i * 30},${0.08 - i * 0.02})`,
              filter: 'blur(1px)',
            }} />
          ))}
        </>
      )}

      {/* Night overlay — stars, shooting stars, subtle glow */}
      {isNight && weather === 'clear' && (
        <>
          <style>{`
            @keyframes star-twinkle {
              0%, 100% { opacity: var(--star-base); }
              50% { opacity: var(--star-peak); }
            }
            @keyframes shooting-star {
              0% { transform: translate(0, 0) rotate(var(--angle)); opacity: 0; width: 0; }
              5% { opacity: 1; }
              30% { opacity: 1; width: var(--length); }
              100% { transform: translate(calc(var(--length) * 2), calc(var(--length) * 1.2)) rotate(var(--angle)); opacity: 0; width: var(--length); }
            }
            @keyframes aurora-sway {
              0%, 100% { transform: translateX(0) scaleX(1); opacity: 0.03; }
              33% { transform: translateX(20px) scaleX(1.1); opacity: 0.06; }
              66% { transform: translateX(-15px) scaleX(0.95); opacity: 0.04; }
            }
          `}</style>
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(10,15,40,0.12) 0%, rgba(5,10,25,0.22) 100%)',
          }} />
          {/* Twinkling stars */}
          {Array.from({ length: 30 }, (_, i) => {
            const baseOp = 0.15 + (i % 5) * 0.08
            return (
              <div key={`star-${i}`} className="absolute rounded-full" style={{
                left: `${(i * 31 + 7) % 95}%`,
                top: `${(i * 17 + 3) % 45}%`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                background: i % 7 === 0 ? 'rgba(200,220,255,0.7)' : 'rgba(255,255,255,0.6)',
                boxShadow: i % 5 === 0 ? '0 0 3px rgba(200,220,255,0.4)' : 'none',
                animation: `star-twinkle ${2 + (i % 4) * 1.5}s ease-in-out infinite`,
                animationDelay: `${(i * 0.7) % 5}s`,
                '--star-base': `${baseOp}`,
                '--star-peak': `${baseOp + 0.3}`,
              } as React.CSSProperties} />
            )
          })}
          {/* Shooting stars — rare streaks */}
          {shootingStars.map((star, i) => (
            <div key={`shoot-${i}`} className="absolute" style={{
              top: star.top,
              left: star.left,
              height: '1px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(200,220,255,0.4), transparent)',
              animation: `shooting-star ${star.duration} ${star.delay} linear infinite`,
              '--angle': `${star.angle}deg`,
              '--length': `${star.length}px`,
            } as React.CSSProperties} />
          ))}
          {/* Subtle aurora hint near horizon */}
          <div className="absolute bottom-[15%] left-0 right-0 h-[20%]" style={{
            background: 'linear-gradient(180deg, transparent, rgba(80,200,160,0.02), rgba(100,150,220,0.02), transparent)',
            animation: 'aurora-sway 15s ease-in-out infinite',
            filter: 'blur(20px)',
          }} />
        </>
      )}
    </div>
  )
}
