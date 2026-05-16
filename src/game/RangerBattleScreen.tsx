import { useState, useCallback, useEffect, useMemo } from 'react'
import type { CapturedCreature, Move, Ranger, RangerTeamMember, WeatherType, TimeOfDay } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { getTypeEffectiveness } from './encounterSystem'
import { getAbility, getEffectiveAbility, rollAbilityCrit, getAbilityDamageMultiplier, rollAbilityDodge, triggerLowHpHeal } from './abilities'
import { getBattleModifiers, getWeatherInfo } from './timeWeather'
import { getEffectiveStats, getHeldItem } from './heldItems'
import { rollHappinessCrit } from './happiness'
import { SFX } from './sounds'
import PixelCreatureToken from './PixelCreatureToken'

interface DamageNumber {
  id: number
  value: string
  side: 'left' | 'right'
  color: string
}

interface Props {
  ranger: Ranger
  playerTeam: CapturedCreature[]
  weather: WeatherType
  timeOfDay: TimeOfDay
  onWin: (xp: number) => void
  onLose: () => void
  onClose: () => void
}

function buildRangerCreature(member: RangerTeamMember): CapturedCreature {
  const base = ALL_CREATURES.find(c => c.id === member.creatureId)
  if (!base) throw new Error(`Unknown creature: ${member.creatureId}`)
  const levelScale = 1 + (member.level - 1) * 0.08
  return {
    ...base,
    level: member.level,
    xp: 0,
    nickname: member.nickname,
    capturedAt: '',
    capturedBiome: 'grassland',
    stats: {
      hp: Math.floor(base.stats.hp * levelScale),
      maxHp: Math.floor(base.stats.maxHp * levelScale),
      attack: Math.floor(base.stats.attack * levelScale),
      defense: Math.floor(base.stats.defense * levelScale),
      speed: Math.floor(base.stats.speed * levelScale),
    },
  }
}

let dmgIdCounter = 0

export default function RangerBattleScreen({ ranger, playerTeam, weather, timeOfDay, onWin, onLose, onClose }: Props) {
  const rangerTeam = (ranger.battleTeam ?? []).map(buildRangerCreature)

  const [playerIdx, setPlayerIdx] = useState(0)
  const [rangerIdx, setRangerIdx] = useState(0)
  const [playerHps, setPlayerHps] = useState(() => playerTeam.map(c => c.stats.hp))
  const [rangerHps, setRangerHps] = useState(() => rangerTeam.map(c => c.stats.maxHp))
  const [log, setLog] = useState<string[]>([ranger.battleQuote ?? `${ranger.name} wants to battle!`])
  const [turn, setTurn] = useState<'player' | 'enemy' | 'animating'>('player')
  const [showMoves, setShowMoves] = useState(false)
  const [showSwitch, setShowSwitch] = useState(false)
  const [forcedSwitch, setForcedSwitch] = useState(false)
  const [battleOver, setBattleOver] = useState(false)
  const [shakeEnemy, setShakeEnemy] = useState(false)
  const [shakePlayer, setShakePlayer] = useState(false)
  const [attackCallout, setAttackCallout] = useState<string | null>(null)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([])

  const weatherInfo = getWeatherInfo(weather)

  const playerCreature = playerTeam[playerIdx]
  const rangerCreature = rangerTeam[rangerIdx]
  const playerHp = playerHps[playerIdx]
  const rangerHp = rangerHps[rangerIdx]

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-5), msg])
  }, [])

  const showCallout = useCallback((name: string) => {
    setAttackCallout(name)
    setTimeout(() => setAttackCallout(null), 600)
  }, [])

  const flashScreen = useCallback((color: string) => {
    setScreenFlash(color)
    setTimeout(() => setScreenFlash(null), 200)
  }, [])

  const addDamageNumber = useCallback((value: string, side: 'left' | 'right', color: string) => {
    const id = ++dmgIdCounter
    setDamageNumbers(prev => [...prev, { id, value, side, color }])
    setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== id)), 1200)
  }, [])

  // Check if the entire ranger team is fainted
  const isRangerTeamDown = useCallback((hps: number[]) => {
    return hps.every(hp => hp <= 0)
  }, [])

  // Check if the entire player team is fainted
  const isPlayerTeamDown = useCallback((hps: number[]) => {
    return hps.every(hp => hp <= 0)
  }, [])

  const mods = useMemo(
    () => getBattleModifiers(weather, timeOfDay, playerCreature.type, rangerCreature.type),
    [weather, timeOfDay, playerCreature.type, rangerCreature.type],
  )

  // Enemy turn logic
  const enemyTurn = useCallback((currentPlayerHp: number) => {
    if (currentPlayerHp <= 0 || battleOver) return

    setTimeout(() => {
      const moves = rangerCreature.moves.filter(m => m.power > 0)
      const move = moves[Math.floor(Math.random() * moves.length)]

      if (!move) {
        addLog(`${rangerCreature.nickname || rangerCreature.name} is watching...`)
        setTurn('player')
        return
      }

      showCallout(move.name)
      SFX.enemyAttack()

      // Player dodge via ability
      if (rollAbilityDodge(playerCreature)) {
        SFX.dodge()
        const ability = getEffectiveAbility(playerCreature)
        addLog(`${playerCreature.nickname || playerCreature.name} dodged! (${ability?.name})`)
        addDamageNumber('DODGE!', 'left', '#60a5fa')
        setTurn('player')
        return
      }

      const typeEff = getTypeEffectiveness(rangerCreature.type, playerCreature.type)
      const enemyAtkAbility = getAbilityDamageMultiplier(rangerCreature.id, true)
      const playerDefAbility = getAbilityDamageMultiplier(playerCreature, false)
      const playerEffStats = getEffectiveStats(playerCreature)
      const baseDamage = Math.max(1, Math.floor(
        (move.power * rangerCreature.stats.attack * mods.enemyAtkMod * enemyAtkAbility /
          (playerEffStats.defense * mods.playerDefMod * playerDefAbility)) * (0.8 + Math.random() * 0.4) / 10
      ))
      const damage = Math.max(1, Math.floor(baseDamage * typeEff.multiplier))

      setShakePlayer(true)
      if (typeEff.multiplier > 1) flashScreen('rgba(239,68,68,0.2)')
      setTimeout(() => { SFX.hit(); setShakePlayer(false) }, 200)

      const newHp = Math.max(0, currentPlayerHp - damage)
      setPlayerHps(prev => {
        const next = [...prev]
        next[playerIdx] = newHp
        return next
      })

      let msg = `${rangerCreature.nickname || rangerCreature.name} used ${move.name}! ${damage} dmg!`
      if (typeEff.label) msg += ` ${typeEff.label}`
      addLog(msg)
      addDamageNumber(`-${damage}`, 'left', typeEff.multiplier > 1 ? '#f87171' : '#ffffff')

      if (newHp <= 0) {
        addLog(`${playerCreature.nickname || playerCreature.name} fainted!`)
        const updatedHps = [...playerHps]
        updatedHps[playerIdx] = 0
        if (isPlayerTeamDown(updatedHps)) {
          setBattleOver(true)
          setResult('lose')
          addLog(ranger.name + ' won the battle.')
          SFX.defeat()
        } else {
          setShowSwitch(true)
          setForcedSwitch(true)
          addLog('Choose your next creature!')
        }
      } else {
        // Check low-HP heal ability
        const healAmount = triggerLowHpHeal(playerCreature, newHp, playerCreature.stats.maxHp)
        if (healAmount > 0) {
          const healedHp = Math.min(playerCreature.stats.maxHp, newHp + healAmount)
          setPlayerHps(prev => { const n = [...prev]; n[playerIdx] = healedHp; return n })
          const ability = getEffectiveAbility(playerCreature)
          addLog(`${ability?.name}: +${healAmount} HP!`)
          addDamageNumber(`+${healAmount}`, 'left', '#4ade80')
          SFX.heal()
        }
        setTurn('player')
      }
    }, 800)
  }, [rangerCreature, playerCreature, playerIdx, playerHps, addLog, showCallout, battleOver,
    ranger.name, isPlayerTeamDown, mods, flashScreen, addDamageNumber])

  // Player attack
  const handleMove = useCallback((move: Move) => {
    if (turn !== 'player' || battleOver) return
    setShowMoves(false)
    setTurn('animating')

    showCallout(move.name)
    SFX.attack()

    if (move.type === 'defend') {
      const heal = Math.floor(playerCreature.stats.defense * 0.3)
      const newHp = Math.min(playerCreature.stats.maxHp, playerHp + heal)
      setPlayerHps(prev => { const n = [...prev]; n[playerIdx] = newHp; return n })
      addLog(`${playerCreature.nickname || playerCreature.name} used ${move.name}! +${heal} HP`)
      setTurn('enemy')
      enemyTurn(newHp)
      return
    }

    // Ranger dodge via ability
    if (rollAbilityDodge(rangerCreature.id)) {
      SFX.dodge()
      const ability = getAbility(rangerCreature.id)
      addLog(`${rangerName} dodged! (${ability?.name})`)
      addDamageNumber('DODGE!', 'right', '#60a5fa')
      setTurn('enemy')
      enemyTurn(playerHp)
      return
    }

    const typeEff = getTypeEffectiveness(playerCreature.type, rangerCreature.type)
    const isCrit = rollAbilityCrit(playerCreature) || rollHappinessCrit(playerCreature)
    const playerAtkAbility = getAbilityDamageMultiplier(playerCreature, true)
    const rangerDefAbility = getAbilityDamageMultiplier(rangerCreature.id, false)
    const playerEffStats = getEffectiveStats(playerCreature)
    const baseDamage = Math.max(1, Math.floor(
      (move.power * playerEffStats.attack * mods.playerAtkMod * playerAtkAbility /
        (rangerCreature.stats.defense * mods.enemyDefMod * rangerDefAbility)) * (0.8 + Math.random() * 0.4) / 10
    ))
    let damage = Math.max(1, Math.floor(baseDamage * typeEff.multiplier))
    if (isCrit) {
      damage = Math.floor(damage * 1.5)
      flashScreen('rgba(255,215,0,0.25)')
    }
    if (typeEff.multiplier > 1) flashScreen('rgba(239,68,68,0.2)')

    setShakeEnemy(true)
    setTimeout(() => { SFX.hit(); setShakeEnemy(false) }, 200)

    const newRangerHp = Math.max(0, rangerHp - damage)
    const updatedRangerHps = [...rangerHps]
    updatedRangerHps[rangerIdx] = newRangerHp
    setRangerHps(updatedRangerHps)

    let msg = `${playerName} used ${move.name}! ${damage} dmg!`
    if (isCrit) msg += ' CRITICAL!'
    if (typeEff.label) msg += ` ${typeEff.label}`
    addLog(msg)
    addDamageNumber(
      isCrit ? `-${damage} CRIT!` : `-${damage}`,
      'right',
      isCrit ? '#fbbf24' : typeEff.multiplier > 1 ? '#f87171' : '#ffffff',
    )

    if (newRangerHp <= 0) {
      addLog(`${rangerCreature.nickname || rangerCreature.name} fainted!`)
      if (isRangerTeamDown(updatedRangerHps)) {
        setBattleOver(true)
        setResult('win')
        addLog(ranger.defeatQuote ?? `${ranger.name} was defeated!`)
        SFX.victory()
      } else {
        // Ranger sends next creature after a delay
        setTimeout(() => {
          const nextIdx = updatedRangerHps.findIndex((hp) => hp > 0)
          if (nextIdx >= 0) {
            const next = rangerTeam[nextIdx]
            addLog(`${ranger.name} sends out ${next.nickname || next.name}!`)
            setRangerIdx(nextIdx)
          }
          setTurn('player')
        }, 1000)
      }
    } else {
      // Check ranger low-HP heal ability
      const healAmt = triggerLowHpHeal(rangerCreature.id, newRangerHp, rangerCreature.stats.maxHp)
      if (healAmt > 0) {
        const healedHp = Math.min(rangerCreature.stats.maxHp, newRangerHp + healAmt)
        const hps2 = [...updatedRangerHps]; hps2[rangerIdx] = healedHp; setRangerHps(hps2)
        const ability = getAbility(rangerCreature.id)
        addLog(`${ability?.name}: ${rangerName} +${healAmt} HP!`)
        addDamageNumber(`+${healAmt}`, 'right', '#4ade80')
        SFX.heal()
      }
      setTurn('enemy')
      enemyTurn(playerHp)
    }
  }, [turn, battleOver, playerCreature, rangerCreature, playerHp, rangerHp, rangerHps, rangerIdx,
    playerIdx, addLog, showCallout, enemyTurn, isRangerTeamDown, ranger, rangerTeam,
    mods, flashScreen, addDamageNumber])

  const handleSwitch = useCallback((idx: number) => {
    if (idx === playerIdx || playerHps[idx] <= 0) return
    const target = playerTeam[idx]
    addLog(`Go, ${target.nickname || target.name}!`)
    setPlayerIdx(idx)
    setShowSwitch(false)
    setForcedSwitch(false)
    setTurn('enemy')
    enemyTurn(playerHps[idx])
  }, [playerIdx, playerHps, playerTeam, addLog, enemyTurn])

  const handleResult = useCallback(() => {
    if (result === 'win') {
      onWin(ranger.battleReward?.xp ?? 200)
    } else {
      onLose()
    }
  }, [result, ranger.battleReward, onWin, onLose])

  // Escape closes (forfeit)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !battleOver) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [battleOver, onClose])

  const rangerName = rangerCreature.nickname || rangerCreature.name
  const playerName = playerCreature.nickname || playerCreature.name
  const rangerHpPct = (rangerHp / rangerCreature.stats.maxHp) * 100
  const playerHpPct = (playerHp / playerCreature.stats.maxHp) * 100

  return (
    <div className="absolute inset-0 bg-[#0a1628] flex flex-col z-50">
      <style>{`
        @keyframes dmg-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          20% { transform: translateY(-10px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
        }
      `}</style>
      {/* Screen flash overlay */}
      {screenFlash && (
        <div className="absolute inset-0 z-[60] pointer-events-none transition-opacity duration-200" style={{ background: screenFlash }} />
      )}

      {/* Attack callout */}
      {attackCallout && (
        <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center">
          <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20 animate-pulse">
            <span className="text-white text-lg font-bold">{attackCallout}</span>
          </div>
        </div>
      )}

      {/* Floating damage numbers */}
      {damageNumbers.map(dn => (
        <div
          key={dn.id}
          className="absolute z-[56] pointer-events-none font-black text-lg"
          style={{
            color: dn.color,
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            [dn.side === 'left' ? 'left' : 'right']: '15%',
            top: '35%',
            animation: 'dmg-float 1.2s ease-out forwards',
          }}
        >
          {dn.value}
        </div>
      ))}

      {/* Battle scene */}
      <div className="flex-1 relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #1a2744 0%, #0f1a2e 50%, #0a1220 100%)',
      }}>
        {/* Ranger badge */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
          <span className="text-xl">{ranger.sprite}</span>
          <div>
            <p className="text-white text-[10px] font-bold">{ranger.name}</p>
            <div className="flex gap-1 mt-0.5">
              {rangerTeam.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full flex items-center justify-center text-[6px]" style={{
                  background: rangerHps[i] > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
                  border: i === rangerIdx ? '1px solid rgba(239,68,68,0.8)' : '1px solid transparent',
                }}>
                  {rangerHps[i] > 0 ? <PixelCreatureToken creature={c} size={12} /> : '✕'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather indicator */}
        {weather !== 'clear' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10 flex items-center gap-1.5">
            <span className="text-sm">{weatherInfo.icon}</span>
            <span className="text-white/50 text-[9px]">{weatherInfo.label}</span>
          </div>
        )}

        {/* Player team indicators */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {playerTeam.map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{
              background: playerHps[i] > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)',
              border: i === playerIdx ? '1.5px solid rgba(74,222,128,0.8)' : '1px solid rgba(255,255,255,0.1)',
            }}>
              {playerHps[i] > 0 ? <PixelCreatureToken creature={c} size={14} /> : '✕'}
            </div>
          ))}
        </div>

        {/* Ranger creature */}
        <div className={`absolute right-8 top-[15%] transition-transform ${shakeEnemy ? 'translate-x-2' : ''}`}>
          <div className="mb-2 inline-flex" style={{
            filter: rangerHp <= 0 ? 'grayscale(1) opacity(0.3)' : 'none',
            animation: rangerHp > 0 ? 'creature-float 4s ease-in-out infinite' : 'none',
          }}>
            <PixelCreatureToken creature={rangerCreature} size={122} selected />
          </div>
          <div className="mx-auto -mt-2 mb-4" style={{
            width: 128, height: 24,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-2xl font-bold">{rangerName}</span>
              <span className="text-white/30 text-lg">Lv.{rangerCreature.level}</span>
            </div>
            <div className="h-3 bg-black/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${rangerHpPct}%`,
                background: rangerHpPct > 50 ? 'linear-gradient(90deg, #16a34a, #4ade80)' :
                  rangerHpPct > 25 ? '#eab308' : '#ef4444',
              }} />
            </div>
            {getAbility(rangerCreature.id) && (
              <span className="text-sm text-purple-400/60 mt-1 block">{getAbility(rangerCreature.id)!.name}</span>
            )}
          </div>
        </div>

        {/* Player creature */}
        <div className={`absolute left-8 bottom-[20%] transition-transform ${shakePlayer ? '-translate-x-2' : ''}`}>
          <div className="mb-2 relative inline-flex" style={{
            filter: playerHp <= 0 ? 'grayscale(1) opacity(0.3)' : 'none',
          }}>
            <PixelCreatureToken creature={playerCreature} size={96} selected flipped />
            {getHeldItem(playerCreature) && (
              <span
                className="absolute -bottom-2 -right-2 text-3xl"
                title={getHeldItem(playerCreature)?.name}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
              >
                {getHeldItem(playerCreature)?.sprite}
              </span>
            )}
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-emerald-500/20 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-2xl font-bold">{playerName}</span>
              <span className="text-emerald-400 text-lg">Lv.{playerCreature.level}</span>
            </div>
            <div className="h-3 bg-black/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${playerHpPct}%`,
                background: playerHpPct > 50 ? 'linear-gradient(90deg, #16a34a, #4ade80)' :
                  playerHpPct > 25 ? '#eab308' : '#ef4444',
              }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base text-white/30">{Math.max(0, playerHp)}/{playerCreature.stats.maxHp}</span>
              {getEffectiveAbility(playerCreature) && (
                <span className="text-sm text-purple-400/60">{getEffectiveAbility(playerCreature)!.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* VS label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white/10">
          VS
        </div>
      </div>

      {/* Battle log */}
      <div className="bg-[#0d1520] border-t border-white/5 px-4 py-2 max-h-20 overflow-y-auto">
        {log.map((msg, i) => (
          <p key={i} className={`text-[10px] leading-relaxed ${i === log.length - 1 ? 'text-white/70' : 'text-white/30'}`}>
            {i === log.length - 1 ? '▸ ' : ''}{msg}
          </p>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-[#0d1520] border-t border-white/5 p-3">
        {result && (
          <div className="text-center">
            <p className="text-lg font-bold mb-2" style={{ color: result === 'win' ? '#4ade80' : '#ef4444' }}>
              {result === 'win' ? 'Victory!' : 'Defeat!'}
            </p>
            {result === 'win' && (
              <p className="text-amber-400 text-xs mb-2">+{ranger.battleReward?.xp ?? 200} XP</p>
            )}
            <button
              onClick={handleResult}
              className="px-6 py-2 rounded-lg text-white text-xs font-medium"
              style={{
                background: result === 'win'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.15))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                border: `1px solid ${result === 'win' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              {result === 'win' ? 'Claim Reward' : 'Return to Map'}
            </button>
          </div>
        )}

        {!result && !showMoves && !showSwitch && turn === 'player' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowMoves(true)}
              className="py-3 rounded-lg text-white text-xs font-medium"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              ⚔️ Fight
            </button>
            <button
              onClick={() => setShowSwitch(true)}
              disabled={playerHps.every((hp, i) => hp <= 0 || i === playerIdx)}
              className="py-3 rounded-lg text-white text-xs font-medium disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.1))', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              🔄 Switch
            </button>
            <button
              onClick={onClose}
              className="py-3 rounded-lg text-white/50 text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              🏳️ Forfeit
            </button>
          </div>
        )}

        {showMoves && (
          <div>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {playerCreature.moves.map(move => (
                <button
                  key={move.name}
                  onClick={() => handleMove(move)}
                  className="py-2.5 rounded-lg text-white text-[10px] font-medium"
                  style={{
                    background: move.type === 'attack' ? 'rgba(239,68,68,0.15)' :
                      move.type === 'special' ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
                    border: `1px solid ${move.type === 'attack' ? 'rgba(239,68,68,0.2)' :
                      move.type === 'special' ? 'rgba(168,85,247,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  }}
                >
                  {move.name} {move.power > 0 ? `(${move.power})` : '(DEF)'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoves(false)} className="text-white/30 text-[9px] hover:text-white/50">
              ← Back
            </button>
          </div>
        )}

        {showSwitch && (
          <div>
            <p className="text-white/40 text-[9px] mb-1.5">Choose a creature:</p>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {playerTeam.map((c, i) => {
                const hp = playerHps[i]
                const isCurrent = i === playerIdx
                const isFainted = hp <= 0
                return (
                  <button
                    key={i}
                    onClick={() => !isCurrent && !isFainted && handleSwitch(i)}
                    disabled={isCurrent || isFainted}
                    className="py-2 px-2 rounded-lg text-left flex items-center gap-2"
                    style={{
                      background: isCurrent ? 'rgba(74,222,128,0.1)' : isFainted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      border: isCurrent ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      opacity: isFainted ? 0.4 : 1,
                    }}
                  >
                    <PixelCreatureToken creature={c} size={30} />
                    <div>
                      <p className="text-white text-[9px] font-medium">{c.nickname || c.name}</p>
                      <p className="text-white/30 text-[8px]">{hp}/{c.stats.maxHp} HP</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {!forcedSwitch && (
              <button onClick={() => setShowSwitch(false)} className="text-white/30 text-[9px] hover:text-white/50">
                ← Back
              </button>
            )}
          </div>
        )}

        {turn === 'enemy' && !result && (
          <div className="text-center py-2">
            <p className="text-white/30 text-[10px] animate-pulse">Opponent's turn...</p>
          </div>
        )}
        {turn === 'animating' && !result && (
          <div className="text-center py-2">
            <p className="text-white/30 text-[10px]">...</p>
          </div>
        )}
      </div>
    </div>
  )
}
