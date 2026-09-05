// The always-rendered world layer: renderer, sky, weather, particles,
// footprints, tutorial tip, minimap, HUD and quest tracker. Game.tsx renders
// this unconditionally for every screen except title/starter (menus overlay
// the world), with <ScreenRouter /> painted on top of it.
import IsometricRenderer from '@/game/IsometricRenderer'
import DayNightSky from '@/game/DayNightSky'
import NightAtmosphere from '@/game/NightAtmosphere'
import WeatherEffects from '@/game/WeatherEffects'
import BiomeTransition from '@/game/BiomeTransition'
import BiomeParticles from '@/game/BiomeParticles'
import WalkParticles from '@/game/WalkParticles'
import CreatureFootprints from '@/game/CreatureFootprints'
import TutorialTip from '@/game/TutorialTip'
import Minimap from '@/game/Minimap'
import GameHUD from '@/game/GameHUD'
import QuestTracker from '@/game/QuestTracker'
import { RANGERS } from '@/game/rangers'
import { getClaimableCount } from '@/game/dailyChallengesData'
import { saveBayDexAck } from '@/game/core/persistence'
import { useGameState, useGameActions } from '@/game/core/GameContext'
import WorldOverlays from './WorldOverlays'

export default function WorldScreen() {
  const {
    gameState, map, exploredTiles, rangerPositions, worldEvents,
    bayDexNewCount, dailyState, unlockedAchievements, activeSlot, ui,
  } = useGameState()
  const { borderPeek, tutorialTip, showFastTravel, showHotkeys } = ui
  const {
    openScreen, movePlayer, handleFastTravel, setBayDexAck, setTutorialTip,
    setShowMigrationCalendar, setShowFieldNotes, setShowTrophyRoom,
    setShowFastTravel, setShowHotkeys,
  } = useGameActions()

  return (
    <>
      <IsometricRenderer map={map} playerX={gameState.player.x} playerY={gameState.player.y} rangers={rangerPositions} timeOfDay={gameState.timeOfDay} weather={gameState.weather} gameMinutes={gameState.gameMinutes} />
      <DayNightSky gameMinutes={gameState.gameMinutes} gameDay={gameState.gameDay ?? 75} />
      <NightAtmosphere timeOfDay={gameState.timeOfDay} gameMinutes={gameState.gameMinutes} />
      <WeatherEffects weather={gameState.weather} timeOfDay={gameState.timeOfDay} />
      <BiomeTransition biome={gameState.currentBiome} />

      {/* Border crossing tint overlay */}
      {borderPeek && (
        <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
          style={{
            background: borderPeek.state === 'Oregon' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(34,197,94,0.12) 100%)'
              : borderPeek.state === 'Nevada' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(234,179,8,0.12) 100%)'
              : borderPeek.state === 'Arizona' ? 'radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.1) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(168,85,247,0.1) 100%)',
          }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'notif-enter 0.5s ease-out', opacity: borderPeek.stepsLeft === 2 ? 1 : 0, transition: 'opacity 0.8s' }}>
            <div className="rounded-xl px-6 py-3 text-center"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
              <div className="text-[10px] tracking-[0.2em] text-white/50 font-bold">NOW ENTERING</div>
              <div className="text-xl font-black text-white mt-0.5">{borderPeek.state.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}
      <BiomeParticles biome={gameState.currentBiome} timeOfDay={gameState.timeOfDay} weather={gameState.weather} />
      <WalkParticles playerX={gameState.player.x} playerY={gameState.player.y} biome={gameState.currentBiome} />
      <CreatureFootprints map={map} playerX={gameState.player.x} playerY={gameState.player.y} currentBiome={gameState.currentBiome} />
      <TutorialTip tip={tutorialTip} onDismiss={() => setTutorialTip(null)} />
      <Minimap map={map} playerX={gameState.player.x} playerY={gameState.player.y} journal={gameState.player.journal} exploredTiles={exploredTiles} rangers={rangerPositions} onFastTravel={handleFastTravel} timeOfDay={gameState.timeOfDay} weather={gameState.weather} activeEvent={worldEvents.activeEvent} />

      <GameHUD
        player={gameState.player}
        currentBiome={gameState.currentBiome}
        currentSubregion={gameState.currentSubregion}
        timeOfDay={gameState.timeOfDay}
        weather={gameState.weather}
        gameMinutes={gameState.gameMinutes}
        gameDay={gameState.gameDay ?? 75}
        onOpenCatalog={() => openScreen('catalog')}
        onOpenTeam={() => openScreen('inventory')}
        onOpenJournal={() => openScreen('journal')}
        onOpenTrade={() => openScreen('trade')}
        bayDexNewCount={bayDexNewCount}
        onOpenBayDex={() => {
          openScreen('baydex')
          const ids = gameState.player.catalog
          setBayDexAck(ids)
          saveBayDexAck(activeSlot, ids)
        }}
        onOpenBreeding={() => openScreen('breeding')}
        onOpenQuestLog={() => openScreen('questlog')}
        onMove={movePlayer}
        onOpenCrafting={() => openScreen('crafting')}
        onOpenAchievements={() => openScreen('achievements')}
        onOpenHabitatMap={() => openScreen('habitat_map')}
        onOpenAdoption={() => openScreen('adoption')}
        onOpenLeaderboard={() => openScreen('leaderboard')}
        onOpenFusion={() => openScreen('fusion')}
        onOpenDiving={() => {
          const tile = map[gameState.player.y]?.[gameState.player.x]
          if (tile?.biome === 'water' || tile?.biome === 'beach') {
            openScreen('diving')
          }
        }}
        onOpenShop={() => openScreen('shop')}
        onOpenDailyChallenges={() => openScreen('daily_challenges')}
        onOpenArena={() => openScreen('arena')}
        onOpenMoveTutor={() => openScreen('move_tutor')}
        onOpenMigrationCalendar={() => setShowMigrationCalendar(true)}
        onOpenFieldNotes={() => setShowFieldNotes(true)}
        onOpenTrophyRoom={() => setShowTrophyRoom(true)}
        dailyClaimable={getClaimableCount(dailyState)}
        achievementCount={unlockedAchievements.length}
        totalAchievements={20}
        activeQuestCount={RANGERS.reduce((n, r) => n + r.quests.filter(q => gameState.questProgress[q.id]?.status === 'active').length, 0)}
        onToggleFastTravel={() => { setShowFastTravel(v => !v); setShowHotkeys(false) }}
        onToggleHotkeys={() => { setShowHotkeys(v => !v); setShowFastTravel(false) }}
        showFastTravel={showFastTravel}
        showHotkeys={showHotkeys}
      />

      {gameState.screen === 'world' && (
        <QuestTracker
          questProgress={gameState.questProgress}
          player={gameState.player}
          onOpenQuestLog={() => openScreen('questlog')}
        />
      )}

      <WorldOverlays />
    </>
  )
}
