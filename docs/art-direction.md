# WildCal Art Direction

## North Star

WildCal is a polished pixel-art field guide: bright, collectible, readable at small sizes, and grounded in real California geography. The UI remains dark, glassy, and game-like, while creatures, terrain, landmarks, and encounter scenes move toward custom pixel art.

## Style Rules

- Use bright collectathon color, closer to modern creature-collecting games than muted simulation.
- Keep shapes readable at HUD scale first, then add detail for large battle and journal views.
- Prefer crisp blocky silhouettes, stepped highlights, and subtle drop shadows over smooth illustration.
- Use subtle shimmer, bobbing, glow, particles, and parallax. Avoid noisy animation.
- Keep UI controls in the 3D pixel-box/token language so the interface feels coherent.
- Keep maps geographically accurate. If the current map cannot support a real location, remake the map data rather than hiding the issue with vague labels.

## Creature Art System

Creature art should not be emoji-first. Emoji can remain as legacy metadata, but on-screen creature art should render through modular pixel creatures.

Each creature should resolve to:

- Body plan: quadruped, avian, fish, serpentine, amphibian, insect, plant, or spirit.
- Palette: type color plus species color override where available.
- Adaptation slots: wings, fins, tail, horns, spikes, shell, antennae, bloom, glow, spots, stripes, or crest.
- Evolution stage: base, middle, or final. Later stages can scale the silhouette, add appendages, and intensify highlights.

This lets future evolutions add visible traits without replacing every asset at once.

## Priority Order

1. Creatures: replace emoji tokens with custom pixel silhouettes everywhere `PixelCreatureToken` is used.
2. Map: make California accurate, wide enough to inspect, and visually legible by terrain/region.
3. Landmarks and terrain: replace emoji markers with custom pixel structures, natural icons, and geography-specific terrain treatment.
4. Battle scenes: layered parallax pixel-art scenes for each biome.
5. UI: convert remaining emoji controls and reward icons into pixel tokens.

## Implementation Foundation

- `src/game/artDirection.ts` is the shared source for palette, lighting, biome, icon, and entity tokens.
- The voxel renderer remains the main world-art foundation for three-dimensional pixel boxes.
- `PixelIcon` is the UI primitive for non-creature pixel-box controls and items.
- `PixelCreatureToken` is the small-surface creature frame used across HUD, battle, catalog, fusion, title, trade, and notifications.
- `PixelCreatureSprite` is the procedural creature silhouette layer that replaces emoji inside creature tokens.
- `creatureArt.ts` owns body-plan inference, palette resolution, evolution stage, and adaptation slots.
- Larger battle poses should build on the same `creatureArt.ts` spec so small and large creature art evolve together.

## Open Art Backlog

- Add curated hand-authored specs for marquee species and starters.
- Add landmark art specs for bridges, mountains, piers, towers, trees, missions, observatories, and desert features.
- Add map tile overlays for roads, BART/ferries, mountain ranges, rivers, and major coastlines.
- Add larger battle-scale creature poses after the small token silhouette system is stable.
