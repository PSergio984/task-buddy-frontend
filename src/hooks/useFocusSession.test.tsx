import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import axios from "axios"
import type { GameEventIn } from "@/lib/api"
import {
  createLocalSession,
  pauseLocal,
  saveLocalSession,
  loadLocalSession,
} from "@/lib/focus-session"
import { enqueueGameEvent, listGameEvents } from "@/lib/game-event-queue"
import { focusSessionsApi } from "@/lib/api"
import { useFocusSessionRuntime } from "./useFocusSession"

const storage = new Map<string, string>()
vi.mock("idb-keyval", () => ({
  get: async (key: string) => {
    const raw = storage.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  set: async (key: string, value: unknown) => {
    storage.set(key, JSON.stringify(value))
  },
  del: async (key: string) => {
    storage.delete(key)
  },
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}))

const enqueueMock = vi.fn((_event: GameEventIn) => Promise.resolve())
vi.mock("@/contexts/GameContext", () => ({
  useGame: () => ({
    enqueueEvent: enqueueMock,
    pendingEventCount: 0,
    flushEvents: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/query-client", () => ({
  queryClient: {
    setQueriesData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    getQueriesData: vi.fn(() => []),
  },
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    focusSessionsApi: {
      getActive: vi.fn(),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      advance: vi.fn(),
      stop: vi.fn(),
    },
  }
})

const T0 = Date.parse("2026-11-01T10:00:00Z")
const iso = (epoch: number) => new Date(epoch).toISOString()
const networkDown = () => new axios.AxiosError("offline")

const timerInput = {
  mode: "timer" as const,
  phases: [
    { kind: "focus" as const, minutes: 1 },
    { kind: "break" as const, minutes: 1 },
    { kind: "focus" as const, minutes: 1 },
  ],
  task_id: null,
  tag_id: null,
  difficulty: "easy" as const,
  auto_start_breaks: true,
  auto_start_focus: false,
  pause_budget_count: 3,
  pause_budget_seconds: 300,
}

async function settle() {
  // Flush pending microtask chains (probe is an async IIFE).
  for (let i = 0; i < 8; i++) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

describe("useFocusSessionRuntime", () => {
  beforeEach(() => {
    storage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("local verbs evaluate first: a past-budget pause abandons at crossedAt", async () => {
    // Persist a paused local run: 280s banked of a 300s budget, pause
    // started at T0. Loading at T0 is still inside the budget.
    const local = createLocalSession(timerInput, T0)
    pauseLocal(local, T0)
    local.session.phases[0].paused_seconds = 280
    await saveLocalSession("u1", local)
    vi.mocked(focusSessionsApi.getActive).mockRejectedValue(networkDown())

    const { result } = renderHook(() => useFocusSessionRuntime())
    await settle()
    expect(result.current.session?.status).toBe("active")
    expect(result.current.view?.status).toBe("paused")

    // 40s later the open pause crosses the budget — resume() must evaluate
    // first, so the damage event is stamped at crossedAt (T0+20s), not the
    // resume instant. Old ordering let the verb act on the stale snapshot.
    vi.setSystemTime(T0 + 40_000)
    await act(async () => {
      await result.current.resume()
    })

    expect(result.current.session?.status).toBe("abandoned")
    const damage = enqueueMock.mock.calls
      .map((c) => c[0])
      .find((e) => e.type === "damage")
    expect(damage?.payload.reason).toBe("pause_overflow")
    expect(damage?.client_ts).toBe(iso(T0 + 20_000))
    // Terminal: the persisted run is dropped, not replayed next mount.
    expect(await loadLocalSession("u1")).toBeNull()
  })

  it("a server session supersedes a local run and drops its queued events", async () => {
    const local = createLocalSession(timerInput, T0)
    await saveLocalSession("u1", local)
    await enqueueGameEvent(
      "u1",
      {
        client_event_id: `web:${local.client_id}:focus_phase_completed:0`,
        type: "focus_phase_completed",
        client_ts: iso(T0),
        payload: { minutes: 1 },
      }
    )
    await enqueueGameEvent("u1", {
      client_event_id: "unrelated-1",
      type: "habit_click",
      client_ts: iso(T0),
      payload: { direction: "positive" },
    })

    vi.mocked(focusSessionsApi.getActive).mockResolvedValue({
      session: {
        id: 42,
        mode: "timer",
        status: "active",
        task_id: null,
        activity_label: null,
        preset: null,
        pause_budget_count: 3,
        pause_budget_seconds: 300,
        started_at: iso(T0 - 60_000),
        ended_at: null,
        phases: [
          {
            seq: 0,
            kind: "focus",
            status: "active",
            planned_seconds: 1500,
            actual_seconds: null,
            pause_count: 0,
            paused_seconds: 0,
            pause_started_at: null,
            started_at: iso(T0 - 60_000),
            ended_at: null,
          },
        ],
      },
      profile: null,
      server_time: iso(T0),
    })

    const { result } = renderHook(() => useFocusSessionRuntime())
    await settle()

    expect(result.current.session?.id).toBe(42)
    // The superseded local run's claimable events must not survive to flush.
    const queued = await listGameEvents("u1")
    expect(queued.map((e) => e.client_event_id)).toEqual(["unrelated-1"])
    expect(await loadLocalSession("u1")).toBeNull()
  })
})
