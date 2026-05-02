import { useState, useEffect } from 'react'
import type { RoamingTrainer } from './roamingTrainers'
import { SFX } from './sounds'

interface Props {
  trainer: RoamingTrainer
  onAccept: () => void
  onDecline: () => void
}

export default function TrainerEncounter({ trainer, onAccept, onDecline }: Props) {
  const [phase, setPhase] = useState<'enter' | 'ready'>('enter')

  useEffect(() => {
    SFX.battleStart()
    const t = setTimeout(() => setPhase('ready'), 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'ready') return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAccept() }
      if (e.key === 'Escape') { e.preventDefault(); onDecline() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, onAccept, onDecline])

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes trainer-slide-in {
          0% { transform: translateX(100%) scale(0.8); opacity: 0; }
          60% { transform: translateX(-5%) scale(1.05); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes trainer-bg-flash {
          0% { opacity: 0; }
          15% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes trainer-pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Flash effect */}
      <div
        className="absolute inset-0 bg-red-500 pointer-events-none"
        style={{ animation: 'trainer-bg-flash 0.6s ease-out forwards' }}
      />

      {/* Main content */}
      <div
        className="relative flex flex-col items-center gap-4 max-w-xs w-full px-4"
        style={{ animation: 'trainer-slide-in 0.8s ease-out' }}
      >
        {/* Alert badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1))',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 20px rgba(239,68,68,0.15)',
        }}>
          <span className="text-red-400 text-[10px] font-black uppercase tracking-[3px]">
            Trainer Challenge!
          </span>
        </div>

        {/* Trainer sprite and info */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {trainer.sprite}
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-red-400/30" style={{
            animation: 'trainer-pulse-ring 1.5s ease-out infinite',
          }} />
        </div>

        {/* Name and title */}
        <div className="text-center">
          <p className="text-white text-base font-bold">{trainer.name}</p>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">{trainer.title}</p>
        </div>

        {/* Quote */}
        <div className="rounded-xl p-3 w-full" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p className="text-white/60 text-xs text-center italic leading-relaxed">
            "{trainer.quote}"
          </p>
        </div>

        {/* Team preview */}
        <div className="flex items-center gap-3 justify-center">
          {trainer.team.map((member, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                ❓
              </div>
              <span className="text-[7px] text-white/25">Lv.{member.level}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        {phase === 'ready' && (
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onAccept}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#fca5a5',
                boxShadow: '0 4px 16px rgba(239,68,68,0.15)',
              }}
            >
              Battle!
            </button>
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Flee
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
