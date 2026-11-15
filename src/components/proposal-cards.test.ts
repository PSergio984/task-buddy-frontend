import { describe, expect, it } from "vitest"
import {
  classifyProposeError,
  parseRefineTarget,
  replaceCard,
} from "./proposal-cards"

const axiosErr = (status: number | undefined, detail?: unknown) => ({
  response: status === undefined ? undefined : { status, data: { detail } },
})

describe("parseRefineTarget", () => {
  it("extracts target from standard #N format", () => {
    expect(parseRefineTarget("#2")).toBe(2)
    expect(parseRefineTarget("split #4 into two")).toBe(4)
    expect(parseRefineTarget("#12 more details")).toBe(12)
  })

  it("extracts target with 'task N' or 'card N' phrasing", () => {
    expect(parseRefineTarget("task 3")).toBe(3)
    expect(parseRefineTarget("card 5")).toBe(5)
    expect(parseRefineTarget("regenerate task 7")).toBe(7)
  })

  it("extracts standalone numbers as fallback", () => {
    expect(parseRefineTarget("2")).toBe(2)
    expect(parseRefineTarget("split 8")).toBe(8)
  })

  it("returns null when no number is present", () => {
    expect(parseRefineTarget("")).toBeNull()
    expect(parseRefineTarget("make it shorter")).toBeNull()
  })
})

describe("replaceCard", () => {
  const cards = [
    { number: 1, title: "Card 1", status: "draft" },
    { number: 2, title: "Card 2", status: "draft" },
    { number: 3, title: "Card 3", status: "draft" },
  ]

  it("replaces a single card in place keeping stable number", () => {
    const replacements = [{ number: 99, title: "New Card 2", status: "draft" }]
    const result = replaceCard(cards, 2, replacements)
    expect(result.map((c) => c.number)).toEqual([1, 2, 3])
    expect(result[1].title).toBe("New Card 2")
    expect(result[0].title).toBe("Card 1")
    expect(result[2].title).toBe("Card 3")
  })

  it("supports one-to-many replacement where first inherits target number", () => {
    const replacements = [
      { number: 10, title: "2A", status: "draft" },
      { number: 11, title: "2B", status: "draft" },
    ]
    const result = replaceCard(cards, 2, replacements)
    expect(result.map((c) => c.number)).toEqual([1, 2, 11, 3])
    expect(result[1].title).toBe("2A")
    expect(result[2].title).toBe("2B")
  })

  it("drops card when replacement is empty", () => {
    const result = replaceCard(cards, 2, [])
    expect(result.map((c) => c.number)).toEqual([1, 3])
  })

  it("appends defensively if target not found", () => {
    const replacements = [{ number: 5, title: "Extra", status: "draft" }]
    const result = replaceCard(cards, 99, replacements)
    expect(result.map((c) => c.number)).toEqual([1, 2, 3, 5])
  })
})

describe("classifyProposeError", () => {
  it("treats the daily-budget 429 detail as exhausted, with no retry copy", () => {
    const err = axiosErr(
      429,
      "Daily AI usage limit reached. Try again tomorrow."
    )
    expect(classifyProposeError(err)).toEqual({
      budgetExhausted: true,
      message: null,
    })
  })

  it("treats slowapi's per-minute 429 as retryable", () => {
    const err = axiosErr(
      429,
      "Too many attempts. Please try again in a few minutes."
    )
    const result = classifyProposeError(err)
    expect(result.budgetExhausted).toBe(false)
    expect(result.message).toMatch(/wait a moment/i)
  })

  it("treats a 429 with no detail as retryable, not budget", () => {
    const result = classifyProposeError(axiosErr(429, undefined))
    expect(result.budgetExhausted).toBe(false)
  })

  it("treats 503 as the unavailable message", () => {
    expect(classifyProposeError(axiosErr(503)).message).toMatch(
      /isn't available/
    )
  })

  it("falls back to the generic message for other failures", () => {
    expect(classifyProposeError(axiosErr(500)).message).toMatch(/went wrong/)
    expect(classifyProposeError(axiosErr(undefined)).message).toMatch(
      /went wrong/
    )
  })
})
