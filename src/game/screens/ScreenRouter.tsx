import { useGameState } from '@/game/core/GameContext'
import CatalogScreenWrapper from './CatalogScreenWrapper'
import BayDexScreenWrapper from './BayDexScreenWrapper'
import JournalScreenWrapper from './JournalScreenWrapper'
import BreedingScreenWrapper from './BreedingScreenWrapper'
import TradeScreenWrapper from './TradeScreenWrapper'
import QuestLogScreenWrapper from './QuestLogScreenWrapper'
import CraftingScreenWrapper from './CraftingScreenWrapper'
import AchievementsScreenWrapper from './AchievementsScreenWrapper'
import HabitatMapScreenWrapper from './HabitatMapScreenWrapper'
import AdoptionScreenWrapper from './AdoptionScreenWrapper'
import LeaderboardScreenWrapper from './LeaderboardScreenWrapper'

export default function ScreenRouter() {
  const { gameState } = useGameState()
  switch (gameState.screen) {
    case 'catalog': return <CatalogScreenWrapper />
    case 'baydex': return <BayDexScreenWrapper />
    case 'journal': return <JournalScreenWrapper />
    case 'breeding': return <BreedingScreenWrapper />
    case 'trade': return <TradeScreenWrapper />
    case 'questlog': return <QuestLogScreenWrapper />
    case 'crafting': return <CraftingScreenWrapper />
    case 'achievements': return <AchievementsScreenWrapper />
    case 'habitat_map': return <HabitatMapScreenWrapper />
    case 'adoption': return <AdoptionScreenWrapper />
    case 'leaderboard': return <LeaderboardScreenWrapper />
    default: return null
  }
}
