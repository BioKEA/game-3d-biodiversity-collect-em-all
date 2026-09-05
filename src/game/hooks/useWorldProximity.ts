import { useEffect, useState } from 'react'
import type { GameState, TimeOfDay } from '@/types/game'
import { getBoatDockAt, getSignpostAt, type BoatDock } from '../bayAreaMap'
import { getNearbyRanger, GRAND_CHAMPION_ID } from '../rangers'
import { getLandmarkAt } from '../landmarks'

export interface WorldProximityArgs {
  screen: GameState['screen']
  x: number
  y: number
  timeOfDay: TimeOfDay
  grandChampionUnlocked: boolean
  /**
   * Runs on the first frame the player is within Ranger Tomás's radius. The
   * one-shot guard (`tutorialFlags`) lives in the caller, exactly as it did
   * before this hook existed — the hook only reports the proximity.
   */
  onFirstRangerProximity: () => void
}

export interface WorldProximity {
  nearbyRangerId: string | null
  currentLandmark: string | null
  nearbyDock: BoatDock | null
  nearbySignpost: { state: string; message: string; fact: string } | null
}

/**
 * The four world-proximity `useEffect`s lifted out of `Game.tsx` verbatim.
 *
 * Dependency arrays are unchanged from the originals: the ranger effect reads
 * `grandChampionUnlocked` and `onFirstRangerProximity` through a closure
 * without listing them, as the pre-refactor effect did.
 */
export function useWorldProximity({
  screen, x, y, timeOfDay, grandChampionUnlocked, onFirstRangerProximity,
}: WorldProximityArgs): WorldProximity {
  const [nearbyRangerId, setNearbyRangerId] = useState<string | null>(null)
  const [currentLandmark, setCurrentLandmark] = useState<string | null>(null)
  const [nearbyDock, setNearbyDock] = useState<BoatDock | null>(null)
  const [nearbySignpost, setNearbySignpost] = useState<{ state: string; message: string; fact: string } | null>(null)

  // Ranger interaction
  useEffect(() => {
    if (screen !== 'world') return
    const nearby = getNearbyRanger(x, y, timeOfDay)
    const isHiddenGrandChampion = nearby?.id === GRAND_CHAMPION_ID && !grandChampionUnlocked
    setNearbyRangerId(isHiddenGrandChampion ? null : (nearby?.id ?? null))
    // Auto-open Ranger Tomás tutorial dialog on first proximity
    if (nearby?.id === 'ranger-golden-gate') {
      onFirstRangerProximity()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, screen, timeOfDay])

  // Landmark detection
  useEffect(() => {
    if (screen !== 'world') return
    const lm = getLandmarkAt(x, y)
    setCurrentLandmark(lm?.name ?? null)
  }, [x, y, screen])

  // Boat dock detection
  useEffect(() => {
    if (screen !== 'world') return
    const dock = getBoatDockAt(x, y)
    setNearbyDock(dock ?? null)
  }, [x, y, screen])

  // Signpost detection
  useEffect(() => {
    if (screen !== 'world') return
    const sp = getSignpostAt(x, y)
    setNearbySignpost(sp ? { state: sp.state, message: sp.message, fact: sp.fact } : null)
  }, [x, y, screen])

  return { nearbyRangerId, currentLandmark, nearbyDock, nearbySignpost }
}
