# Map Audit Notes

## Corrections In This Pass

- Expanded ranger battle teams now reference real creature IDs.
- Monterey and Lake Tahoe expanded rangers now stand on walkable California tiles near their named locations.
- Alcatraz Island, Ghirardelli Square, and Getty Center landmarks now sit on walkable map tiles.
- The minimap now draws a subtle coastline/water-edge trace and reports explored progress against explorable California tiles, not the full 200x500 grid including ocean and neighboring states.
- The in-game Cartographer survey exposes the live tile coordinate, biome, subregion, elevation, bridge, walkability, nearby landmarks, local creatures, and neighborhood QA stats.
- The expanded field map now includes biome, height, and routes layers, with hover details for tile-level map audits.
- California is now grouped into shared province identities in `californiaRegions.ts`; the expanded field map has a Regions layer and the Cartographer/Journal/Battle surfaces read the same regional model.
- The Routes layer now draws primary roads, BART/rail spines, ferry movement, Delta rivers, coastline, Coast Ranges, and the Sierra crest from `californiaMapOverlays.ts`.

## Questions To Settle Next

1. Should the world remain a full California map, or should play start as a Bay Area-first map with the rest of California as an unlockable atlas?
2. Should coordinates prioritize geographic accuracy, or game readability when the two conflict at this tile scale?
3. Should landmarks be exact clickable places, or nearby visual anchors that identify a region?
4. Should neighboring states be explorable later, or should they stay as visible borders only?
5. Which secondary routes should become interactive later: BART branches, park trails, ferry terminals, or regional highways?
