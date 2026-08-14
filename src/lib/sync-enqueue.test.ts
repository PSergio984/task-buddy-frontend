import { describe, it, expect, vi } from "vitest"
import { enqueueOrCall, type PendingMutationInput } from "./sync-enqueue"

const mutation: PendingMutationInput = {
  entity: "task",
  id: 5,
  op: "update",
  payload: { title: "Write handoff" },
  client_updated_at: "2026-08-14T10:00:00Z",
}

describe("enqueueOrCall", () => {
  it("enqueues directly without calling the network when offline", async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined)
    const call = vi.fn()

    const result = await enqueueOrCall({
      isOnline: () => false,
      call,
      enqueue,
      mutation,
    })

    expect(call).not.toHaveBeenCalled()
    expect(enqueue).toHaveBeenCalledWith(mutation)
    expect(result).toEqual({ queued: true, data: null, error: null })
  })

  it("calls the network and enqueues nothing on success when online", async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined)
    const call = vi.fn().mockResolvedValue({ id: 5 })

    const result = await enqueueOrCall({
      isOnline: () => true,
      call,
      enqueue,
      mutation,
    })

    expect(call).toHaveBeenCalledWith(mutation)
    expect(enqueue).not.toHaveBeenCalled()
    expect(result).toEqual({ queued: false, data: { id: 5 }, error: null })
  })

  it("calls the network and enqueues the mutation when the call fails", async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined)
    const failure = new Error("network down")
    const call = vi.fn().mockRejectedValue(failure)

    const result = await enqueueOrCall({
      isOnline: () => true,
      call,
      enqueue,
      mutation,
    })

    expect(call).toHaveBeenCalledWith(mutation)
    expect(enqueue).toHaveBeenCalledWith(mutation)
    expect(result).toEqual({ queued: true, data: null, error: failure })
  })

  it("propagates enqueue failures to the caller", async () => {
    const enqueue = vi.fn().mockRejectedValue(new Error("storage full"))
    const call = vi.fn()

    await expect(
      enqueueOrCall({
        isOnline: () => false,
        call,
        enqueue,
        mutation,
      })
    ).rejects.toThrow("storage full")
  })
})
