import { generateMap, getBridgeAt, getBoatDockAt, BOAT_DOCKS, MAP_WIDTH, MAP_HEIGHT } from './src/game/bayAreaMap'
import { LANDMARKS, getLandmarkAt } from './src/game/landmarks'
import { RANGERS } from './src/game/rangers'
import { MIGRATION_HERDS, getHerdPositions } from './src/game/migration'
import { ALL_CREATURES, getCreaturesByBiome, getRandomEncounter } from './src/game/creatures'
import type { BiomeType, TimeOfDay } from './src/types/game'

console.log('=== MAP INTEGRITY STRESS TEST ===\n')
console.log(`Generating ${MAP_WIDTH}x${MAP_HEIGHT} map...`)
const map = generateMap()
console.log(`Map generated: ${map.length} rows, ${map[0]?.length ?? 0} cols\n`)

let errors = 0
let warnings = 0

function fail(msg: string) { console.log(`  ❌ FAIL: ${msg}`); errors++ }
function warn(msg: string) { console.log(`  ⚠️  WARN: ${msg}`); warnings++ }
function pass(msg: string) { console.log(`  ✅ ${msg}`) }

// ============================================================
// 1. BRIDGE CONNECTIVITY
// ============================================================
console.log('--- 1. BRIDGE TESTS ---')

const BRIDGE_DEFS = [
  { name: 'Golden Gate Bridge', x1: 49, y1: 213, x2: 49, y2: 218 },
  { name: 'Bay Bridge', x1: 50, y1: 218, x2: 64, y2: 218 },
  { name: 'Richmond-San Rafael Bridge', x1: 55, y1: 210, x2: 62, y2: 210 },
  { name: 'San Mateo Bridge', x1: 53, y1: 226, x2: 64, y2: 226 },
  { name: 'Dumbarton Bridge', x1: 54, y1: 229, x2: 63, y2: 229 },
]

function hasLandNear(px: number, py: number, radius: number): boolean {
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      const t = map[py + dy]?.[px + dx]
      if (t && t.biome !== 'water' && !t.bridge) return true
    }
  return false
}

function hasWaterNear(px: number, py: number, radius: number): boolean {
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      const t = map[py + dy]?.[px + dx]
      if (t && t.biome === 'water') return true
    }
  return false
}

for (const b of BRIDGE_DEFS) {
  console.log(`\n  Bridge: ${b.name} (${b.x1},${b.y1}) → (${b.x2},${b.y2})`)
  const startTile = map[b.y1]?.[b.x1]
  const endTile = map[b.y2]?.[b.x2]
  if (!startTile) { fail(`Start tile doesn't exist`); continue }
  if (!endTile) { fail(`End tile doesn't exist`); continue }

  let bridgeTileCount = 0
  let hasWaterUnder = false
  const minX = Math.min(b.x1, b.x2), maxX = Math.max(b.x1, b.x2)
  const minY = Math.min(b.y1, b.y2), maxY = Math.max(b.y1, b.y2)
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const t = map[y]?.[x]
      if (t?.bridge) {
        bridgeTileCount++
        if (!t.isWalkable) fail(`Bridge tile (${x},${y}) not walkable`)
        if (hasWaterNear(x, y, 1)) hasWaterUnder = true
      }
    }

  if (bridgeTileCount === 0) fail(`No bridge tiles found`)
  else pass(`${bridgeTileCount} bridge tiles, all walkable`)

  if (hasWaterUnder) pass(`Bridge spans water`)
  else warn(`No water adjacent to any bridge tile — bridge may be on land`)

  if (hasLandNear(b.x1, b.y1, 2)) pass(`Start connects to land`)
  else fail(`Start (${b.x1},${b.y1}) — no land within 2 tiles`)

  if (hasLandNear(b.x2, b.y2, 2)) pass(`End connects to land`)
  else fail(`End (${b.x2},${b.y2}) — no land within 2 tiles`)
}

// ============================================================
// 2. ISLANDS
// ============================================================
console.log('\n\n--- 2. ISLAND TESTS ---')

const ISLAND_DEFS = [
  { name: 'Alcatraz Island', tiles: [[53,212],[54,212],[53,213],[54,213]] },
  { name: 'Angel Island', tiles: [[55,211],[56,211],[55,212],[56,212],[55,213],[56,213]] },
  { name: 'Treasure Island', tiles: [[57,217],[58,217],[57,218],[58,218]] },
  { name: 'Santa Cruz Island', tiles: [[94,401],[95,401],[96,401],[94,402],[95,402],[96,402],[95,403]] },
  { name: 'Santa Catalina Island', tiles: [[119,429],[120,429],[121,429],[119,430],[120,430],[121,430],[120,431]] },
]

for (const isl of ISLAND_DEFS) {
  console.log(`\n  Island: ${isl.name}`)
  let allWalkable = true
  for (const [ix, iy] of isl.tiles) {
    const t = map[iy]?.[ix]
    if (!t) { fail(`Tile (${ix},${iy}) doesn't exist`); continue }
    if (!t.isWalkable) { fail(`Tile (${ix},${iy}) not walkable`); allWalkable = false }
    if (t.subregion !== isl.name && !t.subregion.includes(isl.name.split(' ')[0]))
      warn(`Tile (${ix},${iy}) subregion is "${t.subregion}" not "${isl.name}"`)
  }
  if (allWalkable) pass(`All ${isl.tiles.length} tiles walkable`)

  const edgeCount = isl.tiles.filter(([ix, iy]) => {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const nt = map[iy + dy]?.[ix + dx]
        if (nt && nt.biome === 'water') return true
      }
    return false
  }).length
  if (edgeCount > 0) pass(`${edgeCount}/${isl.tiles.length} tiles adjoin water`)
  else warn(`No tiles adjoin water — may not look like an island`)
}

// ============================================================
// 3. BOAT DOCKS
// ============================================================
console.log('\n\n--- 3. BOAT DOCK TESTS ---')

for (const dock of BOAT_DOCKS) {
  const t = map[dock.y]?.[dock.x]
  if (!t) { fail(`Dock "${dock.name}" (${dock.x},${dock.y}) — tile doesn't exist`); continue }

  if (!t.isWalkable) fail(`Dock "${dock.name}" (${dock.x},${dock.y}) not walkable (biome=${t.biome})`)

  if (hasWaterNear(dock.x, dock.y, 2)) pass(`Dock "${dock.name}" (${dock.x},${dock.y}) near water`)
  else fail(`Dock "${dock.name}" (${dock.x},${dock.y}) — no water within 2 tiles`)

  const destT = map[dock.destY]?.[dock.destX]
  if (destT) pass(`  → dest "${dock.destinationName}" (${dock.destX},${dock.destY}) exists`)
  else fail(`  → dest (${dock.destX},${dock.destY}) out of bounds`)
}

// Round-trip validation
console.log('\n  Round-trip pairs:')
for (const dock of BOAT_DOCKS) {
  const returnDock = BOAT_DOCKS.find(d => d.x === dock.destX && d.y === dock.destY)
  if (returnDock) pass(`  ${dock.name} ↔ ${returnDock.name}`)
  else warn(`  ${dock.name} → (${dock.destX},${dock.destY}) has no return dock`)
}

// ============================================================
// 4. LANDMARKS
// ============================================================
console.log('\n\n--- 4. LANDMARK TESTS ---')

let landmarkWalkable = 0
for (const lm of LANDMARKS) {
  const t = map[lm.y]?.[lm.x]
  if (!t) { fail(`Landmark "${lm.name}" (${lm.x},${lm.y}) out of bounds`); continue }
  if (!t.isWalkable) warn(`Landmark "${lm.name}" (${lm.x},${lm.y}) not walkable (biome=${t.biome})`)
  else landmarkWalkable++
}
pass(`${landmarkWalkable}/${LANDMARKS.length} landmarks on walkable tiles`)

// ============================================================
// 5. RANGERS
// ============================================================
console.log('\n\n--- 5. RANGER TESTS ---')

const creatureIdSet = new Set(ALL_CREATURES.map(c => c.id))

for (const r of RANGERS) {
  const t = map[r.y]?.[r.x]
  if (!t) { fail(`Ranger "${r.name}" (${r.x},${r.y}) out of bounds`); continue }
  if (!t.isWalkable) fail(`Ranger "${r.name}" (${r.x},${r.y}) not walkable (biome=${t.biome})`)
  else pass(`Ranger "${r.name}" (${r.x},${r.y}) walkable, biome=${t.biome}`)

  // Validate battle team creature IDs
  if (r.battleTeam) {
    for (const member of r.battleTeam) {
      if (!creatureIdSet.has(member.creatureId))
        fail(`Ranger "${r.name}" battleTeam has unknown creature "${member.creatureId}"`)
    }
  }

  // Validate quest objectives
  if (r.quests) {
    for (const q of r.quests) {
      if (q.objective.type === 'catch' && q.objective.creatureId) {
        if (!creatureIdSet.has(q.objective.creatureId))
          fail(`Quest "${q.title}" references unknown creature "${q.objective.creatureId}"`)
      }
      if (q.objective.type === 'visit' && q.objective.subregion) {
        const found = map.some(row => row.some(tile => tile.subregion === q.objective.subregion))
        if (!found) fail(`Quest "${q.title}" visit target "${q.objective.subregion}" not found on map`)
      }
    }
  }
}

// ============================================================
// 6. MIGRATION HERDS
// ============================================================
console.log('\n\n--- 6. MIGRATION HERD TESTS ---')

const TIME_SLOTS: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night']

for (const herd of MIGRATION_HERDS) {
  console.log(`\n  Herd: ${herd.name}`)
  const startT = map[herd.startY]?.[herd.startX]
  const endT = map[herd.endY]?.[herd.endX]

  if (!startT) { fail(`Start (${herd.startX},${herd.startY}) out of bounds`); continue }
  if (!endT) { fail(`End (${herd.endX},${herd.endY}) out of bounds`); continue }

  if (!creatureIdSet.has(herd.creatureId))
    fail(`Herd creature "${herd.creatureId}" not found in ALL_CREATURES`)

  // Sample positions across multiple time points
  let totalSampled = 0, totalWalkable = 0
  for (const time of herd.activeTimes) {
    for (const minute of [0, 30, 60, 90, 119]) {
      const positions = getHerdPositions(herd, minute, time as TimeOfDay)
      if (!positions) continue
      for (const pos of positions) {
        totalSampled++
        const pt = map[pos.y]?.[pos.x]
        if (pt?.isWalkable) totalWalkable++
      }
    }
  }

  if (totalSampled === 0) warn(`No positions sampled (inactive?)`)
  else if (totalWalkable === totalSampled) pass(`All ${totalSampled} sampled positions walkable`)
  else if (totalWalkable / totalSampled > 0.5)
    warn(`${totalWalkable}/${totalSampled} positions walkable (${(totalWalkable/totalSampled*100).toFixed(0)}%)`)
  else fail(`${totalWalkable}/${totalSampled} positions walkable — majority in water`)
}

// ============================================================
// 7. PLAYER START
// ============================================================
console.log('\n\n--- 7. PLAYER START TEST ---')
const playerStart = map[219]?.[52]
if (!playerStart) fail('Player start (52,219) out of bounds')
else if (!playerStart.isWalkable) fail(`Player start not walkable — biome=${playerStart.biome}`)
else pass(`Player start (52,219) walkable, biome=${playerStart.biome}, subregion="${playerStart.subregion}"`)

// ============================================================
// 8. BIOME TYPE COVERAGE
// ============================================================
console.log('\n\n--- 8. BIOME COVERAGE ---')

const ALL_BIOME_TYPES: BiomeType[] = [
  'forest','marsh','beach','rocky_beach','urban','water','mountain','grassland',
  'redwood','tidepool','chaparral','oak_woodland','kelp_forest','desert','alpine',
  'snow','valley','volcanic','scrubland','dunes','canyon','lakeshore','old_growth',
]

const biomeCount: Record<string, number> = {}
const subregionSet = new Set<string>()
let landCount = 0, waterCount = 0, creatureTileCount = 0

for (let y = 0; y < MAP_HEIGHT; y++)
  for (let x = 0; x < MAP_WIDTH; x++) {
    const t = map[y][x]
    biomeCount[t.biome] = (biomeCount[t.biome] || 0) + 1
    if (t.biome === 'water') waterCount++; else landCount++
    if (t.hasCreature) creatureTileCount++
    if (t.subregion) subregionSet.add(t.subregion)
  }

for (const biome of ALL_BIOME_TYPES) {
  const count = biomeCount[biome] || 0
  if (count === 0) fail(`Biome "${biome}" has ZERO tiles on the map`)
  else pass(`Biome "${biome}": ${count} tiles (${(count / 1000).toFixed(1)}k)`)
}

// Check for unknown biomes
for (const b of Object.keys(biomeCount)) {
  if (!ALL_BIOME_TYPES.includes(b as BiomeType))
    fail(`Unknown biome "${b}" found on map (${biomeCount[b]} tiles)`)
}

// ============================================================
// 9. CREATURE-BIOME SPAWNING
// ============================================================
console.log('\n\n--- 9. CREATURE SPAWN COVERAGE ---')

const landBiomes = ALL_BIOME_TYPES.filter(b => b !== 'water')
for (const biome of landBiomes) {
  const creatures = getCreaturesByBiome(biome)
  if (creatures.length === 0) fail(`No creatures can spawn in "${biome}" biome`)
  else pass(`"${biome}": ${creatures.length} creature species`)
}

// ============================================================
// 10. CREATURE SUBREGION RESOLUTION
// ============================================================
console.log('\n\n--- 10. CREATURE SUBREGION RESOLUTION ---')

let resolvedCount = 0, unresolvedCount = 0
const unresolvedSubregions = new Set<string>()

for (const c of ALL_CREATURES) {
  for (const sr of c.subregions) {
    if (subregionSet.has(sr)) {
      resolvedCount++
    } else {
      unresolvedCount++
      unresolvedSubregions.add(sr)
    }
  }
}

pass(`${resolvedCount} creature-subregion references resolve to map subregions`)
if (unresolvedCount > 0)
  warn(`${unresolvedCount} references to ${unresolvedSubregions.size} subregions not on map (fuzzy matching will handle)`)

if (unresolvedSubregions.size > 0 && unresolvedSubregions.size <= 20)
  console.log(`    Missing: ${[...unresolvedSubregions].join(', ')}`)

// ============================================================
// 11. MAP BORDER SANITY
// ============================================================
console.log('\n\n--- 11. MAP BORDER TESTS ---')

// All edge tiles should be water (ocean/beyond)
let edgeWater = 0, edgeTotal = 0
for (let x = 0; x < MAP_WIDTH; x++) {
  edgeTotal += 2
  const top = map[0][x], bot = map[MAP_HEIGHT - 1][x]
  if (top.biome === 'water' || top.borderState) edgeWater++
  if (bot.biome === 'water' || bot.borderState) edgeWater++
}
for (let y = 0; y < MAP_HEIGHT; y++) {
  edgeTotal += 2
  const left = map[y][0], right = map[y][MAP_WIDTH - 1]
  if (left.biome === 'water' || left.borderState) edgeWater++
  if (right.biome === 'water' || right.borderState) edgeWater++
}
const edgePct = (edgeWater / edgeTotal * 100).toFixed(1)
if (edgeWater / edgeTotal > 0.85) pass(`${edgePct}% of map border tiles are water or out-of-state`)
else warn(`Only ${edgePct}% of border tiles are water/border — land may reach map edge`)

// Verify border state tiles exist and are not walkable
let borderTotal = 0, borderUnwalkable = 0
const borderStates = new Set<string>()
for (let y = 0; y < MAP_HEIGHT; y++)
  for (let x = 0; x < MAP_WIDTH; x++) {
    const t = map[y][x]
    if (t.borderState) {
      borderTotal++
      borderStates.add(t.borderState)
      if (!t.isWalkable) borderUnwalkable++
    }
  }
if (borderTotal > 0 && borderUnwalkable === borderTotal)
  pass(`${borderTotal} border tiles (${[...borderStates].join(', ')}), all unwalkable`)
else if (borderTotal > 0)
  fail(`${borderTotal - borderUnwalkable} border tiles are walkable — should all be blocked`)
else warn('No border state tiles found')

// ============================================================
// 12. WALKABILITY CONSISTENCY
// ============================================================
console.log('\n\n--- 12. WALKABILITY CHECKS ---')

// Water tiles should not be walkable (except bridges/islands)
let waterWalkable = 0
for (let y = 0; y < MAP_HEIGHT; y++)
  for (let x = 0; x < MAP_WIDTH; x++) {
    const t = map[y][x]
    if (t.biome === 'water' && t.isWalkable && !t.bridge && !t.boatDock) waterWalkable++
  }

if (waterWalkable === 0) pass('No water tiles are walkable (except bridges/docks)')
else warn(`${waterWalkable} water tiles are walkable without bridge/dock`)

// Land tiles should all be walkable (except border tiles)
let landNotWalkable = 0
for (let y = 0; y < MAP_HEIGHT; y++)
  for (let x = 0; x < MAP_WIDTH; x++) {
    const t = map[y][x]
    if (t.biome !== 'water' && t.biome !== 'kelp_forest' && !t.isWalkable && !t.borderState) landNotWalkable++
  }

if (landNotWalkable === 0) pass('All non-water California land tiles are walkable')
else fail(`${landNotWalkable} California land tiles are NOT walkable`)

// ============================================================
// 13. ENCOUNTER SYSTEM SMOKE TEST
// ============================================================
console.log('\n\n--- 13. ENCOUNTER SMOKE TEST ---')

const testBiomes: BiomeType[] = ['urban', 'forest', 'desert', 'alpine', 'beach', 'marsh', 'mountain', 'valley']
for (const biome of testBiomes) {
  let found = false
  for (let attempt = 0; attempt < 50; attempt++) {
    const c = getRandomEncounter(biome, undefined, 'day', undefined, 1)
    if (c) { found = true; break }
  }
  if (found) pass(`getRandomEncounter("${biome}") returns creatures`)
  else fail(`getRandomEncounter("${biome}") returned null in 50 attempts`)
}

// ============================================================
// 14. DUPLICATE POSITION CHECK
// ============================================================
console.log('\n\n--- 14. DUPLICATE POSITION CHECKS ---')

// Rangers at same position
const rangerPositions = new Map<string, string[]>()
for (const r of RANGERS) {
  const key = `${r.x},${r.y}`
  if (!rangerPositions.has(key)) rangerPositions.set(key, [])
  rangerPositions.get(key)!.push(r.name)
}
let rangerDupes = 0
for (const [pos, names] of rangerPositions) {
  if (names.length > 1) { warn(`Rangers stacked at (${pos}): ${names.join(', ')}`); rangerDupes++ }
}
if (rangerDupes === 0) pass('No rangers share the same tile')

// Landmarks at same position
const landmarkPositions = new Map<string, string[]>()
for (const lm of LANDMARKS) {
  const key = `${lm.x},${lm.y}`
  if (!landmarkPositions.has(key)) landmarkPositions.set(key, [])
  landmarkPositions.get(key)!.push(lm.name)
}
let lmDupes = 0
for (const [pos, names] of landmarkPositions) {
  if (names.length > 1) { warn(`Landmarks stacked at (${pos}): ${names.join(', ')}`); lmDupes++ }
}
if (lmDupes === 0) pass('No landmarks share the same tile')

// ============================================================
// 15. MAP STATISTICS
// ============================================================
console.log('\n\n--- 15. MAP STATISTICS ---')
console.log(`  Total tiles: ${MAP_WIDTH * MAP_HEIGHT}`)
console.log(`  Land: ${landCount} (${(landCount / (MAP_WIDTH * MAP_HEIGHT) * 100).toFixed(1)}%)`)
console.log(`  Water: ${waterCount} (${(waterCount / (MAP_WIDTH * MAP_HEIGHT) * 100).toFixed(1)}%)`)
console.log(`  Creature tiles: ${creatureTileCount}`)
console.log(`  Unique subregions: ${subregionSet.size}`)
console.log(`  Total creatures in database: ${ALL_CREATURES.length}`)
console.log(`  Biome distribution:`)
for (const [biome, count] of Object.entries(biomeCount).sort((a, b) => b[1] - a[1]))
  console.log(`    ${biome}: ${count} (${(count / (MAP_WIDTH * MAP_HEIGHT) * 100).toFixed(1)}%)`)

// ============================================================
// SUMMARY
// ============================================================
console.log(`\n\n=== SUMMARY ===`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}`)
if (errors === 0) console.log('  🎉 ALL TESTS PASSED')
else console.log('  ⛔ SOME TESTS FAILED — see above')

process.exit(errors > 0 ? 1 : 0)
