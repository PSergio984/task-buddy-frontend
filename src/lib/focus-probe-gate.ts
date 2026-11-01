/**
 * Ordering gate between the game-event mount flush and the focus probe.
 *
 * The focus provider sits INSIDE GameProvider, so its probe effect runs
 * before GameContext's mount effect — but the mount flush is deferred on a
 * microtask and could otherwise POST a superseded local run's `web:` events
 * before the probe's removeGameEventsByPrefix executes. The probe arms a
 * deferred per userId and resolves it when the probe settles; the first
 * flush for that user awaits it. Later flushes don't need the gate (the
 * drop has already landed or nothing superseded).
 */
const gates = new Map<string, { promise: Promise<void>; resolve: () => void }>()

/** Arm a fresh gate for a user — called synchronously at probe start. */
export function armProbeGate(userId: string): void {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  gates.set(userId, { promise, resolve })
}

/** Open the gate — called once the probe for that user settles. */
export function releaseProbeGate(userId: string): void {
  gates.get(userId)?.resolve()
}

/** Resolves when the user's probe has settled (immediately if none armed). */
export function probeGate(userId: string): Promise<void> {
  return gates.get(userId)?.promise ?? Promise.resolve()
}
