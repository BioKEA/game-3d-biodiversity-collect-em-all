import { useState, useEffect, useMemo, memo } from 'react'
import type { TimeOfDay } from '@/types/game'

interface Props {
  timeOfDay: TimeOfDay
  gameMinutes: number
}

interface GlowingEyes {
  id: number
  x: number
  y: number
  color: string
  size: number
  blinkSpeed: number
  delay: number
  fadeIn: number
  fadeOut: number
  duration: number
}

const EYE_COLORS = [
  '#fbbf24', // amber
  '#4ade80', // green
  '#f87171', // red
  '#c084fc', // purple
  '#38bdf8', // cyan
  '#fb923c', // orange
]

let eyeIdCounter = 0

function generateEyes(count: number): GlowingEyes[] {
  const eyes: GlowingEyes[] = []
  for (let i = 0; i < count; i++) {
    eyes.push({
      id: eyeIdCounter++,
      x: 5 + Math.random() * 90,
      y: 15 + Math.random() * 65,
      color: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)],
      size: 1.5 + Math.random() * 2,
      blinkSpeed: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      fadeIn: 0.5 + Math.random() * 1.5,
      fadeOut: 0.5 + Math.random() * 1.5,
      duration: 6 + Math.random() * 10,
    })
  }
  return eyes
}

const EyePair = memo(function EyePair({ eyes }: { eyes: GlowingEyes }) {
  const gap = eyes.size * 2.5

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${eyes.x}%`,
        top: `${eyes.y}%`,
        animation: `night-eyes-appear ${eyes.duration}s ease-in-out ${eyes.delay}s infinite`,
      }}
    >
      <div className="flex items-center" style={{ gap: `${gap}px` }}>
        <div
          className="rounded-full"
          style={{
            width: `${eyes.size}px`,
            height: `${eyes.size * 0.7}px`,
            backgroundColor: eyes.color,
            boxShadow: `0 0 ${eyes.size * 3}px ${eyes.size}px ${eyes.color}40, 0 0 ${eyes.size}px ${eyes.color}`,
            animation: `night-eyes-blink ${eyes.blinkSpeed}s ease-in-out ${eyes.delay + 1}s infinite`,
          }}
        />
        <div
          className="rounded-full"
          style={{
            width: `${eyes.size}px`,
            height: `${eyes.size * 0.7}px`,
            backgroundColor: eyes.color,
            boxShadow: `0 0 ${eyes.size * 3}px ${eyes.size}px ${eyes.color}40, 0 0 ${eyes.size}px ${eyes.color}`,
            animation: `night-eyes-blink ${eyes.blinkSpeed}s ease-in-out ${eyes.delay + 1}s infinite`,
          }}
        />
      </div>
    </div>
  )
})

const NightAtmosphere = memo(function NightAtmosphere({ timeOfDay, gameMinutes }: Props) {
  const [eyeSets, setEyeSets] = useState<GlowingEyes[]>([])

  const isNight = timeOfDay === 'night'
  const isDusk = timeOfDay === 'dusk'
  const showEyes = isNight || isDusk

  useEffect(() => {
    if (!showEyes) {
      setEyeSets([])
      return
    }
    setEyeSets(generateEyes(isNight ? 6 : 3))
    const interval = setInterval(() => {
      setEyeSets(generateEyes(isNight ? 6 : 3))
    }, 15000)
    return () => clearInterval(interval)
  }, [showEyes, isNight])

  const vignetteOpacity = useMemo(() => {
    if (isNight) {
      const nightMinutes = gameMinutes >= 1200 ? gameMinutes : gameMinutes + 1440
      const midnight = 1440
      const distFromMidnight = Math.abs(nightMinutes - midnight)
      return 0.15 + (1 - Math.min(distFromMidnight / 240, 1)) * 0.1
    }
    if (isDusk) return 0.08
    return 0
  }, [isNight, isDusk, gameMinutes])

  if (!showEyes && vignetteOpacity === 0) return null

  return (
    <>
      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 z-[7] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
          transition: 'opacity 2s ease',
        }}
      />

      {/* Glowing eyes */}
      {showEyes && (
        <div className="absolute inset-0 z-[7] pointer-events-none overflow-hidden">
          {eyeSets.map(e => (
            <EyePair key={e.id} eyes={e} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes night-eyes-blink {
          0%, 42%, 48%, 100% { transform: scaleY(1); }
          45% { transform: scaleY(0.1); }
        }
        @keyframes night-eyes-appear {
          0% { opacity: 0; }
          8% { opacity: 0.7; }
          85% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
})

export default NightAtmosphere
