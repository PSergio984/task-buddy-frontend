import { describe, it, expect } from "vitest"
import {
  addUtcDays,
  retentionCutoffDay,
  utcDayLabel,
  utcDayToLocalDate,
  localDateToUtcDay,
  utcTimeLabel,
} from "./diary"

describe("addUtcDays", () => {
  it("steps within a month", () => {
    expect(addUtcDays("2025-11-01", 1)).toBe("2025-11-02")
    expect(addUtcDays("2025-11-01", -1)).toBe("2025-10-31")
  })

  it("crosses month and year boundaries on UTC math", () => {
    expect(addUtcDays("2025-01-01", -1)).toBe("2024-12-31")
    expect(addUtcDays("2024-02-28", 1)).toBe("2024-02-29") // leap year
    expect(addUtcDays("2025-12-31", 1)).toBe("2026-01-01")
  })
})

describe("retentionCutoffDay", () => {
  const today = "2025-11-01"

  it("90d keeps a 90-day window", () => {
    expect(retentionCutoffDay("90d", today)).toBe("2025-08-03")
  })

  it("1y keeps a 365-day window", () => {
    expect(retentionCutoffDay("1y", today)).toBe("2024-11-01")
  })

  it("forever — and an absent/unknown pref — has no horizon", () => {
    expect(retentionCutoffDay("forever", today)).toBeNull()
    expect(retentionCutoffDay(undefined, today)).toBeNull()
    expect(retentionCutoffDay(null, today)).toBeNull()
  })
})

describe("day label helpers", () => {
  it("utcDayToLocalDate → localDateToUtcDay round-trips the label", () => {
    const day = "2025-11-01"
    expect(localDateToUtcDay(utcDayToLocalDate(day))).toBe(day)
  })

  it("utcDayLabel renders the UTC day, not the neighbouring local one", () => {
    // 2025-11-01 is a Saturday; a tz-shifted render would show Oct 31/Nov 2.
    expect(utcDayLabel("2025-11-01")).toBe("Sat, Nov 1")
    expect(utcDayLabel("2025-01-06")).toBe("Mon, Jan 6")
  })
})

describe("utcTimeLabel", () => {
  it("formats UTC HH:mm regardless of local tz", () => {
    expect(utcTimeLabel(Date.parse("2025-11-01T14:32:00Z"))).toBe("14:32")
    expect(utcTimeLabel(Date.parse("2025-11-01T00:05:00Z"))).toBe("00:05")
  })
})
