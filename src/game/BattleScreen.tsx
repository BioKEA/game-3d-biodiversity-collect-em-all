import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Creature, CapturedCreature, Move, InventoryItem, WeatherType, TimeOfDay, BiomeType } from '@/types/game'
import { getBattleModifiers, getWeatherInfo } from './timeWeather'
import {
  type CreatureMood, type StatusState, type EncounterType, type Personality,
  getMoodInfo, getMoodDamageModifier, getMoodCatchModifier, willCreatureFlee,
  getTypeEffectiveness, rollStatusEffect, getStatusInfo, applyPoisonDamage, applyBurnDamage,
  rollDefendBuff, getEncounterTypeInfo, getEncounterStatBoost,
  rollPersonality, getPersonalityReaction, rollFriendlyGift, type FriendlyGift,
} from './encounterSystem'
import { getEffectiveAbility, rollAbilityCrit, getAbilityDamageMultiplier, rollAbilityDodge, triggerLowHpHeal } from './abilities'
import { rollHappinessCrit } from './happiness'
import { getEffectiveStats, getHeldItem } from './heldItems'
import { SFX } from './sounds'
import BattleBiomeBackground from './BattleBiomeBackground'
import { TypeMatchupBadge } from './TypeChart'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  wildCreature: Creature
  playerCreature: CapturedCreature
  team: CapturedCreature[]
  inventory: InventoryItem[]
  weather: WeatherType
  timeOfDay: TimeOfDay
  mood: CreatureMood
  encounterType: EncounterType
  onWin: (xpGained: number) => void
  onLose: () => void
  onCapture: (creature: Creature, personality: Personality) => void
  onFlee: () => void
  onUseItem: (itemId: string) => void
  onSwitch: (index: number) => void
  onFriendlyGift: (gift: FriendlyGift) => void
  onCreatureFled: () => void
  biome: BiomeType
  subregion: string
}

function StatusBadge({ status }: { status: StatusState }) {
  const info = getStatusInfo(status.effect)
  if (!info) return null
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40` }}
    >
      <PixelIcon icon={info.icon} size={16} color={info.color} /> {info.label} ({status.turnsLeft})
    </span>
  )
}

export default function BattleScreen({
  wildCreature,
  playerCreature,
  team,
  inventory,
  weather,
  timeOfDay,
  mood,
  encounterType,
  onWin,
  onLose,
  onCapture,
  onFlee,
  onUseItem,
  onSwitch,
  onFriendlyGift,
  onCreatureFled,
  biome,
  subregion,
}: Props) {
  const statBoost = getEncounterStatBoost(encounterType)
  const boostedMaxHp = Math.floor(wildCreature.stats.maxHp * statBoost)

  const [enemyHp, setEnemyHp] = useState(boostedMaxHp)
  const [playerHp, setPlayerHp] = useState(playerCreature.stats.hp)
  const [log, setLog] = useState<string[]>([`A wild ${wildCreature.name} appeared!`])
  const [turn, setTurn] = useState<'player' | 'enemy' | 'animating'>('player')
  const [showMoves, setShowMoves] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [showSwitch, setShowSwitch] = useState(false)
  const [shakeEnemy, setShakeEnemy] = useState(false)
  const [shakePlayer, setShakePlayer] = useState(false)
  const [battleOver, setBattleOver] = useState(false)
  const [playerStatus, setPlayerStatus] = useState<StatusState>({ effect: null, turnsLeft: 0 })
  const [enemyStatus, setEnemyStatus] = useState<StatusState>({ effect: null, turnsLeft: 0 })
  const [attackCallout, setAttackCallout] = useState<string | null>(null)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [friendlyMode, setFriendlyMode] = useState(mood === 'friendly')
  const [personality] = useState<Personality>(() => rollPersonality())
  const [captureReaction, setCaptureReaction] = useState<string | null>(null)
  const [capturePhase, setCapturePhase] = useState<'idle' | 'shake' | 'caught' | 'reveal'>('idle')

  // Battle intro & KO states
  const [introPhase, setIntroPhase] = useState<'sliding' | 'ready'>('sliding')
  const [enemyKO, setEnemyKO] = useState(false)
  const [playerKO, setPlayerKO] = useState(false)
  const [impactSlash, setImpactSlash] = useState<{ id: number; target: 'enemy' | 'player'; angle: number } | null>(null)

  // Juice states
  const [floatingDmg, setFloatingDmg] = useState<{ id: number; value: string; x: string; y: string; color: string }[]>([])
  const [playerLunge, setPlayerLunge] = useState(false)
  const [enemyLunge, setEnemyLunge] = useState(false)
  const [effectivenessText, setEffectivenessText] = useState<{ text: string; color: string } | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const [moveParticles, setMoveParticles] = useState<{ id: number; type: string; x: string; y: string; particles: { px: string; py: string; color: string; size: number; delay: number }[] } | null>(null)
  const [enemyHitFlash, setEnemyHitFlash] = useState(false)
  const [playerHitFlash, setPlayerHitFlash] = useState(false)
  const [enemyStatusFlash, setEnemyStatusFlash] = useState<'poison' | 'burn' | null>(null)
  const [playerStatusFlash, setPlayerStatusFlash] = useState<'poison' | 'burn' | null>(null)
  // HP ghost bar — shows trailing damage
  const [enemyHpGhost, setEnemyHpGhost] = useState(boostedMaxHp)
  const [playerHpGhost, setPlayerHpGhost] = useState(playerCreature.stats.hp)
  // Combo chain — track consecutive same-type attacks
  const [comboCount, setComboCount] = useState(0)
  const [comboType, setComboType] = useState<string | null>(null)
  const [comboFlash, setComboFlash] = useState(false)
  const [critZoom, setCritZoom] = useState(false)
  let dmgCounter = 0

  // Ghost HP bar trails behind actual HP with a delay
  useEffect(() => {
    const timer = setTimeout(() => setEnemyHpGhost(enemyHp), 600)
    return () => clearTimeout(timer)
  }, [enemyHp])

  useEffect(() => {
    const timer = setTimeout(() => setPlayerHpGhost(playerHp), 600)
    return () => clearTimeout(timer)
  }, [playerHp])

  const spawnMoveParticles = useCallback((moveType: string, target: 'enemy' | 'player') => {
    const x = target === 'enemy' ? '72%' : '18%'
    const y = target === 'enemy' ? '25%' : '55%'
    const particles: { px: string; py: string; color: string; size: number; delay: number }[] = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const dist = 30 + Math.random() * 40
      let color = '#fff'
      if (moveType === 'water' || moveType === 'marine') color = ['#38bdf8', '#7dd3fc', '#bae6fd'][i % 3]
      else if (moveType === 'fire' || moveType === 'burn') color = ['#f97316', '#fbbf24', '#ef4444'][i % 3]
      else if (moveType === 'bird') color = ['#e2e8f0', '#cbd5e1', '#94a3b8'][i % 3]
      else if (moveType === 'insect') color = ['#84cc16', '#a3e635', '#65a30d'][i % 3]
      else if (moveType === 'mystic') color = ['#c084fc', '#a78bfa', '#e879f9'][i % 3]
      else if (moveType === 'beast') color = ['#d4a373', '#a0522d', '#deb887'][i % 3]
      else color = ['#f1f5f9', '#e2e8f0', '#cbd5e1'][i % 3]
      particles.push({
        px: `${Math.cos(angle) * dist}px`,
        py: `${Math.sin(angle) * dist}px`,
        color,
        size: 3 + Math.random() * 4,
        delay: i * 0.04,
      })
    }
    const id = Date.now()
    setMoveParticles({ id, type: moveType, x, y, particles })
    setTimeout(() => setMoveParticles(null), 800)
  }, [])

  const showFloatingDmg = useCallback((value: string, target: 'enemy' | 'player', color: string) => {
    const id = ++dmgCounter
    const x = target === 'enemy' ? '72%' : '18%'
    const y = target === 'enemy' ? '15%' : '55%'
    setFloatingDmg(prev => [...prev, { id, value, x, y, color }])
    setTimeout(() => setFloatingDmg(prev => prev.filter(d => d.id !== id)), 1200)
  }, [])

  const showEffectiveness = useCallback((text: string, color: string) => {
    setEffectivenessText({ text, color })
    setTimeout(() => setEffectivenessText(null), 1000)
  }, [])

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 300)
  }, [])

  const moodInfo = getMoodInfo(mood)
  const encounterInfo = getEncounterTypeInfo(encounterType)
  const weatherInfo = getWeatherInfo(weather)

  const mods = useMemo(
    () => getBattleModifiers(weather, timeOfDay, playerCreature.type, wildCreature.type),
    [weather, timeOfDay, playerCreature.type, wildCreature.type],
  )

  // Battle intro animation — creatures slide in from sides
  useEffect(() => {
    const timer = setTimeout(() => setIntroPhase('ready'), 700)
    return () => clearTimeout(timer)
  }, [])

  // Spawn impact slash on hit
  const spawnImpactSlash = useCallback((target: 'enemy' | 'player') => {
    const id = Date.now()
    const angle = -30 + Math.random() * 60
    setImpactSlash({ id, target, angle })
    setTimeout(() => setImpactSlash(null), 400)
  }, [])

  // Log encounter info on mount + play wild creature cry
  useEffect(() => {
    const msgs: string[] = []
    if (encounterType !== 'single') {
      msgs.push(encounterInfo.description)
    }
    if (mood !== 'neutral') {
      msgs.push(`${wildCreature.name} looks ${moodInfo.label.toLowerCase()}! ${moodInfo.description}`)
    }
    if (msgs.length > 0) {
      setLog(prev => [...prev, ...msgs])
    }
    // Play wild creature cry on battle entry
    setTimeout(() => SFX.creatureCry(wildCreature.id, wildCreature.type), 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-5), msg])
  }, [])

  const flashScreen = useCallback((color: string) => {
    setScreenFlash(color)
    setTimeout(() => setScreenFlash(null), 200)
  }, [])

  const showCallout = useCallback((name: string) => {
    setAttackCallout(name)
    setTimeout(() => setAttackCallout(null), 600)
  }, [])

  const tickStatus = useCallback((
    status: StatusState,
    setStatus: React.Dispatch<React.SetStateAction<StatusState>>,
    targetName: string,
    maxHp: number,
    currentHp: number,
    setHp: React.Dispatch<React.SetStateAction<number>>,
    logFn: (msg: string) => void,
  ): { hp: number; stunned: boolean } => {
    if (!status.effect) return { hp: currentHp, stunned: false }

    let hp = currentHp
    let stunned = false

    if (status.effect === 'poison') {
      const dmg = applyPoisonDamage(maxHp)
      hp = Math.max(0, hp - dmg)
      setHp(hp)
      logFn(`${targetName} took ${dmg} poison damage!`)
      // Visual flash for poison
      if (targetName === wildCreature.name) {
        setEnemyStatusFlash('poison')
        setTimeout(() => setEnemyStatusFlash(null), 500)
      } else {
        setPlayerStatusFlash('poison')
        setTimeout(() => setPlayerStatusFlash(null), 500)
      }
    }
    if (status.effect === 'burn') {
      const dmg = applyBurnDamage(maxHp)
      hp = Math.max(0, hp - dmg)
      setHp(hp)
      logFn(`${targetName} took ${dmg} burn damage!`)
      // Visual flash for burn
      if (targetName === wildCreature.name) {
        setEnemyStatusFlash('burn')
        setTimeout(() => setEnemyStatusFlash(null), 500)
      } else {
        setPlayerStatusFlash('burn')
        setTimeout(() => setPlayerStatusFlash(null), 500)
      }
    }
    if (status.effect === 'stun') {
      stunned = true
      logFn(`${targetName} is stunned and can't move!`)
    }
    if (status.effect === 'freeze') {
      stunned = true
      logFn(`${targetName} is frozen solid!`)
    }
    if (status.effect === 'confuse') {
      logFn(`${targetName} is confused...`)
    }

    const newTurns = status.turnsLeft - 1
    if (newTurns <= 0) {
      setStatus({ effect: null, turnsLeft: 0 })
      logFn(`${targetName} recovered from ${status.effect}!`)
    } else {
      setStatus({ ...status, turnsLeft: newTurns })
    }

    return { hp, stunned }
  }, [])

  const enemyTurn = useCallback((currentPlayerHp: number) => {
    if (currentPlayerHp <= 0) return

    setTimeout(() => {
      // Scared creatures may flee
      if (willCreatureFlee(mood, enemyHp / boostedMaxHp)) {
        addLog(`${wildCreature.name} got scared and fled!`)
        setBattleOver(true)
        setTimeout(() => onCreatureFled(), 1200)
        return
      }

      // Tick enemy status
      const enemyResult = tickStatus(
        enemyStatus, setEnemyStatus, wildCreature.name,
        boostedMaxHp, enemyHp, setEnemyHp, addLog,
      )
      if (enemyResult.hp <= 0) {
        const baseXp = Math.floor(wildCreature.stats.hp * 2 + wildCreature.stats.attack)
        const xp = Math.floor(baseXp * encounterInfo.xpMultiplier)
        addLog(`${wildCreature.name} fainted from status damage! +${xp} XP`)
        setEnemyKO(true)
        setBattleOver(true)
        setTimeout(() => onWin(xp), 1800)
        return
      }
      if (enemyResult.stunned) {
        setTurn('player')
        return
      }

      const moves = wildCreature.moves.filter(m => m.type === 'attack' || m.type === 'special')
      const move = moves[Math.floor(Math.random() * moves.length)]

      if (move && move.power > 0) {
        // Enemy confusion self-hit
        if (enemyStatus.effect === 'confuse' && Math.random() < 0.5) {
          const selfDmg = Math.max(1, Math.floor(move.power * 0.3))
          const newEnemyHp = Math.max(0, enemyHp - selfDmg)
          setEnemyHp(newEnemyHp)
          addLog(`${wildCreature.name} hurt itself in confusion! ${selfDmg} damage!`)
          setShakeEnemy(true)
          setTimeout(() => setShakeEnemy(false), 300)
          setTurn('player')
          return
        }

        showCallout(move.name)
        SFX.enemyAttack()
        SFX.creatureCryShort(wildCreature.id, wildCreature.type)

        // Check if player creature dodges via ability
        if (rollAbilityDodge(playerCreature)) {
          SFX.dodge()
          addLog(`${playerCreature.name} dodged ${move.name}!`)
          const ability = getEffectiveAbility(playerCreature)
          if (ability) addLog(`(${ability.name})`)
          setTurn('player')
          return
        }

        const moodDmgMod = getMoodDamageModifier(mood)
        const boostedAtk = wildCreature.stats.attack * statBoost
        const enemyAtkAbility = getAbilityDamageMultiplier(wildCreature.id, true)
        const playerDefAbility = getAbilityDamageMultiplier(playerCreature, false)
        const enemyAtkBuff = enemyStatus.effect === 'atkUp' ? 1.3 : 1
        const playerDefBuff = playerStatus.effect === 'defUp' ? 1.3 : 1
        const playerEffStats = getEffectiveStats(playerCreature)
        const damage = Math.max(1, Math.floor(
          (move.power * boostedAtk * mods.enemyAtkMod * moodDmgMod * enemyAtkAbility * enemyAtkBuff /
            (playerEffStats.defense * mods.playerDefMod * playerDefAbility * playerDefBuff)) * (0.8 + Math.random() * 0.4) / 10
        ))

        // Enemy lunge animation
        setEnemyLunge(true)
        setTimeout(() => setEnemyLunge(false), 300)

        // Move-type particles on player
        spawnMoveParticles(wildCreature.type, 'player')

        setShakePlayer(true)
        triggerScreenShake()
        flashScreen('rgba(239,68,68,0.2)')
        // Hit flash on player sprite
        setPlayerHitFlash(true)
        setTimeout(() => setPlayerHitFlash(false), 200)
        // Impact slash on player
        spawnImpactSlash('player')
        setTimeout(() => setShakePlayer(false), 300)
        setTimeout(() => SFX.hit(), 100)

        // Floating damage on player
        showFloatingDmg(`${damage}`, 'player', '#f87171')

        const newHp = Math.max(0, currentPlayerHp - damage)
        setPlayerHp(newHp)
        addLog(`${wildCreature.name} used ${move.name}! ${damage} damage!`)

        // Check if enemy move inflicts status on player
        const statusRoll = rollStatusEffect(move.name)
        if (statusRoll && !playerStatus.effect) {
          setPlayerStatus(statusRoll)
          const sInfo = getStatusInfo(statusRoll.effect)
          addLog(`${playerCreature.name} is now ${sInfo?.label ?? ''}!`)
        }

        if (newHp <= 0) {
          addLog(`${playerCreature.name} fainted!`)
          setPlayerKO(true)
          setBattleOver(true)
          setTimeout(() => onLose(), 1800)
        } else {
          // Check low-HP heal ability
          const healAmount = triggerLowHpHeal(playerCreature, newHp, playerCreature.stats.maxHp)
          if (healAmount > 0) {
            const healedHp = Math.min(playerCreature.stats.maxHp, newHp + healAmount)
            setPlayerHp(healedHp)
            const ability = getEffectiveAbility(playerCreature)
            addLog(`${ability?.name}: +${healAmount} HP!`)
            SFX.heal()
          }
          setTurn('player')
        }
      } else {
        addLog(`${wildCreature.name} is watching carefully...`)
        setTurn('player')
      }
    }, 800)
  }, [wildCreature, playerCreature, addLog, onLose, onWin, onCreatureFled, mood, enemyHp,
    boostedMaxHp, mods, statBoost, enemyStatus, playerStatus, encounterInfo.xpMultiplier,
    tickStatus, showCallout, flashScreen, spawnMoveParticles, spawnImpactSlash])

  const handlePlayerTurnStart = useCallback((afterAction: (hp: number) => void) => {
    // Tick player status at start of player turn
    const result = tickStatus(
      playerStatus, setPlayerStatus, playerCreature.name,
      playerCreature.stats.maxHp, playerHp, setPlayerHp, addLog,
    )
    if (result.hp <= 0) {
      addLog(`${playerCreature.name} fainted from status damage!`)
      setPlayerKO(true)
      setBattleOver(true)
      setTimeout(() => onLose(), 1800)
      return
    }
    if (result.stunned) {
      setTurn('enemy')
      enemyTurn(result.hp)
      return
    }
    afterAction(result.hp)
  }, [playerStatus, playerCreature, playerHp, addLog, onLose, tickStatus, enemyTurn])

  const handleMove = useCallback((move: Move) => {
    if (turn !== 'player' || battleOver) return
    setShowMoves(false)
    setTurn('animating')

    handlePlayerTurnStart((currentHp) => {
      if (move.type === 'defend') {
        // Defend breaks combo chain
        setComboCount(0)
        setComboType(null)
        showCallout(move.name)
        addLog(`${playerCreature.name} used ${move.name}!`)
        const heal = Math.floor(playerCreature.stats.defense * 0.3)
        const newHp = Math.min(playerCreature.stats.maxHp, currentHp + heal)
        setPlayerHp(newHp)
        addLog(`Restored ${heal} HP!`)
        // Check for self-buff
        const buff = rollDefendBuff(move.name)
        if (buff && !playerStatus.effect) {
          setPlayerStatus(buff)
          const sInfo = getStatusInfo(buff.effect)
          addLog(`${playerCreature.name} gained ${sInfo?.label ?? ''}!`)
        }
        setTurn('enemy')
        enemyTurn(newHp)
        return
      }

      // Confusion self-hit check
      if (playerStatus.effect === 'confuse' && Math.random() < 0.5) {
        const selfDmg = Math.max(1, Math.floor(move.power * 0.3))
        const newHp = Math.max(0, playerHp - selfDmg)
        setPlayerHp(newHp)
        addLog(`${playerCreature.name} hurt itself in confusion! ${selfDmg} damage!`)
        setShakePlayer(true)
        setTimeout(() => setShakePlayer(false), 300)
        if (newHp <= 0) {
          addLog(`${playerCreature.name} fainted!`)
          setPlayerKO(true)
          setBattleOver(true)
          setTimeout(() => onLose(), 1800)
          return
        }
        setTurn('enemy')
        enemyTurn(newHp)
        return
      }

      showCallout(move.name)
      SFX.attack()
      SFX.creatureCryShort(playerCreature.id, playerCreature.type)

      // Player lunge animation
      setPlayerLunge(true)
      setTimeout(() => setPlayerLunge(false), 300)

      // Combo chain tracking — same move type builds combo
      const moveKey = move.type === 'attack' ? 'atk' : 'special'
      let newCombo = 1
      if (comboType === moveKey) {
        newCombo = Math.min(comboCount + 1, 5)
      }
      setComboType(moveKey)
      setComboCount(newCombo)
      if (newCombo >= 2) {
        setComboFlash(true)
        setTimeout(() => setComboFlash(false), 600)
      }
      // Combo damage bonus: x2=1.15, x3=1.3, x4=1.45, x5=1.6
      const comboMul = newCombo >= 2 ? 1 + (newCombo - 1) * 0.15 : 1

      const typeEff = getTypeEffectiveness(playerCreature.type, wildCreature.type)
      const boostedDef = wildCreature.stats.defense * statBoost
      const abilityAtkMul = getAbilityDamageMultiplier(playerCreature, true)
      const abilityDefMul = getAbilityDamageMultiplier(wildCreature.id, false)
      const isCrit = rollAbilityCrit(playerCreature) || rollHappinessCrit(playerCreature)
      const critMul = isCrit ? 1.5 : 1
      const playerAtkBuff = playerStatus.effect === 'atkUp' ? 1.3 : 1
      const enemyDefBuff = enemyStatus.effect === 'defUp' ? 1.3 : 1
      const playerEffStats = getEffectiveStats(playerCreature)
      const baseDamage = Math.max(1, Math.floor(
        (move.power * playerEffStats.attack * mods.playerAtkMod * abilityAtkMul * critMul * playerAtkBuff * comboMul /
          (boostedDef * mods.enemyDefMod * abilityDefMul * enemyDefBuff)) * (0.8 + Math.random() * 0.4) / 10
      ))
      const damage = Math.max(1, Math.floor(baseDamage * typeEff.multiplier))

      setTimeout(() => SFX.hit(), 100)
      setShakeEnemy(true)
      triggerScreenShake()
      // Hit flash on enemy sprite
      setEnemyHitFlash(true)
      setTimeout(() => setEnemyHitFlash(false), 200)
      // Impact slash on enemy
      spawnImpactSlash('enemy')
      // Move-type particles on enemy
      spawnMoveParticles(playerCreature.type, 'enemy')
      if (typeEff.multiplier > 1 || isCrit) {
        flashScreen(isCrit ? 'rgba(255,220,50,0.25)' : 'rgba(255,255,255,0.3)')
        if (isCrit) {
          SFX.criticalHit()
          setCritZoom(true)
          setTimeout(() => setCritZoom(false), 650)
        }
      }
      setTimeout(() => setShakeEnemy(false), 300)

      // Floating damage number
      const dmgColor = isCrit ? '#fbbf24' : typeEff.multiplier > 1 ? '#f87171' : '#fff'
      const dmgText = isCrit ? `${damage}!` : `${damage}`
      showFloatingDmg(dmgText, 'enemy', dmgColor)

      // Type effectiveness callout
      if (typeEff.multiplier > 1) {
        showEffectiveness('Super effective!', '#4ade80')
      } else if (typeEff.multiplier < 1 && typeEff.multiplier > 0) {
        showEffectiveness('Not very effective...', '#f59e0b')
      }

      const newEnemyHp = Math.max(0, enemyHp - damage)
      setEnemyHp(newEnemyHp)

      let dmgMsg = `${playerCreature.name} used ${move.name}! ${damage} damage!`
      if (isCrit) dmgMsg += ' Critical hit!'
      if (newCombo >= 2) dmgMsg += ` Combo x${newCombo}!`
      if (typeEff.label) dmgMsg += ` ${typeEff.label}`
      addLog(dmgMsg)

      // Check if player move inflicts status on enemy
      const statusRoll = rollStatusEffect(move.name)
      if (statusRoll && !enemyStatus.effect) {
        setEnemyStatus(statusRoll)
        const sInfo = getStatusInfo(statusRoll.effect)
        addLog(`${wildCreature.name} is now ${sInfo?.label ?? ''}!`)
      }

      if (newEnemyHp <= 0) {
        const baseXp = Math.floor(wildCreature.stats.hp * 2 + wildCreature.stats.attack)
        const xp = Math.floor(baseXp * encounterInfo.xpMultiplier)
        addLog(`${wildCreature.name} was defeated! +${xp} XP`)
        setEnemyKO(true)
        setBattleOver(true)
        setTimeout(() => onWin(xp), 1800)
      } else {
        setTurn('enemy')
        enemyTurn(currentHp)
      }
    })
  }, [turn, battleOver, playerCreature, wildCreature, enemyHp, mods, statBoost,
    addLog, enemyTurn, onWin, handlePlayerTurnStart, showCallout, flashScreen, spawnMoveParticles, spawnImpactSlash,
    encounterInfo.xpMultiplier, enemyStatus.effect, playerStatus.effect, comboCount, comboType])

  const handleCapture = useCallback(() => {
    if (turn !== 'player' || battleOver) return
    setTurn('animating')

    const capsules = inventory.find(i => i.id === 'bio-capsule')
    if (!capsules || capsules.quantity <= 0) {
      addLog('No Bio Capsules left!')
      setTurn('player')
      return
    }

    onUseItem('bio-capsule')

    const hpRatio = enemyHp / boostedMaxHp
    const rarityMod = wildCreature.rarity === 'common' ? 1.5 :
      wildCreature.rarity === 'uncommon' ? 1.0 :
      wildCreature.rarity === 'rare' ? 0.5 : 0.25
    const moodCatchMod = getMoodCatchModifier(mood)

    const chance = Math.max(0.05, Math.min(0.95, (1 - hpRatio) * rarityMod * moodCatchMod + 0.1))

    addLog(`Threw a Bio Capsule... (${Math.round(chance * 100)}% chance)`)

    // Phase 1: Capsule shaking
    setCapturePhase('shake')
    setTimeout(() => {
      if (Math.random() < chance) {
        // Phase 2: Caught!
        setCapturePhase('caught')
        SFX.capture()
        addLog(`Caught ${wildCreature.name}!`)
        setBattleOver(true)

        // Phase 3: Reveal card with details
        setTimeout(() => {
          setCapturePhase('reveal')
          const reaction = getPersonalityReaction(wildCreature.name, personality)
          setCaptureReaction(reaction)
        }, 1200)

        // Finalize after reveal
        setTimeout(() => onCapture(wildCreature, personality), 4500)
      } else {
        setCapturePhase('idle')
        addLog(`${wildCreature.name} broke free!`)
        setTurn('enemy')
        enemyTurn(playerHp)
      }
    }, 1500)
  }, [turn, battleOver, inventory, enemyHp, boostedMaxHp, wildCreature, mood,
    personality, addLog, onUseItem, onCapture, enemyTurn, playerHp])

  const handleHeal = useCallback(() => {
    if (turn !== 'player' || battleOver) return

    const potion = inventory.find(i => i.id === 'herb-potion')
    if (!potion || potion.quantity <= 0) {
      addLog('No Herb Potions left!')
      return
    }

    setShowItems(false)
    setTurn('animating')
    onUseItem('herb-potion')

    const heal = 30
    const newHp = Math.min(playerCreature.stats.maxHp, playerHp + heal)
    const actual = newHp - playerHp
    setPlayerHp(newHp)
    addLog(`Used Herb Potion! Restored ${actual} HP!`)

    setTurn('enemy')
    enemyTurn(newHp)
  }, [turn, battleOver, inventory, playerHp, playerCreature, addLog, onUseItem, enemyTurn])

  const handleBoost = useCallback(() => {
    if (turn !== 'player' || battleOver) return

    const berry = inventory.find(i => i.id === 'energy-berry')
    if (!berry || berry.quantity <= 0) {
      addLog('No Energy Berries left!')
      return
    }
    if (playerStatus.effect === 'atkUp') {
      addLog('Attack is already boosted!')
      return
    }

    setShowItems(false)
    setTurn('animating')
    onUseItem('energy-berry')

    setPlayerStatus({ effect: 'atkUp', turnsLeft: 3 })
    addLog('Used Energy Berry! Attack boosted for 3 turns!')

    setTurn('enemy')
    enemyTurn(playerHp)
  }, [turn, battleOver, inventory, playerStatus, playerHp, addLog, onUseItem, setPlayerStatus, enemyTurn])

  const handleSwitch = useCallback((index: number) => {
    if (turn !== 'player' || battleOver) return
    setShowSwitch(false)
    setTurn('animating')

    const target = team[index]
    addLog(`${playerCreature.name}, come back! Go, ${target.nickname || target.name}!`)
    onSwitch(index)

    // Switching costs a turn
    setPlayerHp(target.stats.hp)
    setPlayerStatus({ effect: null, turnsLeft: 0 })

    setTurn('enemy')
    enemyTurn(target.stats.hp)
  }, [turn, battleOver, team, playerCreature, addLog, onSwitch, enemyTurn])

  const handleAcceptGift = useCallback(() => {
    const gift = rollFriendlyGift(wildCreature)
    addLog(gift.message)
    setBattleOver(true)
    setTimeout(() => onFriendlyGift(gift), 1200)
  }, [wildCreature, addLog, onFriendlyGift])

  const handleBattleAnyway = useCallback(() => {
    setFriendlyMode(false)
    addLog(`${wildCreature.name} looks hurt that you want to fight...`)
  }, [wildCreature, addLog])

  const rarityColor = wildCreature.rarity === 'legendary' ? '#c084fc' :
    wildCreature.rarity === 'rare' ? '#fbbf24' :
    wildCreature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af'

  const enemyHpPercent = (enemyHp / boostedMaxHp) * 100
  const playerHpPercent = (playerHp / playerCreature.stats.maxHp) * 100

  return (
    <div className={`absolute inset-0 bg-[#0a1628] flex flex-col z-50 ${screenShake ? 'battle-shake' : ''}`}>
      {/* Floating damage numbers */}
      {floatingDmg.map(d => (
        <div key={d.id} className="absolute z-[65] pointer-events-none" style={{ left: d.x, top: d.y }}>
          <div className="floating-dmg" style={{ color: d.color }}>
            {d.value}
          </div>
        </div>
      ))}

      {/* Type effectiveness callout */}
      {effectivenessText && (
        <div className="absolute inset-0 z-[58] pointer-events-none flex items-center justify-center">
          <div className="effectiveness-text" style={{ color: effectivenessText.color }}>
            {effectivenessText.text}
          </div>
        </div>
      )}

      {/* Screen flash overlay */}
      {screenFlash && (
        <div
          className="absolute inset-0 z-[60] pointer-events-none transition-opacity duration-150"
          style={{ background: screenFlash }}
        />
      )}

      {/* Move-type particles */}
      {moveParticles && (
        <div className="absolute z-[57] pointer-events-none" style={{ left: moveParticles.x, top: moveParticles.y }}>
          {moveParticles.particles.map((p, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `move-particles-burst 0.6s ease-out ${p.delay}s forwards`,
              '--px': p.px,
              '--py': p.py,
              opacity: 0,
            } as React.CSSProperties} />
          ))}
        </div>
      )}

      {/* Impact slash marks */}
      {impactSlash && (
        <div className="absolute z-[58] pointer-events-none" style={{
          left: impactSlash.target === 'enemy' ? '72%' : '18%',
          top: impactSlash.target === 'enemy' ? '25%' : '55%',
          transform: `translate(-50%, -50%) rotate(${impactSlash.angle}deg)`,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="absolute" style={{
              left: '50%', top: '50%',
              width: '60px', height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 80%, transparent 100%)',
              transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
              animation: 'impact-slash 0.35s ease-out forwards',
              animationDelay: `${i * 0.04}s`,
              boxShadow: '0 0 8px rgba(255,255,255,0.6), 0 0 16px rgba(255,220,100,0.3)',
              borderRadius: '2px',
            }} />
          ))}
        </div>
      )}

      {/* Attack callout overlay */}
      {attackCallout && (
        <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center">
          <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20" style={{
            animation: 'attack-callout-anim 0.6s ease-out forwards',
          }}>
            <span className="text-white text-lg font-bold tracking-wide">{attackCallout}</span>
          </div>
        </div>
      )}

      {/* Combo counter */}
      {comboCount >= 2 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[56] pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))',
            border: '1px solid rgba(251,191,36,0.4)',
            boxShadow: comboFlash ? '0 0 16px rgba(251,191,36,0.4)' : '0 0 8px rgba(251,191,36,0.15)',
            animation: comboFlash ? 'combo-pop 0.4s ease-out' : 'none',
            transition: 'box-shadow 0.3s',
          }}>
            <span className="text-yellow-400 text-xs font-bold tracking-wider">COMBO</span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(comboCount, 5) }, (_, i) => (
                <div key={i} className="w-2 h-3 rounded-sm" style={{
                  background: i < comboCount
                    ? `linear-gradient(180deg, #fbbf24, #f59e0b)`
                    : 'rgba(255,255,255,0.1)',
                  boxShadow: i < comboCount ? '0 0 4px rgba(251,191,36,0.5)' : 'none',
                }} />
              ))}
            </div>
            <span className="text-yellow-300 text-sm font-black">x{comboCount}</span>
            <span className="text-yellow-400/60 text-[9px]">+{Math.round((comboCount - 1) * 15)}%</span>
          </div>
        </div>
      )}

      {/* Capture animation overlay — arc throw + wobble physics */}
      {capturePhase === 'shake' && (
        <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden">
          <style>{`
            @keyframes capsule-arc-throw {
              0% { left: 15%; top: 70%; opacity: 1; transform: scale(0.6) rotate(0deg); }
              35% { left: 45%; top: 15%; transform: scale(1.2) rotate(180deg); }
              60% { left: 65%; top: 30%; transform: scale(1) rotate(300deg); }
              70% { left: 68%; top: 35%; transform: scale(0.9) rotate(340deg); }
              75% { left: 68%; top: 35%; transform: scale(1.1) rotate(350deg); }
              80% { left: 68%; top: 35%; transform: scale(1) rotate(360deg); }
              100% { left: 68%; top: 35%; transform: scale(1) rotate(360deg); }
            }
            @keyframes capsule-wobble {
              0%, 100% { transform: rotate(0deg) scale(1); }
              12% { transform: rotate(-25deg) scale(1.05); }
              24% { transform: rotate(22deg) scale(1.02); }
              36% { transform: rotate(-18deg) scale(1.01); }
              48% { transform: rotate(12deg) scale(1); }
              60% { transform: rotate(-5deg); }
              72% { transform: rotate(2deg); }
              84% { transform: rotate(0deg); }
            }
            @keyframes capsule-glow-pulse {
              0%, 100% { box-shadow: 0 0 10px rgba(139,92,246,0.3); }
              50% { box-shadow: 0 0 25px rgba(139,92,246,0.6), 0 0 50px rgba(139,92,246,0.2); }
            }
            @keyframes capsule-shadow {
              0% { opacity: 0; transform: scaleX(0.3); }
              35% { opacity: 0; }
              70% { opacity: 0.3; transform: scaleX(0.8); }
              100% { opacity: 0.2; transform: scaleX(1); }
            }
            @keyframes capsule-trail {
              0% { opacity: 0.6; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.2); }
            }
          `}</style>
          {/* Trail particles along arc */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`trail-${i}`} className="absolute rounded-full" style={{
              width: 6 - i, height: 6 - i,
              background: 'rgba(139,92,246,0.5)',
              left: `${15 + i * 9}%`,
              top: `${70 - i * 12 + Math.pow(i - 2.5, 2) * 3}%`,
              animation: `capsule-trail 0.4s ease-out ${i * 0.06}s forwards`,
            }} />
          ))}
          {/* Shadow on ground */}
          <div className="absolute" style={{
            left: '66%', top: '55%',
            width: 30, height: 8,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.3)',
            animation: 'capsule-shadow 0.8s ease-out forwards',
          }} />
          {/* The capsule */}
          <div className="absolute text-4xl" style={{
            left: '15%', top: '70%',
            animation: 'capsule-arc-throw 0.8s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          }}>
            <div style={{
              animation: 'capsule-wobble 1.2s ease-in-out 0.9s infinite',
            }}>
              <div className="rounded-full p-1" style={{
                animation: 'capsule-glow-pulse 0.6s ease-in-out 0.9s infinite',
              }}>
                <PixelIcon icon="🔮" size={44} variant="capture" selected />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capture success celebration */}
      {(capturePhase === 'caught' || capturePhase === 'reveal') && (
        <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center overflow-hidden">
          <style>{`
            @keyframes capture-burst {
              0% { transform: scale(0); opacity: 1; }
              100% { transform: scale(4); opacity: 0; }
            }
            @keyframes capture-card {
              0% { opacity: 0; transform: scale(0.5) translateY(20px); }
              60% { transform: scale(1.05) translateY(-5px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes capture-sparkle {
              0% { opacity: 0; transform: scale(0) rotate(0deg); }
              50% { opacity: 1; transform: scale(1) rotate(180deg); }
              100% { opacity: 0; transform: scale(0.5) rotate(360deg); }
            }
            @keyframes capture-stars {
              0% { opacity: 0; transform: translateY(0) scale(0); }
              30% { opacity: 1; transform: translateY(-10px) scale(1); }
              100% { opacity: 0; transform: translateY(-40px) scale(0.5); }
            }
            @keyframes confetti-burst {
              0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0); }
              30% { opacity: 1; transform: translate(calc(var(--conf-x) * 0.5), calc(var(--conf-y) * 0.5)) rotate(180deg) scale(1); }
              100% { opacity: 0; transform: translate(var(--conf-x), calc(var(--conf-y) + 30px)) rotate(540deg) scale(0.3); }
            }
          `}</style>

          {/* Burst ring */}
          {capturePhase === 'caught' && (
            <div className="absolute" style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '3px solid rgba(74,222,128,0.6)',
              animation: 'capture-burst 0.8s ease-out forwards',
            }} />
          )}

          {/* Confetti particles */}
          {Array.from({ length: 30 }).map((_, i) => {
            const hue = (i * 47) % 360
            const angle = (i * 137.5) % 360
            const dist = 40 + (i * 13) % 60
            const x = 50 + Math.cos(angle * Math.PI / 180) * dist
            const y = 50 + Math.sin(angle * Math.PI / 180) * dist
            return (
              <div key={`conf-${i}`} className="absolute" style={{
                left: '50%', top: '45%',
                width: i % 3 === 0 ? '8px' : '5px',
                height: i % 3 === 0 ? '5px' : '8px',
                background: `hsl(${hue}, 85%, 65%)`,
                borderRadius: i % 2 === 0 ? '50%' : '2px',
                animation: `confetti-burst 1s ease-out ${0.1 + i * 0.02}s forwards`,
                opacity: 0,
                '--conf-x': `${x - 50}vw`,
                '--conf-y': `${y - 50}vh`,
              } as React.CSSProperties} />
            )
          })}

          {/* Sparkles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute text-lg" style={{
              left: `${30 + Math.random() * 40}%`,
              top: `${20 + Math.random() * 40}%`,
              animation: `capture-sparkle 1s ease-out ${0.2 + i * 0.1}s forwards`,
              opacity: 0,
            }}>
              <PixelIcon icon={['✨', '⭐', '💫', '🌟'][i % 4]} size={22} variant="gold" />
            </div>
          ))}

          {/* Rising stars */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`star-${i}`} className="absolute text-sm" style={{
              left: `${25 + i * 10}%`,
              top: '55%',
              animation: `capture-stars 1.5s ease-out ${0.5 + i * 0.15}s forwards`,
              opacity: 0,
            }}>
              <PixelIcon icon="⭐" size={18} variant="gold" />
            </div>
          ))}

          {/* Capture card */}
          {capturePhase === 'reveal' && (
            <div style={{ animation: 'capture-card 0.6s ease-out forwards' }}>
              <div className="rounded-2xl p-4 w-[calc(100%-24px)] max-w-[260px] text-center" style={{
                background: 'linear-gradient(135deg, rgba(10,30,20,0.95), rgba(5,20,15,0.98))',
                border: '2px solid rgba(74,222,128,0.4)',
                boxShadow: '0 0 40px rgba(74,222,128,0.2), 0 0 80px rgba(74,222,128,0.08), 0 20px 60px rgba(0,0,0,0.5)',
              }}>
                {/* Header */}
                <div className="text-[10px] font-bold uppercase tracking-[3px] mb-2" style={{
                  color: wildCreature.isShiny ? '#c084fc' : wildCreature.isAlpha ? '#fbbf24' : '#4ade80',
                  textShadow: `0 0 10px ${wildCreature.isShiny ? 'rgba(192,132,252,0.5)' : wildCreature.isAlpha ? 'rgba(251,191,36,0.5)' : 'rgba(74,222,128,0.5)'}`,
                }}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {(wildCreature.isShiny || wildCreature.isAlpha) && (
                      <PixelIcon icon={wildCreature.isShiny ? '✨' : '⭐'} size={18} variant={wildCreature.isShiny ? 'mystic' : 'gold'} />
                    )}
                    {wildCreature.isShiny ? 'Shiny Captured!' : wildCreature.isAlpha ? 'Alpha Captured!' : 'Captured!'}
                  </span>
                </div>

                {/* Creature sprite */}
                <div className="flex justify-center mb-2">
                  <PixelCreatureToken creature={wildCreature} size={70} selected />
                </div>

                {/* Name and info */}
                <h3 className="text-white font-bold text-base mb-0.5">{wildCreature.name}</h3>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                    background: `${wildCreature.color}20`,
                    color: wildCreature.color,
                    border: `1px solid ${wildCreature.color}30`,
                  }}>{wildCreature.type}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                    background: wildCreature.rarity === 'legendary' ? 'rgba(192,132,252,0.15)' :
                      wildCreature.rarity === 'rare' ? 'rgba(251,191,36,0.15)' :
                      wildCreature.rarity === 'uncommon' ? 'rgba(96,165,250,0.15)' : 'rgba(156,163,175,0.15)',
                    color: wildCreature.rarity === 'legendary' ? '#c084fc' :
                      wildCreature.rarity === 'rare' ? '#fbbf24' :
                      wildCreature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af',
                  }}>{wildCreature.rarity}</span>
                </div>

                {/* Personality */}
                {captureReaction && (
                  <div className="rounded-lg p-2 mb-2" style={{
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.12)',
                  }}>
                    <p className="text-emerald-300/80 text-[10px] leading-relaxed">{captureReaction}</p>
                  </div>
                )}

                {/* Stat preview */}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'HP', value: wildCreature.stats.hp, color: '#22c55e' },
                    { label: 'ATK', value: wildCreature.stats.attack, color: '#ef4444' },
                    { label: 'DEF', value: wildCreature.stats.defense, color: '#3b82f6' },
                    { label: 'SPD', value: wildCreature.stats.speed, color: '#eab308' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-[7px] text-white/30">{s.label}</div>
                      <div className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Battle scene */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          transform: critZoom ? 'scale(1.15)' : 'scale(1)',
          transformOrigin: '72% 30%',
          transition: critZoom ? 'transform 0.15s ease-out' : 'transform 0.35s ease-out',
        }}
      >
        {/* Biome background */}
        <BattleBiomeBackground biome={biome} subregion={subregion} timeOfDay={timeOfDay} />

        {/* Weather indicator */}
        {weather !== 'clear' && (
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10 z-10">
            <span className="text-sm">{weatherInfo.icon}</span>
            <span className="text-white/40 text-[9px] ml-1">{weatherInfo.description}</span>
          </div>
        )}

        {/* Wild creature */}
        <div className={`absolute right-2 sm:right-6 top-[12%] ${shakeEnemy ? 'translate-x-2' : ''} ${enemyLunge ? 'enemy-lunge' : ''}`} style={{
          transition: 'transform 0.1s',
          animation: introPhase === 'sliding' ? 'battle-intro-enemy 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
            : enemyKO ? 'battle-ko 0.8s ease-in forwards' : 'none',
        }}>
          <div className="text-center relative" style={{ transform: 'scale(2)', transformOrigin: 'right top' }}>
            {/* Encounter type badge */}
            {encounterType !== 'single' && (
              <div className="absolute -top-3 -right-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg" style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 0 8px rgba(245,158,11,0.4)',
              }}>
                {encounterInfo.label}
              </div>
            )}
            {/* Creature glow aura */}
            <div className="absolute inset-0 -m-4 rounded-full pointer-events-none" style={{
              background: `radial-gradient(circle, ${rarityColor}15 0%, transparent 70%)`,
              animation: 'creature-pulse 3s ease-in-out infinite',
            }} />
            {/* Status condition persistent overlays — enemy */}
            {enemyStatus.effect === 'poison' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2,3,4].map(i => (
                  <div key={`ep-${i}`} className="absolute rounded-full" style={{
                    left: `${20 + (i * 15)}%`, bottom: `${30 + (i % 3) * 10}%`,
                    width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
                    background: 'rgba(168,85,247,0.7)',
                    boxShadow: '0 0 4px rgba(168,85,247,0.5)',
                    animation: `status-bubble-rise ${1.2 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.25}s`,
                  }} />
                ))}
              </div>
            )}
            {enemyStatus.effect === 'burn' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`ef-${i}`} className="absolute" style={{
                    left: `${25 + i * 20}%`, bottom: '20%',
                    fontSize: `${10 + i * 2}px`,
                    animation: `status-flame-flicker ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.12}s`,
                    opacity: 0.8,
                  }}><PixelIcon icon="🔥" size={18 + i * 2} variant="danger" /></div>
                ))}
              </div>
            )}
            {enemyStatus.effect === 'stun' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`es-${i}`} className="absolute" style={{
                    left: `${20 + i * 25}%`, top: `${10 + (i % 2) * 15}%`,
                    fontSize: '10px',
                    animation: `status-spark-flash ${0.3 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}><PixelIcon icon="⚡" size={18} variant="gold" /></div>
                ))}
              </div>
            )}
            {enemyStatus.effect === 'slow' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`esl-${i}`} className="absolute rounded-full" style={{
                    left: '50%', top: '50%',
                    width: `${30 + i * 12}px`, height: `${30 + i * 12}px`,
                    border: '1.5px solid rgba(96,165,250,0.3)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `status-slow-ring ${2 + i * 0.5}s linear infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }} />
                ))}
              </div>
            )}
            {enemyStatus.effect === 'freeze' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2,3,4].map(i => (
                  <div key={`efr-${i}`} className="absolute" style={{
                    left: `${15 + i * 16}%`, top: `${5 + (i % 3) * 20}%`,
                    fontSize: `${8 + (i % 2) * 3}px`,
                    animation: `status-freeze-fall ${1.5 + i * 0.3}s ease-in infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}><PixelIcon icon="❄️" size={16 + (i % 2) * 3} variant="water" /></div>
                ))}
                <div className="absolute inset-0 rounded-xl" style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  animation: 'status-freeze-pulse 2s ease-in-out infinite',
                }} />
              </div>
            )}
            {enemyStatus.effect === 'confuse' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`ecf-${i}`} className="absolute" style={{
                    left: `${20 + i * 25}%`, top: '0%',
                    fontSize: `${10 + i * 2}px`,
                    animation: `status-confuse-orbit ${1.8 + i * 0.4}s linear infinite`,
                    animationDelay: `${i * 0.6}s`,
                  }}><PixelIcon icon="💫" size={18 + i * 2} variant="mystic" /></div>
                ))}
              </div>
            )}
            <div className="mb-1 relative inline-flex" style={{
              filter: enemyHp <= 0 ? 'grayscale(1) opacity(0.5)'
                : enemyHitFlash ? 'brightness(3)'
                : enemyStatusFlash === 'poison' ? 'brightness(0.7) hue-rotate(80deg)'
                : enemyStatusFlash === 'burn' ? 'brightness(1.3) saturate(2)'
                : enemyStatus.effect === 'freeze' ? 'brightness(1.2) saturate(0.5) hue-rotate(180deg) drop-shadow(0 0 8px rgba(34,211,238,0.5))'
                : enemyStatus.effect === 'confuse' ? 'brightness(1.1) hue-rotate(45deg)'
                : wildCreature.isShiny ? `drop-shadow(0 0 16px rgba(192,132,252,0.5)) hue-rotate(180deg) saturate(1.3)`
                : wildCreature.isAlpha ? `drop-shadow(0 0 16px rgba(251,191,36,0.5))`
                : `drop-shadow(0 0 12px ${rarityColor}30)`,
              transform: shakeEnemy ? 'translateX(4px)' : enemyStatus.effect === 'confuse' ? 'rotate(5deg)' : wildCreature.isAlpha ? 'scale(1.25)' : 'none',
              transition: 'filter 0.15s, transform 0.1s',
              animation: enemyHp > 0 ? 'creature-float 4s ease-in-out infinite, creature-breathe 3s ease-in-out infinite, creature-blink 5s ease-in-out infinite' : 'none',
            }}>
              <PixelCreatureToken creature={wildCreature} size={68} selected={wildCreature.rarity === 'rare' || wildCreature.rarity === 'legendary'} />
            </div>
            {/* Ground shadow with breathing sync */}
            <div className="mx-auto -mt-1 mb-2" style={{
              width: 64, height: 12,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: enemyHp > 0 ? 'shadow-breathe 3s ease-in-out infinite' : 'none',
            }} />
            {/* Info panel */}
            <div className="relative rounded-xl px-3 py-2 border origin-top" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
              backdropFilter: 'blur(12px)',
              borderColor: `${rarityColor}25`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
              transform: 'scale(0.8)',
            }}>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-white text-xs font-bold tracking-wide">{wildCreature.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                  background: `${rarityColor}18`,
                  color: rarityColor,
                  border: `1px solid ${rarityColor}30`,
                  textShadow: `0 0 6px ${rarityColor}40`,
                }}>
                  {wildCreature.rarity}
                </span>
                {wildCreature.isAlpha && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{
                    background: 'rgba(251,191,36,0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.35)',
                    textShadow: '0 0 6px rgba(251,191,36,0.4)',
                  }}><span className="inline-flex items-center gap-1"><PixelIcon icon="⭐" size={14} variant="gold" /> ALPHA</span></span>
                )}
                {wildCreature.isShiny && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{
                    background: 'rgba(192,132,252,0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(192,132,252,0.35)',
                    textShadow: '0 0 6px rgba(192,132,252,0.4)',
                  }}><span className="inline-flex items-center gap-1"><PixelIcon icon="✨" size={14} variant="mystic" /> SHINY</span></span>
                )}
                <TypeMatchupBadge attackerType={playerCreature.type} defenderType={wildCreature.type} />
                <span className="text-[10px] px-1 py-0.5 rounded" style={{ color: moodInfo.color }} title={moodInfo.description}>
                  <PixelIcon icon={moodInfo.icon} size={14} variant="nature" />
                </span>
              </div>
              {/* HP bar with ghost trail + glow */}
              <div className="w-32 h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                {/* Ghost trail bar — shows damage taken */}
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${(enemyHpGhost / boostedMaxHp) * 100}%`,
                  background: 'rgba(239,68,68,0.4)',
                }} />
                <div className="h-full rounded-full transition-all duration-500 relative" style={{
                  width: `${enemyHpPercent}%`,
                  background: enemyHpPercent > 50
                    ? 'linear-gradient(180deg, #4ade80, #16a34a)'
                    : enemyHpPercent > 25
                    ? 'linear-gradient(180deg, #fbbf24, #d97706)'
                    : 'linear-gradient(180deg, #f87171, #dc2626)',
                  boxShadow: enemyHpPercent > 50
                    ? '0 0 6px rgba(34,197,94,0.4)'
                    : enemyHpPercent > 25
                    ? '0 0 6px rgba(234,179,8,0.4)'
                    : '0 0 6px rgba(239,68,68,0.4)',
                  animation: enemyHpPercent <= 20 ? 'hp-critical-pulse 1s ease-in-out infinite' : 'none',
                }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/40 font-mono">{enemyHp}/{boostedMaxHp}</span>
                {enemyStatus.effect && <StatusBadge status={enemyStatus} />}
              </div>
            </div>
          </div>
        </div>

        {/* Player creature */}
        <div className={`absolute left-2 sm:left-6 bottom-[24%] ${shakePlayer ? '-translate-x-2' : ''} ${playerLunge ? 'player-lunge' : ''}`} style={{
          transition: 'transform 0.1s',
          animation: introPhase === 'sliding' ? 'battle-intro-player 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
            : playerKO ? 'battle-ko 0.8s ease-in forwards' : 'none',
        }}>
          <div className="text-center relative" style={{ transform: 'scale(2)', transformOrigin: 'left bottom' }}>
            {/* Player creature glow */}
            <div className="absolute inset-0 -m-4 rounded-full pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)',
            }} />
            {/* Status condition persistent overlays — player */}
            {playerStatus.effect === 'poison' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2,3,4].map(i => (
                  <div key={`pp-${i}`} className="absolute rounded-full" style={{
                    left: `${20 + (i * 15)}%`, bottom: `${30 + (i % 3) * 10}%`,
                    width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
                    background: 'rgba(168,85,247,0.7)',
                    boxShadow: '0 0 4px rgba(168,85,247,0.5)',
                    animation: `status-bubble-rise ${1.2 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.25}s`,
                  }} />
                ))}
              </div>
            )}
            {playerStatus.effect === 'burn' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`pf-${i}`} className="absolute" style={{
                    left: `${25 + i * 20}%`, bottom: '20%',
                    fontSize: `${10 + i * 2}px`,
                    animation: `status-flame-flicker ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.12}s`,
                    opacity: 0.8,
                  }}><PixelIcon icon="🔥" size={18 + i * 2} variant="danger" /></div>
                ))}
              </div>
            )}
            {playerStatus.effect === 'stun' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`ps-${i}`} className="absolute" style={{
                    left: `${20 + i * 25}%`, top: `${10 + (i % 2) * 15}%`,
                    fontSize: '10px',
                    animation: `status-spark-flash ${0.3 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}><PixelIcon icon="⚡" size={18} variant="gold" /></div>
                ))}
              </div>
            )}
            {playerStatus.effect === 'slow' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`psl-${i}`} className="absolute rounded-full" style={{
                    left: '50%', top: '50%',
                    width: `${30 + i * 12}px`, height: `${30 + i * 12}px`,
                    border: '1.5px solid rgba(96,165,250,0.3)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `status-slow-ring ${2 + i * 0.5}s linear infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }} />
                ))}
              </div>
            )}
            {playerStatus.effect === 'freeze' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2,3,4].map(i => (
                  <div key={`pfr-${i}`} className="absolute" style={{
                    left: `${15 + i * 16}%`, top: `${5 + (i % 3) * 20}%`,
                    fontSize: `${8 + (i % 2) * 3}px`,
                    animation: `status-freeze-fall ${1.5 + i * 0.3}s ease-in infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}><PixelIcon icon="❄️" size={16 + (i % 2) * 3} variant="water" /></div>
                ))}
                <div className="absolute inset-0 rounded-xl" style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  animation: 'status-freeze-pulse 2s ease-in-out infinite',
                }} />
              </div>
            )}
            {playerStatus.effect === 'confuse' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[0,1,2].map(i => (
                  <div key={`pcf-${i}`} className="absolute" style={{
                    left: `${20 + i * 25}%`, top: '0%',
                    fontSize: `${10 + i * 2}px`,
                    animation: `status-confuse-orbit ${1.8 + i * 0.4}s linear infinite`,
                    animationDelay: `${i * 0.6}s`,
                  }}><PixelIcon icon="💫" size={18 + i * 2} variant="mystic" /></div>
                ))}
              </div>
            )}
            <div style={{ animation: 'creature-float 4s ease-in-out infinite 0.5s, creature-breathe 3s ease-in-out infinite 0.5s' }}>
              <div className="mb-1 relative inline-flex" style={{
                transform: `scaleX(-1) ${shakePlayer ? 'translateX(4px)' : ''} ${playerStatus.effect === 'confuse' ? 'rotate(-5deg)' : ''}`,
                transition: 'filter 0.15s, transform 0.1s',
                filter: playerHitFlash ? 'brightness(3) drop-shadow(0 0 8px rgba(74,222,128,0.2))'
                  : playerStatusFlash === 'poison' ? 'brightness(0.7) hue-rotate(80deg)'
                  : playerStatusFlash === 'burn' ? 'brightness(1.3) saturate(2)'
                  : playerStatus.effect === 'freeze' ? 'brightness(1.2) saturate(0.5) hue-rotate(180deg) drop-shadow(0 0 8px rgba(34,211,238,0.5))'
                  : playerStatus.effect === 'confuse' ? 'brightness(1.1) hue-rotate(45deg)'
                  : 'drop-shadow(0 0 8px rgba(74,222,128,0.2))',
                animation: 'creature-blink 5s ease-in-out infinite 1s',
              }}>
                <PixelCreatureToken creature={playerCreature} size={60} selected flipped />
                {getHeldItem(playerCreature) && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 text-base"
                    title={getHeldItem(playerCreature)?.name}
                    style={{ transform: 'scaleX(-1)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}
                  >
                    {getHeldItem(playerCreature)?.sprite}
                  </span>
                )}
              </div>
            </div>
            {/* Ground shadow with breathing sync */}
            <div className="mx-auto -mt-1 mb-2" style={{
              width: 56, height: 10,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'shadow-breathe 3s ease-in-out infinite 0.5s',
            }} />
            {/* Info panel */}
            <div className="relative rounded-xl px-3 py-2 border origin-top" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
              backdropFilter: 'blur(12px)',
              borderColor: 'rgba(74,222,128,0.15)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              transform: 'scale(0.8)',
            }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white text-xs font-bold tracking-wide">{playerCreature.nickname || playerCreature.name}</span>
                <span className="text-[10px] font-semibold" style={{
                  color: '#4ade80',
                  textShadow: '0 0 4px rgba(74,222,128,0.3)',
                }}>Lv.{playerCreature.level}</span>
              </div>
              {getEffectiveAbility(playerCreature) && (
                <p className="text-[8px] font-medium mb-0.5" style={{
                  color: '#c084fc',
                  opacity: 0.8,
                  letterSpacing: '0.03em',
                }}>{getEffectiveAbility(playerCreature)!.name}</p>
              )}
              {/* HP bar with ghost trail + glow */}
              <div className="w-28 h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                {/* Ghost trail bar */}
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${(playerHpGhost / playerCreature.stats.maxHp) * 100}%`,
                  background: 'rgba(239,68,68,0.4)',
                }} />
                <div className="h-full rounded-full transition-all duration-500 relative" style={{
                  width: `${playerHpPercent}%`,
                  background: playerHpPercent > 50
                    ? 'linear-gradient(180deg, #4ade80, #16a34a)'
                    : playerHpPercent > 25
                    ? 'linear-gradient(180deg, #fbbf24, #d97706)'
                    : 'linear-gradient(180deg, #f87171, #dc2626)',
                  boxShadow: playerHpPercent > 50
                    ? '0 0 6px rgba(34,197,94,0.4)'
                    : playerHpPercent > 25
                    ? '0 0 6px rgba(234,179,8,0.4)'
                    : '0 0 6px rgba(239,68,68,0.4)',
                  animation: playerHpPercent <= 20 ? 'hp-critical-pulse 1s ease-in-out infinite' : 'none',
                }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/40 font-mono">{playerHp}/{playerCreature.stats.maxHp}</span>
                {playerStatus.effect && <StatusBadge status={playerStatus} />}
              </div>
            </div>
          </div>
        </div>

        {/* Battle ground line — subtle terrain edge */}
        <div className="absolute bottom-[22%] left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent 95%)',
        }} />
      </div>

      {/* Battle log — refined glass panel (hidden during friendly encounters) */}
      {!friendlyMode && (
        <div className="px-4 py-2 border-t" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.25) 100%)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="space-y-0.5">
            {log.slice(-3).map((msg, i) => {
              const isLatest = i === log.slice(-3).length - 1
              return (
                <p key={i} className="text-xs font-medium" style={{
                  color: isLatest ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                  textShadow: isLatest ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {isLatest && <span style={{ color: 'rgba(74,222,128,0.6)' }}>{'▸ '}</span>}
                  {msg}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* CSS animations for battle */}
      <style>{`
        @keyframes battle-intro-enemy {
          0% { transform: translateX(120px); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes battle-intro-player {
          0% { transform: translateX(-120px); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes battle-ko {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; filter: brightness(1); }
          20% { transform: translateY(-10px) rotate(-5deg); opacity: 1; filter: brightness(0.6); }
          40% { transform: translateY(-5px) rotate(3deg); filter: brightness(0.4); }
          100% { transform: translateY(40px) rotate(-15deg); opacity: 0; filter: brightness(0.2) grayscale(1); }
        }
        @keyframes impact-slash {
          0% { transform: translate(-50%, -50%) rotate(inherit) scaleX(0); opacity: 1; }
          30% { transform: translate(-50%, -50%) rotate(inherit) scaleX(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(inherit) scaleX(1.5); opacity: 0; }
        }
        @keyframes creature-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes creature-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes creature-float {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-3px) scale(1.01); }
          50% { transform: translateY(-5px) scale(1.025); }
          75% { transform: translateY(-2px) scale(1.01); }
        }
        @keyframes creature-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.03) scaleX(0.98); }
        }
        @keyframes shadow-breathe {
          0%, 100% { transform: scaleX(1); opacity: 0.4; }
          50% { transform: scaleX(0.85); opacity: 0.25; }
        }
        @keyframes creature-blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.7; }
        }
        @keyframes hp-critical-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes floating-dmg-anim {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          15% { opacity: 1; transform: translateY(-8px) scale(1.2); }
          30% { transform: translateY(-16px) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
        }
        .floating-dmg {
          font-size: 24px;
          font-weight: 900;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px currentColor;
          animation: floating-dmg-anim 1.2s ease-out forwards;
          font-variant-numeric: tabular-nums;
        }
        @keyframes effectiveness-anim {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.1); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9) translateY(-10px); }
        }
        .effectiveness-text {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.9), 0 0 30px currentColor;
          animation: effectiveness-anim 1s ease-out forwards;
        }
        @keyframes attack-callout-anim {
          0% { opacity: 0; transform: scale(0.7) translateY(5px); }
          20% { opacity: 1; transform: scale(1.05) translateY(-2px); }
          70% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(-8px); }
        }
        @keyframes battle-shake-anim {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -3px); }
          30% { transform: translate(-3px, 3px); }
          40% { transform: translate(3px, -2px); }
          50% { transform: translate(-2px, 1px); }
          60% { transform: translate(2px, -1px); }
          70% { transform: translate(-1px, 1px); }
          80% { transform: translate(1px, 0px); }
        }
        .battle-shake {
          animation: battle-shake-anim 0.3s ease-out;
        }
        @keyframes player-lunge-anim {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(30px) translateY(-12px) scale(1.08); }
          50% { transform: translateX(20px) translateY(-6px) scale(1.02); }
          100% { transform: translateX(0) translateY(0) scale(1); }
        }
        .player-lunge {
          animation: player-lunge-anim 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @keyframes enemy-lunge-anim {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-30px) translateY(12px) scale(1.08); }
          50% { transform: translateX(-20px) translateY(6px) scale(1.02); }
          100% { transform: translateX(0) translateY(0) scale(1); }
        }
        .enemy-lunge {
          animation: enemy-lunge-anim 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @keyframes hit-flash {
          0% { filter: brightness(3); }
          100% { filter: brightness(1); }
        }
        @keyframes status-poison-tick {
          0% { filter: brightness(1); }
          30% { filter: brightness(0.7) hue-rotate(80deg); }
          100% { filter: brightness(1); }
        }
        @keyframes status-burn-tick {
          0% { filter: brightness(1); }
          30% { filter: brightness(1.3) saturate(2); }
          100% { filter: brightness(1); }
        }
        @keyframes combo-pop {
          0% { transform: scale(1); }
          30% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes status-bubble-rise {
          0% { opacity: 0.8; transform: translateY(0) scale(1); }
          50% { opacity: 0.6; transform: translateY(-18px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-35px) scale(0.5); }
        }
        @keyframes status-flame-flicker {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-4px) scale(1.15); opacity: 1; }
          100% { transform: translateY(-2px) scale(0.9); opacity: 0.6; }
        }
        @keyframes status-spark-flash {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes status-slow-ring {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.4; }
          50% { opacity: 0.2; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.4; }
        }
        @keyframes status-freeze-fall {
          0% { opacity: 0.9; transform: translateY(0) rotate(0deg); }
          50% { opacity: 0.7; transform: translateY(15px) rotate(180deg); }
          100% { opacity: 0; transform: translateY(30px) rotate(360deg); }
        }
        @keyframes status-freeze-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes status-confuse-orbit {
          0% { transform: translateX(-10px) translateY(0) rotate(0deg); opacity: 0.8; }
          25% { transform: translateX(0) translateY(-8px) rotate(90deg); opacity: 1; }
          50% { transform: translateX(10px) translateY(0) rotate(180deg); opacity: 0.8; }
          75% { transform: translateX(0) translateY(8px) rotate(270deg); opacity: 1; }
          100% { transform: translateX(-10px) translateY(0) rotate(360deg); opacity: 0.8; }
        }
        @keyframes move-particles-water {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3); }
        }
        @keyframes move-particles-burst {
          0% { opacity: 1; transform: translate(0, 0) scale(0); }
          30% { opacity: 1; transform: translate(calc(var(--px) * 0.5), calc(var(--py) * 0.5)) scale(1); }
          100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.2); }
        }
      `}</style>

      {/* Friendly encounter — center card overlay */}
      {friendlyMode && (
        <div className="absolute inset-0 z-[52] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="relative pointer-events-auto w-[calc(100%-24px)] max-w-[280px]"
            style={{
              background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,30,0.96))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '24px 20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(52,211,153,0.04)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="text-center mb-3.5">
              <div className="flex justify-center mb-1.5">
                <PixelCreatureToken creature={wildCreature} size={58} selected />
              </div>
              <div className="text-[15px] text-white font-bold tracking-wide">{wildCreature.name}</div>
              <div className="flex justify-center gap-1.5 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                  color: rarityColor,
                  background: `${rarityColor}18`,
                }}>{wildCreature.rarity}</span>
                <span className="text-[9px] text-emerald-400 px-1.5 py-0.5 rounded" style={{
                  background: 'rgba(52,211,153,0.12)',
                }}><span className="inline-flex items-center gap-1"><PixelIcon icon="😊" size={14} variant="nature" /> friendly</span></span>
              </div>
            </div>
            <div className="rounded-[10px] p-2.5 mb-4 text-center" style={{
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.12)',
            }}>
              <p className="text-xs text-white/70 leading-relaxed">
                Seems friendly and is offering you something!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAcceptGift}
                className="rounded-xl py-2.5 text-sm font-semibold text-emerald-400 active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                  border: '1px solid rgba(16,185,129,0.35)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <PixelIcon icon="🎁" size={20} variant="item" />
                  Accept Gift
                </span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleBattleAnyway}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-300 active:scale-95 transition-transform"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <PixelIcon icon="⚔️" size={18} variant="danger" />
                    Battle Anyway
                  </span>
                </button>
                <button
                  onClick={onFlee}
                  className="flex-1 rounded-xl py-2 text-xs text-white/40 active:scale-95 transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-2 sm:p-3 border-t" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        display: friendlyMode ? 'none' : undefined,
      }}>
        {showMoves ? (
          <div className="grid grid-cols-2 gap-2">
            {playerCreature.moves.map((move) => {
              const isDamaging = move.type === 'attack' || move.type === 'special'
              const typeEff = isDamaging
                ? getTypeEffectiveness(playerCreature.type, wildCreature.type)
                : null
              // Expected damage preview — mirrors handleMove formula at median roll (1.0)
              // and excludes crit since it's probabilistic
              let dmgPreview: number | null = null
              if (isDamaging && move.power > 0) {
                const eff = getEffectiveStats(playerCreature)
                const boostedDef = wildCreature.stats.defense * statBoost
                const aAtk = getAbilityDamageMultiplier(playerCreature, true)
                const aDef = getAbilityDamageMultiplier(wildCreature.id, false)
                const atkBuff = playerStatus.effect === 'atkUp' ? 1.3 : 1
                const defBuff = enemyStatus.effect === 'defUp' ? 1.3 : 1
                const moveKey = move.type === 'attack' ? 'atk' : 'special'
                const projectedCombo = comboType === moveKey ? Math.min(comboCount + 1, 5) : 1
                const comboMul = projectedCombo >= 2 ? 1 + (projectedCombo - 1) * 0.15 : 1
                const base = Math.max(1, Math.floor(
                  (move.power * eff.attack * mods.playerAtkMod * aAtk * atkBuff * comboMul /
                    (boostedDef * mods.enemyDefMod * aDef * defBuff)) / 10
                ))
                dmgPreview = Math.max(1, Math.floor(base * (typeEff?.multiplier ?? 1)))
              }
              const hpPctAfter = dmgPreview !== null ? Math.max(0, (enemyHp - dmgPreview) / boostedMaxHp) * 100 : null
              const wouldKO = dmgPreview !== null && dmgPreview >= enemyHp
              return (
                <button
                  key={move.name}
                  onClick={() => handleMove(move)}
                  disabled={turn !== 'player'}
                  className="p-2 rounded-lg text-left transition-all border disabled:opacity-50 relative overflow-hidden"
                  style={{
                    background: move.type === 'attack' ? 'rgba(239,68,68,0.15)' :
                      move.type === 'special' ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
                    borderColor: move.type === 'attack' ? 'rgba(239,68,68,0.3)' :
                      move.type === 'special' ? 'rgba(168,85,247,0.3)' : 'rgba(34,197,94,0.3)',
                  }}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-white text-xs font-semibold truncate">{move.name}</span>
                    {typeEff && typeEff.multiplier > 1 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{
                        background: 'rgba(34,197,94,0.2)',
                        color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.4)',
                        textShadow: '0 0 6px rgba(34,197,94,0.5)',
                      }}>2×</span>
                    )}
                    {typeEff && typeEff.multiplier < 1 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{
                        background: 'rgba(239,68,68,0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.4)',
                      }}>½×</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[10px]">
                      {move.power > 0 ? `PWR ${move.power}` : 'DEF'}
                    </span>
                    {dmgPreview !== null && (
                      <span className="text-[10px] font-bold tabular-nums" style={{
                        color: wouldKO ? '#fbbf24' : '#fde68a',
                        textShadow: wouldKO ? '0 0 6px rgba(251,191,36,0.6)' : 'none',
                      }}>
                        {wouldKO ? 'KO!' : `~${dmgPreview}`}
                      </span>
                    )}
                  </div>
                  {/* Damage bar — shows how much of enemy HP this move would chew through */}
                  {dmgPreview !== null && hpPctAfter !== null && (
                    <div className="mt-1 h-0.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, ((enemyHp - Math.max(0, enemyHp - dmgPreview)) / boostedMaxHp) * 100)}%`,
                        background: wouldKO
                          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                          : 'linear-gradient(90deg, rgba(253,230,138,0.8), rgba(251,191,36,0.6))',
                        boxShadow: wouldKO ? '0 0 6px rgba(251,191,36,0.5)' : 'none',
                      }} />
                    </div>
                  )}
                </button>
              )
            })}
            <button
              onClick={() => setShowMoves(false)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs"
            >
              Back
            </button>
          </div>
        ) : showItems ? (
          <div className="grid grid-cols-2 gap-2">
            {inventory.filter(i => i.quantity > 0).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'heal') handleHeal()
                  if (item.type === 'boost') handleBoost()
                }}
                disabled={turn !== 'player'}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-left disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <PixelIcon icon={item.sprite} size={26} variant={item.type === 'heal' ? 'nature' : item.type === 'boost' ? 'gold' : 'item'} />
                  <span className="text-white text-xs font-semibold">{item.name}</span>
                </span>
                <span className="text-white/40 text-[10px] block">x{item.quantity}</span>
              </button>
            ))}
            <button
              onClick={() => setShowItems(false)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs"
            >
              Back
            </button>
          </div>
        ) : showSwitch ? (
          <div className="space-y-2">
            <p className="text-white/50 text-[10px] text-center">Choose a creature to switch in:</p>
            <div className="grid grid-cols-2 gap-2">
              {team.map((c, i) => {
                const isCurrent = c.id === playerCreature.id && c.capturedAt === playerCreature.capturedAt
                const fainted = c.stats.hp <= 0
                return (
                  <button
                    key={`${c.id}-${i}`}
                    onClick={() => handleSwitch(i)}
                    disabled={isCurrent || fainted || turn !== 'player'}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <PixelCreatureToken creature={c} size={30} />
                      <div>
                        <span className="text-white text-xs font-semibold block">
                          {c.nickname || c.name}
                        </span>
                        <span className="text-white/40 text-[10px]">
                          Lv.{c.level} HP:{c.stats.hp}/{c.stats.maxHp}
                          {isCurrent && ' (active)'}
                          {fainted && ' (fainted)'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowSwitch(false)}
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowMoves(true)}
              disabled={turn !== 'player' || battleOver}
              className="p-2 sm:p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PixelIcon icon="⚔️" size={24} variant="action" />
                Fight
              </span>
            </button>
            <button
              onClick={handleCapture}
              disabled={turn !== 'player' || battleOver}
              className="p-2 sm:p-3 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PixelIcon icon="🔮" size={24} variant="capture" />
                Catch ({inventory.find(i => i.id === 'bio-capsule')?.quantity ?? 0})
              </span>
            </button>
            <button
              onClick={() => setShowItems(true)}
              disabled={turn !== 'player' || battleOver}
              className="p-2 sm:p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PixelIcon icon="🎒" size={24} variant="item" />
                Items
              </span>
            </button>
            <button
              onClick={() => setShowSwitch(true)}
              disabled={turn !== 'player' || battleOver || team.length <= 1}
              className="p-2 sm:p-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PixelIcon icon="🔄" size={24} variant="travel" />
                Switch
              </span>
            </button>
            <button
              onClick={onFlee}
              disabled={turn !== 'player' || battleOver}
              className="col-span-2 p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <PixelIcon icon="🏃" size={22} variant="neutral" />
                Run
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
