import { useEffect, useRef } from 'react'
import type { GameState, MapTile } from '@/types/game'
import type { BoatDock } from '../bayAreaMap'
import type { getBartStationAt } from '../BartSystem'

// When a text input/textarea/contentEditable element is focused, game keyboard
// shortcuts must not fire — otherwise typing "w" or "d" moves the player, and
// letters like "c"/"j"/"t" open menus instead of being typed into the field.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    // Range/checkbox inputs don't consume character keys — let the game handler run for those.
    if (tag === 'INPUT') {
      const type = (target as HTMLInputElement).type
      if (type === 'range' || type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit') {
        return false
      }
    }
    return true
  }
  return target.isContentEditable
}

export interface KeyboardControlsArgs {
  screen: GameState['screen']
  battleActive: boolean
  teamSize: number
  playerX: number
  playerY: number
  map: MapTile[][]
  nearbyDock: BoatDock | null
  boatAnimating: boolean
  nearbyBartStation: ReturnType<typeof getBartStationAt>
  atSteamerLane: boolean
  atBoardwalk: boolean
  nearbyRangerId: string | null
  movePlayer: (dx: number, dy: number) => void
  openScreen: (s: GameState['screen']) => void
  closeOverlay: () => void
  handleBoatTravel: () => void
  openRanger: (id: string) => void
  toggleMusic: () => void
}

/**
 * The two keyboard `useEffect`s lifted out of `Game.tsx` verbatim.
 *
 * Dependency semantics are preserved exactly as they were in `Game.tsx`:
 * `teamSize`, `playerX`, `playerY` and `map` are deliberately read through a
 * stale closure (the pre-refactor effect read `gameState.player.team.length`,
 * `gameState.player.x/y` and `map` without listing them), so they are NOT in
 * the shortcut effect's dependency array. Listing them would re-register the
 * listener on every step and change behavior.
 */
export function useKeyboardControls({
  screen, battleActive, teamSize, playerX, playerY, map,
  nearbyDock, boatAnimating, nearbyBartStation, atSteamerLane, atBoardwalk, nearbyRangerId,
  movePlayer, openScreen, closeOverlay, handleBoatTravel, openRanger, toggleMusic,
}: KeyboardControlsArgs): void {
  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when the user is typing in a text field
      if (isEditableTarget(e.target)) return

      // Allow Escape from overlay screens
      if (e.key === 'Escape') {
        closeOverlay()
        return
      }

      if (screen !== 'world' || battleActive) return

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); movePlayer(0, -1); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); movePlayer(0, 1); break
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); movePlayer(-1, 0); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); movePlayer(1, 0); break
        case 'c': case 'C':
          openScreen('catalog'); break
        case 'b': case 'B':
          openScreen('baydex'); break
        case 'j': case 'J':
          openScreen('journal'); break
        case 'n': case 'N':
          openScreen('breeding'); break
        case 't': case 'T':
          openScreen('trade'); break
        case 'q': case 'Q':
          openScreen('questlog'); break
        case 'm': case 'M':
          toggleMusic(); break
        case 'r': case 'R':
          openScreen('crafting'); break
        case 'h': case 'H':
          openScreen('habitat_map'); break
        case 'l': case 'L':
          openScreen('leaderboard'); break
        case 'g': case 'G':
          if (teamSize >= 2) {
            openScreen('fusion')
          }
          break
        case 'f': case 'F': {
          // Fishing — only near water tiles
          const px = playerX
          const py = playerY
          const nearWater = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
            const t = map[py+dy]?.[px+dx]
            return t && t.biome === 'water'
          }) || map[py]?.[px]?.biome === 'beach' || map[py]?.[px]?.biome === 'marsh'
          if (nearWater) {
            openScreen('fishing')
          }
          break
        }
        case ' ': case 'Enter':
          // Exact-tile interactions (dock, BART, Steamer Lane, Boardwalk) take
          // precedence over radius-based ranger interactions — otherwise rangers
          // sitting on/next to these tiles make the activity unreachable.
          if (nearbyDock && !boatAnimating) {
            e.preventDefault()
            handleBoatTravel()
          } else if (nearbyBartStation) {
            e.preventDefault()
            openScreen('bart')
          } else if (atSteamerLane) {
            e.preventDefault()
            openScreen('surfing')
          } else if (atBoardwalk) {
            e.preventDefault()
            openScreen('boardwalk')
          } else if (nearbyRangerId) {
            e.preventDefault()
            openRanger(nearbyRangerId)
          }
          break
        // Escape handled above the guard
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // `teamSize`, `playerX`, `playerY` and `map` are deliberately omitted — see
  // the note on the hook above; the pre-refactor effect read them through the
  // same stale closure. `openScreen`, `closeOverlay`, `openRanger` and
  // `toggleMusic` are stable `useCallback([])`s, listed for hygiene only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, battleActive, movePlayer, nearbyRangerId, nearbyBartStation, atSteamerLane, atBoardwalk, nearbyDock, boatAnimating, handleBoatTravel, closeOverlay, openScreen, openRanger, toggleMusic])


  // Hold-to-move for keyboard
  useEffect(() => {
    if (screen !== 'world' || battleActive) return

    const keysDown = new Set<string>()

    const process = () => {
      if (keysDown.has('ArrowUp') || keysDown.has('w')) movePlayer(0, -1)
      else if (keysDown.has('ArrowDown') || keysDown.has('s')) movePlayer(0, 1)
      else if (keysDown.has('ArrowLeft') || keysDown.has('a')) movePlayer(-1, 0)
      else if (keysDown.has('ArrowRight') || keysDown.has('d')) movePlayer(1, 0)

      if (keysDown.size > 0) moveTimeout.current = setTimeout(process, 130)
    }

    const handleDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        if (!keysDown.has(e.key)) {
          keysDown.add(e.key)
          if (keysDown.size === 1) process()
        }
      }
    }

    const handleUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key)
      if (keysDown.size === 0 && moveTimeout.current) {
        clearTimeout(moveTimeout.current)
        moveTimeout.current = null
      }
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
      if (moveTimeout.current) clearTimeout(moveTimeout.current)
    }
  }, [screen, battleActive, movePlayer])
}
