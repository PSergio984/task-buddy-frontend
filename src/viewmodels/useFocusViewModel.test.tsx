import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useFocusViewModel } from "./useFocusViewModel"
import { makeRuntime, speedrunSession } from "@/lib/focus-session-test-utils"
import type { FocusSessionRuntime } from "@/hooks/useFocusSession"

let mockRuntime: FocusSessionRuntime

vi.mock("@/contexts/FocusSessionContext", () => ({
  useFocusSession: () => mockRuntime,
}))

vi.mock("@/hooks/useTasks", () => ({
  useTasks: () => ({ data: [{ id: 10, title: "Test Task" }] }),
}))

vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({ data: [{ id: 20, name: "code" }] }),
}))

const primeAlertAudioMock = vi.fn()
const requestAlertPermissionMock = vi.fn()

vi.mock("@/lib/focus-audio", () => ({
  primeAlertAudio: () => primeAlertAudioMock(),
  requestAlertPermission: () => requestAlertPermissionMock(),
  alertPhaseBoundary: vi.fn(),
}))

describe("useFocusViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntime = makeRuntime(null)
  })

  it("exposes clean initial state when idle", () => {
    const { result } = renderHook(() => useFocusViewModel())

    expect(result.current.running).toBe(false)
    expect(result.current.session).toBeNull()
    expect(result.current.settingsOpen).toBe(false)
    expect(result.current.stopConfirmOpen).toBe(false)
    expect(result.current.immersive).toBe(false)
  })

  it("handles settings open/close and stop confirm modal toggles", () => {
    const { result } = renderHook(() => useFocusViewModel())

    act(() => {
      result.current.openSettings()
    })
    expect(result.current.settingsOpen).toBe(true)

    act(() => {
      result.current.closeSettings()
    })
    expect(result.current.settingsOpen).toBe(false)

    act(() => {
      result.current.openStopConfirm()
    })
    expect(result.current.stopConfirmOpen).toBe(true)

    act(() => {
      result.current.closeStopConfirm()
    })
    expect(result.current.stopConfirmOpen).toBe(false)
  })

  it("starts session and primes audio if alerts enabled", async () => {
    const { result } = renderHook(() => useFocusViewModel())

    act(() => {
      result.current.onSettingsChange({
        ...result.current.settings,
        alerts: true,
      })
    })

    await act(async () => {
      await result.current.start()
    })

    expect(mockRuntime.start).toHaveBeenCalled()
    expect(primeAlertAudioMock).toHaveBeenCalled()
    expect(requestAlertPermissionMock).toHaveBeenCalled()
  })

  it("derives speedrun session state and stop modal properties", async () => {
    mockRuntime = makeRuntime(speedrunSession())
    const { result } = renderHook(() => useFocusViewModel())

    expect(result.current.running).toBe(true)
    expect(result.current.isSpeedrun).toBe(true)
    expect(result.current.stopLabel).toBe("Give up (−HP)")
    expect(result.current.stopModalTitle).toBe("Give up the run?")
    expect(result.current.stopModalVariant).toBe("destructive")

    act(() => {
      result.current.openStopConfirm()
    })
    expect(result.current.stopConfirmOpen).toBe(true)

    await act(async () => {
      await result.current.stop()
    })
    expect(result.current.stopConfirmOpen).toBe(false)
    expect(mockRuntime.stop).toHaveBeenCalled()
  })

  it("toggles immersive mode", () => {
    const { result } = renderHook(() => useFocusViewModel())

    act(() => {
      result.current.enterImmersive()
    })
    expect(result.current.immersive).toBe(true)

    act(() => {
      result.current.exitImmersive()
    })
    expect(result.current.immersive).toBe(false)
  })
})
