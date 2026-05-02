import { describe, it, expect } from 'vitest'
import { SFX, Music } from './sounds'

describe('SFX', () => {
  it('exports all expected sound effect functions', () => {
    expect(typeof SFX.attack).toBe('function')
    expect(typeof SFX.hit).toBe('function')
    expect(typeof SFX.criticalHit).toBe('function')
    expect(typeof SFX.enemyAttack).toBe('function')
    expect(typeof SFX.capture).toBe('function')
    expect(typeof SFX.captureFail).toBe('function')
    expect(typeof SFX.levelUp).toBe('function')
    expect(typeof SFX.evolution).toBe('function')
    expect(typeof SFX.battleStart).toBe('function')
    expect(typeof SFX.victory).toBe('function')
    expect(typeof SFX.defeat).toBe('function')
    expect(typeof SFX.flee).toBe('function')
    expect(typeof SFX.uiClick).toBe('function')
    expect(typeof SFX.menuOpen).toBe('function')
    expect(typeof SFX.menuClose).toBe('function')
    expect(typeof SFX.achievement).toBe('function')
    expect(typeof SFX.step).toBe('function')
    expect(typeof SFX.hatch).toBe('function')
    expect(typeof SFX.dodge).toBe('function')
    expect(typeof SFX.heal).toBe('function')
  })
})

describe('Music', () => {
  it('exports all expected music functions', () => {
    expect(typeof Music.play).toBe('function')
    expect(typeof Music.stop).toBe('function')
    expect(typeof Music.setVolume).toBe('function')
    expect(typeof Music.isPlaying).toBe('function')
    expect(typeof Music.toggle).toBe('function')
  })

  it('isPlaying returns false initially', () => {
    expect(Music.isPlaying()).toBe(false)
  })
})
