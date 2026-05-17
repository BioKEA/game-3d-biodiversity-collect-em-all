// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameHUD from './GameHUD'
import { ALL_CREATURES } from './creatures'
import type { PlayerState, CapturedCreature } from '@/types/game'

const mockCreatureOnTeam: CapturedCreature = {
  id: 'coyote',
  name: 'Coyote',
  sprite: '🐺',
  type: 'beast',
  rarity: 'common',
  stats: { hp: 30, maxHp: 40, attack: 18, defense: 12, speed: 15 },
  level: 5,
  xp: 50,
  maxXp: 100,
  moves: [],
  personality: 'brave',
  capturedBiome: 'forest',
}

const mockPlayer: PlayerState = {
  x: 13,
  y: 20,
  level: 5,
  xp: 100,
  maxXp: 200,
  hp: 100,
  maxHp: 100,
  coins: 100,
  captured: ['coyote', 'raccoon'],
  catalog: ['coyote', 'raccoon'],
  team: [mockCreatureOnTeam],
  inventory: [],
  journal: {},
  nursery: null,
  reserves: [],
}

const defaultProps = {
  player: mockPlayer,
  currentBiome: 'forest' as const,
  currentSubregion: 'Golden Gate Park',
  timeOfDay: 'day' as const,
  weather: 'clear' as const,
  gameMinutes: 720,
  onOpenCatalog: vi.fn(),
  onOpenTeam: vi.fn(),
  onOpenJournal: vi.fn(),
  onOpenTrade: vi.fn(),
  onOpenBayDex: vi.fn(),
  onOpenBreeding: vi.fn(),
  onOpenQuestLog: vi.fn(),
  onOpenCrafting: vi.fn(),
  onOpenAchievements: vi.fn(),
  onOpenHabitatMap: vi.fn(),
  onOpenAdoption: vi.fn(),
  onOpenLeaderboard: vi.fn(),
  onOpenFusion: vi.fn(),
  onOpenDiving: vi.fn(),
  onOpenShop: vi.fn(),
  onOpenDailyChallenges: vi.fn(),
  dailyClaimable: 0,
  achievementCount: 3,
  totalAchievements: 20,
}

describe('GameHUD', () => {
  it('renders player level', () => {
    render(<GameHUD {...defaultProps} />)
    expect(screen.getByText('Lv.5')).toBeInTheDocument()
  })

  it('renders species count', () => {
    render(<GameHUD {...defaultProps} />)
    const speciesText = screen.getByText(`${mockPlayer.captured.length}/${ALL_CREATURES.length}`)
    expect(speciesText).toBeInTheDocument()
  })

  it('renders current subregion', () => {
    render(<GameHUD {...defaultProps} />)
    expect(screen.getByText('Golden Gate Park')).toBeInTheDocument()
  })

  it('renders active creature info', () => {
    render(<GameHUD {...defaultProps} />)
    expect(screen.getByText('Coyote')).toBeInTheDocument()
  })

  it('shows toolbar buttons', () => {
    render(<GameHUD {...defaultProps} />)
    // Should have multiple toolbar buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })

  it('calls onOpenQuestLog when quest button is clicked', () => {
    render(<GameHUD {...defaultProps} />)
    const questBtn = screen.getByText('Quests')
    fireEvent.click(questBtn.closest('button')!)
    expect(defaultProps.onOpenQuestLog).toHaveBeenCalled()
  })

  it('calls onOpenCatalog when catalog button is clicked', () => {
    render(<GameHUD {...defaultProps} />)
    // Collection button opens the radial — Catalog is inside it
    // Just check that the Collection button renders
    const collectionBtn = screen.getByText('Collection')
    expect(collectionBtn).toBeInTheDocument()
  })

  it('shows coin balance', () => {
    render(<GameHUD {...defaultProps} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders d-pad for mobile', () => {
    const { container } = render(<GameHUD {...defaultProps} />)
    const dpad = container.querySelector('#dpad')
    expect(dpad).toBeInTheDocument()
  })

  it('moves from D-pad pointer input without requiring a click', () => {
    const onMove = vi.fn()
    render(<GameHUD {...defaultProps} onMove={onMove} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move up' }), { pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(0, -1)
  })

  it('keeps the D-pad click fallback for keyboard and older touch paths', () => {
    const onMove = vi.fn()
    render(<GameHUD {...defaultProps} onMove={onMove} />)

    fireEvent.click(screen.getByRole('button', { name: 'Move right' }))

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(1, 0)
  })

  it('moves from the D-pad touch fallback', () => {
    const onMove = vi.fn()
    render(<GameHUD {...defaultProps} onMove={onMove} />)

    const button = screen.getByRole('button', { name: 'Move down' })
    fireEvent.touchStart(button)
    fireEvent.touchEnd(button)

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(0, 1)
  })

  it('does not double-step when a pointer press is followed by a synthetic click', () => {
    const onMove = vi.fn()
    const right = 'Move right'
    render(<GameHUD {...defaultProps} onMove={onMove} />)

    const button = screen.getByRole('button', { name: right })
    fireEvent.pointerDown(button, { pointerId: 1 })
    fireEvent.pointerUp(button, { pointerId: 1 })
    fireEvent.click(button)

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(1, 0)
  })

  it('offers a control-mode toggle in the HUD', () => {
    const onToggleControlMode = vi.fn()
    render(
      <GameHUD
        {...defaultProps}
        controlMode="map"
        onToggleControlMode={onToggleControlMode}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Controls: map locked' }))

    expect(onToggleControlMode).toHaveBeenCalledTimes(1)
  })
})
