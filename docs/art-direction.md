# WildCal Art Direction

## Target Style

The chosen direction is a **California field-guide pixel-box diorama**: high-quality isometric/orthographic terrain made from crisp three-dimensional pixel boxes, with naturalistic California habitat colors and a grounded ecology mood.

This is not a candy-bright arcade look. It should feel like a living field notebook translated into voxel/pixel form: readable, tactile, calm, and collectible.

## Visual Principles

- Terrain is built from visible box geometry: square tile tops, darker sides, stacked elevation, crisp block silhouettes.
- The palette is natural, sun-faded, and specific to California habitats: sage, redwood green, coastal blue, dry grass, granite, sandstone, marsh olive.
- Lighting should make cubes feel premium: soft ambient occlusion, clean rim light, modest atmospheric depth, no glossy plastic.
- Creature hints should be subtle specimen markers, footprints, or tiny boxed silhouettes instead of floating magical orbs by default.
- Landmarks can remain iconic, but they should be simplified into blocky, readable miniatures rather than emoji-first symbols.
- UI overlays should remain legible, but the world art should carry more of the sense of place.

## Implementation Direction

The existing `src/game/voxel` renderer is the best foundation for the universal upgrade. It already has instanced box terrain, blocky player/ranger entities, landmarks, weather, and camera-follow behavior.

Recommended path:

1. Make the voxel renderer previewable alongside the current canvas renderer.
2. Bring all biome, entity, landmark, water, and weather styling through `src/game/artDirection.ts`.
3. Replace sphere/glow encounter markers with boxed field-guide markers, footprints, or creature silhouettes.
4. Upgrade decorations biome by biome: redwoods, oak woodland, marsh reeds, tidepools, chaparral scrub, dunes, alpine rock, city blocks.
5. Move creatures from emoji/HUD-only representation toward reusable pixel-box creature models or sprite cards.
6. Once the voxel renderer is visually complete and performant, switch it on universally.

## Current Prep

- Shared field-guide palette and lighting tokens live in `src/game/artDirection.ts`.
- Voxel renderer constants consume those tokens.
- Current biome color exports are aligned to the same palette so old and new renderer work can converge.
- Voxel mode is the default renderer, with the legacy canvas renderer kept as an in-game fallback toggle.
- Terrain has a deterministic surface-detail layer for field-guide texture without needing hand-authored tile art.
- `PixelCreatureToken` is the transitional UI primitive for replacing raw emoji creature art with reusable pixel-box tokens.
