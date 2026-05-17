import { useEffect, useMemo, useRef } from 'react'

interface TitleBackdropCanvasProps {
  phase: number
}

interface StarPoint {
  x: number
  y: number
  size: number
  warmth: number
  phase: number
}

interface ParticlePoint {
  x: number
  y: number
  size: number
  delay: number
  color: string
}

const CALIFORNIA_OUTLINE: [number, number][] = [
  [0.32, 0.03],
  [0.48, 0.05],
  [0.52, 0.13],
  [0.57, 0.22],
  [0.62, 0.31],
  [0.67, 0.43],
  [0.73, 0.55],
  [0.77, 0.68],
  [0.82, 0.84],
  [0.73, 0.96],
  [0.62, 0.89],
  [0.55, 0.79],
  [0.47, 0.68],
  [0.38, 0.59],
  [0.29, 0.51],
  [0.22, 0.41],
  [0.16, 0.29],
  [0.18, 0.19],
  [0.25, 0.11],
]

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function snap(value: number, pixel: number) {
  return Math.round(value / pixel) * pixel
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  fill: string,
  stroke: string | null,
  pixel: number,
) {
  if (points.length === 0) return
  ctx.beginPath()
  ctx.moveTo(snap(points[0][0], pixel), snap(points[0][1], pixel))
  points.slice(1).forEach(([x, y]) => ctx.lineTo(snap(x, pixel), snap(y, pixel)))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = Math.max(pixel, 2)
    ctx.stroke()
  }
}

function drawRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixel: number,
  baseY: number,
  fill: string,
  stroke: string,
  peaks: [number, number][],
) {
  const points: [number, number][] = [[-pixel * 8, height + pixel * 8]]
  peaks.forEach(([x, y]) => points.push([x * width, y * height]))
  points.push([width + pixel * 8, height + pixel * 8])
  drawPolygon(ctx, points, fill, stroke, pixel)

  ctx.fillStyle = 'rgba(241, 244, 224, 0.72)'
  peaks.forEach(([x, y], index) => {
    if (index % 2 !== 0) return
    const peakX = snap(x * width, pixel)
    const peakY = snap(y * height, pixel)
    const cap = Math.max(pixel * 4, width * 0.016)
    drawPolygon(ctx, [
      [peakX, peakY + pixel],
      [peakX - cap, peakY + cap * 0.82],
      [peakX + cap * 0.9, peakY + cap * 0.74],
    ], 'rgba(229, 238, 226, 0.7)', null, pixel)
  })

  ctx.fillStyle = 'rgba(255, 197, 103, 0.12)'
  ctx.fillRect(0, snap(baseY * height, pixel), width, Math.max(pixel, 2))
}

function drawFogBand(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixel: number,
  y: number,
  alpha: number,
  time: number,
  tint: string,
) {
  ctx.fillStyle = tint
  ctx.globalAlpha = alpha
  const step = pixel * 5
  for (let x = -step * 4; x < width + step * 4; x += step) {
    const wave = Math.sin((x / width) * Math.PI * 4 + time) * pixel * 2.2
    const blockY = snap(y * height + wave, pixel)
    const widthBoost = 3 + ((Math.floor(x / step) % 4 + 4) % 4)
    ctx.fillRect(snap(x + Math.sin(time * 0.4) * 28, pixel), blockY, step * widthBoost, pixel * 3)
    if (widthBoost % 2 === 0) {
      ctx.fillRect(snap(x + step * 0.8, pixel), blockY + pixel * 4, step * 2, pixel)
    }
  }
  ctx.globalAlpha = 1
}

function drawCaliforniaProjection(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixel: number,
  time: number,
) {
  const mapWidth = Math.min(width * (width > 760 ? 0.35 : 0.56), height * 0.52)
  const mapHeight = mapWidth * 1.36
  const mapX = width > 760 ? width * 0.62 : width * 0.5 - mapWidth * 0.5
  const mapY = height * (width > 760 ? 0.08 : 0.14)
  const outline = CALIFORNIA_OUTLINE.map(([x, y]) => [mapX + x * mapWidth, mapY + y * mapHeight] as [number, number])

  ctx.globalAlpha = 0.18
  drawPolygon(ctx, outline, '#1e735f', '#89ffe0', pixel)
  ctx.globalAlpha = 1

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(outline[0][0], outline[0][1])
  outline.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
  ctx.closePath()
  ctx.clip()

  const bands = [
    ['#7dd3fc', 0.11],
    ['#6ee7b7', 0.16],
    ['#fbbf24', 0.11],
    ['#f97316', 0.08],
  ] as const
  bands.forEach(([color, alpha], i) => {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    const offset = (Math.sin(time * 0.65 + i) + 1) * pixel * 2
    for (let y = mapY + i * pixel * 4 + offset; y < mapY + mapHeight; y += pixel * 9) {
      ctx.fillRect(mapX, snap(y, pixel), mapWidth, pixel * 2)
    }
  })

  ctx.globalAlpha = 0.24
  ctx.strokeStyle = '#e9d58d'
  ctx.lineWidth = Math.max(1, pixel)
  const faultLine = [
    [0.34, 0.14],
    [0.4, 0.26],
    [0.48, 0.39],
    [0.54, 0.55],
    [0.64, 0.7],
    [0.72, 0.86],
  ]
  ctx.beginPath()
  faultLine.forEach(([x, y], index) => {
    const px = snap(mapX + x * mapWidth, pixel)
    const py = snap(mapY + y * mapHeight, pixel)
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()

  const pins: [number, number, string][] = [
    [0.33, 0.18, '#fef3c7'],
    [0.38, 0.36, '#93c5fd'],
    [0.47, 0.56, '#86efac'],
    [0.61, 0.75, '#fdba74'],
  ]
  pins.forEach(([x, y, color], index) => {
    const pulse = 0.6 + Math.sin(time * 2 + index) * 0.25
    ctx.globalAlpha = 0.55 + pulse * 0.25
    ctx.fillStyle = color
    ctx.fillRect(snap(mapX + x * mapWidth, pixel), snap(mapY + y * mapHeight, pixel), pixel * 3, pixel * 3)
  })

  ctx.restore()
  ctx.globalAlpha = 0.34
  drawPolygon(ctx, outline, 'rgba(0, 0, 0, 0)', '#d9ffe9', pixel)
  ctx.globalAlpha = 1
}

export default function TitleBackdropCanvas({ phase }: TitleBackdropCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stars = useMemo<StarPoint[]>(() => {
    const random = seededRandom(8347)
    return Array.from({ length: 145 }, () => ({
      x: random(),
      y: random() * 0.66,
      size: 1 + Math.floor(random() * 3),
      warmth: random(),
      phase: random() * Math.PI * 2,
    }))
  }, [])
  const particles = useMemo<ParticlePoint[]>(() => {
    const random = seededRandom(11721)
    return Array.from({ length: 38 }, () => ({
      x: random(),
      y: 0.58 + random() * 0.36,
      size: 1 + Math.floor(random() * 3),
      delay: random() * Math.PI * 2,
      color: random() > 0.52 ? '#7dd3fc' : random() > 0.2 ? '#86efac' : '#fbbf24',
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let cssWidth = 0
    let cssHeight = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      cssWidth = Math.max(1, rect.width)
      cssHeight = Math.max(1, rect.height)
      canvas.width = Math.floor(cssWidth * dpr)
      canvas.height = Math.floor(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
    }

    const draw = (timestamp: number) => {
      const width = cssWidth
      const height = cssHeight
      if (width <= 0 || height <= 0) return

      const time = timestamp / 1000
      const pixel = Math.max(2, Math.floor(Math.min(width, height) / 250))
      const intro = Math.min(1, Math.max(0.35, phase / 4))

      ctx.clearRect(0, 0, width, height)

      const sky = ctx.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, '#020711')
      sky.addColorStop(0.32, '#081b31')
      sky.addColorStop(0.57, '#113c4f')
      sky.addColorStop(0.74, '#194f47')
      sky.addColorStop(1, '#061713')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      ctx.globalAlpha = 0.12 * intro
      ctx.fillStyle = '#fbbf24'
      for (let y = snap(height * 0.28, pixel); y < height * 0.76; y += pixel * 18) {
        ctx.fillRect(0, y, width, pixel)
      }
      ctx.globalAlpha = 1

      stars.forEach((star) => {
        const shimmer = 0.34 + Math.sin(time * 1.8 + star.phase) * 0.25
        ctx.globalAlpha = Math.max(0.08, shimmer) * intro
        ctx.fillStyle = star.warmth > 0.82 ? '#ffe6a3' : star.warmth > 0.58 ? '#bde6ff' : '#f8fbff'
        const size = pixel * star.size
        ctx.fillRect(snap(star.x * width, pixel), snap(star.y * height, pixel), size, size)
      })
      ctx.globalAlpha = 1

      const moonX = snap(width * 0.13, pixel)
      const moonY = snap(height * 0.12, pixel)
      ctx.globalAlpha = 0.92 * intro
      ctx.fillStyle = '#fff2c6'
      ctx.fillRect(moonX, moonY, pixel * 8, pixel * 8)
      ctx.fillRect(moonX - pixel * 2, moonY + pixel * 2, pixel * 12, pixel * 4)
      ctx.fillStyle = '#b6a777'
      ctx.fillRect(moonX + pixel * 5, moonY + pixel * 2, pixel * 2, pixel * 2)
      ctx.globalAlpha = 0.16 * intro
      ctx.fillStyle = '#fff2c6'
      ctx.fillRect(moonX - pixel * 10, moonY - pixel * 8, pixel * 30, pixel * 24)
      ctx.globalAlpha = 1

      drawCaliforniaProjection(ctx, width, height, pixel, time)

      drawRidge(ctx, width, height, pixel, 0.5, '#0c2436', 'rgba(125, 211, 252, 0.16)', [
        [-0.08, 0.58],
        [0.08, 0.49],
        [0.18, 0.54],
        [0.28, 0.42],
        [0.42, 0.53],
        [0.58, 0.36],
        [0.72, 0.5],
        [0.86, 0.39],
        [1.08, 0.52],
      ])
      drawRidge(ctx, width, height, pixel, 0.58, '#102f2a', 'rgba(134, 239, 172, 0.14)', [
        [-0.08, 0.7],
        [0.05, 0.61],
        [0.16, 0.66],
        [0.32, 0.55],
        [0.46, 0.62],
        [0.6, 0.49],
        [0.78, 0.62],
        [0.94, 0.52],
        [1.08, 0.65],
      ])

      const oceanTop = snap(height * 0.72, pixel)
      const oceanGradient = ctx.createLinearGradient(0, oceanTop, 0, height)
      oceanGradient.addColorStop(0, '#0d5d67')
      oceanGradient.addColorStop(1, '#08262a')
      ctx.fillStyle = oceanGradient
      ctx.fillRect(0, oceanTop, width, height - oceanTop)

      for (let y = oceanTop + pixel * 4; y < height; y += pixel * 7) {
        ctx.globalAlpha = 0.18
        ctx.fillStyle = y % (pixel * 14) === 0 ? '#a7f3d0' : '#67e8f9'
        const offset = snap(Math.sin(time * 0.7 + y * 0.025) * pixel * 8, pixel)
        for (let x = -pixel * 12 + offset; x < width; x += pixel * 18) {
          ctx.fillRect(x, y, pixel * 7, pixel)
        }
      }
      ctx.globalAlpha = 1

      drawFogBand(ctx, width, height, pixel, 0.46, 0.13 * intro, time * 0.48, '#dbeafe')
      drawFogBand(ctx, width, height, pixel, 0.58, 0.11 * intro, time * -0.36, '#cffafe')
      drawFogBand(ctx, width, height, pixel, 0.68, 0.08 * intro, time * 0.32, '#fef3c7')

      particles.forEach((particle) => {
        const drift = Math.sin(time * 0.75 + particle.delay) * pixel * 5
        const bob = Math.cos(time * 1.2 + particle.delay) * pixel * 2
        ctx.globalAlpha = (0.18 + Math.max(0, Math.sin(time * 2 + particle.delay)) * 0.45) * intro
        ctx.fillStyle = particle.color
        const size = pixel * particle.size
        ctx.fillRect(
          snap(particle.x * width + drift, pixel),
          snap(particle.y * height + bob, pixel),
          size,
          size,
        )
      })
      ctx.globalAlpha = 1

      const foreground = ctx.createLinearGradient(0, height * 0.82, 0, height)
      foreground.addColorStop(0, 'rgba(4, 18, 18, 0.1)')
      foreground.addColorStop(1, 'rgba(3, 10, 10, 0.86)')
      ctx.fillStyle = foreground
      ctx.fillRect(0, height * 0.78, width, height * 0.22)

      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#e9d58d'
      for (let x = 0; x < width; x += pixel * 16) {
        const h = pixel * (2 + ((x / pixel) % 5))
        ctx.fillRect(snap(x, pixel), snap(height * 0.86 - h, pixel), pixel * 2, h)
      }
      ctx.globalAlpha = 1

      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.34, height * 0.16, width * 0.5, height * 0.45, height * 0.82)
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    }

    const tick = (timestamp: number) => {
      draw(timestamp)
      if (!media.matches) frame = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [particles, phase, stars])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    />
  )
}
