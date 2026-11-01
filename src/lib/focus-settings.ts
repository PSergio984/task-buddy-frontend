import {
  DEFAULT_FOCUS_SETTINGS,
  FOCUS_PRESETS,
  type FocusPresetId,
  type FocusSettings,
} from "@/lib/focus-session"

export const FOCUS_SETTINGS_KEY = "tb_focus_settings"

/**
 * localStorage → FocusSettings. Corrupt JSON falls back to defaults; an
 * unknown persisted presetId also falls back — FOCUS_PRESETS["bogus"] is
 * undefined and would crash describePlan on render.
 */
export function loadFocusSettings(): FocusSettings {
  try {
    const raw = globalThis.localStorage.getItem(FOCUS_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FocusSettings>
      const presetValid =
        parsed.presetId === "custom" ||
        (typeof parsed.presetId === "string" &&
          parsed.presetId in FOCUS_PRESETS)
      return {
        ...DEFAULT_FOCUS_SETTINGS,
        ...parsed,
        presetId: presetValid
          ? (parsed.presetId as FocusPresetId)
          : DEFAULT_FOCUS_SETTINGS.presetId,
        taskId: null,
        tagId: null,
      }
    }
  } catch {
    // Corrupt storage falls back to defaults.
  }
  return DEFAULT_FOCUS_SETTINGS
}
