import { useState, useEffect } from 'react'
import type { BiomeType, TimeOfDay } from '@/types/game'

interface Props {
  biome: BiomeType
  subregion: string
  timeOfDay: TimeOfDay
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number; color: string; type: string
}

// Time-of-day sky overlays — richer color science
function getTimeOverlay(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn': return 'linear-gradient(180deg, #0f0a1a 0%, #2a1535 15%, #5a2848 30%, #c4593a 50%, #e8946a 70%, #f5c8a0 85%, #fde8cc 100%)'
    case 'day': return 'linear-gradient(180deg, #0f2847 0%, #1a4a7a 20%, #2d72b0 40%, #4a9fd4 60%, #72c0e8 80%, #a8daf0 95%, #c8eaf8 100%)'
    case 'dusk': return 'linear-gradient(180deg, #08101a 0%, #121f35 15%, #2a2040 30%, #6a2a4a 45%, #c44a3a 60%, #e87840 75%, #f0a850 90%, #f8d080 100%)'
    case 'night': return 'linear-gradient(180deg, #020508 0%, #050a14 15%, #081428 35%, #0c1e38 55%, #102848 75%, #143050 90%, #183858 100%)'
  }
}

// Celestial body
function CelestialBody({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  if (timeOfDay === 'night') {
    return (
      <div className="absolute pointer-events-none" style={{
        top: '8%', right: '12%', width: 24, height: 24, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #e8dcc8 0%, #c8b898 40%, #a89878 80%)',
        boxShadow: '0 0 25px rgba(232,220,200,0.15), 0 0 50px rgba(232,220,200,0.06)',
      }}>
        {/* Moon craters */}
        <div className="absolute rounded-full" style={{ top: '30%', left: '45%', width: 4, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: '50%' }} />
        <div className="absolute rounded-full" style={{ top: '55%', left: '25%', width: 3, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: '50%' }} />
      </div>
    )
  }
  if (timeOfDay === 'day') {
    return (
      <div className="absolute pointer-events-none" style={{
        top: '10%', right: '20%', width: 20, height: 20, borderRadius: '50%',
        background: 'radial-gradient(circle, #fff8e0 0%, #f8e8a0 40%, #f0d060 100%)',
        boxShadow: '0 0 30px rgba(248,232,160,0.3), 0 0 60px rgba(240,208,96,0.15)',
      }} />
    )
  }
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
    const isLeft = timeOfDay === 'dawn'
    return (
      <div className="absolute pointer-events-none" style={{
        top: '35%', [isLeft ? 'left' : 'right']: '10%', width: 28, height: 28, borderRadius: '50%',
        background: timeOfDay === 'dawn'
          ? 'radial-gradient(circle, #ffe8c0 0%, #f8c070 40%, #e89030 100%)'
          : 'radial-gradient(circle, #f8d0a0 0%, #e89050 40%, #d06030 100%)',
        boxShadow: `0 0 40px rgba(248,192,112,0.25), 0 0 80px rgba(232,144,48,0.1)`,
      }} />
    )
  }
  return null
}

// Animated cloud layers
function CloudLayer({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  if (timeOfDay === 'night') return null
  const cloudColor = timeOfDay === 'dawn' ? 'rgba(248,200,160,0.12)' :
    timeOfDay === 'dusk' ? 'rgba(200,120,100,0.1)' : 'rgba(255,255,255,0.08)'
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute" style={{
          top: `${12 + i * 10}%`, left: '-20%', width: '140%', height: `${18 + i * 6}px`,
          background: `radial-gradient(ellipse, ${cloudColor} 20%, transparent 70%)`,
          filter: `blur(${6 + i * 4}px)`,
          animation: `cloud-drift ${30 + i * 15}s linear infinite`,
          animationDelay: `${i * -8}s`,
        }} />
      ))}
    </div>
  )
}

// Particle system hook
function useParticles(biome: BiomeType, timeOfDay: TimeOfDay) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const initial: Particle[] = []
    const isNight = timeOfDay === 'night'

    if ((biome === 'forest' || biome === 'redwood') && isNight) {
      // Fireflies
      for (let i = 0; i < 12; i++) {
        initial.push({ x: Math.random() * 100, y: 30 + Math.random() * 50, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2, size: 2 + Math.random(), opacity: 0.3 + Math.random() * 0.5, color: '#a8e840', type: 'firefly' })
      }
    } else if ((biome === 'forest' || biome === 'redwood') && !isNight) {
      // Floating leaves
      for (let i = 0; i < 8; i++) {
        initial.push({ x: Math.random() * 100, y: Math.random() * 60, vx: 0.1 + Math.random() * 0.15, vy: 0.05 + Math.random() * 0.1, size: 3 + Math.random() * 2, opacity: 0.2 + Math.random() * 0.2, color: biome === 'redwood' ? '#8B4513' : '#22c55e', type: 'leaf' })
      }
    } else if (biome === 'marsh') {
      // Fireflies + dragonflies
      for (let i = 0; i < 10; i++) {
        initial.push({ x: Math.random() * 100, y: 35 + Math.random() * 40, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3, size: isNight ? 2 : 3, opacity: 0.3, color: isNight ? '#80e0a0' : '#60c0d0', type: isNight ? 'firefly' : 'dragonfly' })
      }
    } else if (biome === 'grassland') {
      // Pollen / butterflies
      for (let i = 0; i < 10; i++) {
        const isButterfly = i < 3
        initial.push({ x: Math.random() * 100, y: 20 + Math.random() * 50, vx: (Math.random() - 0.5) * 0.2, vy: isButterfly ? (Math.random() - 0.5) * 0.3 : -0.05, size: isButterfly ? 4 : 1.5, opacity: isButterfly ? 0.4 : 0.2, color: isButterfly ? ['#f59e0b', '#ec4899', '#a855f7'][i % 3] : '#f0e68c', type: isButterfly ? 'butterfly' : 'pollen' })
      }
    } else if (biome === 'beach' || biome === 'water') {
      // Sparkles on water
      for (let i = 0; i < 15; i++) {
        initial.push({ x: Math.random() * 100, y: 55 + Math.random() * 30, vx: 0.05, vy: 0, size: 1.5, opacity: 0, color: '#ffffff', type: 'sparkle' })
      }
    } else if (biome === 'mountain') {
      // Wind wisps + distant birds
      for (let i = 0; i < 6; i++) {
        initial.push({ x: Math.random() * 100, y: 15 + Math.random() * 30, vx: 0.2 + Math.random() * 0.1, vy: (Math.random() - 0.5) * 0.05, size: i < 2 ? 5 : 20, opacity: 0.08, color: '#ffffff', type: i < 2 ? 'bird' : 'wisp' })
      }
    } else if (biome === 'urban' && isNight) {
      // City light particles
      for (let i = 0; i < 8; i++) {
        initial.push({ x: Math.random() * 100, y: 50 + Math.random() * 30, vx: 0, vy: -0.02, size: 1.5, opacity: 0, color: ['#fbbf24', '#60a5fa', '#f87171', '#a78bfa'][i % 4], type: 'citylight' })
      }
    }
    setParticles(initial)

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        let { x, y, vx, vy, opacity } = p
        x += vx
        y += vy
        // Wrap around
        if (x > 105) x = -5
        if (x < -5) x = 105
        if (y > 95) y = Math.random() * 10
        if (y < -5) y = 90

        // Animate opacity for sparkle/firefly types
        if (p.type === 'firefly') opacity = 0.2 + Math.sin(Date.now() * 0.003 + p.x * 10) * 0.4
        if (p.type === 'sparkle') opacity = Math.max(0, Math.sin(Date.now() * 0.002 + p.x * 5) * 0.5)
        if (p.type === 'citylight') opacity = 0.1 + Math.sin(Date.now() * 0.001 + p.x * 3) * 0.15

        return { ...p, x, y, opacity }
      }))
    }, 60)

    return () => clearInterval(interval)
  }, [biome, timeOfDay])

  return particles
}

// Fog layer for SF-characteristic fog
function FogLayer({ intensity = 0.3 }: { intensity?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: intensity }}>
      <div className="absolute w-[200%] h-24 top-[30%] -left-[50%]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(200,210,220,0.4) 20%, rgba(220,225,235,0.6) 50%, rgba(200,210,220,0.4) 80%, transparent 100%)',
          animation: 'fog-drift 20s linear infinite',
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute w-[200%] h-16 top-[45%] -left-[30%]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(180,195,210,0.3) 30%, rgba(200,210,225,0.5) 60%, rgba(180,195,210,0.3) 90%, transparent 100%)',
          animation: 'fog-drift 28s linear infinite reverse',
          filter: 'blur(12px)',
        }}
      />
    </div>
  )
}

// Stars for night scenes
function Stars() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() > 0.7 ? 2 : 1,
            height: Math.random() > 0.7 ? 2 : 1,
            left: `${5 + (i * 31) % 90}%`,
            top: `${2 + (i * 17) % 40}%`,
            opacity: 0.3 + Math.random() * 0.5,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// Golden Gate silhouette — detailed
function GoldenGateSilhouette({ color = '#1a2030', glow = false }: { color?: string; glow?: boolean }) {
  return (
    <svg className="absolute bottom-[35%] left-[5%] w-[40%] h-[20%] pointer-events-none" viewBox="0 0 400 100" preserveAspectRatio="none">
      {/* Tower 1 — art deco stepped top */}
      <rect x="88" y="12" width="12" height="88" fill={color} />
      <rect x="85" y="8" width="18" height="6" fill={color} rx="1" />
      <rect x="90" y="4" width="8" height="6" fill={color} />
      {/* Tower 1 cross beams */}
      <rect x="85" y="35" width="18" height="2" fill={color} opacity="0.7" />
      <rect x="85" y="60" width="18" height="2" fill={color} opacity="0.7" />
      {/* Tower 2 */}
      <rect x="248" y="12" width="12" height="88" fill={color} />
      <rect x="245" y="8" width="18" height="6" fill={color} rx="1" />
      <rect x="250" y="4" width="8" height="6" fill={color} />
      <rect x="245" y="35" width="18" height="2" fill={color} opacity="0.7" />
      <rect x="245" y="60" width="18" height="2" fill={color} opacity="0.7" />
      {/* Main cables (catenary curves) */}
      <path d="M 20 55 Q 94 88 94 18" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M 94 18 Q 170 65 254 18" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M 254 18 Q 335 88 370 55" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Vertical suspender cables */}
      {[40, 55, 70, 120, 145, 170, 195, 220, 290, 310, 330, 350].map((x, i) => (
        <line key={i} x1={x} y1={85} x2={x} y2={40 + Math.abs(x - 172) * 0.15} stroke={color} strokeWidth="0.5" opacity="0.4" />
      ))}
      {/* Road deck */}
      <rect x="15" y="84" width="360" height="5" fill={color} rx="1" />
      <rect x="15" y="83" width="360" height="1" fill={color} opacity="0.5" />
      {/* Glow for dusk/night */}
      {glow && (
        <>
          <rect x="90" y="2" width="8" height="3" fill="#ef4444" opacity="0.4" rx="1">
            <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.3;0.5;0.3" />
          </rect>
          <rect x="250" y="2" width="8" height="3" fill="#ef4444" opacity="0.4" rx="1">
            <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.3;0.5;0.3" />
          </rect>
        </>
      )}
    </svg>
  )
}

// City skyline silhouette — SF landmarks
function CitySkyline({ color = '#0a1020' }: { color?: string }) {
  return (
    <svg className="absolute bottom-[20%] w-full h-[35%] pointer-events-none" viewBox="0 0 800 200" preserveAspectRatio="none">
      {/* Background building row (far) */}
      <rect x="10" y="120" width="30" height="60" fill={color} opacity="0.5" />
      <rect x="45" y="105" width="25" height="75" fill={color} opacity="0.5" />
      <rect x="400" y="110" width="35" height="70" fill={color} opacity="0.5" />
      <rect x="580" y="115" width="28" height="65" fill={color} opacity="0.5" />
      <rect x="750" y="125" width="40" height="55" fill={color} opacity="0.5" />
      {/* Transamerica Pyramid */}
      <polygon points="200,18 212,180 188,180" fill={color} />
      <polygon points="200,18 206,100 194,100" fill={color} opacity="0.8" />
      {/* Salesforce Tower — rounded top */}
      <rect x="280" y="28" width="30" height="152" fill={color} rx="6" />
      <ellipse cx="295" cy="28" rx="15" ry="5" fill={color} />
      {/* Coit Tower hint */}
      <rect x="160" y="75" width="12" height="50" fill={color} rx="3" />
      <rect x="155" y="72" width="22" height="5" fill={color} rx="2" />
      {/* Various buildings — varied shapes */}
      <rect x="50" y="80" width="35" height="100" fill={color} />
      <rect x="90" y="55" width="25" height="125" fill={color} />
      <polygon points="90,55 102,45 115,55" fill={color} /> {/* Pointed roof */}
      <rect x="120" y="95" width="40" height="85" fill={color} />
      <rect x="340" y="65" width="32" height="115" fill={color} />
      <rect x="340" y="60" width="4" height="8" fill={color} /> {/* Antenna */}
      <rect x="380" y="85" width="48" height="95" fill={color} />
      <polygon points="380,85 404,75 428,85" fill={color} /> {/* Triangular top */}
      <rect x="440" y="45" width="28" height="135" fill={color} />
      <rect x="451" y="38" width="6" height="10" fill={color} /> {/* Spire */}
      <rect x="480" y="70" width="38" height="110" fill={color} />
      <rect x="530" y="105" width="52" height="75" fill={color} />
      <rect x="600" y="80" width="32" height="100" fill={color} />
      <rect x="650" y="55" width="22" height="125" fill={color} />
      <rect x="690" y="90" width="42" height="90" fill={color} />
      {/* Rooftop AC units on flat buildings */}
      <rect x="385" y="83" width="5" height="4" fill={color} opacity="0.8" />
      <rect x="415" y="83" width="5" height="4" fill={color} opacity="0.8" />
      <rect x="535" y="103" width="4" height="3" fill={color} opacity="0.8" />
      {/* Window lights — warm and cool mix */}
      {[60, 100, 295, 350, 393, 450, 495, 545, 610, 660, 700].map((x, i) => (
        <rect key={i} x={x + (i * 3) % 8} y={80 + (i * 13) % 50} width="2.5" height="2.5" fill="#fbbf2435" rx="0.3">
          <animate attributeName="opacity" dur={`${2 + (i * 0.7) % 3}s`} repeatCount="indefinite" values="0.2;0.5;0.2" />
        </rect>
      ))}
      {[70, 130, 300, 390, 490, 555, 620, 665, 710].map((x, i) => (
        <rect key={`w2-${i}`} x={x + (i * 5) % 10} y={95 + (i * 17) % 40} width="2.5" height="2.5" fill="#60a5fa28" rx="0.3">
          <animate attributeName="opacity" dur={`${3 + (i * 0.5) % 2}s`} repeatCount="indefinite" values="0.15;0.4;0.15" />
        </rect>
      ))}
      {/* Occasional red aircraft warning lights on tall buildings */}
      <circle cx="200" cy="20" r="1.5" fill="#ef4444" opacity="0.3">
        <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.1;0.4;0.1" />
      </circle>
      <circle cx="295" cy="26" r="1.5" fill="#ef4444" opacity="0.3">
        <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.1;0.4;0.1" begin="1.5s" />
      </circle>
    </svg>
  )
}

// Tree silhouettes
function TreeLine({ variant = 'mixed', color = '#0a1a10', bottom = '20%' }: { variant?: 'mixed' | 'redwood' | 'sparse'; color?: string; bottom?: string }) {
  if (variant === 'redwood') {
    return (
      <svg className="absolute w-full pointer-events-none" style={{ bottom, height: '50%' }} viewBox="0 0 800 300" preserveAspectRatio="none">
        {[50, 120, 200, 310, 420, 500, 580, 660, 740].map((x, i) => {
          const h = 180 + (i * 37) % 80
          const w = 12 + (i % 3) * 4
          return (
            <g key={i}>
              {/* Trunk */}
              <rect x={x - 3} y={300 - h} width={6} height={h} fill={color} />
              {/* Canopy — tall narrow conifers */}
              <ellipse cx={x} cy={300 - h + 20} rx={w} ry={h * 0.4} fill={color} opacity="0.9" />
            </g>
          )
        })}
        {/* Ferns at base */}
        {[30, 150, 270, 400, 550, 700].map((x, i) => (
          <ellipse key={`fern-${i}`} cx={x} cy={290} rx={20 + i * 3} ry={8} fill={color} opacity="0.5" />
        ))}
      </svg>
    )
  }

  return (
    <svg className="absolute w-full pointer-events-none" style={{ bottom, height: '35%' }} viewBox="0 0 800 200" preserveAspectRatio="none">
      {[40, 130, 210, 350, 460, 580, 680, 760].map((x, i) => {
        const isConifer = i % 3 === 0
        const h = 80 + (i * 29) % 60
        if (isConifer) {
          return <polygon key={i} points={`${x},${200 - h} ${x - 15},200 ${x + 15},200`} fill={color} />
        }
        return (
          <g key={i}>
            <rect x={x - 2} y={200 - h * 0.4} width={4} height={h * 0.4} fill={color} />
            <ellipse cx={x} cy={200 - h * 0.5} rx={h * 0.3} ry={h * 0.35} fill={color} />
          </g>
        )
      })}
    </svg>
  )
}

// Mountain range silhouette
function MountainRange({ color = '#1a2a3a', bottom = '20%' }: { color?: string; bottom?: string }) {
  return (
    <svg className="absolute w-full pointer-events-none" style={{ bottom, height: '40%' }} viewBox="0 0 800 200" preserveAspectRatio="none">
      <polygon
        points="0,200 50,120 120,150 180,80 250,130 320,60 400,110 460,40 530,100 600,70 670,120 730,90 800,130 800,200"
        fill={color}
      />
      <polygon
        points="0,200 80,140 160,170 230,110 300,150 370,100 450,140 520,90 590,130 660,105 750,145 800,120 800,200"
        fill={color}
        opacity="0.6"
      />
    </svg>
  )
}

// Water/waves
function WaterSurface({ color = '#0a2a4a' }: { color?: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '25%' }}>
      <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="800" height="100" fill="url(#water-grad)" />
        <path d="M0,15 Q100,5 200,15 T400,15 T600,15 T800,15 L800,100 L0,100Z" fill={color} opacity="0.3">
          <animate attributeName="d" dur="4s" repeatCount="indefinite"
            values="M0,15 Q100,5 200,15 T400,15 T600,15 T800,15 L800,100 L0,100Z;M0,18 Q100,8 200,12 T400,18 T600,12 T800,18 L800,100 L0,100Z;M0,15 Q100,5 200,15 T400,15 T600,15 T800,15 L800,100 L0,100Z" />
        </path>
        {/* Light reflections */}
        {[100, 300, 500, 700].map((x, i) => (
          <rect key={i} x={x} y={20 + i * 8} width={40} height={1} fill="white" opacity="0.05">
            <animate attributeName="opacity" dur={`${3 + i}s`} repeatCount="indefinite" values="0.03;0.08;0.03" />
          </rect>
        ))}
      </svg>
    </div>
  )
}

// Reeds for marsh
function MarshReeds() {
  return (
    <svg className="absolute bottom-[18%] w-full h-[15%] pointer-events-none" viewBox="0 0 800 80" preserveAspectRatio="none">
      {[20, 45, 80, 110, 150, 190, 230, 280, 330, 380, 420, 470, 520, 560, 610, 650, 700, 740, 780].map((x, i) => {
        const h = 30 + (i * 13) % 40
        const lean = ((i * 7) % 10) - 5
        return (
          <line
            key={i}
            x1={x} y1={80} x2={x + lean} y2={80 - h}
            stroke="#2a4a30"
            strokeWidth={1.5 + (i % 3) * 0.5}
            strokeLinecap="round"
            opacity={0.5 + (i % 3) * 0.15}
          >
            <animate attributeName="x2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite"
              values={`${x + lean};${x + lean + 3};${x + lean}`} />
          </line>
        )
      })}
      {/* Cattail heads */}
      {[45, 150, 280, 420, 560, 700].map((x, i) => (
        <ellipse key={`cat-${i}`} cx={x + ((i * 7) % 10) - 5} cy={80 - 45 - (i * 13) % 20} rx="3" ry="6" fill="#3a2a20" opacity="0.6" />
      ))}
    </svg>
  )
}

// Ground/terrain layer
function GroundLayer({ color, style = 'flat' }: { color: string; style?: 'flat' | 'sandy' | 'grassy' }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '22%' }}>
      <div
        className="w-full h-full"
        style={{
          background: style === 'grassy'
            ? `linear-gradient(180deg, ${color} 0%, ${color}dd 40%, ${color}bb 100%)`
            : style === 'sandy'
            ? `linear-gradient(180deg, ${color} 0%, ${color}ee 60%, ${color}cc 100%)`
            : `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
          borderTop: style === 'grassy' ? `2px solid ${color}` : 'none',
        }}
      />
      {style === 'grassy' && (
        <svg className="absolute top-0 left-0 w-full h-4 -translate-y-2" viewBox="0 0 800 16" preserveAspectRatio="none">
          {Array.from({ length: 60 }).map((_, i) => (
            <line
              key={i}
              x1={i * 13 + Math.random() * 8}
              y1={16}
              x2={i * 13 + Math.random() * 8 + (Math.random() - 0.5) * 4}
              y2={16 - 4 - Math.random() * 8}
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.4 + Math.random() * 0.3}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

// Location banner
function LocationBanner({ subregion, biome, biomeName }: { subregion: string; biome: BiomeType; biomeName: string }) {
  const biomeColors: Record<BiomeType, string> = {
    urban: '#f59e0b',
    forest: '#22c55e',
    marsh: '#06b6d4',
    beach: '#f97316',
    rocky_beach: '#78716c',
    water: '#3b82f6',
    mountain: '#8b5cf6',
    grassland: '#84cc16',
    redwood: '#15803d',
    tidepool: '#0891b2',
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
  const color = biomeColors[biome]

  return (
    <div className="absolute top-3 left-3 z-20 pointer-events-none">
      <div className="flex items-center gap-2">
        <div
          className="w-1 h-8 rounded-full"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}40)` }}
        />
        <div>
          <p className="text-white/80 text-[11px] font-bold tracking-wide leading-tight">
            {subregion || biomeName}
          </p>
          <p className="text-[9px] font-medium tracking-wider uppercase" style={{ color: `${color}aa` }}>
            {biomeName}
          </p>
        </div>
      </div>
    </div>
  )
}

const BIOME_NAMES: Record<BiomeType, string> = {
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

export default function BattleBiomeBackground({ biome, subregion, timeOfDay }: Props) {
  const isNight = timeOfDay === 'night'
  const isDusk = timeOfDay === 'dusk'
  const isDawn = timeOfDay === 'dawn'
  const biomeName = BIOME_NAMES[biome]
  const particles = useParticles(biome, timeOfDay)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient (time-aware) */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: getTimeOverlay(timeOfDay) }}
      />

      {/* Celestial body */}
      <CelestialBody timeOfDay={timeOfDay} />

      {/* Clouds */}
      <CloudLayer timeOfDay={timeOfDay} />

      {/* Stars at night */}
      {isNight && <Stars />}

      {/* Biome-specific layers */}
      {biome === 'urban' && (
        <>
          {/* City ambient glow — warm sodium light bounce */}
          <div className="absolute inset-0" style={{
            background: isNight
              ? 'radial-gradient(ellipse at 40% 90%, rgba(251,191,36,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 85%, rgba(96,165,250,0.04) 0%, transparent 40%)'
              : 'radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.03) 0%, transparent 50%)',
          }} />
          <CitySkyline color={isNight ? '#060a14' : isDusk ? '#0c1018' : '#142030'} />
          {/* Street level with gradient depth */}
          <div className="absolute bottom-0 left-0 right-0 h-[22%]" style={{
            background: isNight
              ? 'linear-gradient(180deg, #08101a 0%, #0e141f 40%, #141820 70%, #1a1e28 100%)'
              : isDusk
              ? 'linear-gradient(180deg, #18121a 0%, #201520 50%, #281a28 100%)'
              : 'linear-gradient(180deg, #242a38 0%, #2a3040 50%, #303848 100%)',
          }} />
          {/* Horizon glow line */}
          {isNight && (
            <div className="absolute bottom-[22%] left-0 right-0 h-0.5" style={{
              background: 'linear-gradient(90deg, transparent 5%, rgba(251,191,36,0.12) 25%, rgba(96,165,250,0.08) 50%, rgba(251,191,36,0.12) 75%, transparent 95%)',
              filter: 'blur(1px)',
            }} />
          )}
          {/* Streetlight pools at bottom */}
          {isNight && (
            <div className="absolute bottom-0 left-0 right-0 h-[15%] pointer-events-none">
              {[15, 40, 65, 85].map((x, i) => (
                <div key={i} className="absolute bottom-0" style={{
                  left: `${x}%`, width: 40, height: '100%',
                  background: `radial-gradient(ellipse at 50% 0%, ${i % 2 === 0 ? 'rgba(251,191,36,0.06)' : 'rgba(96,165,250,0.04)'} 0%, transparent 70%)`,
                }} />
              ))}
            </div>
          )}
          {(isDusk || isDawn) && <FogLayer intensity={0.15} />}
        </>
      )}

      {biome === 'forest' && (
        <>
          {/* Canopy filter — darker at top, light breaks through */}
          <div className="absolute inset-0" style={{
            background: isNight
              ? 'linear-gradient(180deg, rgba(4,12,6,0.4) 0%, transparent 50%)'
              : 'linear-gradient(180deg, rgba(10,30,15,0.15) 0%, transparent 30%)',
          }} />
          {/* Dappled light shafts */}
          {!isNight && (
            <>
              <div className="absolute pointer-events-none" style={{
                top: 0, left: '20%', width: '10%', height: '65%',
                background: 'linear-gradient(180deg, rgba(220,240,160,0.06) 0%, rgba(200,230,140,0.02) 60%, transparent 100%)',
                transform: 'skewX(-8deg)', filter: 'blur(6px)',
              }} />
              <div className="absolute pointer-events-none" style={{
                top: 0, left: '55%', width: '7%', height: '55%',
                background: 'linear-gradient(180deg, rgba(200,230,150,0.05) 0%, transparent 80%)',
                transform: 'skewX(4deg)', filter: 'blur(8px)',
              }} />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 35% 40%, rgba(255,255,200,0.05) 0%, transparent 18%), radial-gradient(circle at 68% 35%, rgba(255,255,180,0.04) 0%, transparent 14%)',
              }} />
            </>
          )}
          <TreeLine variant="mixed" color={isNight ? '#040a06' : isDusk ? '#081408' : '#0c2010'} bottom="18%" />
          <GroundLayer color={isNight ? '#081008' : isDusk ? '#142810' : '#1a3018'} style="grassy" />
          <FogLayer intensity={isNight ? 0.12 : isDawn ? 0.3 : 0.15} />
        </>
      )}

      {biome === 'redwood' && (
        <>
          {/* Cathedral light — shafts filtering through canopy */}
          <div className="absolute inset-0" style={{
            background: isNight
              ? 'none'
              : 'linear-gradient(135deg, transparent 30%, rgba(180,210,140,0.04) 45%, transparent 60%), linear-gradient(100deg, transparent 50%, rgba(200,220,160,0.03) 65%, transparent 80%)',
          }} />
          {/* Light shafts */}
          {!isNight && (
            <>
              <div className="absolute pointer-events-none" style={{
                top: '0', left: '25%', width: '8%', height: '70%',
                background: 'linear-gradient(180deg, rgba(200,220,150,0.06) 0%, rgba(200,220,150,0.02) 70%, transparent 100%)',
                transform: 'skewX(-5deg)',
                filter: 'blur(4px)',
              }} />
              <div className="absolute pointer-events-none" style={{
                top: '0', left: '60%', width: '6%', height: '60%',
                background: 'linear-gradient(180deg, rgba(180,210,140,0.05) 0%, rgba(180,210,140,0.01) 80%, transparent 100%)',
                transform: 'skewX(3deg)',
                filter: 'blur(6px)',
              }} />
            </>
          )}
          <TreeLine variant="redwood" color={isNight ? '#040a06' : '#0a1a0e'} bottom="15%" />
          <GroundLayer color={isNight ? '#080e06' : '#1a2a14'} style="grassy" />
          <FogLayer intensity={0.2} />
        </>
      )}

      {biome === 'marsh' && (
        <>
          <WaterSurface color={isNight ? '#081820' : isDusk ? '#102030' : '#15354a'} />
          <MarshReeds />
          <GroundLayer color={isNight ? '#0a1410' : '#1a2e22'} style="flat" />
          <FogLayer intensity={isDawn ? 0.35 : 0.2} />
          {/* Marsh atmospheric haze */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: isNight
              ? 'radial-gradient(ellipse at 50% 70%, rgba(6,182,212,0.04) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 50% 70%, rgba(6,182,212,0.06) 0%, transparent 40%)',
          }} />
        </>
      )}

      {biome === 'beach' && (
        <>
          {/* Ocean */}
          <WaterSurface color={isNight ? '#0a1830' : isDusk ? '#1a2a4a' : '#1a4060'} />
          {/* Beach sand */}
          <GroundLayer color={isNight ? '#1a1810' : isDusk ? '#3a3020' : '#c4a870'} style="sandy" />
          {/* Cliffs in background (Devil's Slide, Pacifica) */}
          <svg className="absolute bottom-[24%] right-0 w-[40%] h-[30%] pointer-events-none" viewBox="0 0 300 150" preserveAspectRatio="none">
            <polygon
              points="100,150 120,60 180,40 220,70 260,50 300,80 300,150"
              fill={isNight ? '#101820' : '#3a4a3a'}
              opacity="0.6"
            />
          </svg>
          {/* Distant GG bridge on coastal biome */}
          {!isNight && <GoldenGateSilhouette color={isDusk ? '#1a1020' : '#2a3a4a80'} glow={isDusk} />}
          <FogLayer intensity={isDawn ? 0.3 : 0.15} />
        </>
      )}

      {biome === 'water' && (
        <>
          <WaterSurface color={isNight ? '#061428' : isDusk ? '#0f2040' : '#0f3058'} />
          <GoldenGateSilhouette color={isNight ? '#080e18' : isDusk ? '#15101a' : '#1a2a3a'} glow={isNight || isDusk} />
          {/* Distant Alcatraz */}
          <svg className="absolute bottom-[38%] right-[15%] w-[8%] h-[6%] pointer-events-none" viewBox="0 0 80 30" preserveAspectRatio="none">
            <polygon
              points="10,30 15,15 30,10 50,8 65,12 70,30"
              fill={isNight ? '#0a1018' : '#2a3a4a'}
              opacity="0.5"
            />
            <rect x="38" y="4" width="4" height="8" fill={isNight ? '#0a1018' : '#2a3a4a'} opacity="0.5" />
          </svg>
          {/* Sailboat */}
          {!isNight && (
            <svg className="absolute bottom-[30%] left-[60%] w-[4%] h-[5%] pointer-events-none" viewBox="0 0 30 30" preserveAspectRatio="xMidYMid">
              <polygon points="15,2 15,22 25,22" fill="white" opacity="0.15" />
              <line x1="5" y1="22" x2="25" y2="22" stroke="white" strokeWidth="1" opacity="0.1" />
            </svg>
          )}
          <FogLayer intensity={0.25} />
        </>
      )}

      {biome === 'mountain' && (
        <>
          <MountainRange
            color={isNight ? '#0a1018' : isDusk ? '#1a1a2a' : '#2a3a4a'}
            bottom="20%"
          />
          {/* Foreground hills */}
          <svg className="absolute bottom-[18%] w-full h-[15%] pointer-events-none" viewBox="0 0 800 80" preserveAspectRatio="none">
            <path
              d="M0,80 Q100,30 200,50 Q300,20 400,45 Q500,10 600,40 Q700,25 800,50 L800,80Z"
              fill={isNight ? '#0a1410' : isDusk ? '#1a2018' : '#2a4a2a'}
              opacity="0.7"
            />
          </svg>
          <GroundLayer color={isNight ? '#0a1208' : isDusk ? '#1a2518' : '#3a5a2a'} style="grassy" />
          {/* Hawks circling */}
          {!isNight && (
            <svg className="absolute top-[20%] right-[20%] w-6 h-4 pointer-events-none" viewBox="0 0 24 12" opacity="0.2">
              <path d="M12,6 Q8,2 0,4 M12,6 Q16,2 24,4" stroke="currentColor" strokeWidth="1" fill="none" className="text-white">
                <animateTransform attributeName="transform" type="translate" dur="8s" repeatCount="indefinite" values="0,0;-10,2;0,0" />
              </path>
            </svg>
          )}
          <FogLayer intensity={isDawn ? 0.2 : 0.1} />
        </>
      )}

      {biome === 'grassland' && (
        <>
          {/* Rolling golden hills */}
          <svg className="absolute bottom-[18%] w-full h-[35%] pointer-events-none" viewBox="0 0 800 180" preserveAspectRatio="none">
            <path
              d="M0,180 Q100,100 200,120 Q350,60 500,100 Q650,50 800,90 L800,180Z"
              fill={isNight ? '#0a1208' : isDusk ? '#3a2a10' : '#8a7a30'}
              opacity="0.4"
            />
            <path
              d="M0,180 Q150,110 300,130 Q450,80 600,115 Q700,70 800,100 L800,180Z"
              fill={isNight ? '#0a1408' : isDusk ? '#4a3510' : '#9a8a3a'}
              opacity="0.5"
            />
          </svg>
          <GroundLayer color={isNight ? '#0a1208' : isDusk ? '#3a3018' : '#7a6a28'} style="grassy" />
          {/* Wildflower dots */}
          {!isNight && (
            <div className="absolute bottom-[20%] left-0 right-0 h-[8%] pointer-events-none">
              {[10, 18, 30, 42, 55, 67, 75, 88].map((x, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 3,
                    height: 3,
                    left: `${x}%`,
                    bottom: `${20 + (i * 23) % 60}%`,
                    background: ['#f59e0b', '#ea580c', '#a855f7', '#ec4899', '#f59e0b', '#ea580c', '#a855f7', '#ec4899'][i],
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>
          )}
          {/* Sparse trees on horizon */}
          <TreeLine variant="sparse" color={isNight ? '#060e08' : '#2a4020'} bottom="30%" />
        </>
      )}

      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div key={i} className="absolute" style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: p.type === 'leaf' ? '30% 70%' : p.type === 'butterfly' ? '40%' : '50%',
            background: p.type === 'wisp'
              ? `linear-gradient(90deg, transparent, ${p.color}, transparent)` : p.color,
            opacity: p.opacity,
            transform: p.type === 'leaf' ? `rotate(${Date.now() * 0.05 + i * 40}deg)` :
              p.type === 'butterfly' ? `rotate(${Math.sin(Date.now() * 0.005 + i) * 20}deg)` : 'none',
            filter: p.type === 'firefly' ? `blur(0.5px) drop-shadow(0 0 3px ${p.color})` :
              p.type === 'sparkle' ? 'blur(0.5px)' : 'none',
            transition: 'opacity 0.3s',
            ...(p.type === 'wisp' ? { width: p.size * 4, height: 2 } : {}),
          }} />
        ))}
      </div>

      {/* Vignette overlay — adds depth to all biomes */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* Location banner */}
      <LocationBanner subregion={subregion} biome={biome} biomeName={biomeName} />

      {/* CSS animations */}
      <style>{`
        @keyframes fog-drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        @keyframes cloud-drift {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(10%); }
        }
      `}</style>
    </div>
  )
}
