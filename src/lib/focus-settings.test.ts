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

  it.each(["constructor", "toString", "hasOwnProperty"])(
    "falls back when stored presetId is the inherited name %s",
    (presetId) => {
      globalThis.localStorage.setItem(
        FOCUS_SETTINGS_KEY,
        JSON.stringify({ presetId })
      )
      const s = loadFocusSettings()
      expect(s.presetId).toBe(DEFAULT_FOCUS_SETTINGS.presetId)
    }
  )

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

  it("falls back to defaults for bogus persisted speedrun fields", () => {
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({
        speedrunKind: "bogus",
        speedrunBudgetMin: "fast",
        activityLabel: 42,
      })
    )
    const s = loadFocusSettings()
    expect(s.speedrunKind).toBe(DEFAULT_FOCUS_SETTINGS.speedrunKind)
    expect(s.speedrunBudgetMin).toBe(DEFAULT_FOCUS_SETTINGS.speedrunBudgetMin)
    expect(s.activityLabel).toBe(DEFAULT_FOCUS_SETTINGS.activityLabel)
  })

  it("keeps valid persisted speedrun fields", () => {
    globalThis.localStorage.setItem(
      FOCUS_SETTINGS_KEY,
      JSON.stringify({
        speedrunKind: "beat_best",
        speedrunBudgetMin: 45,
        activityLabel: "Deep work",
      })
    )
    const s = loadFocusSettings()
    expect(s.speedrunKind).toBe("beat_best")
    expect(s.speedrunBudgetMin).toBe(45)
    expect(s.activityLabel).toBe("Deep work")
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
