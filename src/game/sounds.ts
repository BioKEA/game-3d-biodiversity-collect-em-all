// Web Audio API sound effects — no external files needed
// Uses oscillators and noise to synthesize retro game sounds

let audioCtx: AudioContext | null = null
let sfxVolume = 1.0 // 0-1 multiplier

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) {
  volume *= sfxVolume
  if (volume < 0.001) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playNoise(duration: number, volume = 0.05) {
  volume *= sfxVolume
  if (volume < 0.001) return
  const ctx = getCtx()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

// === CREATURE CRY SYSTEM ===
// Each creature type gets a unique synthesized cry based on its type and ID hash
// Used on battle entry and when attacking

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

type CreatureCryType = 'beast' | 'bird' | 'insect' | 'marine' | 'amphibian' | 'mystic' | 'reptile' | 'plant'

function playCreatureCry(creatureId: string, creatureType: CreatureCryType, short = false) {
  const vol = sfxVolume * 0.08
  if (vol < 0.001) return
  const ctx = getCtx()
  const h = hashString(creatureId)
  const dur = short ? 0.15 : 0.35

  switch (creatureType) {
    case 'beast': {
      // Deep growl with harmonic overtone
      const baseFreq = 100 + (h % 80)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, ctx.currentTime + dur)
      const osc2 = ctx.createOscillator()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + dur * 0.6)
      const g1 = ctx.createGain()
      g1.gain.setValueAtTime(vol, ctx.currentTime)
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      const g2 = ctx.createGain()
      g2.gain.setValueAtTime(vol * 0.5, ctx.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur * 0.7)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 400 + (h % 200)
      osc1.connect(lp); lp.connect(g1); g1.connect(ctx.destination)
      osc2.connect(g2); g2.connect(ctx.destination)
      osc1.start(); osc1.stop(ctx.currentTime + dur)
      osc2.start(); osc2.stop(ctx.currentTime + dur)
      break
    }
    case 'bird': {
      // High-pitched chirp with rapid frequency sweep
      const baseFreq = 1800 + (h % 1200)
      const noteCount = short ? 1 : 2 + (h % 2)
      for (let n = 0; n < noteCount; n++) {
        const t = ctx.currentTime + n * 0.09
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        const freq = baseFreq + (n % 2 === 0 ? 1 : -1) * (h % 400)
        osc.frequency.setValueAtTime(freq, t)
        osc.frequency.exponentialRampToValueAtTime(freq * (1 + (h % 30) / 100), t + 0.06)
        const g = ctx.createGain()
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(t); osc.stop(t + 0.1)
      }
      break
    }
    case 'insect': {
      // Buzzy rapid oscillation
      const baseFreq = 300 + (h % 300)
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      // Rapid vibrato
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 30 + (h % 40)
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = baseFreq * 0.3
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      const g = ctx.createGain()
      g.gain.setValueAtTime(vol * 0.7, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = baseFreq * 2
      bp.Q.value = 3
      osc.connect(bp); bp.connect(g); g.connect(ctx.destination)
      lfo.start(); osc.start()
      lfo.stop(ctx.currentTime + dur); osc.stop(ctx.currentTime + dur)
      break
    }
    case 'marine': {
      // Whale-like sweep — low frequency with slow glide
      const baseFreq = 150 + (h % 150)
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + dur * 0.4)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(vol, ctx.currentTime)
      g.gain.setValueAtTime(vol * 0.8, ctx.currentTime + dur * 0.4)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + dur)
      // Bubble overlay
      if (!short) {
        setTimeout(() => {
          const bub = ctx.createOscillator()
          bub.type = 'sine'
          bub.frequency.setValueAtTime(800 + (h % 400), ctx.currentTime)
          bub.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.04)
          const bg = ctx.createGain()
          bg.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
          bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
          bub.connect(bg); bg.connect(ctx.destination)
          bub.start(); bub.stop(ctx.currentTime + 0.06)
        }, dur * 300)
      }
      break
    }
    case 'amphibian': {
      // Croak — frequency-descending with resonance
      const baseFreq = 200 + (h % 200)
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(baseFreq * 1.4, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + dur * 0.6)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 500 + (h % 300)
      lp.Q.value = 5
      const g = ctx.createGain()
      g.gain.setValueAtTime(vol, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.connect(lp); lp.connect(g); g.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + dur)
      // Second croak echo
      if (!short) {
        setTimeout(() => {
          const o2 = ctx.createOscillator()
          o2.type = 'sawtooth'
          o2.frequency.setValueAtTime(baseFreq * 1.2, ctx.currentTime)
          o2.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, ctx.currentTime + 0.15)
          const g2 = ctx.createGain()
          g2.gain.setValueAtTime(vol * 0.6, ctx.currentTime)
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
          o2.connect(lp); lp.connect(g2); g2.connect(ctx.destination)
          o2.start(); o2.stop(ctx.currentTime + 0.18)
        }, dur * 600)
      }
      break
    }
    case 'mystic': {
      // Ethereal shimmer — detuned sine pair with reverb-like tail
      const baseFreq = 400 + (h % 400)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.value = baseFreq
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = baseFreq * 1.008 // slight detune for shimmer
      const osc3 = ctx.createOscillator()
      osc3.type = 'triangle'
      osc3.frequency.value = baseFreq * 1.5
      const g1 = ctx.createGain()
      g1.gain.setValueAtTime(vol, ctx.currentTime)
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur * 1.5)
      const g2 = ctx.createGain()
      g2.gain.setValueAtTime(vol * 0.7, ctx.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur * 1.5)
      const g3 = ctx.createGain()
      g3.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
      g3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc1.connect(g1); g1.connect(ctx.destination)
      osc2.connect(g2); g2.connect(ctx.destination)
      osc3.connect(g3); g3.connect(ctx.destination)
      osc1.start(); osc2.start(); osc3.start()
      const endTime = ctx.currentTime + dur * 1.5
      osc1.stop(endTime); osc2.stop(endTime); osc3.stop(endTime)
      break
    }
    case 'reptile': {
      // Dry hiss / rattle — sawtooth with rapid amplitude flutter
      const baseFreq = 500 + (h % 400)
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      // Rapid amplitude stutter for a rattle-like feel
      const steps = short ? 4 : 8
      for (let i = 0; i < steps; i++) {
        const t = ctx.currentTime + (i / steps) * dur
        g.gain.setValueAtTime(vol * 0.6, t)
        g.gain.setValueAtTime(vol * 0.1, t + dur / (steps * 2))
      }
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 400
      osc.connect(hp); hp.connect(g); g.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + dur)
      break
    }
    case 'plant': {
      // Soft wooden rustle — low triangle with gentle pitch drift
      const baseFreq = 140 + (h % 120)
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + dur * 0.5)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, ctx.currentTime + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(vol * 0.8, ctx.currentTime + dur * 0.15)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 800
      osc.connect(lp); lp.connect(g); g.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + dur)
      break
    }
  }
}

export const SFX = {
  /** Player attacks — quick ascending blip */
  attack() {
    playTone(200, 0.08, 'square', 0.08)
    setTimeout(() => playTone(400, 0.06, 'square', 0.06), 50)
    setTimeout(() => playTone(600, 0.04, 'square', 0.04), 90)
  },

  /** Hit lands — short crunch */
  hit() {
    playNoise(0.08, 0.06)
    playTone(150, 0.1, 'sawtooth', 0.05)
  },

  /** Critical hit — sharper, louder */
  criticalHit() {
    playTone(300, 0.05, 'square', 0.12)
    setTimeout(() => playTone(600, 0.05, 'square', 0.1), 40)
    setTimeout(() => playTone(900, 0.08, 'square', 0.08), 70)
    setTimeout(() => playNoise(0.1, 0.08), 80)
  },

  /** Enemy attacks */
  enemyAttack() {
    playTone(400, 0.06, 'sawtooth', 0.06)
    setTimeout(() => playTone(200, 0.08, 'sawtooth', 0.05), 60)
  },

  /** Successful capture — ascending melody */
  capture() {
    const notes = [262, 330, 392, 523] // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'square', 0.08), i * 120)
    })
  },

  /** Capture failed — descending sad tone */
  captureFail() {
    playTone(400, 0.15, 'triangle', 0.06)
    setTimeout(() => playTone(300, 0.2, 'triangle', 0.05), 150)
  },

  /** Level up — fanfare */
  levelUp() {
    const notes = [262, 330, 392, 523, 659] // C E G C E
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'square', 0.07), i * 100)
    })
    setTimeout(() => playTone(784, 0.4, 'square', 0.09), 500) // G5 sustain
  },

  /** Evolution — dramatic ascending sequence */
  evolution() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(200 + i * 80, 0.15, 'sine', 0.06)
        playTone(200 + i * 80 + 5, 0.15, 'sine', 0.04) // slight detune for shimmer
      }, i * 150)
    }
    // Final chord
    setTimeout(() => {
      playTone(523, 0.5, 'sine', 0.08)
      playTone(659, 0.5, 'sine', 0.06)
      playTone(784, 0.5, 'sine', 0.06)
    }, 1300)
  },

  /** Battle start — alert tones */
  battleStart() {
    playTone(330, 0.1, 'square', 0.07)
    setTimeout(() => playTone(440, 0.1, 'square', 0.07), 100)
    setTimeout(() => playTone(554, 0.15, 'square', 0.08), 200)
  },

  /** Victory — triumphant melody */
  victory() {
    const notes = [392, 494, 587, 784] // G B D G
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'square', 0.07), i * 130)
    })
    setTimeout(() => {
      playTone(784, 0.5, 'sine', 0.06)
      playTone(988, 0.5, 'sine', 0.04)
    }, 550)
  },

  /** Defeat — sad descending */
  defeat() {
    playTone(400, 0.2, 'triangle', 0.06)
    setTimeout(() => playTone(350, 0.2, 'triangle', 0.05), 200)
    setTimeout(() => playTone(300, 0.2, 'triangle', 0.04), 400)
    setTimeout(() => playTone(250, 0.4, 'triangle', 0.03), 600)
  },

  /** Flee / run away */
  flee() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(600 - i * 100, 0.06, 'square', 0.05), i * 60)
    }
  },

  /** UI click/select */
  uiClick() {
    playTone(800, 0.04, 'square', 0.04)
  },

  /** Menu open */
  menuOpen() {
    playTone(500, 0.06, 'sine', 0.05)
    setTimeout(() => playTone(700, 0.06, 'sine', 0.04), 50)
  },

  /** Menu close */
  menuClose() {
    playTone(700, 0.06, 'sine', 0.04)
    setTimeout(() => playTone(500, 0.06, 'sine', 0.03), 50)
  },

  /** Achievement unlocked */
  achievement() {
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.2, 'sine', 0.07)
        playTone(freq * 1.005, 0.2, 'sine', 0.05) // shimmer
      }, i * 100)
    })
  },

  /** Step / footstep — subtle */
  step() {
    playTone(80 + Math.random() * 40, 0.03, 'triangle', 0.02)
  },

  /** Breed/hatch */
  hatch() {
    playTone(400, 0.1, 'sine', 0.06)
    setTimeout(() => playTone(500, 0.1, 'sine', 0.06), 100)
    setTimeout(() => playTone(600, 0.1, 'sine', 0.06), 200)
    setTimeout(() => playTone(800, 0.3, 'sine', 0.08), 350)
  },

  /** Dodge — quick swoosh */
  dodge() {
    playNoise(0.06, 0.04)
    playTone(1200, 0.06, 'sine', 0.03)
  },

  /** Creature cry — played on battle entry */
  creatureCry(creatureId: string, creatureType: CreatureCryType) {
    playCreatureCry(creatureId, creatureType, false)
  },

  /** Short creature cry — played on attack */
  creatureCryShort(creatureId: string, creatureType: CreatureCryType) {
    playCreatureCry(creatureId, creatureType, true)
  },

  /** Heal */
  heal() {
    playTone(523, 0.12, 'sine', 0.05)
    setTimeout(() => playTone(659, 0.12, 'sine', 0.05), 80)
    setTimeout(() => playTone(784, 0.15, 'sine', 0.06), 160)
  },
}

// === BACKGROUND MUSIC SYSTEM ===
// Generative ambient music using oscillators — different vibes per biome/screen

type MusicMode = 'explore' | 'battle' | 'menu'

interface MusicState {
  mode: MusicMode
  biome: string
  playing: boolean
  volume: number
  nodes: { oscs: OscillatorNode[]; gains: GainNode[]; masterGain: GainNode } | null
  intervalId: ReturnType<typeof setInterval> | null
}

const musicState: MusicState = {
  mode: 'explore',
  biome: 'forest',
  playing: false,
  volume: 0.04,
  nodes: null,
  intervalId: null,
}

// Pentatonic scales per biome for procedural melodies
const BIOME_SCALES: Record<string, number[]> = {
  forest:       [262, 294, 330, 392, 440],   // C D E G A (peaceful)
  redwood:      [220, 262, 294, 330, 392],   // A C D E G (deep, mystical)
  marsh:        [247, 294, 330, 370, 440],   // B D E F# A (mysterious)
  beach:        [330, 392, 440, 494, 587],   // E G A B D (bright, airy)
  water:        [262, 294, 349, 392, 494],   // C D F G B (flowing)
  urban:        [330, 370, 440, 494, 554],   // E F# A B C# (techy)
  mountain:     [220, 262, 330, 392, 494],   // A C E G B (epic)
  grassland:    [294, 330, 392, 440, 523],   // D E G A C (pastoral)
  tidepool:     [294, 349, 392, 466, 523],   // D F G Bb C (briny, eerie)
  chaparral:    [277, 311, 370, 415, 466],   // C# Eb F# G# Bb (dry heat)
  oak_woodland: [247, 277, 330, 370, 415],   // B C# E F# G# (warm woodland)
  kelp_forest:  [196, 233, 262, 311, 349],   // G Bb C Eb F (deep, swaying)
}

const BATTLE_SCALE = [165, 196, 220, 262, 294] // E3 G3 A3 C4 D4 (tense)

function stopMusic() {
  if (musicState.nodes) {
    const fadeTime = 0.5
    const ctx = getCtx()
    musicState.nodes.masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fadeTime)
    const captured = musicState.nodes
    setTimeout(() => {
      captured.oscs.forEach(o => { try { o.stop() } catch (_e) { /* already stopped */ } })
      captured.gains.forEach(g => g.disconnect())
      captured.masterGain.disconnect()
    }, fadeTime * 1000 + 100)
    musicState.nodes = null
  }
  if (musicState.intervalId) {
    clearInterval(musicState.intervalId)
    musicState.intervalId = null
  }
  musicState.playing = false
}

function startExploreMusic(biome: string) {
  const ctx = getCtx()
  const scale = BIOME_SCALES[biome] ?? BIOME_SCALES.forest
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
  masterGain.gain.exponentialRampToValueAtTime(musicState.volume, ctx.currentTime + 1)
  masterGain.connect(ctx.destination)

  const oscs: OscillatorNode[] = []
  const gains: GainNode[] = []

  // Drone — root note pad
  const droneOsc = ctx.createOscillator()
  droneOsc.type = 'sine'
  droneOsc.frequency.value = scale[0] / 2 // One octave below
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.6
  droneOsc.connect(droneGain)
  droneGain.connect(masterGain)
  droneOsc.start()
  oscs.push(droneOsc)
  gains.push(droneGain)

  // Fifth drone for fullness
  const fifthOsc = ctx.createOscillator()
  fifthOsc.type = 'sine'
  fifthOsc.frequency.value = scale[3] / 2
  const fifthGain = ctx.createGain()
  fifthGain.gain.value = 0.3
  fifthOsc.connect(fifthGain)
  fifthGain.connect(masterGain)
  fifthOsc.start()
  oscs.push(fifthOsc)
  gains.push(fifthGain)

  musicState.nodes = { oscs, gains, masterGain }

  // Melodic notes at random intervals
  musicState.intervalId = setInterval(() => {
    if (!musicState.playing) return
    const note = scale[Math.floor(Math.random() * scale.length)]
    const octave = Math.random() > 0.3 ? 1 : 2
    const melOsc = ctx.createOscillator()
    melOsc.type = Math.random() > 0.5 ? 'sine' : 'triangle'
    melOsc.frequency.value = note * octave
    const melGain = ctx.createGain()
    const dur = 0.8 + Math.random() * 1.2
    melGain.gain.setValueAtTime(0.15 + Math.random() * 0.1, ctx.currentTime)
    melGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    melOsc.connect(melGain)
    melGain.connect(masterGain)
    melOsc.start()
    melOsc.stop(ctx.currentTime + dur)
  }, 1500 + Math.random() * 2000)
}

function startBattleMusic() {
  const ctx = getCtx()
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
  masterGain.gain.exponentialRampToValueAtTime(musicState.volume * 1.2, ctx.currentTime + 0.3)
  masterGain.connect(ctx.destination)

  const oscs: OscillatorNode[] = []
  const gains: GainNode[] = []

  // Low bass pulse
  const bassOsc = ctx.createOscillator()
  bassOsc.type = 'sawtooth'
  bassOsc.frequency.value = BATTLE_SCALE[0]
  const bassGain = ctx.createGain()
  bassGain.gain.value = 0.5
  bassOsc.connect(bassGain)
  bassGain.connect(masterGain)
  bassOsc.start()
  oscs.push(bassOsc)
  gains.push(bassGain)

  musicState.nodes = { oscs, gains, masterGain }

  let beatCount = 0
  musicState.intervalId = setInterval(() => {
    if (!musicState.playing) return
    beatCount++
    // Rhythmic pulse
    const note = BATTLE_SCALE[beatCount % BATTLE_SCALE.length]
    const pulseOsc = ctx.createOscillator()
    pulseOsc.type = 'square'
    pulseOsc.frequency.value = note
    const pulseGain = ctx.createGain()
    pulseGain.gain.setValueAtTime(0.12, ctx.currentTime)
    pulseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    pulseOsc.connect(pulseGain)
    pulseGain.connect(masterGain)
    pulseOsc.start()
    pulseOsc.stop(ctx.currentTime + 0.25)

    // Occasional higher accent
    if (beatCount % 4 === 0) {
      const accOsc = ctx.createOscillator()
      accOsc.type = 'triangle'
      accOsc.frequency.value = note * 2
      const accGain = ctx.createGain()
      accGain.gain.setValueAtTime(0.08, ctx.currentTime)
      accGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      accOsc.connect(accGain)
      accGain.connect(masterGain)
      accOsc.start()
      accOsc.stop(ctx.currentTime + 0.35)
    }
  }, 350)
}

// === AMBIENT BIOME SOUND SYSTEM ===
// Generates continuous ambient soundscapes per biome/time/weather

interface AmbientState {
  playing: boolean
  biome: string
  timeOfDay: string
  weather: string
  nodes: { oscs: OscillatorNode[]; gains: GainNode[]; sources: AudioBufferSourceNode[]; masterGain: GainNode } | null
  intervalIds: ReturnType<typeof setInterval>[]
}

const ambientState: AmbientState = {
  playing: false,
  biome: '',
  timeOfDay: '',
  weather: '',
  nodes: null,
  intervalIds: [],
}

function stopAmbient() {
  if (ambientState.nodes) {
    const ctx = getCtx()
    ambientState.nodes.masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    const captured = ambientState.nodes
    setTimeout(() => {
      captured.oscs.forEach(o => { try { o.stop() } catch (_e) { /* ok */ } })
      captured.sources.forEach(s => { try { s.stop() } catch (_e) { /* ok */ } })
      captured.gains.forEach(g => g.disconnect())
      captured.masterGain.disconnect()
    }, 900)
    ambientState.nodes = null
  }
  ambientState.intervalIds.forEach(id => clearInterval(id))
  ambientState.intervalIds = []
  ambientState.playing = false
}

function createFilteredNoise(ctx: AudioContext, freq: number, Q: number, duration: number): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  // Bandpass filter for shaped noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = Q
  source.connect(filter)
  // Re-route: return source, caller connects filter output
  ;(source as AudioBufferSourceNode & { filterNode: BiquadFilterNode }).filterNode = filter
  return source
}

function startAmbientSounds(biome: string, timeOfDay: string, weather: string) {
  const ctx = getCtx()
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
  masterGain.gain.exponentialRampToValueAtTime(musicState.volume * 0.5, ctx.currentTime + 2)
  masterGain.connect(ctx.destination)

  const oscs: OscillatorNode[] = []
  const gains: GainNode[] = []
  const sources: AudioBufferSourceNode[] = []
  const intervals: ReturnType<typeof setInterval>[] = []

  const isNight = timeOfDay === 'night'

  // Night crickets — for forest, marsh, grassland, redwood
  if (isNight && ['forest', 'marsh', 'grassland', 'redwood', 'mountain'].includes(biome)) {
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const freq = 4000 + Math.random() * 2000
      const chirpOsc = ctx.createOscillator()
      chirpOsc.type = 'sine'
      chirpOsc.frequency.value = freq
      const chirpGain = ctx.createGain()
      const dur = 0.03 + Math.random() * 0.02
      chirpGain.gain.setValueAtTime(0.03 * sfxVolume, ctx.currentTime)
      chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      chirpOsc.connect(chirpGain)
      chirpGain.connect(masterGain)
      chirpOsc.start()
      chirpOsc.stop(ctx.currentTime + dur)
      // Second chirp echo
      if (Math.random() > 0.4) {
        setTimeout(() => {
          const c2 = ctx.createOscillator()
          c2.type = 'sine'
          c2.frequency.value = freq + 200
          const g2 = ctx.createGain()
          g2.gain.setValueAtTime(0.02 * sfxVolume, ctx.currentTime)
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
          c2.connect(g2)
          g2.connect(masterGain)
          c2.start()
          c2.stop(ctx.currentTime + dur)
        }, 80)
      }
    }, 800 + Math.random() * 1200))
  }

  // Daytime birds — for forest, grassland, redwood, beach
  if (!isNight && ['forest', 'grassland', 'redwood', 'beach'].includes(biome)) {
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const baseFreq = 1200 + Math.random() * 1500
      const noteCount = 2 + Math.floor(Math.random() * 4)
      for (let n = 0; n < noteCount; n++) {
        setTimeout(() => {
          const birdOsc = ctx.createOscillator()
          birdOsc.type = 'sine'
          const freq = baseFreq + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 300
          birdOsc.frequency.value = freq
          birdOsc.frequency.exponentialRampToValueAtTime(freq + (Math.random() - 0.5) * 200, ctx.currentTime + 0.08)
          const birdGain = ctx.createGain()
          birdGain.gain.setValueAtTime(0.02 * sfxVolume, ctx.currentTime)
          birdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
          birdOsc.connect(birdGain)
          birdGain.connect(masterGain)
          birdOsc.start()
          birdOsc.stop(ctx.currentTime + 0.12)
        }, n * (60 + Math.random() * 80))
      }
    }, 3000 + Math.random() * 5000))
  }

  // Ocean waves — for beach, water
  if (['beach', 'water'].includes(biome)) {
    const waveSource = createFilteredNoise(ctx, 400, 0.5, 4)
    const filterNode = (waveSource as AudioBufferSourceNode & { filterNode: BiquadFilterNode }).filterNode
    const waveGain = ctx.createGain()
    waveGain.gain.value = 0.06 * sfxVolume
    filterNode.connect(waveGain)
    waveGain.connect(masterGain)
    waveSource.start()
    sources.push(waveSource)
    gains.push(waveGain)
    // Rhythmic wave surge
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const now = ctx.currentTime
      waveGain.gain.setValueAtTime(0.03 * sfxVolume, now)
      waveGain.gain.linearRampToValueAtTime(0.08 * sfxVolume, now + 1.5)
      waveGain.gain.linearRampToValueAtTime(0.03 * sfxVolume, now + 3)
    }, 4000))
  }

  // City hum — for urban
  if (biome === 'urban') {
    const humOsc = ctx.createOscillator()
    humOsc.type = 'sawtooth'
    humOsc.frequency.value = 60
    const humGain = ctx.createGain()
    humGain.gain.value = 0.015 * sfxVolume
    // Low-pass to make it a deep hum
    const lpFilter = ctx.createBiquadFilter()
    lpFilter.type = 'lowpass'
    lpFilter.frequency.value = 120
    humOsc.connect(lpFilter)
    lpFilter.connect(humGain)
    humGain.connect(masterGain)
    humOsc.start()
    oscs.push(humOsc)
    gains.push(humGain)
  }

  // Wind ambience — for mountain, or when weather is wind
  if (biome === 'mountain' || weather === 'wind') {
    const windSource = createFilteredNoise(ctx, 800, 0.3, 6)
    const filterNode = (windSource as AudioBufferSourceNode & { filterNode: BiquadFilterNode }).filterNode
    const windGain = ctx.createGain()
    windGain.gain.value = (biome === 'mountain' ? 0.04 : 0.06) * sfxVolume
    filterNode.connect(windGain)
    windGain.connect(masterGain)
    windSource.start()
    sources.push(windSource)
    gains.push(windGain)
    // Gust modulation
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const now = ctx.currentTime
      const peakVol = (0.04 + Math.random() * 0.04) * sfxVolume
      windGain.gain.linearRampToValueAtTime(peakVol, now + 1)
      windGain.gain.linearRampToValueAtTime(0.02 * sfxVolume, now + 3)
    }, 3000 + Math.random() * 2000))
  }

  // Rain sound — filtered noise when raining
  if (weather === 'rain' || weather === 'thunderstorm') {
    const isStorm = weather === 'thunderstorm'
    const rainSource = createFilteredNoise(ctx, isStorm ? 2500 : 3000, 0.2, 4)
    const filterNode = (rainSource as AudioBufferSourceNode & { filterNode: BiquadFilterNode }).filterNode
    const rainGain = ctx.createGain()
    rainGain.gain.value = (isStorm ? 0.08 : 0.05) * sfxVolume
    filterNode.connect(rainGain)
    rainGain.connect(masterGain)
    rainSource.start()
    sources.push(rainSource)
    gains.push(rainGain)
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const now = ctx.currentTime
      const base = isStorm ? 0.06 : 0.04
      const range = isStorm ? 0.05 : 0.03
      rainGain.gain.linearRampToValueAtTime((base + Math.random() * range) * sfxVolume, now + 2)
    }, isStorm ? 2000 : 3000))
  }

  // Marsh frogs — deep croaks at night or dusk
  if (biome === 'marsh' && (isNight || timeOfDay === 'dusk')) {
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const freq = 120 + Math.random() * 80
      const croakOsc = ctx.createOscillator()
      croakOsc.type = 'sawtooth'
      croakOsc.frequency.value = freq
      croakOsc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + 0.15)
      const croakGain = ctx.createGain()
      croakGain.gain.setValueAtTime(0.02 * sfxVolume, ctx.currentTime)
      croakGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 300
      croakOsc.connect(lp)
      lp.connect(croakGain)
      croakGain.connect(masterGain)
      croakOsc.start()
      croakOsc.stop(ctx.currentTime + 0.25)
    }, 2000 + Math.random() * 3000))
  }

  // Fog ambience — eerie low drone with occasional distant foghorn
  if (weather === 'fog') {
    const fogOsc = ctx.createOscillator()
    fogOsc.type = 'sine'
    fogOsc.frequency.value = 80
    const fogGain = ctx.createGain()
    fogGain.gain.value = 0.025 * sfxVolume
    const fogLp = ctx.createBiquadFilter()
    fogLp.type = 'lowpass'
    fogLp.frequency.value = 200
    fogOsc.connect(fogLp)
    fogLp.connect(fogGain)
    fogGain.connect(masterGain)
    fogOsc.start()
    oscs.push(fogOsc)
    gains.push(fogGain)
    // Slow eerie modulation
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const now = ctx.currentTime
      fogOsc.frequency.linearRampToValueAtTime(70 + Math.random() * 30, now + 2)
    }, 4000))
    // Distant foghorn every 15-25s
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const hornOsc = ctx.createOscillator()
      hornOsc.type = 'sawtooth'
      hornOsc.frequency.value = 110
      const hornGain = ctx.createGain()
      const dur = 1.8 + Math.random() * 0.5
      hornGain.gain.setValueAtTime(0.001, ctx.currentTime)
      hornGain.gain.linearRampToValueAtTime(0.02 * sfxVolume, ctx.currentTime + 0.4)
      hornGain.gain.setValueAtTime(0.02 * sfxVolume, ctx.currentTime + dur - 0.5)
      hornGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      const hornLp = ctx.createBiquadFilter()
      hornLp.type = 'lowpass'
      hornLp.frequency.value = 180
      hornOsc.connect(hornLp)
      hornLp.connect(hornGain)
      hornGain.connect(masterGain)
      hornOsc.start(ctx.currentTime)
      hornOsc.stop(ctx.currentTime + dur)
    }, 15000 + Math.random() * 10000))
  }

  // Thunder rumbles during rain/thunderstorm — low-frequency bursts
  if (weather === 'rain' || weather === 'thunderstorm') {
    const isStorm = weather === 'thunderstorm'
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      if (Math.random() > (isStorm ? 0.7 : 0.3)) return
      const bufLen = ctx.sampleRate * (isStorm ? 3 : 2)
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufLen; i++) {
        const env = Math.exp(-i / (ctx.sampleRate * (isStorm ? 1.2 : 0.8)))
        data[i] = (Math.random() * 2 - 1) * env
      }
      const thunderSrc = ctx.createBufferSource()
      thunderSrc.buffer = buf
      const thunderLp = ctx.createBiquadFilter()
      thunderLp.type = 'lowpass'
      thunderLp.frequency.value = (isStorm ? 80 : 120) + Math.random() * 80
      const thunderGain = ctx.createGain()
      thunderGain.gain.setValueAtTime(0.001, ctx.currentTime)
      thunderGain.gain.linearRampToValueAtTime((isStorm ? 0.07 : 0.04 + Math.random() * 0.03) * sfxVolume, ctx.currentTime + 0.1)
      thunderGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isStorm ? 3 : 2))
      thunderSrc.connect(thunderLp)
      thunderLp.connect(thunderGain)
      thunderGain.connect(masterGain)
      thunderSrc.start()
    }, isStorm ? (3000 + Math.random() * 5000) : (8000 + Math.random() * 12000)))
  }

  // Dawn chorus — layered bird calls at dawn
  if (timeOfDay === 'dawn') {
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      for (let b = 0; b < 2 + Math.floor(Math.random() * 3); b++) {
        setTimeout(() => {
          const freq = 1800 + Math.random() * 2000
          const bOsc = ctx.createOscillator()
          bOsc.type = 'sine'
          bOsc.frequency.value = freq
          bOsc.frequency.exponentialRampToValueAtTime(freq * (0.8 + Math.random() * 0.4), ctx.currentTime + 0.06)
          const bGain = ctx.createGain()
          bGain.gain.setValueAtTime(0.025 * sfxVolume, ctx.currentTime)
          bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
          bOsc.connect(bGain)
          bGain.connect(masterGain)
          bOsc.start()
          bOsc.stop(ctx.currentTime + 0.1)
        }, b * (40 + Math.random() * 60))
      }
    }, 1500 + Math.random() * 2500))
  }

  // Dusk insects — soft buzzing and chirping blend
  if (timeOfDay === 'dusk') {
    const duskSource = createFilteredNoise(ctx, 5000, 2, 4)
    const filterNode = (duskSource as AudioBufferSourceNode & { filterNode: BiquadFilterNode }).filterNode
    const duskGain = ctx.createGain()
    duskGain.gain.value = 0.015 * sfxVolume
    filterNode.connect(duskGain)
    duskGain.connect(masterGain)
    duskSource.start()
    sources.push(duskSource)
    gains.push(duskGain)
    // Modulate the buzz
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const now = ctx.currentTime
      duskGain.gain.linearRampToValueAtTime((0.01 + Math.random() * 0.015) * sfxVolume, now + 1)
    }, 2000 + Math.random() * 2000))
  }

  // Redwood ambience — deep creaking wood sounds
  if (biome === 'redwood' && !isNight) {
    intervals.push(setInterval(() => {
      if (!ambientState.playing) return
      const creakOsc = ctx.createOscillator()
      creakOsc.type = 'sawtooth'
      const freq = 60 + Math.random() * 40
      creakOsc.frequency.value = freq
      creakOsc.frequency.linearRampToValueAtTime(freq + 10 + Math.random() * 20, ctx.currentTime + 0.3)
      const creakGain = ctx.createGain()
      creakGain.gain.setValueAtTime(0.01 * sfxVolume, ctx.currentTime)
      creakGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      const creakLp = ctx.createBiquadFilter()
      creakLp.type = 'lowpass'
      creakLp.frequency.value = 200
      creakOsc.connect(creakLp)
      creakLp.connect(creakGain)
      creakGain.connect(masterGain)
      creakOsc.start()
      creakOsc.stop(ctx.currentTime + 0.5)
    }, 6000 + Math.random() * 8000))
  }

  ambientState.nodes = { oscs, gains, sources, masterGain }
  ambientState.intervalIds = intervals
  ambientState.playing = true
}

export const Music = {
  /** Start or switch background music */
  play(mode: MusicMode, biome = 'forest') {
    // Don't restart if already playing same mode/biome
    if (musicState.playing && musicState.mode === mode && musicState.biome === biome) return

    // Crossfade: start new music before fully stopping old
    stopMusic()
    musicState.mode = mode
    musicState.biome = biome
    musicState.playing = true

    if (mode === 'battle') {
      startBattleMusic()
    } else {
      startExploreMusic(biome)
    }
  },

  /** Stop all music */
  stop() {
    stopMusic()
    stopAmbient()
  },

  /** Set volume (0-1) */
  setVolume(v: number) {
    musicState.volume = Math.max(0, Math.min(1, v)) * 0.04
    if (musicState.nodes) {
      const ctx = getCtx()
      musicState.nodes.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, musicState.volume), ctx.currentTime + 0.1
      )
    }
    // Also update ambient volume
    if (ambientState.nodes) {
      const ctx = getCtx()
      ambientState.nodes.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, musicState.volume * 0.5), ctx.currentTime + 0.1
      )
    }
  },

  /** Check if music is playing */
  isPlaying() {
    return musicState.playing
  },

  /** Toggle music on/off */
  toggle() {
    if (musicState.playing) {
      stopMusic()
      stopAmbient()
    } else {
      Music.play(musicState.mode, musicState.biome)
    }
    return musicState.playing
  },

  /** Get current music volume (0-1) */
  getVolume() {
    return musicState.volume / 0.04
  },

  /** Get current SFX volume (0-1) */
  getSfxVolume() {
    return sfxVolume
  },

  /** Set SFX volume (0-1) */
  setSfxVolume(v: number) {
    sfxVolume = Math.max(0, Math.min(1, v))
  },

  /** Start/switch ambient biome sounds (separate from music) */
  playAmbient(biome: string, timeOfDay: string, weather: string) {
    if (ambientState.playing && ambientState.biome === biome && ambientState.timeOfDay === timeOfDay && ambientState.weather === weather) return
    stopAmbient()
    ambientState.biome = biome
    ambientState.timeOfDay = timeOfDay
    ambientState.weather = weather
    startAmbientSounds(biome, timeOfDay, weather)
  },

  /** Stop ambient sounds */
  stopAmbient() {
    stopAmbient()
  },
}
