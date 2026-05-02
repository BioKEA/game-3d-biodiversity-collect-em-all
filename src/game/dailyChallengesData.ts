// Daily challenge definitions and state management

export interface DailyChallenge {
  id: string
  title: string
  description: string
  icon: string
  target: number
  reward: number // coins
  type: 'catch' | 'battle' | 'fish' | 'explore' | 'steps'
}

export interface DailyChallengeProgress {
  challengeId: string
  progress: number
  claimed: boolean
}

export interface DailyState {
  date: string // YYYY-MM-DD
  challenges: DailyChallengeProgress[]
  streak: number // consecutive days with all challenges completed
  lastCompletedDate?: string // last date all 3 were completed
}

// Pool of possible challenges
const CHALLENGE_POOL: DailyChallenge[] = [
  { id: 'catch-3', title: 'Creature Catcher', description: 'Catch 3 creatures', icon: '🔮', target: 3, reward: 30, type: 'catch' },
  { id: 'catch-5', title: 'Net Master', description: 'Catch 5 creatures', icon: '🎯', target: 5, reward: 60, type: 'catch' },
  { id: 'battle-2', title: 'Battle Ready', description: 'Win 2 battles', icon: '⚔️', target: 2, reward: 25, type: 'battle' },
  { id: 'battle-5', title: 'Champion', description: 'Win 5 battles', icon: '🏆', target: 5, reward: 55, type: 'battle' },
  { id: 'fish-2', title: 'Angler', description: 'Catch 2 fish', icon: '🎣', target: 2, reward: 20, type: 'fish' },
  { id: 'fish-4', title: 'Deep Sea Fisher', description: 'Catch 4 fish', icon: '🐟', target: 4, reward: 45, type: 'fish' },
  { id: 'explore-5', title: 'Wanderer', description: 'Visit 5 new tiles', icon: '🗺️', target: 5, reward: 20, type: 'explore' },
  { id: 'explore-15', title: 'Trailblazer', description: 'Visit 15 new tiles', icon: '🧭', target: 15, reward: 50, type: 'explore' },
  { id: 'steps-50', title: 'Walker', description: 'Take 50 steps', icon: '👟', target: 50, reward: 15, type: 'steps' },
  { id: 'steps-150', title: 'Marathon', description: 'Take 150 steps', icon: '🏃', target: 150, reward: 40, type: 'steps' },
]

const DAILY_KEY = 'bioquest-daily-challenges'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// Deterministic pick based on date string — gives 3 challenges per day
function pickChallenges(dateStr: string): DailyChallenge[] {
  // Simple hash from date string
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  hash = Math.abs(hash)

  // Pick 3 unique challenges from pool, preferring different types
  const types = ['catch', 'battle', 'fish', 'explore', 'steps'] as const
  const picked: DailyChallenge[] = []

  for (let i = 0; i < 3; i++) {
    const typeIdx = (hash + i * 7) % types.length
    const type = types[typeIdx]
    const ofType = CHALLENGE_POOL.filter(c => c.type === type && !picked.some(p => p.id === c.id))
    if (ofType.length > 0) {
      picked.push(ofType[(hash + i * 13) % ofType.length])
    } else {
      // Fallback to any unpicked
      const remaining = CHALLENGE_POOL.filter(c => !picked.some(p => p.id === c.id))
      if (remaining.length > 0) {
        picked.push(remaining[(hash + i) % remaining.length])
      }
    }
  }
  return picked
}

export function getTodaysChallenges(): DailyChallenge[] {
  return pickChallenges(getToday())
}

export function loadDailyState(): DailyState {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (raw) {
      const state = JSON.parse(raw) as DailyState
      if (state.date === getToday()) return state
    }
  } catch { /* ignore */ }

  // New day — generate fresh challenges, carry over streak
  const challenges = getTodaysChallenges()
  let streak = 0
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (raw) {
      const prev = JSON.parse(raw) as DailyState
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      if (prev.lastCompletedDate === yesterdayStr) {
        streak = (prev.streak ?? 0)
      }
    }
  } catch { /* ignore */ }
  const state: DailyState = {
    date: getToday(),
    challenges: challenges.map(c => ({ challengeId: c.id, progress: 0, claimed: false })),
    streak,
  }
  saveDailyState(state)
  return state
}

export function saveDailyState(state: DailyState): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export function updateChallengeProgress(
  state: DailyState,
  type: DailyChallenge['type'],
  amount: number = 1
): DailyState {
  const challenges = getTodaysChallenges()
  const newProgress = state.challenges.map(cp => {
    const def = challenges.find(c => c.id === cp.challengeId)
    if (!def || def.type !== type || cp.claimed) return cp
    return { ...cp, progress: Math.min(cp.progress + amount, def.target) }
  })
  const newState = { ...state, challenges: newProgress }
  saveDailyState(newState)
  return newState
}

export function getClaimableCount(state: DailyState): number {
  const challenges = getTodaysChallenges()
  return state.challenges.filter(cp => {
    const def = challenges.find(c => c.id === cp.challengeId)
    return def && cp.progress >= def.target && !cp.claimed
  }).length
}

export function claimChallengeReward(
  state: DailyState,
  challengeId: string
): { newState: DailyState; reward: number } {
  const challenges = getTodaysChallenges()
  const def = challenges.find(c => c.id === challengeId)
  const cp = state.challenges.find(c => c.challengeId === challengeId)

  if (!def || !cp || cp.claimed || cp.progress < def.target) {
    return { newState: state, reward: 0 }
  }

  const newProgress = state.challenges.map(c =>
    c.challengeId === challengeId ? { ...c, claimed: true } : c
  )
  const allClaimed = newProgress.every(c => c.claimed)
  const newState: DailyState = {
    ...state,
    challenges: newProgress,
    streak: allClaimed ? (state.streak ?? 0) + 1 : (state.streak ?? 0),
    lastCompletedDate: allClaimed ? getToday() : state.lastCompletedDate,
  }
  // Streak bonus: extra 25 coins for completing all 3
  const bonus = allClaimed ? 25 : 0
  saveDailyState(newState)
  return { newState, reward: def.reward + bonus }
}
