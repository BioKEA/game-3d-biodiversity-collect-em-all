// The mutually exclusive interaction prompts — dock, BART, Steamer Lane,
// Boardwalk, ranger. Rendered by Game.tsx *after* <ScreenRouter />, which is
// where these blocks sit in the tree today.
import { RANGERS } from '@/game/rangers'
import { useGameState } from '@/game/core/GameContext'

export default function WorldPrompts() {
  const { gameState, ui } = useGameState()
  const {
    nearbyDock, boatAnimating, nearbyBartStation, atSteamerLane, atBoardwalk, nearbyRangerId,
  } = ui

  return (
    <>
      {/* Interaction prompts — priority matches the Space-key handler:
          dock > BART > surf > ranger > boardwalk */}
      {gameState.screen === 'world' && nearbyDock && !boatAnimating && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-sky-400/30 animate-pulse">
            <p className="text-sky-300 text-sm sm:text-xl font-medium">
              ⛴ Press Space to sail to {nearbyDock.destinationName}
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && nearbyBartStation && !nearbyDock && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-yellow-400/30 animate-pulse">
            <p className="text-yellow-300 text-sm sm:text-xl font-medium">
              🚇 Press Space to enter {nearbyBartStation.name} BART Station
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && atSteamerLane && !nearbyDock && !nearbyBartStation && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-cyan-400/30 animate-pulse">
            <p className="text-cyan-300 text-sm sm:text-xl font-medium">
              🏄 Press Space to surf Steamer Lane
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && atBoardwalk && !nearbyDock && !nearbyBartStation && !atSteamerLane && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-amber-400/30 animate-pulse">
            <p className="text-amber-300 text-sm sm:text-xl font-medium">
              🎡 Press Space to enter the Boardwalk
            </p>
          </div>
        </div>
      )}

      {gameState.screen === 'world' && nearbyRangerId && !nearbyDock && !nearbyBartStation && !atSteamerLane && !atBoardwalk && (
        <div className="absolute bottom-20 sm:bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100%-16px)]">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-6 sm:py-3 border border-emerald-500/30 animate-pulse">
            <p className="text-emerald-300 text-sm sm:text-xl font-medium">
              Press Space to talk to {RANGERS.find(r => r.id === nearbyRangerId)?.name}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
