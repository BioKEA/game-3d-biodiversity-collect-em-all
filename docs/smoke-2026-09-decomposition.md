# Manual smoke — Game.tsx decomposition (September 2026)

Browser checks run against the refactored branch during the decomposition
described in `docs/superpowers/specs/2026-09-04-game-tsx-decomposition-design.md`.
All checks were driven in a real browser (Playwright, Chromium) against the Vite
dev server. No GIF was recorded: the Chrome-extension recorder could not reach
localhost in the session that ran these checks.

## Automated parity (every commit)

- `src/game/__replay__/replay.test.tsx` — seeded, scripted handler replay; its
  `GameState` snapshot stayed byte-identical across all Phase 2 and Phase 3
  commits.
- `src/game/core/persistence.test.ts` — legacy-save backward-compat snapshot,
  unchanged throughout.

## Browser checks on the refactored build

1. **Title → new game → starter → world.** Title screen renders through
   `ScreenRouter`; slot 1 new game; starter chosen and confirmed; world screen
   mounts with the canvas renderer, HUD, minimap, and the one-time Ranger Tomás
   tutorial dialog.
2. **Save and reload.** The auto-save written by `core/persistence.ts` reappears
   on the title screen as slot 1; Continue loads it to the world.
3. **Menus and keyboard.** `C` opens the Species Catalog, `Q` opens the Quest
   Log, `Escape` closes each; arrow keys move the player, advance the clock,
   update the subregion, and auto-save.
4. **Encounters.** A roaming-trainer encounter (Hiker Sam) rendered through its
   wrapper with the battle tip and Battle/Flee controls.
5. **World layer split.** Fast-travel panel (HUD Travel button), the dock
   prompt ("Press Space to sail to Sausalito"), biome particles, footprints, and
   the tutorial tip all render together after the `WorldScreen` /
   `WorldPrompts` / `WorldPanels` split; keyframe styles from
   `overlayStyles.ts` are present in the DOM.
6. **Pre-refactor save round-trip.** A save produced by the pre-refactor build
   (commit `1b2fa3a`, played in a separate browser origin: starter, 28 steps,
   one capture, seven journal subregions) was injected into the refactored
   build's localStorage. After Continue, position, team, coins, capsule count,
   game minutes, subregion, journal count, explored-tile count, and step stats
   were identical to the injected values, and the HUD reflected them.

Console was clean in every check except a pre-existing `favicon.ico` 404.
