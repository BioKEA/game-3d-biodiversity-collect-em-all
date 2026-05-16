import { useState, useRef, useEffect } from 'react'
import type { Ranger, QuestProgress, InventoryItem, PlayerState, TimeOfDay } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { FINAL_BOSS_ID, MINI_BOSS_IDS, GRAND_CHAMPION_ID, canChallengeFinalBoss, canChallengeGrandChampion, getGrandChampionProgress } from './rangers'
import { describeObjective, getQuestProgress, getObjectiveTarget } from './questHelpers'
import { getRangerActivity, getActivityEmoji, getActivityLabel } from './npcSchedules'
import PixelCreatureToken from './PixelCreatureToken'

// Pick a response based on simple keyword matching over the user's message.
// Falls back to a generic reply. Ranger-flavored, Bay Area ecology themed.
function rangerReply(msg: string, ranger: Ranger): string {
  const text = msg.toLowerCase()
  const rules: { keywords: string[]; replies: string[] }[] = [
    { keywords: ['hi', 'hello', 'hey', 'yo', 'greetings'], replies: [
      `Well met, explorer. What brings you to ${ranger.subregion}?`,
      `Hello there! Staying safe out there?`,
      `Hi. I was just cataloguing tracks when you walked up.`,
    ]},
    { keywords: ['weather', 'rain', 'fog', 'sun'], replies: [
      `The fog rolls in most afternoons here. It's what keeps the redwoods drinking.`,
      `Weather shifts fast on the coast. Always pack a layer.`,
      `Rain brings the salamanders out. Check the leaf litter.`,
    ]},
    { keywords: ['quest', 'mission', 'task', 'help'], replies: [
      `Check my quests tab — I always have work for a good field naturalist.`,
      `If you want to help, I've got a few jobs posted.`,
    ]},
    { keywords: ['rare', 'legend', 'legendary', 'mystic'], replies: [
      `The old-timers whisper about creatures only the fog remembers. Keep looking.`,
      `Rare sightings usually come at dawn or dusk. Patience, explorer.`,
    ]},
    { keywords: ['battle', 'fight', 'duel', 'challenge'], replies: [
      `If you want to test your team, hit the Battle tab — I don't pull punches.`,
      `A ranger battle is a teaching moment. Come ready.`,
    ]},
    { keywords: ['trade', 'shop', 'buy', 'sell', 'item'], replies: [
      `Trades are over in that tab. I swap supplies for things I need in the field.`,
    ]},
    { keywords: ['invasive', 'bullfrog', 'starling', 'slider'], replies: [
      `Removing invasives is some of the most important work a ranger does. Every one matters.`,
      `Native ecosystems evolved without those species. Your cleanup work genuinely helps.`,
    ]},
    { keywords: ['bird', 'birds', 'wing'], replies: [
      `Hundreds of species pass through the Bay on the Pacific Flyway. Bring binoculars.`,
    ]},
    { keywords: ['water', 'bay', 'ocean', 'tide'], replies: [
      `The Bay is an estuary — fresh meets salt. It's one of the richest nurseries on the Pacific.`,
    ]},
    { keywords: ['forest', 'tree', 'redwood'], replies: [
      `These forests predate most human cities. Walk gently.`,
    ]},
    { keywords: ['thanks', 'thank', 'cheers'], replies: [
      `Anytime, explorer. Good luck out there.`,
      `Happy to help. Stay curious.`,
    ]},
    { keywords: ['bye', 'goodbye', 'later', 'see you'], replies: [
      `Safe travels. Watch for tracks on the trail.`,
      `Until next time.`,
    ]},
    { keywords: ['love', 'favorite', 'best'], replies: [
      `Hard to pick favorites. But there's nothing like a tide-pool at dawn.`,
    ]},
  ]
  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.replies[Math.floor(Math.random() * rule.replies.length)]
    }
  }
  const generic = [
    `Interesting. Tell me more.`,
    `A lot of folks don't notice that. Good eye.`,
    `Field notes on that one are thin. I'd love to hear what you find.`,
    `Every explorer brings a different lens to it.`,
    `Hmm. I hadn't thought of it that way.`,
  ]
  return generic[Math.floor(Math.random() * generic.length)]
}

type ChatLine = { from: 'player' | 'ranger'; text: string }

interface Props {
  ranger: Ranger
  questProgress: Record<string, QuestProgress>
  player: PlayerState
  onClose: () => void
  onAcceptQuest: (questId: string) => void
  onClaimReward: (questId: string) => void
  onTrade: (tradeId: string) => void
  onChallenge?: () => void
  defeated?: boolean
  defeatedRangers?: string[]
  subregionsVisited?: string[]
  timeOfDay?: TimeOfDay
  isTutorial?: boolean
  starterName?: string
  onTutorialComplete?: () => void
}

type Tab = 'talk' | 'quests' | 'trade' | 'battle'

function getItemCount(inventory: InventoryItem[], itemId: string): number {
  return inventory.find(i => i.id === itemId)?.quantity ?? 0
}

const TUTORIAL_LINES = [
  (name: string) => `Welcome, new explorer! I'm Ranger Tomás. That's a fine ${name} — great choice for a first companion.`,
  (_: string) => `See those paw prints on the ground? They point toward wild creatures. Follow them and you might find something worth catching.`,
  (_: string) => `When you find one, weaken it in battle first — then try to catch it. The lower its health, the better your odds.`,
  (_: string) => `Your minimap is up in the corner — click it to see where you've been. Now go catch your first creature and come back to see me!`,
]

export default function RangerDialog({
  ranger, questProgress, player, onClose, onAcceptQuest, onClaimReward, onTrade, onChallenge, defeated,
  defeatedRangers = [],
  subregionsVisited = [],
  timeOfDay = 'day',
  isTutorial, starterName, onTutorialComplete,
}: Props) {
  const isFinalBoss = ranger.id === FINAL_BOSS_ID
  const isGrandChampion = ranger.id === GRAND_CHAMPION_ID
  const isMiniBoss = (MINI_BOSS_IDS as readonly string[]).includes(ranger.id)
  const schedule = getRangerActivity(ranger.id, timeOfDay)
  const isBossType = isFinalBoss || isGrandChampion || isMiniBoss
  const sleepingNoBattle = !schedule.canBattle && !isBossType
  const finalBossLocked = isFinalBoss && !canChallengeFinalBoss(defeatedRangers)
  const grandChampionLocked = isGrandChampion && !canChallengeGrandChampion(defeatedRangers, subregionsVisited)
  const grandProgress = isGrandChampion ? getGrandChampionProgress(defeatedRangers, subregionsVisited) : null
  const miniBossesDefeated = MINI_BOSS_IDS.filter(id => defeatedRangers.includes(id)).length
  const [tab, setTab] = useState<Tab>('talk')
  const [chatLog, setChatLog] = useState<ChatLine[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [tutorialStep, setTutorialStep] = useState(0)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatLog])

  if (isTutorial) {
    const line = TUTORIAL_LINES[tutorialStep]?.(starterName || 'creature')
    const isLast = tutorialStep >= TUTORIAL_LINES.length - 1

    return (
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-3">
        <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border"
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
            borderColor: 'rgba(74,222,128,0.2)',
          }}
        >
          <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-3xl">{ranger.sprite}</span>
            <div className="flex-1">
              <h2 className="text-white font-bold text-sm">{ranger.name}</h2>
              <p className="text-emerald-400 text-[10px]">{ranger.title}</p>
            </div>
            <div className="flex gap-1">
              {TUTORIAL_LINES.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors" style={{
                  background: i <= tutorialStep ? '#4ade80' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </div>

          <div className="p-5">
            <p className="text-white/80 text-sm leading-relaxed" style={{ minHeight: 48 }}>
              {line}
            </p>
          </div>

          <div className="px-4 pb-4 flex justify-end">
            <button
              onClick={() => {
                if (isLast) {
                  onTutorialComplete?.()
                  onClose()
                } else {
                  setTutorialStep(s => s + 1)
                }
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95"
              style={{
                background: isLast
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : 'rgba(255,255,255,0.08)',
                color: isLast ? 'white' : 'rgba(255,255,255,0.6)',
                border: isLast ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {isLast ? "Let's go! →" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const sendChat = () => {
    const msg = chatDraft.trim()
    if (!msg) return
    const reply = rangerReply(msg, ranger)
    setChatLog(prev => [...prev, { from: 'player', text: msg }, { from: 'ranger', text: reply }])
    setChatDraft('')
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-3">
      <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-900/40 to-transparent border-b border-white/5">
          <span className="text-3xl">{ranger.sprite}</span>
          <div className="flex-1">
            <h2 className="text-white font-bold text-sm">{ranger.name}</h2>
            <p className="text-emerald-400 text-[10px]">{ranger.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(['talk', 'quests', 'trade', ...(onChallenge ? ['battle' as const] : [])] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === t
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t === 'talk' ? '💬 Talk' : t === 'quests' ? '📋 Quests' : t === 'trade' ? '🔄 Trade' : '⚔️ Battle'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'talk' && (
            <div className="space-y-3">
              <div className="bg-white/3 rounded-lg p-3 border border-white/5">
                <p className="text-white/70 text-xs leading-relaxed italic">
                  "{schedule.greeting ?? ranger.greeting}"
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/3 rounded-lg p-2 border border-white/5">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Location</p>
                  <p className="text-white/60 text-xs">{ranger.subregion}</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Activity</p>
                  <p className="text-white/60 text-xs">{getActivityEmoji(schedule.activity)} {getActivityLabel(schedule.activity)}</p>
                </div>
              </div>

              {/* Chat with the ranger */}
              <div className="rounded-lg border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Chat</p>
                  {chatLog.length > 0 && (
                    <button
                      onClick={() => setChatLog([])}
                      className="text-white/20 hover:text-white/50 text-[9px]"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div
                  ref={chatScrollRef}
                  className="px-2 py-2 space-y-1.5 overflow-y-auto"
                  style={{ maxHeight: 160 }}
                >
                  {chatLog.length === 0 ? (
                    <p className="text-white/25 text-[10px] italic text-center py-2">
                      Say something to {ranger.name.split(' ')[0]}…
                    </p>
                  ) : (
                    chatLog.map((line, i) => (
                      <div
                        key={i}
                        className={`flex ${line.from === 'player' ? 'justify-end' : 'justify-start'} gap-1.5 items-end`}
                      >
                        {line.from === 'ranger' && <span className="text-sm leading-none mb-0.5">{ranger.sprite}</span>}
                        <div
                          className="rounded-lg px-2 py-1 max-w-[80%]"
                          style={{
                            background: line.from === 'player'
                              ? 'rgba(16,185,129,0.18)'
                              : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${line.from === 'player' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <p className="text-white text-[10px] leading-snug">{line.text}</p>
                        </div>
                        {line.from === 'player' && <span className="text-[10px] leading-none mb-0.5">🧭</span>}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-white/5 p-1.5 flex gap-1.5">
                  <input
                    value={chatDraft}
                    onChange={e => setChatDraft(e.target.value.slice(0, 120))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); sendChat() }
                      else e.stopPropagation()
                    }}
                    placeholder="Type a message…"
                    className="flex-1 bg-black/30 border border-white/8 rounded-md px-2 py-1 text-white text-[10px] placeholder-white/25 outline-none focus:border-emerald-400/40"
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatDraft.trim()}
                    className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className={`grid gap-2 ${onChallenge ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <button
                  onClick={() => setTab('quests')}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
                >
                  📋 Quests ({ranger.quests.length})
                </button>
                <button
                  onClick={() => setTab('trade')}
                  className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-cyan-300 text-xs hover:bg-cyan-500/20 transition-colors"
                >
                  🔄 Trade ({ranger.trades.length})
                </button>
                {onChallenge && (
                  <button
                    onClick={() => setTab('battle')}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-300 text-xs hover:bg-red-500/20 transition-colors"
                  >
                    ⚔️ Battle
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'quests' && (
            <div className="space-y-2">
              {ranger.quests.map(quest => {
                const qp = questProgress[quest.id]
                const status = qp?.status ?? 'available'
                const progress = getQuestProgress(quest.objective, player)
                const target = getObjectiveTarget(quest.objective)
                const isComplete = progress >= target

                return (
                  <div key={quest.id} className="bg-white/3 rounded-lg p-3 border border-white/5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-white text-xs font-semibold">{quest.title}</h3>
                      <QuestStatusBadge status={status} isComplete={isComplete && status === 'active'} />
                    </div>
                    <p className="text-white/40 text-[10px] mb-2">{quest.description}</p>

                    {/* Objective */}
                    <div className="bg-black/30 rounded-md px-2 py-1.5 mb-2">
                      <p className="text-white/50 text-[9px] uppercase tracking-wider mb-0.5">Objective</p>
                      <p className="text-white/70 text-[10px]">{describeObjective(quest.objective)}</p>
                      {status === 'active' && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${(progress / target) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-white/40">{progress}/{target}</span>
                        </div>
                      )}
                    </div>

                    {/* Reward */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[9px] text-white/30">Reward:</span>
                      <span className="text-[9px] text-cyan-400">{quest.reward.xp} XP</span>
                      {quest.reward.items?.map(item => (
                        <span key={item.id} className="text-[9px] text-white/50">
                          + {item.quantity}x {item.sprite}
                        </span>
                      ))}
                    </div>

                    {/* Action button */}
                    {status === 'available' && (
                      <button
                        onClick={() => onAcceptQuest(quest.id)}
                        className="w-full py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                      >
                        Accept Quest
                      </button>
                    )}
                    {status === 'active' && isComplete && (
                      <button
                        onClick={() => onClaimReward(quest.id)}
                        className="w-full py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors animate-pulse"
                      >
                        Claim Reward!
                      </button>
                    )}
                    {status === 'active' && !isComplete && (
                      <p className="text-white/20 text-[10px] text-center">In progress...</p>
                    )}
                    {status === 'rewarded' && (
                      <p className="text-emerald-400/50 text-[10px] text-center">✓ Completed</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'trade' && (
            <div className="space-y-2">
              {ranger.trades.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No trades available.</p>
              ) : (
                ranger.trades.map(trade => {
                  const haveCount = getItemCount(player.inventory, trade.give.itemId)
                  const canAfford = haveCount >= trade.give.quantity

                  return (
                    <div key={trade.id} className="bg-white/3 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-3">
                        {/* Give */}
                        <div className="flex-1 text-center">
                          <p className="text-[9px] text-white/30 uppercase mb-1">You give</p>
                          <p className="text-white/70 text-xs">
                            {trade.give.quantity}x {trade.give.itemName}
                          </p>
                          <p className={`text-[9px] ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                            (have {haveCount})
                          </p>
                        </div>

                        <span className="text-white/20 text-lg">→</span>

                        {/* Receive */}
                        <div className="flex-1 text-center">
                          <p className="text-[9px] text-white/30 uppercase mb-1">You get</p>
                          <p className="text-white/70 text-xs">
                            {trade.receive.sprite} {trade.receive.quantity}x {trade.receive.itemName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => canAfford && onTrade(trade.id)}
                        disabled={!canAfford}
                        className={`w-full mt-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          canAfford
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Trade' : 'Not enough items'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === 'battle' && onChallenge && (
            <div className="space-y-3">
              {/* Boss quest line badge */}
              {(isMiniBoss || isFinalBoss || isGrandChampion) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{
                  background: isGrandChampion ? 'rgba(251,191,36,0.08)' : isFinalBoss ? 'rgba(168,85,247,0.08)' : 'rgba(245,158,11,0.08)',
                  borderColor: isGrandChampion ? 'rgba(251,191,36,0.2)' : isFinalBoss ? 'rgba(168,85,247,0.2)' : 'rgba(245,158,11,0.2)',
                }}>
                  <span className="text-sm">{isGrandChampion ? '🦅' : isFinalBoss ? '👑' : '⭐'}</span>
                  <div>
                    <span className="text-[10px] font-bold" style={{
                      color: isGrandChampion ? '#fbbf24' : isFinalBoss ? '#c084fc' : '#fbbf24',
                    }}>
                      {isGrandChampion ? 'GRAND CHAMPION' : isFinalBoss ? 'FINAL BOSS' : 'MINI-BOSS'}
                    </span>
                    {isFinalBoss && (
                      <p className="text-[9px] text-white/40 mt-0.5">
                        Guardians defeated: {miniBossesDefeated}/{MINI_BOSS_IDS.length}
                      </p>
                    )}
                    {isGrandChampion && grandProgress && (
                      <p className="text-[9px] text-white/40 mt-0.5">
                        Rangers: {grandProgress.rangersDefeated}/{grandProgress.rangersTotal} · Regions: {grandProgress.subregions}/{grandProgress.subregionsRequired}+
                      </p>
                    )}
                  </div>
                </div>
              )}

              {defeated && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-emerald-400 text-[10px] font-medium">
                    {isFinalBoss ? 'Bay Area Champion — challenge again anytime' : 'Defeated — challenge again for XP'}
                  </span>
                </div>
              )}

              {/* Locked grand champion */}
              {grandChampionLocked && grandProgress ? (
                <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/15 text-center">
                  <span className="text-3xl mb-2 block">🔒</span>
                  <p className="text-white/70 text-xs leading-relaxed mb-3">
                    "You seek the ultimate challenge? First, prove you've mastered every corner of California. Defeat every ranger and explore the land."
                  </p>
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-[9px] text-white/40 mb-1">
                        <span>Rangers Defeated</span>
                        <span>{grandProgress.rangersDefeated}/{grandProgress.rangersTotal}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${(grandProgress.rangersDefeated / grandProgress.rangersTotal) * 100}%`,
                          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-white/40 mb-1">
                        <span>Regions Explored</span>
                        <span>{grandProgress.subregions}/{grandProgress.subregionsRequired}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.min(100, (grandProgress.subregions / grandProgress.subregionsRequired) * 100)}%`,
                          background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                        }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-amber-400/50 text-[9px]">Defeat all rangers and explore 20+ subregions to unlock</p>
                </div>
              ) : null}

              {/* Locked boss / Battle UI */}
              {(finalBossLocked || grandChampionLocked) ? (
                finalBossLocked ? (
                  <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/15 text-center">
                    <span className="text-3xl mb-2 block">🔒</span>
                    <p className="text-white/70 text-xs leading-relaxed mb-3">
                      "You show promise, explorer... but you're not ready yet. Prove yourself by defeating my two guardians first."
                    </p>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/3 border border-white/5">
                        <span className="text-sm">{defeatedRangers.includes('boss-salesforce') ? '✅' : '❌'}</span>
                        <span className="text-[10px] text-white/50">Director Hayes — Salesforce Tower</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/3 border border-white/5">
                        <span className="text-sm">{defeatedRangers.includes('boss-tesla') ? '✅' : '❌'}</span>
                        <span className="text-[10px] text-white/50">Engineer Volta — Tesla Factory</span>
                      </div>
                    </div>
                    <p className="text-purple-400/50 text-[9px]">Defeat both guardians to unlock this battle</p>
                  </div>
                ) : null
              ) : sleepingNoBattle ? (
                <div className="rounded-lg p-4 border border-blue-400/15 text-center" style={{ background: 'rgba(96,165,250,0.05)' }}>
                  <span className="text-3xl mb-2 block">💤</span>
                  <p className="text-white/70 text-xs leading-relaxed mb-2">
                    {ranger.name} is resting and can't battle right now.
                  </p>
                  <p className="text-blue-300/50 text-[9px]">Come back during the day to challenge them!</p>
                </div>
              ) : (
                <div className="rounded-lg p-3 border" style={{
                  background: isGrandChampion ? 'rgba(251,191,36,0.05)' : isFinalBoss ? 'rgba(168,85,247,0.05)' : 'rgba(239,68,68,0.05)',
                  borderColor: isGrandChampion ? 'rgba(251,191,36,0.15)' : isFinalBoss ? 'rgba(168,85,247,0.15)' : 'rgba(239,68,68,0.15)',
                }}>
                  <p className="text-white/70 text-xs leading-relaxed italic mb-3">
                    "{ranger.battleQuote ?? `Think you can take me on? Let's see what you've got!`}"
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Team</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {ranger.battleTeam?.map((m, i) => {
                        const c = ALL_CREATURES.find(cr => cr.id === m.creatureId)
                        return (
                          <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
                            {c ? <PixelCreatureToken creature={c} size={20} /> : <span className="text-white/15 text-xs">?</span>}
                            <span className="text-[9px] text-white/50">Lv.{m.level}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {ranger.battleReward && (
                    <p className="text-[9px] text-amber-400 mb-3">Reward: {ranger.battleReward.xp} XP</p>
                  )}
                  <button
                    onClick={onChallenge}
                    className="w-full py-2.5 rounded-lg text-white text-xs font-bold transition-all hover:scale-[1.02]"
                    style={{
                      background: isGrandChampion
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(168,85,247,0.15))'
                        : isFinalBoss
                          ? 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.15))'
                          : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                      border: `1px solid ${isGrandChampion ? 'rgba(251,191,36,0.3)' : isFinalBoss ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      boxShadow: `0 4px 12px ${isGrandChampion ? 'rgba(251,191,36,0.15)' : isFinalBoss ? 'rgba(168,85,247,0.15)' : 'rgba(239,68,68,0.15)'}`,
                    }}
                  >
                    {isGrandChampion ? '🦅 Challenge the Grand Champion!' : isFinalBoss ? '👑 Challenge the Champion!' : `⚔️ Challenge ${ranger.name}!`}
                  </button>
                </div>
              )}
              {player.team.length === 0 && (
                <p className="text-red-400 text-[10px] text-center">You need creatures on your team to battle!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuestStatusBadge({ status, isComplete }: { status: string; isComplete: boolean }) {
  if (isComplete) {
    return <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">READY</span>
  }
  const styles: Record<string, string> = {
    available: 'bg-emerald-500/15 text-emerald-400',
    active: 'bg-blue-500/15 text-blue-400',
    rewarded: 'bg-white/5 text-white/30',
  }
  const labels: Record<string, string> = {
    available: 'NEW',
    active: 'ACTIVE',
    rewarded: 'DONE',
  }
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${styles[status] ?? styles.available}`}>
      {labels[status] ?? status}
    </span>
  )
}
