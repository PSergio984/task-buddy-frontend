import { describe, it, expect, vi } from "vitest"
import { armProbeGate, probeGate, releaseProbeGate } from "./focus-probe-gate"

describe("focus-probe-gate", () => {
  it("probeGate resolves immediately when no probe is armed", async () => {
    await expect(probeGate("unarmed-user")).resolves.toBeUndefined()
  })

  it("waiters unblock only when the armed gate is released", async () => {
    const gate = armProbeGate("u1")
    const spy = vi.fn()
    void probeGate("u1").then(spy)
    await Promise.resolve()
    expect(spy).not.toHaveBeenCalled()
    releaseProbeGate("u1", gate)
    await Promise.resolve()
    expect(spy).toHaveBeenCalled()
  })

  it("a stale probe's release cannot open a newer gate", async () => {
    // Probe A arms, is cancelled, probe B re-arms — A's late release must
    // not resolve B's gate or a flush could outrun B's supersede.
    const stale = armProbeGate("u2")
    const fresh = armProbeGate("u2")
    const spy = vi.fn()
    void probeGate("u2").then(spy)
    releaseProbeGate("u2", stale)
    await Promise.resolve()
    expect(spy).not.toHaveBeenCalled()
    releaseProbeGate("u2", fresh)
    await Promise.resolve()
    expect(spy).toHaveBeenCalled()
  })

  it("a second arm joins the in-flight gate — waiters resolve on the last release", async () => {
    // Two rapid probes (e.g. rapid `online` events): the second arm must
    // not displace the first — a displaced gate would strand every waiter
    // on it forever (nobody holds a handle that resolves it).
    const first = armProbeGate("u3")
    const spy = vi.fn()
    void probeGate("u3").then(spy)
    const second = armProbeGate("u3")
    expect(second).toBe(first)
    releaseProbeGate("u3", first)
    await Promise.resolve()
    expect(spy).not.toHaveBeenCalled() // second probe still in flight
    releaseProbeGate("u3", second)
    await Promise.resolve()
    expect(spy).toHaveBeenCalled()
    // And the gate is gone — the next arm starts a fresh generation.
    await expect(probeGate("u3")).resolves.toBeUndefined()
  })
})
