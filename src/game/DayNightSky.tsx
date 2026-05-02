import { useMemo } from 'react'

interface Props {
  gameMinutes: number
  gameDay?: number
}

/**
 * Smooth atmospheric sky overlay driven by the continuous in-game clock (0-1440).
 * Renders a top-of-screen gradient band that interpolates between color keyframes,
 * plus a sun or moon that arcs across the sky based on the current time, plus
 * stars that fade in at dusk and out at dawn.
 *
 * Sits above the isometric canvas (z-[6]) but below weather and foreground
 * particles so rain/fog read in front of the sky.
 */

type Stop = {
  t: number
  top: [number, number, number]
  mid: [number, number, number]
  bot: [number, number, number]
}

// Keyframes span a full 24h cycle. Interpolation is linear between stops.
const SKY_KEYFRAMES: Stop[] = [
  { t: 0,    top: [6, 10, 30],    mid: [15, 20, 45],    bot: [20, 25, 55] },     // midnight
  { t: 240,  top: [8, 12, 38],    mid: [22, 28, 58],    bot: [30, 35, 72] },     // 4am late night
  { t: 300,  top: [30, 22, 60],   mid: [80, 45, 85],    bot: [155, 85, 100] },   // 5am dawn ignition
  { t: 345,  top: [70, 40, 95],   mid: [180, 90, 100],  bot: [240, 155, 110] },  // 5:45 civil dawn
  { t: 375,  top: [110, 70, 130], mid: [230, 130, 100], bot: [255, 190, 125] },  // 6:15 sunrise peak
  { t: 420,  top: [140, 180, 225],mid: [200, 215, 240], bot: [240, 220, 195] },  // 7am soft morning
  { t: 540,  top: [105, 165, 230],mid: [150, 200, 240], bot: [200, 225, 245] },  // 9am clear
  { t: 720,  top: [90, 150, 225], mid: [135, 190, 240], bot: [190, 220, 245] },  // noon
  { t: 900,  top: [95, 150, 220], mid: [150, 190, 235], bot: [215, 215, 225] },  // 3pm
  { t: 1020, top: [130, 95, 155], mid: [240, 150, 95],  bot: [255, 200, 120] },  // 5pm golden hour
  { t: 1065, top: [95, 55, 125],  mid: [240, 110, 80],  bot: [255, 165, 80] },   // 5:45 dusk deepens
  { t: 1095, top: [55, 30, 100],  mid: [180, 65, 90],   bot: [235, 125, 75] },   // 6:15 sunset peak
  { t: 1140, top: [22, 18, 75],   mid: [70, 35, 95],    bot: [140, 60, 90] },    // 7pm blue hour
  { t: 1200, top: [10, 14, 48],   mid: [22, 28, 68],    bot: [38, 35, 82] },     // 8pm early night
  { t: 1320, top: [6, 10, 32],    mid: [16, 20, 48],    bot: [22, 25, 58] },     // 10pm deep night
  { t: 1440, top: [6, 10, 30],    mid: [15, 20, 45],    bot: [20, 25, 55] },     // wrap to midnight
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
}

function sampleSky(m: number): { top: [number, number, number]; mid: [number, number, number]; bot: [number, number, number] } {
  const t = ((m % 1440) + 1440) % 1440
  let a = SKY_KEYFRAMES[0]
  let b = SKY_KEYFRAMES[SKY_KEYFRAMES.length - 1]
  for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
    if (t >= SKY_KEYFRAMES[i].t && t < SKY_KEYFRAMES[i + 1].t) {
      a = SKY_KEYFRAMES[i]
      b = SKY_KEYFRAMES[i + 1]
      break
    }
  }
  const span = b.t - a.t
  const u = span > 0 ? (t - a.t) / span : 0
  return {
    top: lerpColor(a.top, b.top, u),
    mid: lerpColor(a.mid, b.mid, u),
    bot: lerpColor(a.bot, b.bot, u),
  }
}

function rgb([r, g, b]: [number, number, number], alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`
}

// Stable starfield — positions seeded by index so the sky doesn't rearrange on re-render.
const STARS = Array.from({ length: 60 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${((i * 53) % 55)}%`,
  size: 0.8 + ((i * 3) % 5) * 0.4,
  twinkleDelay: `${(i * 0.37) % 4}s`,
  twinkleDuration: `${2.5 + (i % 4) * 0.6}s`,
  brightness: 0.45 + ((i * 7) % 10) * 0.055,
}))

export default function DayNightSky({ gameMinutes, gameDay = 75 }: Props) {
  const sky = useMemo(() => {
    const colors = sampleSky(gameMinutes)
    const m = ((gameMinutes % 1440) + 1440) % 1440

    // Sun arcs from 5:30 (330) to 18:30 (1110)
    const sunRise = 330
    const sunSet = 1110
    const inDay = m >= sunRise && m <= sunSet

    let sunProgress = 0
    if (inDay) sunProgress = (m - sunRise) / (sunSet - sunRise)

    // Moon progress — arcs from 19:00 through midnight to 5:00
    // Night window: 1140 -> 300 (next day), 600 minutes long
    const moonRise = 1140
    const moonSet = 300
    const moonWindow = 1440 - moonRise + moonSet // 600
    let moonProgress = 0
    let moonVisible = false
    if (m >= moonRise) {
      moonProgress = (m - moonRise) / moonWindow
      moonVisible = true
    } else if (m < moonSet) {
      moonProgress = (m + (1440 - moonRise)) / moonWindow
      moonVisible = true
    }

    // Sine arc — peak at 0.5
    const sunY = inDay ? Math.sin(sunProgress * Math.PI) : 0
    const moonY = moonVisible ? Math.sin(moonProgress * Math.PI) : 0

    // Star alpha: invisible 7am-5pm, fade in during dusk, fade out during dawn
    let starAlpha = 0
    if (m < 300) starAlpha = 1
    else if (m < 420) starAlpha = 1 - (m - 300) / 120  // fade out 5-7am
    else if (m < 1020) starAlpha = 0                    // day
    else if (m < 1140) starAlpha = (m - 1020) / 120     // fade in 5-7pm
    else starAlpha = 1                                   // night

    // Horizon glow intensity — peaks during sunrise/sunset
    // Peaks at 6am and 6pm, fades out over ~90 minutes each side
    let horizonGlow = 0
    const distToSunrise = Math.min(Math.abs(m - 360), Math.abs(m - 360 + 1440), Math.abs(m - 360 - 1440))
    const distToSunset = Math.min(Math.abs(m - 1080), Math.abs(m - 1080 + 1440), Math.abs(m - 1080 - 1440))
    const minDist = Math.min(distToSunrise, distToSunset)
    if (minDist < 90) horizonGlow = 1 - minDist / 90
    const isSunriseGlow = distToSunrise < distToSunset

    return {
      colors,
      sun: { visible: inDay, x: sunProgress, y: sunY },
      moon: { visible: moonVisible, x: moonProgress, y: moonY },
      starAlpha,
      horizonGlow,
      isSunriseGlow,
    }
  }, [gameMinutes])

  const { colors, sun, moon, starAlpha, horizonGlow, isSunriseGlow } = sky

  return (
    <div className="absolute inset-0 pointer-events-none z-[6] overflow-hidden">
      <style>{`
        @keyframes sky-twinkle {
          0%, 100% { opacity: var(--base); transform: scale(1); }
          50% { opacity: calc(var(--base) * 0.35); transform: scale(0.85); }
        }
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.08); }
        }
        @keyframes moon-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(200,210,240,0.35), 0 0 130px rgba(150,170,220,0.18); }
          50% { box-shadow: 0 0 75px rgba(215,225,250,0.42), 0 0 150px rgba(165,185,230,0.22); }
        }
      `}</style>

      {/* Sky gradient band occupying the upper portion of the viewport */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: '62%',
          background: `linear-gradient(to bottom,
            ${rgb(colors.top, 0.5)} 0%,
            ${rgb(colors.mid, 0.38)} 42%,
            ${rgb(colors.bot, 0.22)} 72%,
            transparent 100%)`,
          transition: 'background 2s ease-out',
          mixBlendMode: 'screen',
        }}
      />

      {/* Horizon sunrise/sunset glow */}
      {horizonGlow > 0 && (
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '62%',
            background: isSunriseGlow
              ? `radial-gradient(ellipse 70% 45% at ${sun.x * 100}% 80%, rgba(255,160,80,${horizonGlow * 0.35}) 0%, rgba(255,100,120,${horizonGlow * 0.2}) 40%, transparent 70%)`
              : `radial-gradient(ellipse 70% 45% at ${sun.x * 100}% 80%, rgba(255,120,70,${horizonGlow * 0.35}) 0%, rgba(200,60,110,${horizonGlow * 0.22}) 40%, transparent 70%)`,
            mixBlendMode: 'screen',
            transition: 'background 2s ease-out',
          }}
        />
      )}

      {/* Stars — visible at dusk/night/dawn */}
      {starAlpha > 0.01 && (
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '55%',
            opacity: starAlpha,
            transition: 'opacity 2s ease-out',
          }}
        >
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                '--base': s.brightness,
                opacity: s.brightness,
                animation: `sky-twinkle ${s.twinkleDuration} ease-in-out infinite`,
                animationDelay: s.twinkleDelay,
                boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,${s.brightness * 0.6})`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Sun */}
      {sun.visible && (
        <div
          className="absolute"
          style={{
            width: 70,
            height: 70,
            left: `calc(${sun.x * 100}% - 35px)`,
            top: `calc(${(1 - sun.y) * 45 + 4}% - 35px)`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,248,210,0.98) 0%, rgba(255,225,140,0.82) 30%, rgba(255,180,80,0.38) 60%, transparent 85%)',
            boxShadow: '0 0 90px rgba(255,225,140,0.55), 0 0 180px rgba(255,180,80,0.28), 0 0 280px rgba(255,140,50,0.14)',
            animation: 'sun-pulse 6s ease-in-out infinite',
            transition: 'left 1.8s linear, top 1.8s linear',
          }}
        />
      )}

      {/* Moon — phase-aware */}
      {moon.visible && (() => {
        const dayInCycle = ((gameDay % 30) + 30) % 30
        const phase = dayInCycle / 30
        const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
        const isWaxing = phase <= 0.5
        const shadowX = isWaxing ? (1 - illumination) * 100 : illumination * -100
        const shadowDir = isWaxing ? 'right' : 'left'
        const isNewMoon = illumination < 0.08
        const moonBrightness = isNewMoon ? 0.15 : 0.5 + illumination * 0.5

        return (
          <div
            className="absolute"
            style={{
              width: 50,
              height: 50,
              left: `calc(${moon.x * 100}% - 25px)`,
              top: `calc(${(1 - moon.y) * 45 + 4}% - 25px)`,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, rgba(248,248,255,${moonBrightness}) 0%, rgba(225,228,245,${moonBrightness * 0.9}) 45%, rgba(175,185,220,${moonBrightness * 0.55}) 78%, transparent 100%)`,
              animation: 'moon-glow 5s ease-in-out infinite',
              transition: 'left 1.8s linear, top 1.8s linear',
              overflow: 'hidden',
            }}
          >
            {!isNewMoon && illumination < 0.95 && (
              <div className="absolute inset-0 rounded-full" style={{
                background: `linear-gradient(to ${shadowDir}, transparent ${Math.max(0, 50 - Math.abs(shadowX) * 0.5)}%, rgba(10,15,35,0.92) ${50 + Math.abs(shadowX) * 0.5}%)`,
              }} />
            )}
            {/* Crater detail — visible on lit portion */}
            {!isNewMoon && (
              <>
                <div className="absolute rounded-full" style={{ left: '55%', top: '32%', width: 6, height: 6, background: `rgba(160,170,200,${0.4 * illumination})` }} />
                <div className="absolute rounded-full" style={{ left: '28%', top: '58%', width: 4, height: 4, background: `rgba(160,170,200,${0.35 * illumination})` }} />
                <div className="absolute rounded-full" style={{ left: '62%', top: '62%', width: 3, height: 3, background: `rgba(160,170,200,${0.3 * illumination})` }} />
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}
