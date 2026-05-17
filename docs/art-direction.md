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

## Ten-Track Overhaul Program

The user-approved improvement program is now tracked in `src/game/overhaulRoadmap.ts` and surfaced in the in-game Cartographer HUD.

1. Map accuracy: coordinates, biome, water, elevation, walkability, bridges, docks, borders, and landmarks must be inspectable in-game.
2. Regional identity: each California province needs a clear terrain language and height profile.
3. Creature art: local species should render through modular pixel creatures with evolution-ready adaptation slots.
4. Encounter presentation: arenas should inherit biome, weather, time, and local identity.
5. Field guide: discovery progress should connect creatures to places, habitats, and notes.
6. Landmarks and traversal: major places should anchor routes, bridges, ferries, and fast-travel memory.
7. Map interaction: the expanded field map should support atlas layers and tile inspection.
8. Progression loop: level, quests, regional mastery, and collection should reinforce each other.
9. Animation and juice: subtle motion should support the field-guide fantasy without becoming noisy.
10. Quality/regression: every geography-sensitive change should get a durable check.

## Implementation Foundation

- `src/game/artDirection.ts` is the shared source for palette, lighting, biome, icon, and entity tokens.
- The voxel renderer remains the main world-art foundation for three-dimensional pixel boxes.
- `PixelIcon` is the UI primitive for non-creature pixel-box controls and items.
- `PixelGlyph` and `pixelGlyphArt.ts` translate legacy emoji metadata into crisp 7x7 pixel glyphs for HUD icons, rewards, weather, status, and map markers.
- `PixelCreatureToken` is the small-surface creature frame used across HUD, battle, catalog, fusion, title, trade, and notifications.
- `PixelCreatureSprite` is the procedural creature silhouette layer that replaces emoji inside creature tokens.
- `creatureArt.ts` owns body-plan inference, palette resolution, evolution stage, and adaptation slots.
- Larger battle poses should build on the same `creatureArt.ts` spec so small and large creature art evolve together.
- `PixelLandmarkIcon` and `landmarkArt.ts` provide the matching modular landmark language for map labels, fast travel, and Field Journal discovery.
- Ambient effects should use CSS/canvas pixel particles instead of emoji leaves, droplets, or weather symbols.
- `CartographerPanel` is the shared in-game survey layer for the ten-track overhaul: it exposes current tile data, local relief, creature adaptations, nearby landmarks, route signals, and QA stats.
- The expanded `Minimap` now has biome, height, and routes layers plus tile hover details, so geography and traversal can be audited directly inside the game.
- `californiaRegions.ts` is the shared California province model. It drives the expanded map's Regions layer, Cartographer regional identity cards, Field Journal province context, and region-tinted battle parallax accents.

## Open Art Backlog

- Add curated hand-authored specs for marquee species and starters.
- Add curated hand-authored landmark specs for marquee locations once the procedural landmark system has covered all surfaces.
- Add map tile overlays for roads, BART/ferries, mountain ranges, rivers, and major coastlines.
- Add larger battle-scale creature poses after the small token silhouette system is stable.
- Sweep remaining feature-specific minigames and modal copy for direct emoji text once their local art primitives exist.
