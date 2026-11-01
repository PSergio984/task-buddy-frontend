import { describe, it, expect, beforeEach } from "vitest"
import { FOCUS_SETTINGS_KEY, loadFocusSettings } from "./focus-settings"
import { DEFAULT_FOCUS_SETTINGS } from "./focus-session"

describe("loadFocusSettings", () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it("returns defaults when nothing is stored", () => {
    expect(loadFocusSettings()).toEqual(DEFAULT_FOCUS_SETTINGS)
  })

  it("returns defaults on corrupt JSON", () => {
    globalThis.localStorage.setItem(FOCUS_SETTINGS_KEY, "{not json")
    expect(loadFocusSettings()).toEqual(DEFAULT_FOCUS_SETTINGS)
  })

  it("falls back to the default preset when the stored presetId is unknown", () => {
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({ presetId: "bogus", cycles: 6 })
    )
    const s = loadFocusSettings()
    expect(s.presetId).toBe(DEFAULT_FOCUS_SETTINGS.presetId)
    expect(s.cycles).toBe(6) // the rest of the blob still survives
  })

  it("keeps a valid persisted presetId (including custom)", () => {
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({ presetId: "deep" })
    )
    expect(loadFocusSettings().presetId).toBe("deep")
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({ presetId: "custom" })
    )
    expect(loadFocusSettings().presetId).toBe("custom")
  })

  it("never persists taskId/tagId through a reload", () => {
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({ presetId: "classic", taskId: 3, tagId: 4 })
    )
    const s = loadFocusSettings()
    expect(s.taskId).toBeNull()
    expect(s.tagId).toBeNull()
  })
})
