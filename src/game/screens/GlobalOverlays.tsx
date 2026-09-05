// Screen-independent overlays that render regardless of which screen is
// active: the sailing transition, evolution/champion/reward toasts, boss
// popups, the screen-transition fade, and the migration/field-notes/trophy/
// conservation/leaderboard panels. Sits after <WorldPanels /> at the tail
// of Game.tsx's main return, in the same DOM order those blocks used to
// render in.
import { useGameState, useGameActions } from '@/game/core/GameContext'
import { GRAND_CHAMPION_ID } from '@/game/rangers'
import EvolutionScreen from '@/game/EvolutionScreen'
import ChampionScreen from '@/game/ChampionScreen'
import QuestRewardPopup from '@/game/QuestRewardPopup'
import LunarBossPopup from '@/game/LunarBossPopup'
import ShadowBossPopup from '@/game/ShadowBossPopup'
import MigrationCalendar from '@/game/MigrationCalendar'
import BiomeFieldNotesPanel from '@/game/BiomeFieldNotesPanel'
import BossTrophyRoom from '@/game/BossTrophyRoom'
import ConservationPrompt from '@/game/ConservationPrompt'
import { BiokeaLeaderboardPrompt } from '@/components/BiokeaLeaderboardPrompt'
import { OVERLAY_KEYFRAMES } from './overlayStyles'

export default function GlobalOverlays() {
  const { gameState, playerStats, playerName, ui } = useGameState()
  const {
    boatAnimating, pendingEvolution, showChampion, battleReward, achievementToast, evolveReadyToast,
    questReward, lunarBoss, shadowBoss, screenTransition,
    showMigrationCalendar, showFieldNotes, showTrophyRoom, showConservation, biokeaPromptOpen,
  } = ui
  const a = useGameActions()

  return (
    <>
      {boatAnimating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-sky-950/80 transition-opacity">
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl animate-bounce">⛴</span>
            <p className="text-sky-200 text-sm font-medium">Sailing across the Bay...</p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {pendingEvolution && (
        <EvolutionScreen
          fromCreature={pendingEvolution.from} toCreature={pendingEvolution.to}
          description={pendingEvolution.description} onComplete={() => a.setPendingEvolution(null)}
        />
      )}

      {/* Champion victory screen */}
      {showChampion && (
        <ChampionScreen
          playerName={playerName}
          playerLevel={gameState.player.level}
          team={gameState.player.team}
          stats={playerStats}
          isGrand={(playerStats.defeatedRangers ?? []).includes(GRAND_CHAMPION_ID)}
          onClose={() => a.setShowChampion(false)}
        />
      )}

      {/* Battle reward toast */}
      {gameState.screen === 'world' && battleReward && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60]">
          <style>{`
            @keyframes reward-pop {
              0% { opacity: 0; transform: translateY(10px) scale(0.9); }
              20% { opacity: 1; transform: translateY(0) scale(1); }
              80% { opacity: 1; }
              100% { opacity: 0; transform: translateY(-10px); }
            }
            @keyframes levelup-glow {
              0%, 100% { box-shadow: 0 0 10px rgba(168,85,247,0.3), 0 4px 16px rgba(0,0,0,0.4); }
              50% { box-shadow: 0 0 25px rgba(168,85,247,0.5), 0 0 50px rgba(168,85,247,0.2), 0 4px 16px rgba(0,0,0,0.4); }
            }
            @keyframes levelup-stars {
              0% { opacity: 0; transform: translateY(0) scale(0); }
              40% { opacity: 1; transform: translateY(-15px) scale(1); }
              100% { opacity: 0; transform: translateY(-35px) scale(0.5); }
            }
          `}</style>
          {/* Level-up star particles */}
          {battleReward.levelUp && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute text-sm" style={{
              left: `${10 + i * 12}%`,
              bottom: '100%',
              animation: `levelup-stars 1.5s ease-out ${0.2 + i * 0.1}s forwards`,
              opacity: 0,
            }}>
              {['⭐', '✨', '💫', '🌟'][i % 4]}
            </div>
          ))}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{
              background: battleReward.isBoss
                ? 'linear-gradient(135deg, rgba(100,100,180,0.8), rgba(30,30,80,0.7))'
                : battleReward.levelUp
                  ? 'linear-gradient(135deg, rgba(88,28,135,0.8), rgba(0,0,0,0.7))'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.6))',
              backdropFilter: 'blur(12px)',
              border: battleReward.isBoss
                ? '1px solid rgba(200,200,255,0.4)'
                : battleReward.levelUp
                  ? '1px solid rgba(168,85,247,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
              animation: battleReward.levelUp || battleReward.isBoss
                ? 'reward-pop 3s ease-out forwards, levelup-glow 1s ease-in-out 3'
                : 'reward-pop 3s ease-out forwards',
            }}
          >
            {battleReward.isBoss && (
              <>
                <span className="text-xs font-bold tracking-wider" style={{
                  color: 'rgba(200,210,255,0.9)',
                  textShadow: '0 0 8px rgba(200,210,255,0.4)',
                }}>🌕 BOSS SLAIN</span>
                <span className="text-white/20">|</span>
              </>
            )}
            <span className="text-xs text-emerald-400 font-medium">+{battleReward.xp} XP</span>
            <span className="text-white/20">|</span>
            <span className="text-xs text-yellow-400 font-medium">+{battleReward.coins} 💰</span>
            {battleReward.levelUp && (
              <>
                <span className="text-white/20">|</span>
                <span className="text-xs text-purple-400 font-bold" style={{
                  textShadow: '0 0 10px rgba(168,85,247,0.6)',
                }}>LEVEL UP!</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Achievement toast notification */}
      {achievementToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top duration-300">
          <div className="bg-black/80 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
            <span className="text-lg">{achievementToast.icon}</span>
            <div>
              <p className="text-amber-400 text-[10px] uppercase tracking-wider font-semibold">Achievement Unlocked</p>
              <p className="text-white text-xs font-medium">{achievementToast.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Evolution-ready hint toast */}
      {evolveReadyToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top duration-300">
          <div
            className="backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2.5 shadow-lg"
            style={{
              background: 'rgba(20,10,40,0.85)',
              border: '1px solid rgba(192,132,252,0.4)',
              boxShadow: '0 0 24px rgba(192,132,252,0.25)',
            }}
          >
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(192,132,252,0.8))' }}>
              {evolveReadyToast.sprite}
            </span>
            <div>
              <p className="text-purple-300 text-[10px] uppercase tracking-wider font-bold">✨ Almost Ready to Evolve</p>
              <p className="text-white text-xs font-medium">
                {evolveReadyToast.name} → {evolveReadyToast.toName}
                <span className="text-white/50 ml-1">({evolveReadyToast.gap} {evolveReadyToast.gap === 1 ? 'lvl' : 'lvls'} to go)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quest reward popup */}
      {questReward && (
        <QuestRewardPopup
          questTitle={questReward.title}
          reward={{ xp: questReward.xp, coins: questReward.coins, items: questReward.items?.map(i => ({ ...i, type: 'capture' as const, description: '' })) }}
          onDone={() => a.setQuestReward(null)}
        />
      )}

      {lunarBoss && (
        <LunarBossPopup
          boss={lunarBoss}
          onReady={a.handleBossChallenge}
          onFlee={a.handleBossFlee}
        />
      )}

      {shadowBoss && (
        <ShadowBossPopup
          boss={shadowBoss}
          onReady={a.handleShadowBossChallenge}
          onFlee={a.handleBossFlee}
        />
      )}

      {/* Screen transition overlay */}
      {screenTransition !== 'none' && (
        <div className="absolute inset-0 z-[80] pointer-events-none bg-black" style={{
          opacity: screenTransition === 'fade-out' ? 1 : 0,
          transition: screenTransition === 'fade-out' ? 'opacity 0.3s ease-in' : 'opacity 0.4s ease-out',
        }} />
      )}

      <style>{OVERLAY_KEYFRAMES}</style>

      {/* Overlay panels — render above everything */}
      {showMigrationCalendar && (
        <MigrationCalendar
          gameDay={gameState.gameDay ?? 75}
          onClose={() => a.setShowMigrationCalendar(false)}
        />
      )}
      {showFieldNotes && (
        <BiomeFieldNotesPanel
          player={gameState.player}
          onClose={() => a.setShowFieldNotes(false)}
        />
      )}
      {showTrophyRoom && (
        <BossTrophyRoom
          defeats={gameState.bossDefeats ?? []}
          onClose={() => a.setShowTrophyRoom(false)}
        />
      )}
      {showConservation && (
        <ConservationPrompt onDismiss={a.dismissConservation} />
      )}
      {biokeaPromptOpen && (
        <BiokeaLeaderboardPrompt
          trigger="game-start"
          gameSlug="3d-biodiversity-collect-em-all"
          gameTitle="WildCal"
          defaultHandle={playerName === 'Explorer' ? '' : playerName}
          onSubmit={(result) => {
            a.handleRenamePlayer(result.handle)
            a.setBiokeaPromptOpen(false)
          }}
        />
      )}
    </>
  )
}
