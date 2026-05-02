# WildCal

A 3D Pokémon-go-style biodiversity collect-em-all set in a stylized Bay Area — track wildlife across biomes, fill the BayDex, and battle rangers. A BioKEA game.

> **Status:** private beta. Public release pending.

![WildCal gameplay](docs/screenshot.png)
<!-- TODO: drop a real screenshot or gif at docs/screenshot.png before going public -->

## The science angle

Every creature you log is a real California species in a real biome — woodland, chaparral, tidepool, redwood, bay — and the BayDex doubles as a field journal of habitats, migration windows, and conservation status. WildCal is part of [BioKEA](https://biokea.ai)'s work in biodiversity genomics: the same way our pipelines tie sequence reads back to organisms and ecosystems, the game ties the act of *finding* a creature to the place and time it actually lives. Catch-em-all becomes catalog-em-all.

## Play

- **Story / Bay Area campaign** — explore an open Bay Area map, beat ranger gyms, work toward the Grand Champion.
- **BayDex completion** — log every species across biomes, day/night cycles, weather, and seasonal migrations.
- **Daily challenges** — rotating objectives with claimable rewards.
- **Minigames** — fishing, surfing (Steamer Lane), diving, the Boardwalk, an Alcatraz escape sequence.
- **Side systems** — breeding, fusion lab, crafting, trade center (trade-code strings), adoption center, arena ladder, move tutor, achievements, leaderboard.
- **Multiple save slots** with rename + delete.

### Controls

- **Move** — `WASD` or arrow keys.
- **Interact / Talk / Sail / Enter** — `Space` (or `Enter`).
- **Menus** — letter shortcuts (e.g. catalog, journal, team) shown on the in-game help overlay.
- **Pause / back** — `Escape`.

## Tech

- React 18 + TypeScript + Vite
- **three.js** with **@react-three/fiber** + **@react-three/drei** for the 3D world
- Tailwind + shadcn/radix for HUD and menus
- Zustand-style local state + `localStorage` save slots (see `gameState.ts`)
- Supabase for the optional online leaderboard (silently no-ops without env vars)
- Vitest + Testing Library for unit tests
- Bun as package manager and runtime

## Local dev

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # production build into dist/
bun test         # run the vitest suite
```

Optional Supabase leaderboard:

```bash
cp .env.example .env   # then fill in:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The app reads these via `import.meta.env`; no keys are committed.

## License

MIT — see [LICENSE](LICENSE).

---

Made by [BioKEA](https://biokea.ai).
