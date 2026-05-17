import { describe, expect, it } from 'vitest'
import { PIXEL_GLYPHS, resolvePixelGlyphKind } from './pixelGlyphArt'

describe('pixelGlyphArt', () => {
  it('keeps every glyph on a square 7px pattern grid', () => {
    for (const glyph of Object.values(PIXEL_GLYPHS)) {
      expect(glyph.pattern).toHaveLength(7)
      for (const row of glyph.pattern) {
        expect(row).toHaveLength(7)
        expect(row).toMatch(/^[padl.]+$/)
      }
    }
  })

  it('maps legacy HUD emoji to pixel glyph identities', () => {
    expect(resolvePixelGlyphKind('🧬')).toBe('dna')
    expect(resolvePixelGlyphKind('🗺️')).toBe('map')
    expect(resolvePixelGlyphKind('💰')).toBe('coin')
    expect(resolvePixelGlyphKind('🌫️')).toBe('fog')
    expect(resolvePixelGlyphKind('⛈️')).toBe('storm')
    expect(resolvePixelGlyphKind('🦋')).toBe('bug')
    expect(resolvePixelGlyphKind('🐸')).toBe('frog')
  })
})
