import type { TimeOfDay, WeatherType, BiomeType, Season } from '@/types/game'

// === SEASONS ===
// In-game year is 360 days, 90 days per season.
// Day 0 = Jan 1; meteorological seasons aligned to Northern Hemisphere.
const DAYS_PER_YEAR = 360
const DAYS_PER_MONTH = 30

export function getSeason(gameDay: number): Season {
  const day = ((gameDay % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR
  // Winter: Dec(11)-Feb(1) ≈ days 330-89 (rolling)
  // Spring: Mar-May → days 60-149
  // Summer: Jun-Aug → days 150-239
  // Fall:   Sep-Nov → days 240-329
  if (day < 60 || day >= 330) return 'winter'
  if (day < 150) return 'spring'
  if (day < 240) return 'summer'
  return 'fall'
}

export function getMonth(gameDay: number): number {
  const day = ((gameDay % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR
  return Math.floor(day / DAYS_PER_MONTH) % 12
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function getMonthName(gameDay: number): string {
  return MONTH_NAMES[getMonth(gameDay)]
}

export function getSeasonInfo(season: Season): { label: string; icon: string; color: string } {
  switch (season) {
    case 'winter': return { label: 'Winter', icon: '❄️', color: '#7dd3fc' }
    case 'spring': return { label: 'Spring', icon: '🌸', color: '#f9a8d4' }
    case 'summer': return { label: 'Summer', icon: '☀️', color: '#fde047' }
    case 'fall':   return { label: 'Fall',   icon: '🍂', color: '#fb923c' }
  }
}

/** Check whether a creature with a migration window is currently in season. */
export function isCreatureInSeason(
  migrationWindow: { startMonth: number; endMonth: number } | undefined,
  gameDay: number | undefined,
): boolean {
  if (!migrationWindow) return true
  const month = getMonth(gameDay ?? 0)
  const { startMonth, endMonth } = migrationWindow
  // Wraparound support (e.g. Nov..Feb = 10..1)
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth
  }
  return month >= startMonth || month <= endMonth
}

/** Advance game clock by minutes, return new total and derived time-of-day */
export function advanceTime(currentMinutes: number, delta: number): { gameMinutes: number; timeOfDay: TimeOfDay } {
  const gameMinutes = (currentMinutes + delta) % 1440 // wrap at 24h
  return { gameMinutes, timeOfDay: getTimeOfDay(gameMinutes) }
}

export function getTimeOfDay(minutes: number): TimeOfDay {
  if (minutes >= 300 && minutes < 420) return 'dawn'   // 5:00–7:00
  if (minutes >= 420 && minutes < 1080) return 'day'    // 7:00–18:00
  if (minutes >= 1080 && minutes < 1200) return 'dusk'  // 18:00–20:00
  return 'night'                                         // 20:00–5:00
}

export function getTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function getTimeSky(time: TimeOfDay): { bg: string; label: string; icon: string } {
  switch (time) {
    case 'dawn':  return { bg: 'from-orange-900/30 via-pink-900/20 to-blue-900/40', label: 'Dawn', icon: '🌅' }
    case 'day':   return { bg: 'from-cyan-900/20 via-blue-900/10 to-blue-900/20', label: 'Day', icon: '☀️' }
    case 'dusk':  return { bg: 'from-purple-900/30 via-orange-900/20 to-blue-900/40', label: 'Dusk', icon: '🌇' }
    case 'night': return { bg: 'from-indigo-950/40 via-blue-950/40 to-black/40', label: 'Night', icon: '🌙' }
  }
}

/** Weather changes randomly every ~60 game-minutes. Biome + season influences probability. */
export function rollWeather(_currentWeather: WeatherType, biome: BiomeType, gameDay?: number): WeatherType {
  return rollWeatherSeeded(Math.random(), biome, gameDay)
}

export function getWeatherInfo(weather: WeatherType): { icon: string; label: string; description: string } {
  switch (weather) {
    case 'clear':        return { icon: '🌤', label: 'Clear', description: 'No weather effects' }
    case 'fog':          return { icon: '🌫️', label: 'Foggy', description: 'Mystic types +25% ATK, SPD -10%' }
    case 'rain':         return { icon: '🌧️', label: 'Rainy', description: 'Marine/amphibian +25% ATK, bird SPD -20%' }
    case 'wind':         return { icon: '💨', label: 'Windy', description: 'Bird types +25% SPD, insect ATK -20%' }
    case 'sunny':        return { icon: '☀️', label: 'Sunny', description: 'Beast types +15% ATK, marine DEF -10%' }
    case 'thunderstorm': return { icon: '⛈️', label: 'Thunderstorm', description: 'Legendary +50% spawn, all ATK +20%, SPD -15%' }
  }
}

export interface BattleModifiers {
  playerAtkMod: number
  playerDefMod: number
  playerSpdMod: number
  enemyAtkMod: number
  enemyDefMod: number
  enemySpdMod: number
}

/** Calculate battle stat modifiers based on weather + time of day */
export function getBattleModifiers(
  weather: WeatherType,
  time: TimeOfDay,
  playerType: string,
  enemyType: string
): BattleModifiers {
  const mods: BattleModifiers = {
    playerAtkMod: 1, playerDefMod: 1, playerSpdMod: 1,
    enemyAtkMod: 1, enemyDefMod: 1, enemySpdMod: 1,
  }

  const applyWeather = (type: string, side: 'player' | 'enemy') => {
    const prefix = side === 'player' ? 'player' : 'enemy'
    switch (weather) {
      case 'fog':
        if (type === 'mystic') mods[`${prefix}AtkMod`] *= 1.25
        mods[`${prefix}SpdMod`] *= 0.90
        break
      case 'rain':
        if (type === 'marine' || type === 'amphibian') mods[`${prefix}AtkMod`] *= 1.25
        if (type === 'bird') mods[`${prefix}SpdMod`] *= 0.80
        break
      case 'wind':
        if (type === 'bird') mods[`${prefix}SpdMod`] *= 1.25
        if (type === 'insect') mods[`${prefix}AtkMod`] *= 0.80
        break
      case 'sunny':
        if (type === 'beast') mods[`${prefix}AtkMod`] *= 1.15
        if (type === 'marine') mods[`${prefix}DefMod`] *= 0.90
        break
      case 'thunderstorm':
        mods[`${prefix}AtkMod`] *= 1.20
        mods[`${prefix}SpdMod`] *= 0.85
        if (type === 'marine' || type === 'amphibian') mods[`${prefix}AtkMod`] *= 1.15
        if (type === 'mystic') mods[`${prefix}AtkMod`] *= 1.25
        break
    }
  }

  applyWeather(playerType, 'player')
  applyWeather(enemyType, 'enemy')

  // Night bonus for nocturnal types
  if (time === 'night' || time === 'dusk') {
    if (playerType === 'mystic' || playerType === 'beast') mods.playerAtkMod *= 1.10
    if (enemyType === 'mystic' || enemyType === 'beast') mods.enemyAtkMod *= 1.10
  }
  // Dawn/day bonus for birds
  if (time === 'dawn' || time === 'day') {
    if (playerType === 'bird') mods.playerSpdMod *= 1.10
    if (enemyType === 'bird') mods.enemySpdMod *= 1.10
  }

  return mods
}

/** Generate a deterministic weather forecast based on game time and biome.
 * Uses game-minute seed so the forecast is stable (doesn't change until the hour rolls). */
export function getWeatherForecast(
  currentMinutes: number,
  currentWeather: WeatherType,
  biome: BiomeType,
  count = 4,
  gameDay?: number,
): { time: string; weather: WeatherType; timeOfDay: TimeOfDay }[] {
  const forecast: { time: string; weather: WeatherType; timeOfDay: TimeOfDay }[] = []
  let weather = currentWeather
  for (let i = 1; i <= count; i++) {
    const futureMin = (currentMinutes + i * 60) % 1440
    const tod = getTimeOfDay(futureMin)
    const seed = Math.sin((Math.floor(currentMinutes / 60) + i) * 127.1 + biome.length * 311.7) * 43758.5453
    const r = seed - Math.floor(seed)
    weather = rollWeatherSeeded(r, biome, gameDay)
    forecast.push({
      time: getTimeLabel(futureMin),
      weather,
      timeOfDay: tod,
    })
  }
  return forecast
}

/** Seasonal weight multipliers — shift weather probabilities by season */
const SEASON_MODS: Record<Season, Partial<Record<WeatherType, number>>> = {
  winter: { rain: 1.6, thunderstorm: 1.4, fog: 1.3, sunny: 0.4, clear: 0.7 },
  spring: { rain: 1.2, clear: 1.2, wind: 1.3, fog: 0.8, thunderstorm: 1.1 },
  summer: { fog: 1.8, sunny: 1.5, clear: 1.2, rain: 0.3, thunderstorm: 0.5 },
  fall:   { wind: 1.5, fog: 1.2, rain: 1.0, clear: 1.0, thunderstorm: 0.8 },
}

interface WeatherWeights { clear: number; fog: number; rain: number; wind: number; sunny: number; thunderstorm: number }

function biomeBaseWeights(biome: BiomeType): WeatherWeights {
  if (biome === 'beach' || biome === 'water' || biome === 'kelp_forest')
    return { fog: 0.28, wind: 0.20, clear: 0.20, rain: 0.18, sunny: 0.10, thunderstorm: 0.04 }
  if (biome === 'tidepool')
    return { fog: 0.35, wind: 0.25, clear: 0.18, rain: 0.14, sunny: 0.05, thunderstorm: 0.03 }
  if (biome === 'redwood' || biome === 'forest')
    return { fog: 0.20, rain: 0.22, clear: 0.22, sunny: 0.18, wind: 0.10, thunderstorm: 0.08 }
  if (biome === 'oak_woodland')
    return { sunny: 0.25, clear: 0.28, fog: 0.12, wind: 0.15, rain: 0.13, thunderstorm: 0.07 }
  if (biome === 'chaparral' || biome === 'desert' || biome === 'dunes')
    return { sunny: 0.38, clear: 0.28, wind: 0.15, fog: 0.04, rain: 0.08, thunderstorm: 0.07 }
  if (biome === 'marsh')
    return { fog: 0.25, rain: 0.25, clear: 0.22, wind: 0.12, sunny: 0.08, thunderstorm: 0.08 }
  if (biome === 'mountain' || biome === 'alpine' || biome === 'snow')
    return { wind: 0.22, clear: 0.22, sunny: 0.18, fog: 0.12, rain: 0.15, thunderstorm: 0.11 }
  if (biome === 'grassland' || biome === 'valley')
    return { clear: 0.25, sunny: 0.22, wind: 0.18, fog: 0.12, rain: 0.15, thunderstorm: 0.08 }
  // urban / default
  return { clear: 0.28, sunny: 0.22, fog: 0.18, rain: 0.16, wind: 0.10, thunderstorm: 0.06 }
}

function rollWeatherSeeded(r: number, biome: BiomeType, gameDay?: number): WeatherType {
  const base = biomeBaseWeights(biome)
  const season = getSeason(gameDay ?? 0)
  const mods = SEASON_MODS[season]

  const w: WeatherWeights = {
    clear:        base.clear        * (mods.clear ?? 1),
    fog:          base.fog          * (mods.fog ?? 1),
    rain:         base.rain         * (mods.rain ?? 1),
    wind:         base.wind         * (mods.wind ?? 1),
    sunny:        base.sunny        * (mods.sunny ?? 1),
    thunderstorm: base.thunderstorm * (mods.thunderstorm ?? 1),
  }

  const total = w.clear + w.fog + w.rain + w.wind + w.sunny + w.thunderstorm
  const pick = r * total
  let cum = 0
  for (const [type, weight] of Object.entries(w) as [WeatherType, number][]) {
    cum += weight
    if (pick < cum) return type
  }
  return 'clear'
}

/** Time-of-day affects encounter rates for certain creatures */
export function isCreatureActiveNow(activeTime: TimeOfDay[] | undefined, currentTime: TimeOfDay): boolean {
  if (!activeTime || activeTime.length === 0) return true
  return activeTime.includes(currentTime)
}
