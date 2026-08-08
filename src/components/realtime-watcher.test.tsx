import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

import { RealtimeWatcher } from "@/components/realtime-watcher"
import * as realtimeClient from "@/lib/realtime-client"
import * as apiModule from "@/lib/api"
import * as queryClientModule from "@/lib/query-client"

type ChannelHandler = (payload: unknown) => void

function createFakeSupabase() {
  const handlers = new Map<string, ChannelHandler>()
  const fakeChannel = {
    on: vi.fn((_type: string, opts: { table: string }, handler: ChannelHandler) => {
      handlers.set(opts.table, handler)
      return fakeChannel
    }),
    subscribe: vi.fn(() => fakeChannel),
  }

  const client = {
    channel: vi.fn((_topic: string) => fakeChannel),
    removeChannel: vi.fn(),
    realtime: {
      setAuth: vi.fn(),
    },
  }

  return { client, fakeChannel, handlers }
}

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, email_confirmed: true },
    loading: false,
  }),
}))

describe("RealtimeWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(queryClientModule.queryClient, "invalidateQueries").mockResolvedValue(undefined)
  })

  function mockSupabase() {
    const fake = createFakeSupabase()
    vi.spyOn(realtimeClient, "getRealtimeClient").mockReturnValue(
      fake.client as unknown as ReturnType<typeof realtimeClient.getRealtimeClient>
    )
    vi.spyOn(apiModule.api, "post").mockResolvedValue({
      data: { token: "test-token", expires_in: 300 },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as unknown as ReturnType<typeof apiModule.api.post>)
    return fake
  }

  it("mints a token and subscribes to all published tables", async () => {
    const fake = mockSupabase()

    render(<RealtimeWatcher />)

    await vi.waitFor(() => {
      expect(apiModule.api.post).toHaveBeenCalledWith("/api/v1/realtime/token")
      expect(fake.client.realtime.setAuth).toHaveBeenCalledWith("test-token")
      expect(fake.client.channel).toHaveBeenCalledTimes(5)
    })

    const tables = fake.client.channel.mock.calls.map(([topic]) =>
      String(topic).split(":")[1]
    )
    expect(tables).toEqual(
      expect.arrayContaining([
        "tbl_tasks",
        "tbl_subtasks",
        "tbl_projects",
        "tbl_tags",
        "tbl_notifications",
      ])
    )
  })

  it("invalidates tasks and stats queries on a task insert", async () => {
    const fake = mockSupabase()

    render(<RealtimeWatcher />)

    await vi.waitFor(() => {
      expect(fake.handlers.has("tbl_tasks")).toBe(true)
    })

    fake.handlers.get("tbl_tasks")!({ type: "INSERT", table: "tbl_tasks" })

    expect(queryClientModule.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tasks"],
    })
    expect(queryClientModule.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["stats"],
    })
  })

  it("invalidates notifications on a notification change", async () => {
    const fake = mockSupabase()

    render(<RealtimeWatcher />)

    await vi.waitFor(() => {
      expect(fake.handlers.has("tbl_notifications")).toBe(true)
    })

    fake.handlers.get("tbl_notifications")!({ type: "UPDATE", table: "tbl_notifications" })

    expect(queryClientModule.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notifications"],
    })
  })

  it("refreshes the token without creating duplicate channels", async () => {
    vi.useFakeTimers()
    try {
      const fake = mockSupabase()

      render(<RealtimeWatcher />)

      await vi.waitFor(() => {
        expect(fake.client.channel).toHaveBeenCalledTimes(5)
      })

      // expires_in=300 → refresh scheduled at (300-30)*1000 = 270000ms
      await vi.advanceTimersByTimeAsync(270000)

      expect(apiModule.api.post).toHaveBeenCalledTimes(2)
      expect(fake.client.realtime.setAuth).toHaveBeenCalledTimes(2)
      expect(fake.client.channel).toHaveBeenCalledTimes(5)
    } finally {
      vi.useRealTimers()
    }
  })

  it("cleans up channels on unmount", async () => {
    const fake = mockSupabase()

    const { unmount } = render(<RealtimeWatcher />)

    await vi.waitFor(() => {
      expect(fake.client.channel).toHaveBeenCalledTimes(5)
    })

    unmount()
    expect(fake.client.removeChannel).toHaveBeenCalledTimes(5)
  })
})

