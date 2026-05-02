// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuestLog from './QuestLog'
import type { PlayerState, QuestProgress } from '@/types/game'

const mockPlayer: PlayerState = {
  level: 5,
  xp: 100,
  maxXp: 200,
  captured: ['coyote', 'raccoon'],
  team: [],
  inventory: [],
  journal: { 'Oakland Hills': true },
}

describe('QuestLog', () => {
  it('renders quest log with title', () => {
    render(
      <QuestLog
        questProgress={{}}
        player={mockPlayer}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Quest Log')).toBeInTheDocument()
  })

  it('shows tab buttons', () => {
    render(
      <QuestLog
        questProgress={{}}
        player={mockPlayer}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('shows available quests when no progress exists', () => {
    const { container } = render(
      <QuestLog
        questProgress={{}}
        player={mockPlayer}
        onClose={() => {}}
      />
    )
    // Switch to Available tab
    fireEvent.click(screen.getByText('Available'))
    // Should show quest cards
    expect(container.querySelectorAll('.rounded-lg').length).toBeGreaterThan(0)
  })

  it('shows active quests when quest is in progress', () => {
    const progress: Record<string, QuestProgress> = {
      'presidio-coyote': { questId: 'presidio-coyote', status: 'active', progress: 0 },
    }
    render(
      <QuestLog
        questProgress={progress}
        player={mockPlayer}
        onClose={() => {}}
      />
    )
    // Active tab is default
    expect(screen.getByText('Urban Coyote Survey')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    let closed = false
    render(
      <QuestLog
        questProgress={{}}
        player={mockPlayer}
        onClose={() => { closed = true }}
      />
    )
    // FloatingPanel has a close button with ✕
    const closeBtn = screen.getByText('✕')
    fireEvent.click(closeBtn)
    expect(closed).toBe(true)
  })

  it('shows overall progress bar', () => {
    render(
      <QuestLog
        questProgress={{}}
        player={mockPlayer}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Overall Progress')).toBeInTheDocument()
  })
})
