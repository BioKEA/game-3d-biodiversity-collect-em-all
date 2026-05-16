import { describe, it, expect } from 'vitest'
import { advanceTime, getTimeOfDay, getTimeLabel, getTimeSky, rollWeather, getWeatherInfo, getBattleModifiers } from './timeWeather'

describe('Time System', () => {
  it('getTimeOfDay returns correct periods', () => {
    expect(getTimeOfDay(360)).toBe('dawn')   // 6:00
    expect(getTimeOfDay(600)).toBe('day')     // 10:00
    expect(getTimeOfDay(1100)).toBe('dusk')   // 18:20
    expect(getTimeOfDay(1260)).toBe('night')  // 21:00
    expect(getTimeOfDay(60)).toBe('night')    // 1:00
  })

  it('advanceTime wraps around at 1440', () => {
    const result = advanceTime(1430, 20)
    expect(result.gameMinutes).toBe(10)
  })

  it('getTimeLabel returns formatted time string', () => {
    const label = getTimeLabel(780) // 13:00
    expect(label).toContain('1:00')
  })

  it('getTimeSky returns valid data for all times', () => {
    for (const time of ['dawn', 'day', 'dusk', 'night'] as const) {
      const sky = getTimeSky(time)
      expect(sky.bg).toBeTruthy()
      expect(sky.icon).toBeTruthy()
    }
  })
})

describe('Weather System', () => {
  it('rollWeather returns valid weather types', () => {
    const validWeathers = ['clear', 'fog', 'rain', 'wind', 'sunny', 'thunderstorm']
    for (let i = 0; i < 100; i++) {
      const weather = rollWeather('clear', 'forest')
      expect(validWeathers).toContain(weather)
    }
  })

  it('getWeatherInfo returns valid data for all types', () => {
    for (const weather of ['clear', 'fog', 'rain', 'wind', 'sunny', 'thunderstorm'] as const) {
      const info = getWeatherInfo(weather)
      expect(info.icon).toBeTruthy()
      expect(info.label).toBeTruthy()
    }
  })
})

describe('Battle Modifiers', () => {
  it('returns modifier object with correct shape', () => {
    const mods = getBattleModifiers('clear', 'day', 'beast', 'bird')
    expect(mods).toHaveProperty('playerAtkMod')
    expect(mods).toHaveProperty('playerDefMod')
    expect(mods).toHaveProperty('playerSpdMod')
    expect(mods).toHaveProperty('enemyAtkMod')
    expect(mods).toHaveProperty('enemyDefMod')
    expect(mods).toHaveProperty('enemySpdMod')
  })

  it('all modifiers are positive numbers', () => {
    for (const time of ['dawn', 'day', 'dusk', 'night'] as const) {
      for (const weather of ['clear', 'fog', 'rain', 'wind', 'sunny', 'thunderstorm'] as const) {
        const mods = getBattleModifiers(weather, time, 'beast', 'bird')
        expect(mods.playerAtkMod).toBeGreaterThan(0)
        expect(mods.playerDefMod).toBeGreaterThan(0)
        expect(mods.playerSpdMod).toBeGreaterThan(0)
        expect(mods.enemyAtkMod).toBeGreaterThan(0)
        expect(mods.enemyDefMod).toBeGreaterThan(0)
        expect(mods.enemySpdMod).toBeGreaterThan(0)
      }
    }
  })

  it('rain boosts marine attack', () => {
    const mods = getBattleModifiers('rain', 'day', 'marine', 'beast')
    expect(mods.playerAtkMod).toBeGreaterThan(1)
  })

  it('night boosts mystic attack', () => {
    const mods = getBattleModifiers('clear', 'night', 'mystic', 'bird')
    expect(mods.playerAtkMod).toBeGreaterThan(1)
  })
})
