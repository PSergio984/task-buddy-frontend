import { describe, it, expect } from "vitest"
import {
  counterLabel,
  habitDrift,
  itemLines,
  parseItemLines,
  recurrenceLabel,
  reminderLabel,
} from "./game-columns"

describe("habitDrift", () => {
  it("flags positive drift as farmed — the +click payout already decayed", () => {
    expect(habitDrift(1)).toBe("farmed")
    expect(habitDrift(21.27)).toBe("farmed")
  })

  it("flags negative drift as fresh — neglected habits pay more", () => {
    expect(habitDrift(-1)).toBe("fresh")
    expect(habitDrift(-47.27)).toBe("fresh")
  })

  it("treats sub-click drift as steady", () => {
    expect(habitDrift(0)).toBe("steady")
    expect(habitDrift(0.9)).toBe("steady")
    expect(habitDrift(-0.9)).toBe("steady")
  })
})

describe("recurrenceLabel", () => {
  it("labels each stored recurrence kind", () => {
    expect(recurrenceLabel({ kind: "daily" })).toBe("Every day")
    expect(recurrenceLabel({ kind: "weekdays", days: [0, 3] })).toBe(
      "Mon · Thu"
    )
    expect(
      recurrenceLabel({ kind: "weekdays", days: [0, 1, 2, 3, 4, 5, 6] })
    ).toBe("Every day")
    expect(recurrenceLabel({ kind: "every_n_days", interval: 3 })).toBe(
      "Every 3 days"
    )
    expect(recurrenceLabel({ kind: "every_n_days", interval: 1 })).toBe(
      "Every day"
    )
    expect(recurrenceLabel({ kind: "times_per_week", count: 3 })).toBe(
      "3× per week"
    )
  })

  it("falls back to Custom on a malformed blob", () => {
    expect(recurrenceLabel(undefined)).toBe("Custom")
    // The read type is Recurrence, but stored JSONB is a trust boundary.
    expect(recurrenceLabel({ kind: "weekdays", days: [] })).toBe("Custom")
    expect(
      recurrenceLabel({ kind: "bogus" } as unknown as Parameters<
        typeof recurrenceLabel
      >[0])
    ).toBe("Custom")
  })
})

describe("reminderLabel", () => {
  it("joins up to two times, then counts the rest", () => {
    expect(reminderLabel(["07:00"])).toBe("07:00")
    expect(reminderLabel(["07:00", "21:00"])).toBe("07:00 · 21:00")
    expect(reminderLabel(["07:00", "12:30", "21:00"])).toBe("07:00 · 12:30 +1")
    expect(reminderLabel([])).toBe("")
  })
})

describe("counterLabel", () => {
  it("renders a signed net counter", () => {
    expect(counterLabel(12)).toBe("+12")
    expect(counterLabel(0)).toBe("0")
    expect(counterLabel(-3)).toBe("−3")
  })
})

describe("parseItemLines / itemLines", () => {
  it("splits a checklist into titles, trimming and dropping blanks", () => {
    expect(parseItemLines("  sit 10 min  \n\n journal line \n   ")).toEqual([
      { title: "sit 10 min" },
      { title: "journal line" },
    ])
  })

  it("round-trips a saved checklist back into the editor", () => {
    const items = [
      { id: 1, title: "a", position: 0, done_today: false },
      { id: 2, title: "b", position: 1, done_today: true },
    ]
    expect(itemLines(items)).toBe("a\nb")
    expect(parseItemLines("")).toEqual([])
  })
})
