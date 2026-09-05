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
import FishingScreenWrapper from './FishingScreenWrapper'
import FusionScreenWrapper from './FusionScreenWrapper'
import DivingScreenWrapper from './DivingScreenWrapper'
import BartScreenWrapper from './BartScreenWrapper'
import ShopScreenWrapper from './ShopScreenWrapper'
import ArenaScreenWrapper from './ArenaScreenWrapper'
import MoveTutorScreenWrapper from './MoveTutorScreenWrapper'
import DailyChallengesScreenWrapper from './DailyChallengesScreenWrapper'
import SurfingScreenWrapper from './SurfingScreenWrapper'
import BoardwalkScreenWrapper from './BoardwalkScreenWrapper'
import AlcatrazScreenWrapper from './AlcatrazScreenWrapper'
import InventoryScreenWrapper from './InventoryScreenWrapper'

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
    case 'fishing': return <FishingScreenWrapper />
    case 'fusion': return <FusionScreenWrapper />
    case 'diving': return <DivingScreenWrapper />
    case 'bart': return <BartScreenWrapper />
    case 'shop': return <ShopScreenWrapper />
    case 'arena': return <ArenaScreenWrapper />
    case 'move_tutor': return <MoveTutorScreenWrapper />
    case 'daily_challenges': return <DailyChallengesScreenWrapper />
    case 'surfing': return <SurfingScreenWrapper />
    case 'boardwalk': return <BoardwalkScreenWrapper />
    case 'alcatraz_escape': return <AlcatrazScreenWrapper />
    case 'inventory': return <InventoryScreenWrapper />
    default: return null
  }
}
