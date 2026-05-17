export type PixelGlyphTone = 'p' | 'a' | 'd' | 'l'

export type PixelGlyphKind =
  | 'arena'
  | 'backpack'
  | 'bell'
  | 'book'
  | 'boot'
  | 'calendar'
  | 'capsule'
  | 'check'
  | 'clipboard'
  | 'coin'
  | 'craft'
  | 'crown'
  | 'dna'
  | 'egg'
  | 'fish'
  | 'fog'
  | 'gem'
  | 'heart'
  | 'home'
  | 'leaf'
  | 'lightning'
  | 'lock'
  | 'map'
  | 'medal'
  | 'moon'
  | 'music'
  | 'bug'
  | 'frog'
  | 'paw'
  | 'pin'
  | 'rain'
  | 'reptile'
  | 'shield'
  | 'shop'
  | 'sparkle'
  | 'speaker'
  | 'storm'
  | 'sun'
  | 'sword'
  | 'target'
  | 'trophy'
  | 'trade'
  | 'warning'
  | 'water'
  | 'wing'
  | 'wind'

export interface PixelGlyphPalette {
  primary: string
  accent: string
  dark: string
  light?: string
}

export interface PixelGlyphDefinition {
  label: string
  pattern: string[]
}

export const PIXEL_GLYPHS: Record<PixelGlyphKind, PixelGlyphDefinition> = {
  arena: { label: 'Arena', pattern: ['..pp...', '.pddp..', 'pddddp.', 'pdaadp.', '.pddp..', '..pp...', '...d...'] },
  backpack: { label: 'Pack', pattern: ['..aa...', '.app...', 'ppppp..', 'pdpdp..', 'ppppp..', 'pdddp..', '.ddd...'] },
  bell: { label: 'Bell', pattern: ['..a....', '.ppp...', '.pap...', 'ppppp..', 'ppppp..', '.ddd...', '..d....'] },
  book: { label: 'Book', pattern: ['.pppa..', 'pplpa..', 'pplpa..', 'pplpa..', 'pplpa..', '.dddd..', '..aa...'] },
  boot: { label: 'Steps', pattern: ['.pp....', '.pp....', '.ppp...', '.pdp...', '.pddp..', '.ddddp.', '..aaaa.'] },
  calendar: { label: 'Calendar', pattern: ['p.p.p..', 'aaaaa..', 'pdpdp..', 'ppppp..', 'pdpdp..', 'ppppp..', 'ddddd..'] },
  capsule: { label: 'Capsule', pattern: ['..aa...', '.appp..', 'apllp..', 'apdap..', '.pddp..', '..dd...', '..a....'] },
  check: { label: 'Done', pattern: ['.......', '.....p.', '....pp.', '.p.pp..', '.ppp...', '..p....', '.......'] },
  clipboard: { label: 'Notes', pattern: ['.aaa...', 'ppppp..', 'ppllp..', 'pdpdp..', 'ppllp..', 'pdpdp..', 'ddddd..'] },
  coin: { label: 'Coin', pattern: ['..aaa..', '.apppa.', 'applpa.', 'appdpa.', '.apppa.', '..ddd..', '.......'] },
  craft: { label: 'Craft', pattern: ['..pp...', '..pp...', '.pddp..', 'pdaap..', 'paaap..', '.ppp...', '..dd...'] },
  crown: { label: 'Crown', pattern: ['p...p..', 'pa.ap..', 'papap..', 'ppppp..', 'paapd..', 'ddddd..', '.......'] },
  dna: { label: 'DNA', pattern: ['p...a..', '.p.a...', '..p....', '.a.p...', 'a...p..', '.a.p...', '..a....'] },
  egg: { label: 'Egg', pattern: ['..aa...', '.appp..', '.pllp..', 'apppp..', 'appdp..', '.pddp..', '..dd...'] },
  fish: { label: 'Fish', pattern: ['.......', '..ppp..', '.pllap.', 'pllllap', '.pllap.', '..ddd..', '.......'] },
  fog: { label: 'Fog', pattern: ['.......', '.llll..', 'lllll..', '..aaaa.', 'aaaaa..', '.dddd..', '.......'] },
  gem: { label: 'Gem', pattern: ['.aaaa..', 'applpa.', 'pllllap', '.pplp..', '..pp...', '..d....', '.......'] },
  heart: { label: 'Heart', pattern: ['.pp.pp.', 'pplplp.', 'pplllp.', '.pllp..', '..pp...', '..d....', '.......'] },
  home: { label: 'Home', pattern: ['..a....', '.apa...', 'apppa..', 'ppppp..', 'pdpdp..', 'pdpdp..', 'ddddd..'] },
  leaf: { label: 'Leaf', pattern: ['....a..', '..aaa..', '.appp..', 'apppd..', '.pdd...', '..d....', '.d.....'] },
  lightning: { label: 'Bolt', pattern: ['...a...', '..aa...', '..p....', '.ppp...', '..d....', '.dd....', '.d.....'] },
  lock: { label: 'Locked', pattern: ['..aaa..', '.p...p.', '.p...p.', 'pppppp.', 'ppdppp.', 'pppppp.', '.ddddd.'] },
  map: { label: 'Map', pattern: ['pp.aap.', 'plpapl.', 'plpapl.', 'plpapl.', 'plpapl.', 'dd.pdd.', '.......'] },
  medal: { label: 'Medal', pattern: ['p...p..', '.p.p...', '..a....', '.appp..', 'applpa.', '.pddp..', '..d....'] },
  moon: { label: 'Moon', pattern: ['..aaa..', '.appp..', 'apd....', 'apd....', '.appp..', '..ddd..', '.......'] },
  music: { label: 'Music', pattern: ['..ppp..', '..p.p..', '..p.p..', '..p....', 'app....', 'app....', '.dd....'] },
  bug: { label: 'Insect', pattern: ['.a...a.', '..p.p..', '.pppp..', 'applpa.', '.pppp..', '..d.d..', '.d...d.'] },
  frog: { label: 'Amphibian', pattern: ['.a...a.', 'appppa.', 'pllllp.', 'pppppp.', '.pddp..', 'p....p.', 'd....d.'] },
  paw: { label: 'Beast', pattern: ['.p.p...', 'p.p.p..', '.......', '.ppp...', 'ppppp..', 'ppppp..', '.ddd...'] },
  pin: { label: 'Pin', pattern: ['..aa...', '.appp..', 'apllp..', 'apppp..', '.pdp...', '..d....', '..d....'] },
  rain: { label: 'Rain', pattern: ['.llll..', 'lllll..', '..a.a..', '.p.p...', '..d.d..', '.d.d...', '.......'] },
  reptile: { label: 'Reptile', pattern: ['..aaa..', '.appdp.', 'apppp..', 'ppllp..', '.pdp...', 'p...p..', 'd...d..'] },
  shield: { label: 'Shield', pattern: ['.aaaa..', 'appppa.', 'apllpa.', 'appppa.', '.pddp..', '..dd...', '..d....'] },
  shop: { label: 'Shop', pattern: ['aaaaa..', 'pdpdp..', 'ppppp..', 'ppllp..', 'ppldp..', 'ppppp..', 'ddddd..'] },
  sparkle: { label: 'Sparkle', pattern: ['...p...', '...p...', '.papa..', '..apa..', '.papa..', '...d...', '...d...'] },
  speaker: { label: 'Audio', pattern: ['..p....', '.ppp...', 'pppp...', '.ppp.a.', '..p..a.', '.....d.', '.......'] },
  storm: { label: 'Storm', pattern: ['.llll..', 'lllll..', '..aa...', '..p....', '.ppp...', '..d.d..', '.d.d...'] },
  sun: { label: 'Sun', pattern: ['p..p..p', '..aaa..', '.apppa.', 'papppap', '.apppa.', '..ddd..', 'd..d..d'] },
  sword: { label: 'Battle', pattern: ['....a..', '...a...', '..p....', '.p.....', 'pdp....', '.d.....', 'd......'] },
  target: { label: 'Target', pattern: ['..aaa..', '.apppa.', 'apdadpa', 'apdpdpa', 'apdadpa', '.apppa.', '..ddd..'] },
  trophy: { label: 'Trophy', pattern: ['.aaaa..', 'appppa.', 'appppa.', '.appp..', '..p....', '.ppp...', 'ddddd..'] },
  trade: { label: 'Trade', pattern: ['.ppp...', '...p...', '...pp..', '.......', '..aa...', '...a...', 'aaa....'] },
  warning: { label: 'Alert', pattern: ['...a...', '..aaa..', '..apa..', '.apap..', '.apap..', 'appppa.', 'dddddd.'] },
  water: { label: 'Water', pattern: ['.......', '.a...a.', 'apa.ap.', 'pplppa.', '.pppp..', '..ddd..', '.......'] },
  wing: { label: 'Bird', pattern: ['a......', 'pa.....', 'ppa....', 'pppa...', 'pdp....', '.d.....', '..d....'] },
  wind: { label: 'Wind', pattern: ['.......', '.llll..', '....l..', 'aaaaa..', '...a...', '.dddd..', '.......'] },
}

const GLYPH_ALIASES: Record<string, PixelGlyphKind> = {
  '⚗': 'craft',
  '⚔': 'sword',
  '⚡': 'lightning',
  '⚠': 'warning',
  '☀': 'sun',
  '☔': 'rain',
  '☠': 'warning',
  '✦': 'sparkle',
  '✓': 'check',
  '✅': 'check',
  '🌅': 'sun',
  '🌇': 'sun',
  '🌑': 'moon',
  '🌒': 'moon',
  '🌓': 'moon',
  '🌔': 'moon',
  '🌕': 'moon',
  '🌖': 'moon',
  '🌗': 'moon',
  '🌘': 'moon',
  '🌙': 'moon',
  '🌤': 'sun',
  '🌧': 'rain',
  '🌫': 'fog',
  '🌟': 'sparkle',
  '🌊': 'water',
  '🌿': 'leaf',
  '🍂': 'leaf',
  '🎒': 'backpack',
  '🎖': 'medal',
  '🎯': 'target',
  '🎵': 'music',
  '🏃': 'boot',
  '🏅': 'medal',
  '🏆': 'trophy',
  '🏠': 'home',
  '🏪': 'shop',
  '🏳': 'warning',
  '🐟': 'fish',
  '🐌': 'reptile',
  '🐍': 'reptile',
  '🐢': 'reptile',
  '🐦': 'wing',
  '🐱': 'paw',
  '🐸': 'frog',
  '🐺': 'paw',
  '🐾': 'paw',
  '🐿': 'paw',
  '💎': 'gem',
  '💠': 'gem',
  '💧': 'water',
  '💗': 'heart',
  '💖': 'heart',
  '💛': 'heart',
  '💰': 'coin',
  '💨': 'wind',
  '💫': 'sparkle',
  '🔄': 'trade',
  '🔊': 'speaker',
  '🔇': 'speaker',
  '🔔': 'bell',
  '🔒': 'lock',
  '🔮': 'capsule',
  '🗺': 'map',
  '📝': 'clipboard',
  '📍': 'pin',
  '📅': 'calendar',
  '📋': 'clipboard',
  '📖': 'book',
  '📚': 'book',
  '📓': 'book',
  '📦': 'backpack',
  '🔬': 'craft',
  '👑': 'crown',
  '👟': 'boot',
  '👣': 'boot',
  '🤍': 'heart',
  '🤝': 'trade',
  '🤿': 'water',
  '🥊': 'arena',
  '🥚': 'egg',
  '🥈': 'medal',
  '🥉': 'medal',
  '🧬': 'dna',
  '🧪': 'craft',
  '🪙': 'coin',
  '🪴': 'leaf',
  '🫧': 'water',
  '🦅': 'wing',
  '🦊': 'paw',
  '🦋': 'bug',
  '🦎': 'reptile',
  '🦭': 'water',
  '🦦': 'water',
  '🦉': 'wing',
  '🦌': 'paw',
  '🦇': 'wing',
  '🦝': 'paw',
  '🪽': 'wing',
  '🪲': 'bug',
  '🪶': 'wing',
  '🛡': 'shield',
  '🗡': 'sword',
  '🗺️': 'map',
  '⛈': 'storm',
  '⭐': 'sparkle',
  '✨': 'sparkle',
}

export function resolvePixelGlyphKind(source: unknown): PixelGlyphKind | null {
  if (typeof source !== 'string') return null
  const normalized = source.replace(/\uFE0F/g, '').trim()
  if (GLYPH_ALIASES[normalized]) return GLYPH_ALIASES[normalized]
  if (normalized.includes('🌧') || normalized.includes('☔')) return 'rain'
  if (normalized.includes('⛈')) return 'storm'
  if (normalized.includes('🌫')) return 'fog'
  if (normalized.includes('☀') || normalized.includes('🌤')) return 'sun'
  if (normalized.includes('🌕') || normalized.includes('🌑') || normalized.includes('🌙')) return 'moon'
  if (normalized.includes('🗺')) return 'map'
  if (normalized.includes('🏆') || normalized.includes('🏅')) return 'medal'
  if (normalized.includes('💰')) return 'coin'
  if (normalized.includes('✨') || normalized.includes('⭐')) return 'sparkle'
  return null
}

export function getPixelGlyphDefinition(kind: PixelGlyphKind): PixelGlyphDefinition {
  return PIXEL_GLYPHS[kind]
}

export function getPixelGlyphToneColor(tone: PixelGlyphTone, palette: PixelGlyphPalette): string {
  if (tone === 'a') return palette.accent
  if (tone === 'd') return palette.dark
  if (tone === 'l') return palette.light ?? '#f8f2d8'
  return palette.primary
}

export function drawPixelGlyphOnCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  kind: PixelGlyphKind,
  x: number,
  y: number,
  size: number,
  palette: PixelGlyphPalette,
) {
  const glyph = getPixelGlyphDefinition(kind)
  const cell = Math.max(1, Math.floor(size / 7))
  const drawnSize = cell * 7
  const startX = Math.round(x - drawnSize / 2)
  const startY = Math.round(y - drawnSize / 2)
  glyph.pattern.forEach((row, rowIndex) => {
    Array.from(row).forEach((tone, colIndex) => {
      if (tone === '.') return
      ctx.fillStyle = getPixelGlyphToneColor(tone as PixelGlyphTone, palette)
      ctx.fillRect(startX + colIndex * cell, startY + rowIndex * cell, cell, cell)
    })
  })
}
