export type ControlMode = 'map' | 'perspective'
export type FacingDirection = 'north' | 'east' | 'south' | 'west'

export const CONTROL_MODE_KEY = 'wildcal-control-mode'

const FACING_VECTORS: Record<FacingDirection, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  east: { dx: 1, dy: 0 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
}

function cleanZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}

export function loadControlMode(): ControlMode {
  try {
    const saved = localStorage.getItem(CONTROL_MODE_KEY)
    return saved === 'perspective' ? 'perspective' : 'map'
  } catch {
    return 'map'
  }
}

export function toggleControlModeValue(mode: ControlMode): ControlMode {
  return mode === 'map' ? 'perspective' : 'map'
}

export function facingFromDelta(dx: number, dy: number): FacingDirection | null {
  if (dx === 0 && dy === -1) return 'north'
  if (dx === 1 && dy === 0) return 'east'
  if (dx === 0 && dy === 1) return 'south'
  if (dx === -1 && dy === 0) return 'west'
  return null
}

export function resolveControlMove(
  inputDx: number,
  inputDy: number,
  facing: FacingDirection,
  controlMode: ControlMode
): { dx: number; dy: number } {
  if (controlMode === 'map') {
    return { dx: inputDx, dy: inputDy }
  }

  const forward = FACING_VECTORS[facing]
  const right = { dx: -forward.dy, dy: forward.dx }

  return {
    dx: cleanZero(forward.dx * -inputDy + right.dx * inputDx),
    dy: cleanZero(forward.dy * -inputDy + right.dy * inputDx),
  }
}
