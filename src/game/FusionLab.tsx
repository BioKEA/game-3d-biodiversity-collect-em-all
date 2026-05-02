import { useState, useEffect, useRef } from 'react'
import type { CapturedCreature, CreatureType, Move } from '@/types/game'
import { SFX } from './sounds'

interface Props {
  team: CapturedCreature[]
  onFuse: (idx1: number, idx2: number, result: CapturedCreature) => void
  onClose: () => void
}

// Fusion recipes: type1 + type2 → resulting type + name prefix + sprite
interface FusionRecipe {
  types: [CreatureType, CreatureType]
  resultType: CreatureType
  namePrefix: string
  sprite: string
  color: string
  bonus: 'attack' | 'defense' | 'speed' | 'hp'
  description: string
}

const FUSION_RECIPES: FusionRecipe[] = [
  { types: ['beast', 'bird'], resultType: 'mystic', namePrefix: 'Gryphon', sprite: '🦅', color: '#c084fc', bonus: 'speed', description: 'A beast that soars — land and sky merge.' },
  { types: ['beast', 'marine'], resultType: 'beast', namePrefix: 'Selkie', sprite: '🐺', color: '#38bdf8', bonus: 'hp', description: 'Seal-born, wolf-hearted — at home in tide and trail.' },
  { types: ['beast', 'insect'], resultType: 'beast', namePrefix: 'Chimera', sprite: '🐛', color: '#a3e635', bonus: 'attack', description: 'Exoskeleton and fur — armor meets ferocity.' },
  { types: ['beast', 'amphibian'], resultType: 'mystic', namePrefix: 'Swamp', sprite: '🐊', color: '#4ade80', bonus: 'defense', description: 'Marshland predator — patient, deadly, adapted.' },
  { types: ['beast', 'mystic'], resultType: 'mystic', namePrefix: 'Spirit', sprite: '✨', color: '#e879f9', bonus: 'attack', description: 'A beast touched by the supernatural — raw primal magic.' },
  { types: ['bird', 'marine'], resultType: 'bird', namePrefix: 'Storm', sprite: '🌊', color: '#60a5fa', bonus: 'speed', description: 'Born between wave and wind — rides hurricanes.' },
  { types: ['bird', 'insect'], resultType: 'insect', namePrefix: 'Flutter', sprite: '🦋', color: '#fbbf24', bonus: 'speed', description: 'Delicate wings, deadly precision — the air is theirs.' },
  { types: ['bird', 'amphibian'], resultType: 'bird', namePrefix: 'Marsh', sprite: '🪿', color: '#2dd4bf', bonus: 'hp', description: 'Wading through fog — a hunter of two worlds.' },
  { types: ['bird', 'mystic'], resultType: 'mystic', namePrefix: 'Phoenix', sprite: '🔥', color: '#f97316', bonus: 'attack', description: 'Ethereal flame takes wing — reborn from Bay mist.' },
  { types: ['marine', 'insect'], resultType: 'marine', namePrefix: 'Coral', sprite: '🐚', color: '#fb7185', bonus: 'defense', description: 'Hard shell, quick reflexes — the reef guardian.' },
  { types: ['marine', 'amphibian'], resultType: 'amphibian', namePrefix: 'Tidal', sprite: '🐸', color: '#22d3ee', bonus: 'hp', description: 'Equally at home in salt and fresh — the ultimate amphibian.' },
  { types: ['marine', 'mystic'], resultType: 'mystic', namePrefix: 'Leviathan', sprite: '🐉', color: '#818cf8', bonus: 'attack', description: 'Ancient ocean magic condensed into living form.' },
  { types: ['insect', 'amphibian'], resultType: 'insect', namePrefix: 'Plague', sprite: '🪲', color: '#84cc16', bonus: 'speed', description: 'Toxic and swarming — a marsh nightmare.' },
  { types: ['insect', 'mystic'], resultType: 'mystic', namePrefix: 'Glimmer', sprite: '✨', color: '#c084fc', bonus: 'speed', description: 'Bioluminescent magic — a swarm of living starlight.' },
  { types: ['amphibian', 'mystic'], resultType: 'mystic', namePrefix: 'Oracle', sprite: '🔮', color: '#a78bfa', bonus: 'defense', description: 'Ancient waters grant foresight — the swamp sees all.' },
]

function getRecipe(t1: CreatureType, t2: CreatureType): FusionRecipe | undefined {
  return FUSION_RECIPES.find(r =>
    (r.types[0] === t1 && r.types[1] === t2) || (r.types[0] === t2 && r.types[1] === t1)
  )
}

type FusionPhase = 'select' | 'preview' | 'animating' | 'result'

export function fuseCreatures(c1: CapturedCreature, c2: CapturedCreature, recipe: FusionRecipe): CapturedCreature {
  const avgLevel = Math.floor((c1.level + c2.level) / 2) + 1
  const bonusStat = recipe.bonus

  // Merge stats: take max of each + level bonus
  const baseHp = Math.max(c1.stats.maxHp, c2.stats.maxHp) + avgLevel * 2
  const baseAtk = Math.max(c1.stats.attack, c2.stats.attack) + avgLevel
  const baseDef = Math.max(c1.stats.defense, c2.stats.defense) + avgLevel
  const baseSpd = Math.max(c1.stats.speed, c2.stats.speed) + avgLevel

  const stats = {
    hp: baseHp + (bonusStat === 'hp' ? 10 : 0),
    maxHp: baseHp + (bonusStat === 'hp' ? 10 : 0),
    attack: baseAtk + (bonusStat === 'attack' ? 5 : 0),
    defense: baseDef + (bonusStat === 'defense' ? 5 : 0),
    speed: baseSpd + (bonusStat === 'speed' ? 5 : 0),
  }

  // Combine moves: pick best 2 from each parent
  const allMoves = [...c1.moves, ...c2.moves]
  const uniqueMoves = allMoves.reduce<Move[]>((acc, m) => {
    if (!acc.find(a => a.name === m.name)) acc.push(m)
    return acc
  }, [])
  const sortedMoves = uniqueMoves.sort((a, b) => b.power - a.power).slice(0, 4)

  const fusionName = `${recipe.namePrefix} ${c1.name.split(' ').pop()}`

  return {
    id: `fusion-${c1.id}-${c2.id}`,
    name: fusionName,
    scientificName: `${c1.scientificName.split(' ')[0]} × ${c2.scientificName.split(' ')[0]}`,
    description: recipe.description,
    type: recipe.resultType,
    rarity: c1.rarity === 'legendary' || c2.rarity === 'legendary' ? 'legendary' : 'rare',
    biomes: [...new Set([...c1.biomes, ...c2.biomes])],
    subregions: [],
    stats,
    isFantasy: true,
    sprite: recipe.sprite,
    color: recipe.color,
    moves: sortedMoves,
    level: avgLevel,
    xp: 0,
    capturedAt: new Date().toISOString(),
    capturedBiome: c1.capturedBiome,
    parentIds: [c1.id, c2.id],
    happiness: Math.round(((c1.happiness ?? 50) + (c2.happiness ?? 50)) / 2),
  }
}

export default function FusionLab({ team, onFuse, onClose }: Props) {
  const [phase, setPhase] = useState<FusionPhase>('select')
  const [selected1, setSelected1] = useState<number | null>(null)
  const [selected2, setSelected2] = useState<number | null>(null)
  const [result, setResult] = useState<CapturedCreature | null>(null)
  const [recipe, setRecipe] = useState<FusionRecipe | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  const canFuse = selected1 !== null && selected2 !== null && selected1 !== selected2
  const previewRecipe = canFuse ? getRecipe(team[selected1!].type, team[selected2!].type) : null

  // Run fusion animation on canvas
  useEffect(() => {
    if (phase !== 'animating') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(300, window.innerWidth - 48)
    const w = canvas.width = size
    const h = canvas.height = size
    const cx = w / 2, cy = h / 2

    const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }[] = []
    let tick = 0
    const color = recipe?.color || '#c084fc'

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      tick++

      // Phase 1 (0-60): Two orbs spiral toward center
      if (tick < 60) {
        const progress = tick / 60
        const angle = progress * Math.PI * 4
        const dist = 80 * (1 - progress)

        // Orb 1
        const x1 = cx + Math.cos(angle) * dist
        const y1 = cy + Math.sin(angle) * dist
        ctx.beginPath()
        ctx.arc(x1, y1, 12 - progress * 6, 0, Math.PI * 2)
        const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, 12)
        g1.addColorStop(0, `rgba(255,255,255,0.9)`)
        g1.addColorStop(1, `${color}60`)
        ctx.fillStyle = g1
        ctx.fill()

        // Orb 2
        const x2 = cx + Math.cos(angle + Math.PI) * dist
        const y2 = cy + Math.sin(angle + Math.PI) * dist
        ctx.beginPath()
        ctx.arc(x2, y2, 12 - progress * 6, 0, Math.PI * 2)
        ctx.fillStyle = g1
        ctx.fill()

        // Trailing particles
        if (tick % 2 === 0) {
          particles.push(
            { x: x1, y: y1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 30, size: 2, color },
            { x: x2, y: y2, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 30, size: 2, color }
          )
        }
      }

      // Phase 2 (60-90): Collision burst
      if (tick === 60) {
        SFX.criticalHit()
        for (let i = 0; i < 50; i++) {
          const angle = (i / 50) * Math.PI * 2
          const speed = 2 + Math.random() * 5
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 30, size: 1 + Math.random() * 3, color,
          })
        }
      }

      // Phase 2: Central glow
      if (tick >= 60 && tick < 90) {
        const pulse = (tick - 60) / 30
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 + pulse * 30)
        grad.addColorStop(0, `rgba(255,255,255,${0.8 - pulse * 0.5})`)
        grad.addColorStop(0.5, `${color}${Math.floor((0.4 - pulse * 0.2) * 255).toString(16).padStart(2, '0')}`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Phase 3 (90+): Reveal sparkles
      if (tick >= 90 && tick < 120 && tick % 3 === 0) {
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 20 + Math.random() * 40
          particles.push({
            x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5 - 1,
            life: 40, size: 1 + Math.random() * 2, color: '#fbbf24',
          })
        }
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.97
        p.vy *= 0.97
        p.life--
        if (p.life <= 0) { particles.splice(i, 1); continue }
        const alpha = Math.min(1, p.life / 20)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(alpha * 200).toString(16).padStart(2, '0')}`
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(alpha * 30).toString(16).padStart(2, '0')}`
        ctx.fill()
      }

      if (tick >= 120) {
        cancelAnimationFrame(animRef.current)
        setPhase('result')
        SFX.capture()
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [phase, recipe?.color])

  const handleStartFusion = () => {
    if (!canFuse || !previewRecipe) return
    const c1 = team[selected1!]
    const c2 = team[selected2!]
    const fused = fuseCreatures(c1, c2, previewRecipe)
    setResult(fused)
    setRecipe(previewRecipe)
    setPhase('animating')
    SFX.evolution()
  }

  const handleConfirm = () => {
    if (selected1 !== null && selected2 !== null && result) {
      onFuse(selected1, selected2, result)
    }
  }

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(3,8,16,0.97) 0%, rgba(20,10,40,0.98) 100%)' }}>
      <button onClick={onClose}
        className="absolute top-3 right-3 text-white/20 hover:text-white/50 text-xs transition-colors z-10">✕</button>

      <style>{`
        @keyframes fusion-pulse { 0%,100% { box-shadow: 0 0 20px rgba(192,132,252,0.15); } 50% { box-shadow: 0 0 40px rgba(192,132,252,0.3); } }
        @keyframes fusion-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>

      {phase === 'select' && (
        <div className="flex flex-col items-center gap-3 max-w-sm w-full px-4">
          <div className="text-center">
            <p className="text-[8px] text-purple-400 font-black uppercase tracking-[4px] mb-1">🧬 FUSION LAB 🧬</p>
            <h2 className="text-white text-base font-bold">Creature Fusion</h2>
            <p className="text-white/30 text-[10px] mt-1">Combine two creatures into a powerful hybrid</p>
          </div>

          <p className="text-white/40 text-[9px]">Select two creatures from your team:</p>

          <div className="grid grid-cols-3 gap-2 w-full">
            {team.map((c, i) => {
              const isSelected = i === selected1 || i === selected2
              const selNum = i === selected1 ? 1 : i === selected2 ? 2 : 0
              return (
                <button key={i} onClick={() => {
                  if (selected1 === i) { setSelected1(null); return }
                  if (selected2 === i) { setSelected2(null); return }
                  if (selected1 === null) setSelected1(i)
                  else if (selected2 === null) setSelected2(i)
                  else { setSelected1(selected2); setSelected2(i) }
                }}
                  className="rounded-xl p-2 text-center transition-all"
                  style={{
                    background: isSelected ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? 'rgba(192,132,252,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isSelected ? '0 0 12px rgba(192,132,252,0.2)' : 'none',
                  }}>
                  <span className="text-2xl block">{c.sprite}</span>
                  <p className="text-white/70 text-[8px] mt-1 truncate">{c.nickname || c.name}</p>
                  <p className="text-white/30 text-[7px]">Lv.{c.level} · {c.type}</p>
                  {selNum > 0 && (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                      style={{ background: 'rgba(192,132,252,0.3)', color: '#e9d5ff' }}>
                      #{selNum}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Preview */}
          {canFuse && (
            <div className="w-full rounded-xl p-3 text-center" style={{
              background: previewRecipe ? 'rgba(192,132,252,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${previewRecipe ? 'rgba(192,132,252,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {previewRecipe ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg">{team[selected1!].sprite}</span>
                    <span className="text-purple-400 text-xs font-bold">+</span>
                    <span className="text-lg">{team[selected2!].sprite}</span>
                    <span className="text-amber-400 text-xs">=</span>
                    <span className="text-xl" style={{ filter: 'drop-shadow(0 0 6px rgba(192,132,252,0.4))' }}>{previewRecipe.sprite}</span>
                  </div>
                  <p className="text-white/60 text-[9px]">{previewRecipe.description}</p>
                  <p className="text-purple-300 text-[8px] mt-1">Type: {previewRecipe.resultType} · Bonus: +{previewRecipe.bonus}</p>
                  <p className="text-amber-300/50 text-[7px] mt-1">⚠️ Both creatures will be consumed</p>
                </>
              ) : (
                <p className="text-red-300/60 text-[9px]">
                  {team[selected1!].type} + {team[selected2!].type} — no fusion recipe exists for same types
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleStartFusion}
            disabled={!canFuse || !previewRecipe}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, rgba(192,132,252,0.3), rgba(139,92,246,0.15))',
              border: '1px solid rgba(192,132,252,0.35)',
              color: '#e9d5ff',
              boxShadow: canFuse && previewRecipe ? '0 0 20px rgba(192,132,252,0.15)' : 'none',
            }}>
            Begin Fusion
          </button>

          {team.length < 2 && (
            <p className="text-white/30 text-[9px]">Need at least 2 creatures in your team</p>
          )}
        </div>
      )}

      {phase === 'animating' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest animate-pulse">Fusing...</p>
          <div className="relative">
            <canvas ref={canvasRef} style={{ width: Math.min(300, window.innerWidth - 48), height: Math.min(300, window.innerWidth - 48) }} />
            {/* Creature sprites overlaid */}
            <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-none">
              <span className="text-3xl opacity-60" style={{ animation: 'fusion-float 1s ease-in-out infinite' }}>
                {team[selected1!]?.sprite}
              </span>
              <span className="text-3xl opacity-60" style={{ animation: 'fusion-float 1s ease-in-out infinite 0.5s' }}>
                {team[selected2!]?.sprite}
              </span>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && result && recipe && (
        <div className="flex flex-col items-center gap-3 max-w-xs w-full px-4">
          <div className="text-center" style={{ animation: 'fusion-float 3s ease-in-out infinite' }}>
            <span className="text-6xl block mb-2" style={{
              filter: `drop-shadow(0 0 12px ${recipe.color})`,
            }}>{recipe.sprite}</span>
          </div>

          <div className="text-center">
            <p className="text-[8px] text-amber-400 font-black uppercase tracking-[4px] mb-1">FUSION COMPLETE</p>
            <h2 className="text-white text-lg font-bold">{result.name}</h2>
            <p className="text-white/30 text-[9px] italic">{result.scientificName}</p>
          </div>

          <div className="rounded-xl p-3 w-full" style={{
            background: `${recipe.color}10`,
            border: `1px solid ${recipe.color}25`,
            animation: 'fusion-pulse 2s ease-in-out infinite',
          }}>
            <p className="text-white/50 text-[10px] text-center leading-relaxed mb-2">{recipe.description}</p>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'HP', val: result.stats.maxHp, bonus: recipe.bonus === 'hp' },
                { label: 'ATK', val: result.stats.attack, bonus: recipe.bonus === 'attack' },
                { label: 'DEF', val: result.stats.defense, bonus: recipe.bonus === 'defense' },
                { label: 'SPD', val: result.stats.speed, bonus: recipe.bonus === 'speed' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-white/30 text-[7px] uppercase">{s.label}</p>
                  <p className={`text-sm font-bold ${s.bonus ? 'text-amber-400' : 'text-white/70'}`}>{s.val}</p>
                  {s.bonus && <p className="text-amber-400/60 text-[7px]">★</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-1.5 justify-center mt-2">
              {result.moves.map(m => (
                <span key={m.name} className="text-[7px] px-1.5 py-0.5 rounded-full"
                  style={{ background: `${recipe.color}15`, color: `${recipe.color}`, border: `1px solid ${recipe.color}25` }}>
                  {m.name} {m.power > 0 ? `(${m.power})` : ''}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/25 text-[8px]">
            <span>{team[selected1!]?.sprite}</span>
            <span>+</span>
            <span>{team[selected2!]?.sprite}</span>
            <span>→</span>
            <span className="text-lg">{recipe.sprite}</span>
          </div>

          <p className="text-white/40 text-[9px]">
            Level {result.level} · {result.rarity} · {result.type}
          </p>

          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${recipe.color}35, ${recipe.color}15)`,
              border: `1px solid ${recipe.color}45`,
              color: '#e9d5ff',
              boxShadow: `0 0 20px ${recipe.color}20`,
            }}>
            Welcome to the Team!
          </button>
        </div>
      )}
    </div>
  )
}
