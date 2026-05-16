import { renderHook, act } from "@testing-library/react"
import { SettingsProvider, useSettings } from "./SettingsContext"
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("SettingsContext", () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    vi.clearAllMocks()
  })

  it("should provide default time format of 12h", () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    expect(result.current.timeFormat).toBe("12h")
  })

  it("should update time format and persist to localStorage", () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    act(() => {
      result.current.setTimeFormat("24h")
    })
    expect(result.current.timeFormat).toBe("24h")
    expect(globalThis.localStorage.getItem("pref_time_format")).toBe("24h")
  })

  it("should initialize from localStorage", () => {
    globalThis.localStorage.setItem("pref_time_format", "24h")
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    expect(result.current.timeFormat).toBe("24h")
  })
})
