import { useState, useEffect, useCallback } from 'react'
import type { CapturedCreature, Creature } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { SFX } from './sounds'
import PixelCreatureToken from './PixelCreatureToken'

// The Alcatraz Escape is a multi-stage quest:
// Stage 1: "Lockdown" - You arrive and the ferry breaks down. Ranger Ghost warns you.
// Stage 2: "Cell Block Challenge" - Battle 3 ghost creatures in sequence
// Stage 3: "The Warden's Trial" - Solve a type-effectiveness puzzle
// Stage 4: "The Great Escape" - Final battle against the Warden of the Rock
// Stage 5: "Freedom" - Victory screen, rewards

export type EscapeStage = 'lockdown' | 'cellblock' | 'trial' | 'boss' | 'freedom'

interface Props {
  playerTeam: CapturedCreature[]
  playerLevel: number
  stage: EscapeStage
  cellBlockProgress: number
  onSetStage: (stage: EscapeStage) => void
  onComplete: (rewards: { xp: number; item?: { id: string; name: string; type: 'capture' | 'heal' | 'boost' | 'material'; quantity: number; description: string; sprite: string } }) => void
  onClose: () => void
  onStartBattle: (creature: Creature) => void
}

const TRIAL_QUESTIONS = [
  {
    question: 'The Cell Block Specter is a mystic type. What type is super effective against it?',
    options: ['Beast', 'Mystic', 'Bird', 'Marine'],
    correct: 1, // Mystic beats mystic
    hint: 'Think about what fights fire with fire...',
  },
  {
    question: 'A Phantom Crab (marine) guards the dock. Which type should you lead with?',
    options: ['Beast', 'Bird', 'Amphibian', 'Insect'],
    correct: 2, // Amphibian beats marine
    hint: 'Freshwater creatures have an edge over saltwater...',
  },
  {
    question: 'The fog is thick tonight. Which creature ability helps dodge attacks in fog?',
    options: ['Toxic Skin', 'Fog Veil', 'Pack Tactics', 'Keen Eye'],
    correct: 1,
    hint: 'The fog itself can be a shield...',
  },
]

export default function AlcatrazEscape({ playerTeam, playerLevel, stage, cellBlockProgress, onSetStage, onComplete, onClose, onStartBattle }: Props) {
  const [dialogLine, setDialogLine] = useState(0)
  const [trialProgress, setTrialProgress] = useState(0) // 0-3 questions
  const [trialWrong, setTrialWrong] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    setFadeIn(true)
    const t = setTimeout(() => setFadeIn(false), 300)
    return () => clearTimeout(t)
  }, [stage])

  const cellBlockCreatures = [
    ALL_CREATURES.find(c => c.id === 'fog-gull'),
    ALL_CREATURES.find(c => c.id === 'phantom-crab'),
    ALL_CREATURES.find(c => c.id === 'cell-block-specter'),
  ].filter(Boolean) as Creature[]

  const wardenCreature = ALL_CREATURES.find(c => c.id === 'warden-of-the-rock')

  const advanceDialog = useCallback(() => {
    setDialogLine(prev => prev + 1)
  }, [])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        advanceDialog()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [advanceDialog])

  const lockdownDialog = [
    { speaker: '⛴', text: '*CLANG* The ferry engine sputters and dies. You\'re stranded.' },
    { speaker: '🏴‍☠️', text: '"Well, well. Looks like the island doesn\'t want you to leave."' },
    { speaker: '🏴‍☠️', text: '"The creatures of Alcatraz have sealed the dock. No one leaves without their permission."' },
    { speaker: '🏴‍☠️', text: '"Three guardians patrol the cell blocks. Defeat them, solve the Warden\'s trial, and face the Rock itself."' },
    { speaker: '🏴‍☠️', text: '"Only then will the island release you. Good luck, explorer. You\'ll need it."' },
  ]

  const renderStage = () => {
    switch (stage) {
      case 'lockdown':
        return (
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            {/* Scene header */}
            <div className="text-center">
              <p className="text-[8px] text-red-400 font-black uppercase tracking-[4px] mb-1">⚠️ LOCKDOWN ⚠️</p>
              <h2 className="text-white text-lg font-bold">Escape from Alcatraz</h2>
              <p className="text-white/30 text-[10px] mt-1">The island won't let you leave...</p>
            </div>

            {/* Alcatraz silhouette */}
            <div className="relative w-64 h-24 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #0a1628 0%, #1a0a2e 50%, #2d1a4a 100%)',
            }}>
              <div className="absolute bottom-0 left-0 right-0 h-6" style={{
                background: 'linear-gradient(180deg, transparent, rgba(30,58,138,0.3))',
              }} />
              {/* Moon */}
              <div className="absolute top-3 right-8 w-6 h-6 rounded-full" style={{
                background: 'radial-gradient(circle, #e2e8f0 0%, #94a3b8 60%, transparent 70%)',
                boxShadow: '0 0 20px rgba(226,232,240,0.3)',
              }} />
              {/* Prison silhouette */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xl opacity-40">🏚️</div>
              {/* Fog */}
              <div className="absolute inset-0 opacity-20" style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)',
                animation: 'pulse 4s ease-in-out infinite',
              }} />
            </div>

            {/* Dialog */}
            {dialogLine < lockdownDialog.length ? (
              <div className="w-full rounded-xl p-3 cursor-pointer" onClick={advanceDialog} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{lockdownDialog[dialogLine].speaker}</span>
                  <p className="text-white/70 text-xs leading-relaxed">{lockdownDialog[dialogLine].text}</p>
                </div>
                <p className="text-white/20 text-[7px] text-right mt-1">tap to continue</p>
              </div>
            ) : (
              <button
                onClick={() => { onSetStage('cellblock'); setDialogLine(0); SFX.battleStart() }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: '#fca5a5',
                  boxShadow: '0 0 20px rgba(239,68,68,0.15)',
                }}
              >
                Begin the Escape
              </button>
            )}
          </div>
        )

      case 'cellblock':
        return (
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="text-center">
              <p className="text-[8px] text-purple-400 font-black uppercase tracking-[4px] mb-1">CELL BLOCK</p>
              <h2 className="text-white text-base font-bold">Guardian Gauntlet</h2>
              <p className="text-white/30 text-[10px] mt-1">Defeat 3 guardians to proceed</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              {cellBlockCreatures.map((creature, i) => (
                <div
                  key={creature.id}
                  className="flex-1 rounded-lg p-2 text-center transition-all"
                  style={{
                    background: i < cellBlockProgress
                      ? 'rgba(74,222,128,0.1)'
                      : i === cellBlockProgress
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i < cellBlockProgress ? 'rgba(74,222,128,0.3)' : i === cellBlockProgress ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <span className="flex justify-center">
                    {i < cellBlockProgress ? '✅' : (
                      <PixelCreatureToken creature={creature} size={30} selected={i === cellBlockProgress} />
                    )}
                  </span>
                  <p className="text-white/50 text-[8px] mt-1">{creature.name}</p>
                  <p className="text-white/25 text-[7px]">
                    {i < cellBlockProgress ? 'Defeated' : i === cellBlockProgress ? 'Next' : 'Locked'}
                  </p>
                </div>
              ))}
            </div>

            {cellBlockProgress < cellBlockCreatures.length ? (
              <>
                <div className="rounded-xl p-3 w-full text-center" style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span className="mb-2 flex justify-center">
                    <PixelCreatureToken creature={cellBlockCreatures[cellBlockProgress]} size={48} selected />
                  </span>
                  <p className="text-white font-semibold text-sm">{cellBlockCreatures[cellBlockProgress].name}</p>
                  <p className="text-white/30 text-[9px] mt-1">{cellBlockCreatures[cellBlockProgress].description}</p>
                  <p className="text-red-400 text-[8px] mt-1">Level {playerLevel + 2 + cellBlockProgress * 2}</p>
                </div>
                <button
                  onClick={() => {
                    // Scale the creature to player level + difficulty
                    const base = cellBlockCreatures[cellBlockProgress]
                    const scaledLevel = playerLevel + 2 + cellBlockProgress * 2
                    const scale = 1 + (scaledLevel - 1) * 0.08
                    const scaled: Creature = {
                      ...base,
                      stats: {
                        hp: Math.floor(base.stats.hp * scale),
                        maxHp: Math.floor(base.stats.maxHp * scale),
                        attack: Math.floor(base.stats.attack * scale),
                        defense: Math.floor(base.stats.defense * scale),
                        speed: Math.floor(base.stats.speed * scale),
                      },
                    }
                    onStartBattle(scaled)
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(168,85,247,0.35)',
                    color: '#c4b5fd',
                    boxShadow: '0 0 20px rgba(168,85,247,0.15)',
                  }}
                >
                  Challenge {cellBlockCreatures[cellBlockProgress].name}
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-emerald-400 text-xs font-semibold mb-3">All guardians defeated!</p>
                <button
                  onClick={() => { onSetStage('trial'); setDialogLine(0); SFX.achievement() }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(74,222,128,0.15))',
                    border: '1px solid rgba(74,222,128,0.35)',
                    color: '#86efac',
                  }}
                >
                  Proceed to the Warden's Trial
                </button>
              </div>
            )}
          </div>
        )

      case 'trial':
        return (
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="text-center">
              <p className="text-[8px] text-cyan-400 font-black uppercase tracking-[4px] mb-1">THE TRIAL</p>
              <h2 className="text-white text-base font-bold">Warden's Knowledge Test</h2>
              <p className="text-white/30 text-[10px] mt-1">Answer 3 questions to prove your worth</p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {TRIAL_QUESTIONS.map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{
                  background: i < trialProgress ? '#4ade80' : i === trialProgress ? '#22d3ee' : 'rgba(255,255,255,0.1)',
                  boxShadow: i < trialProgress ? '0 0 6px rgba(74,222,128,0.4)' : 'none',
                }} />
              ))}
            </div>

            {trialProgress < TRIAL_QUESTIONS.length ? (
              <>
                <div className="rounded-xl p-4 w-full" style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,211,238,0.15)',
                }}>
                  <p className="text-white text-xs leading-relaxed mb-1">
                    {TRIAL_QUESTIONS[trialProgress].question}
                  </p>
                  {trialWrong && (
                    <p className="text-amber-400 text-[9px] italic">{TRIAL_QUESTIONS[trialProgress].hint}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  {TRIAL_QUESTIONS[trialProgress].options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => {
                        if (i === TRIAL_QUESTIONS[trialProgress].correct) {
                          SFX.levelUp()
                          setTrialProgress(prev => prev + 1)
                          setTrialWrong(false)
                        } else {
                          SFX.hit()
                          setTrialWrong(true)
                        }
                      }}
                      className="py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-cyan-400 text-xs font-semibold mb-1">Trial passed!</p>
                <p className="text-white/40 text-[9px] mb-3">The Warden acknowledges your knowledge.</p>
                <button
                  onClick={() => { onSetStage('boss'); SFX.battleStart() }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(251,191,36,0.15))',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#fca5a5',
                    boxShadow: '0 0 20px rgba(239,68,68,0.15)',
                  }}
                >
                  Face the Warden of the Rock
                </button>
              </div>
            )}
          </div>
        )

      case 'boss':
        return (
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="text-center">
              <p className="text-[8px] text-red-400 font-black uppercase tracking-[4px] animate-pulse mb-1">FINAL BATTLE</p>
              <h2 className="text-white text-lg font-bold">The Warden of the Rock</h2>
            </div>

            {wardenCreature && (
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(239,68,68,0.1))',
                  border: '2px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 0 30px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}>
                  <PixelCreatureToken creature={wardenCreature} size={72} selected />
                </div>
                <div className="absolute -top-1 -right-1 text-xs">👑</div>
              </div>
            )}

            <div className="rounded-xl p-3 w-full text-center" style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)',
            }}>
              <p className="text-white/60 text-xs italic leading-relaxed">
                "You've fought my guardians. You've passed my trial. Now face me — the eternal Warden of this Rock.
                Win, and I'll release the island's grip. Lose, and you join the phantoms..."
              </p>
              <p className="text-purple-400 text-[8px] mt-2">Level {playerLevel + 8} · Legendary</p>
            </div>

            <button
              onClick={() => {
                if (!wardenCreature) return
                const scaledLevel = playerLevel + 8
                const scale = 1 + (scaledLevel - 1) * 0.1
                const scaled: Creature = {
                  ...wardenCreature,
                  stats: {
                    hp: Math.floor(wardenCreature.stats.hp * scale),
                    maxHp: Math.floor(wardenCreature.stats.maxHp * scale),
                    attack: Math.floor(wardenCreature.stats.attack * scale),
                    defense: Math.floor(wardenCreature.stats.defense * scale),
                    speed: Math.floor(wardenCreature.stats.speed * scale),
                  },
                }
                onStartBattle(scaled)
              }}
              className="px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(239,68,68,0.2))',
                border: '1px solid rgba(139,92,246,0.4)',
                color: '#e9d5ff',
                boxShadow: '0 0 30px rgba(139,92,246,0.2)',
              }}
            >
              Battle the Warden
            </button>
          </div>
        )

      case 'freedom':
        return (
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            <style>{`
              @keyframes freedom-glow {
                0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.2); }
                50% { box-shadow: 0 0 40px rgba(251,191,36,0.4); }
              }
              @keyframes freedom-sparkle {
                0% { transform: scale(0) rotate(0deg); opacity: 0; }
                50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                100% { transform: scale(1) rotate(360deg); opacity: 1; }
              }
            `}</style>

            <div className="text-center" style={{ animation: 'freedom-sparkle 0.8s ease-out' }}>
              <span className="text-5xl block mb-2">🗽</span>
              <p className="text-[8px] text-amber-400 font-black uppercase tracking-[6px] mb-1">FREEDOM!</p>
              <h2 className="text-white text-xl font-bold">You Escaped Alcatraz!</h2>
            </div>

            <div className="rounded-xl p-4 w-full text-center" style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(74,222,128,0.05))',
              border: '1px solid rgba(251,191,36,0.2)',
              animation: 'freedom-glow 2s ease-in-out infinite',
            }}>
              <p className="text-white/60 text-xs italic leading-relaxed mb-3">
                "No one has ever beaten the island's challenge before. The ferry engines roar back to life.
                You're free to go — but you'll always be welcome on The Rock."
              </p>
              <div className="space-y-1.5">
                <p className="text-amber-400 text-sm font-bold">+500 XP</p>
                <p className="text-purple-300 text-[10px]">🏆 Alcatraz Escapee Achievement</p>
                <p className="text-cyan-300 text-[10px]">✨ 5x Spectral Capsules</p>
              </div>
            </div>

            {/* Team display */}
            <div className="flex gap-1.5 justify-center">
              {playerTeam.slice(0, 6).map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(251,191,36,0.15)',
                }}>
                  <PixelCreatureToken creature={c} size={24} />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                onComplete({
                  xp: 500,
                  item: {
                    id: 'spectral-capsule',
                    name: 'Spectral Capsule',
                    type: 'capture',
                    quantity: 5,
                    description: 'A ghostly capsule that works better on mystic creatures.',
                    sprite: '👻',
                  },
                })
              }}
              className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(74,222,128,0.15))',
                border: '1px solid rgba(251,191,36,0.35)',
                color: '#fcd34d',
                boxShadow: '0 0 20px rgba(251,191,36,0.15)',
              }}
            >
              Claim Rewards & Leave
            </button>
          </div>
        )
    }
  }

  return (
    <div
      className="absolute inset-0 z-[55] flex items-center justify-center overflow-hidden p-4"
      style={{
        background: 'linear-gradient(180deg, rgba(3,8,16,0.97) 0%, rgba(10,22,40,0.98) 100%)',
        opacity: fadeIn ? 0.5 : 1,
        transition: 'opacity 0.3s',
      }}
    >
      {stage !== 'freedom' && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/20 hover:text-white/50 text-xs transition-colors z-10"
        >
          ✕ Abandon
        </button>
      )}

      {renderStage()}
    </div>
  )
}
