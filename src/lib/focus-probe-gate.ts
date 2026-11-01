/**
 * Ordering gate between game-event flushes and the focus probe.
 *
 * The focus provider sits INSIDE GameProvider, so its probe effect runs
 * before GameContext's mount effect — but a flush could otherwise POST a
 * superseded local run's `web:` events before the probe's
 * removeGameEventsByPrefix executes. The probe arms a deferred per userId
 * and resolves it when the probe settles; every flush awaits it. A gate
 * armed during a probe that never opens would deadlock flushes, so gates
 * only exist for the duration of one probe.
 */
interface ProbeGate {
  promise: Promise<void>
  resolve: () => void
}

const gates = new Map<string, ProbeGate>()

/** Arm a fresh gate for a user — called synchronously at probe start. */
export function armProbeGate(userId: string): ProbeGate {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  const gate = { promise, resolve }
  gates.set(userId, gate)
  return gate
}

/**
 * Open the gate — called once the probe that armed it settles. The handle
 * must match the armed entry: a cancelled probe must not resolve a newer
 * gate armed after it (that would let a flush outrun the live probe).
 */
export function releaseProbeGate(userId: string, gate: ProbeGate): void {
  if (gates.get(userId) === gate) gate.resolve()
}

/** Resolves when the user's armed probe settles (immediately if none). */
export function probeGate(userId: string): Promise<void> {
  return gates.get(userId)?.promise ?? Promise.resolve()
}
