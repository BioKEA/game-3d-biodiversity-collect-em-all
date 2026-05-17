import type { CSSProperties } from 'react'
import {
  getPixelGlyphDefinition,
  getPixelGlyphToneColor,
  resolvePixelGlyphKind,
  type PixelGlyphKind,
  type PixelGlyphPalette,
  type PixelGlyphTone,
} from './pixelGlyphArt'

interface Props {
  glyph?: PixelGlyphKind
  source?: unknown
  size?: number
  palette: PixelGlyphPalette
  className?: string
  style?: CSSProperties
}

export default function PixelGlyph({ glyph, source, size = 16, palette, className, style }: Props) {
  const kind = glyph ?? resolvePixelGlyphKind(source)
  if (!kind) return null

  const definition = getPixelGlyphDefinition(kind)
  const cell = Math.max(1, Math.floor(size / 7))
  const drawnSize = cell * 7

  return (
    <span
      className={`relative inline-block shrink-0${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-pixel-glyph={kind}
      title={definition.label}
      style={{ ...style, width: drawnSize, height: drawnSize }}
    >
      {definition.pattern.map((row, rowIndex) =>
        Array.from(row).map((tone, colIndex) => {
          if (tone === '.') return null
          const color = getPixelGlyphToneColor(tone as PixelGlyphTone, palette)
          return (
            <span
              key={`${rowIndex}-${colIndex}`}
              className="absolute"
              style={{
                left: colIndex * cell,
                top: rowIndex * cell,
                width: cell,
                height: cell,
                background: color,
                boxShadow: tone === 'l' ? `0 0 ${Math.max(2, cell)}px ${color}66` : undefined,
              }}
            />
          )
        }),
      )}
    </span>
  )
}
