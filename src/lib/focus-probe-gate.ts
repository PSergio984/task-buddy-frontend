/**
 * Ordering gate between game-event flushes and the focus probe.
 *
 * The focus provider sits INSIDE GameProvider, so its probe effect runs
 * before GameContext's mount effect — but a flush could otherwise POST a
 * superseded local run's `web:` events before the probe's
 * removeGameEventsByPrefix executes. The probe arms a deferred per userId
 * and resolves it when the probe settles; every flush awaits it.
 *
 * Overlapping probes (e.g. two rapid `online` events) JOIN the armed gate
 * rather than displacing it — a replaced gate would strand waiters on the
 * displaced promise forever (the stale release can't resolve the new entry
 * and nobody holds the old one). The shared gate resolves only when every
 * in-flight probe has released, so a flush can never outrun a live probe.
 */
interface ProbeGate {
  promise: Promise<void>
  resolve: () => void
  pending: number
}

const gates = new Map<string, ProbeGate>()

/**
 * Arm a gate for a user — called synchronously at probe start. While a probe
 * is already in flight the caller joins it and receives the SAME handle;
 * each caller still releases exactly once.
 */
export function armProbeGate(userId: string): ProbeGate {
  const existing = gates.get(userId)
  if (existing !== undefined) {
    existing.pending += 1
    return existing
  }
  let resolve: () => void = () => {}
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  const gate: ProbeGate = { promise, resolve, pending: 1 }
  gates.set(userId, gate)
  return gate
}

/**
 * Release one in-flight probe — called once the probe settles. The handle
 * must match the armed entry; the gate opens only after the LAST in-flight
 * probe releases, then is cleared so the next arm starts fresh.
 */
export function releaseProbeGate(userId: string, gate: ProbeGate): void {
  if (gates.get(userId) !== gate) return
  gate.pending -= 1
  if (gate.pending <= 0) {
    gates.delete(userId)
    gate.resolve()
  }
}

/** Resolves when the user's armed probes settle (immediately if none). */
export function probeGate(userId: string): Promise<void> {
  return gates.get(userId)?.promise ?? Promise.resolve()
}
