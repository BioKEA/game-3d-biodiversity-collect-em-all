import { drawPixelGlyphOnCanvas } from './pixelGlyphArt'

type CanvasCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function rect(ctx: CanvasCtx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

export function drawPixelKelp(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - s, y - 10 * s, 2 * s, 11 * s, '#2f7d4a')
  rect(ctx, x - 4 * s, y - 7 * s, 4 * s, 2 * s, '#7fbc5a')
  rect(ctx, x + s, y - 5 * s, 4 * s, 2 * s, '#4f9b4a')
  rect(ctx, x - 5 * s, y - 2 * s, 4 * s, 2 * s, '#9fca62')
  rect(ctx, x + s, y - 9 * s, 3 * s, 2 * s, '#b4d46a')
  rect(ctx, x - 2 * s, y + s, 5 * s, s, '#214f35')
}

export function drawPixelJellyfish(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - 4 * s, y - 8 * s, 8 * s, 2 * s, '#e9d5ff')
  rect(ctx, x - 6 * s, y - 6 * s, 12 * s, 4 * s, '#c084fc')
  rect(ctx, x - 4 * s, y - 2 * s, 8 * s, 2 * s, '#7dd3fc')
  rect(ctx, x - 5 * s, y, 2 * s, 5 * s, '#a78bfa')
  rect(ctx, x - s, y, 2 * s, 6 * s, '#67e8f9')
  rect(ctx, x + 3 * s, y, 2 * s, 5 * s, '#a78bfa')
  rect(ctx, x - 2 * s, y - 5 * s, s, s, '#312e81')
  rect(ctx, x + 2 * s, y - 5 * s, s, s, '#312e81')
}

export function drawPixelSurfer(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - 9 * s, y + 3 * s, 18 * s, 2 * s, '#fef3c7')
  rect(ctx, x - 7 * s, y + 5 * s, 13 * s, s, '#0ea5e9')
  rect(ctx, x - 2 * s, y - 8 * s, 4 * s, 4 * s, '#d8a878')
  rect(ctx, x - 3 * s, y - 4 * s, 6 * s, 5 * s, '#f97316')
  rect(ctx, x - 7 * s, y, 5 * s, 2 * s, '#343a3d')
  rect(ctx, x + 2 * s, y, 5 * s, 2 * s, '#343a3d')
  rect(ctx, x - 5 * s, y - 5 * s, 2 * s, 5 * s, '#d8a878')
  rect(ctx, x + 3 * s, y - 5 * s, 2 * s, 5 * s, '#d8a878')
}

export function drawPixelDiver(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - 3 * s, y - 10 * s, 6 * s, 4 * s, '#7dd3fc')
  rect(ctx, x - 4 * s, y - 6 * s, 8 * s, 7 * s, '#0f766e')
  rect(ctx, x - 6 * s, y - 4 * s, 2 * s, 7 * s, '#67e8f9')
  rect(ctx, x + 4 * s, y - 4 * s, 2 * s, 7 * s, '#67e8f9')
  rect(ctx, x - 5 * s, y + s, 3 * s, 5 * s, '#082f49')
  rect(ctx, x + 2 * s, y + s, 3 * s, 5 * s, '#082f49')
  rect(ctx, x - 8 * s, y + 6 * s, 5 * s, 2 * s, '#22d3ee')
  rect(ctx, x + 3 * s, y + 6 * s, 5 * s, 2 * s, '#22d3ee')
  rect(ctx, x - 2 * s, y - 9 * s, 4 * s, 2 * s, '#e0f2fe')
}

export function drawPixelTrain(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - 7 * s, y - 7 * s, 14 * s, 12 * s, '#fbbf24')
  rect(ctx, x - 5 * s, y - 5 * s, 10 * s, 4 * s, '#1e3a8a')
  rect(ctx, x - 5 * s, y, 4 * s, 3 * s, '#0f172a')
  rect(ctx, x + s, y, 4 * s, 3 * s, '#0f172a')
  rect(ctx, x - 6 * s, y + 6 * s, 4 * s, 2 * s, '#64748b')
  rect(ctx, x + 2 * s, y + 6 * s, 4 * s, 2 * s, '#64748b')
}

export function drawPixelFerry(ctx: CanvasCtx, x: number, y: number, scale = 1.2) {
  const s = scale
  rect(ctx, x - 8 * s, y - 2 * s, 16 * s, 5 * s, '#f8fafc')
  rect(ctx, x - 6 * s, y - 6 * s, 12 * s, 4 * s, '#38bdf8')
  rect(ctx, x - 4 * s, y - 5 * s, 2 * s, 2 * s, '#0f172a')
  rect(ctx, x, y - 5 * s, 2 * s, 2 * s, '#0f172a')
  rect(ctx, x + 4 * s, y - 5 * s, 2 * s, 2 * s, '#0f172a')
  rect(ctx, x - 10 * s, y + 3 * s, 20 * s, 3 * s, '#0f766e')
  rect(ctx, x - 7 * s, y + 6 * s, 14 * s, s, '#67e8f9')
}

export function drawPixelRingTarget(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const s = scale
  rect(ctx, x - s, y + 5 * s, 2 * s, 15 * s, '#d4a574')
  drawPixelGlyphOnCanvas(ctx, 'target', x, y, 8 * s, {
    primary: '#ef4444',
    accent: '#fef2f2',
    dark: '#7f1d1d',
    light: '#ffffff',
  })
}

export function drawPixelConfettiBurst(ctx: CanvasCtx, x: number, y: number, scale = 2) {
  const colors = ['#fbbf24', '#22c55e', '#38bdf8', '#f472b6', '#a78bfa']
  colors.forEach((color, i) => {
    const s = scale + (i % 2)
    const angle = (Math.PI * 2 * i) / colors.length
    rect(ctx, x + Math.cos(angle) * 13 - s, y + Math.sin(angle) * 9 - s, s * 2, s * 2, color)
  })
  drawPixelGlyphOnCanvas(ctx, 'sparkle', x, y, 18, {
    primary: '#fbbf24',
    accent: '#ffffff',
    dark: '#a16207',
    light: '#fef3c7',
  })
}

export function drawThrowPips(ctx: CanvasCtx, x: number, y: number, remaining: number, max = 5) {
  for (let i = 0; i < max; i++) {
    const filled = i < remaining
    rect(ctx, x + i * 9, y, 6, 6, filled ? '#ef4444' : 'rgba(255,255,255,0.16)')
    rect(ctx, x + i * 9 + 1, y + 1, 2, 2, filled ? '#fecaca' : 'rgba(255,255,255,0.22)')
  }
}

export function drawPixelCampfire(ctx: CanvasCtx, x: number, y: number, frame = 0, scale = 1.4) {
  const s = scale
  rect(ctx, x - 5 * s, y + 3 * s, 10 * s, 2 * s, '#5c4033')
  rect(ctx, x - 4 * s, y + s, 8 * s, 2 * s, '#7c2d12')
  rect(ctx, x - 2 * s, y - 6 * s, 4 * s, 8 * s, frame % 2 ? '#f97316' : '#ef4444')
  rect(ctx, x - s, y - 8 * s, 2 * s, 5 * s, '#fbbf24')
  rect(ctx, x - 3 * s, y - 2 * s, 2 * s, 4 * s, '#fb923c')
  rect(ctx, x + s, y - 3 * s, 2 * s, 5 * s, '#fb923c')
}

export function drawPixelTelescope(ctx: CanvasCtx, x: number, y: number, scale = 1.3) {
  const s = scale
  rect(ctx, x - 6 * s, y - 5 * s, 11 * s, 3 * s, '#94a3b8')
  rect(ctx, x + 4 * s, y - 6 * s, 3 * s, 5 * s, '#cbd5e1')
  rect(ctx, x - 2 * s, y - 2 * s, 2 * s, 8 * s, '#64748b')
  rect(ctx, x - 5 * s, y + 5 * s, 3 * s, 2 * s, '#64748b')
  rect(ctx, x + s, y + 5 * s, 3 * s, 2 * s, '#64748b')
}

export function drawPixelFishingRod(ctx: CanvasCtx, x: number, y: number, scale = 1.3) {
  const s = scale
  ctx.strokeStyle = '#d4a574'
  ctx.lineWidth = Math.max(1, s)
  ctx.beginPath()
  ctx.moveTo(x - 5 * s, y + 5 * s)
  ctx.lineTo(x + 4 * s, y - 8 * s)
  ctx.stroke()
  ctx.strokeStyle = '#93c5fd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 4 * s, y - 8 * s)
  ctx.lineTo(x + 7 * s, y + 3 * s)
  ctx.stroke()
  rect(ctx, x + 6 * s, y + 3 * s, 2 * s, 2 * s, '#38bdf8')
}

export function drawPixelClipboard(ctx: CanvasCtx, x: number, y: number, scale = 1.2) {
  const s = scale
  rect(ctx, x - 5 * s, y - 7 * s, 10 * s, 13 * s, '#f8fafc')
  rect(ctx, x - 3 * s, y - 9 * s, 6 * s, 3 * s, '#94a3b8')
  rect(ctx, x - 3 * s, y - 3 * s, 6 * s, s, '#38bdf8')
  rect(ctx, x - 3 * s, y, 6 * s, s, '#a3e635')
  rect(ctx, x - 3 * s, y + 3 * s, 4 * s, s, '#fbbf24')
}
