// Test-only window into the live context values.
//
// `Game` renders whatever it is passed as `children` inside both context
// providers, so the oracle mounts `<Game><GameProbe /></Game>` and reads the
// same `GameStateValue` / `GameActions` objects the real screens consume.
// This replaces the old `window.__wildcal` hook: no production code carries a
// test surface any more, and the oracle exercises the exact context the
// screens use.
//
// The effect has no dependency array on purpose — it runs after *every*
// commit, so `probe()` always returns the current render's values (the old
// `exposeTestHook` effect had the same shape). Its cleanup clears the slot,
// so after unmount `probe()` throws rather than handing back a stale probe
// bound to a torn-down tree.
import { useEffect } from 'react'
import { useGameState, useGameActions } from '@/game/core/GameContext'
import type { GameStateValue, GameActions } from '@/game/core/GameContext'

export type Probe = { state: () => GameStateValue; actions: () => GameActions }

let current: Probe | null = null

export const probe = (): Probe => {
  if (!current) throw new Error('GameProbe not mounted')
  return current
}

export function GameProbe() {
  const s = useGameState()
  const a = useGameActions()
  useEffect(() => {
    current = { state: () => s, actions: () => a }
    return () => { current = null }
  })
  return null
}
