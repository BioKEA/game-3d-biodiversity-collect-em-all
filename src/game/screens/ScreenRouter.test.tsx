// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import ScreenRouter from './ScreenRouter'
import { GameStateContext, GameActionsContext, type GameStateValue, type GameActions } from '@/game/core/GameContext'
import { makeState } from '@/test/fixtures'

vi.mock('./CatalogScreenWrapper', () => ({ default: () => <div data-testid="catalog" /> }))
// Pulls in @biokea/leaderboard, whose dist/index.js has extensionless relative
// imports that Node's ESM resolver rejects. Display-only screen. Same known
// issue documented in src/game/__replay__/replay.test.tsx.
vi.mock('@/game/Leaderboard', () => ({ default: () => null }))

function renderWith(screen: string) {
  const stateValue = { gameState: makeState({ screen: screen as never }) } as unknown as GameStateValue
  const actions = {} as GameActions
  return render(
    <GameStateContext.Provider value={stateValue}>
      <GameActionsContext.Provider value={actions}>
        <ScreenRouter />
      </GameActionsContext.Provider>
    </GameStateContext.Provider>,
  )
}

describe('ScreenRouter', () => {
  it('renders nothing for world', () => { expect(renderWith('world').container.innerHTML).toBe('') })
  it('routes catalog to its wrapper', () => { expect(renderWith('catalog').getByTestId('catalog')).toBeTruthy() })
})
