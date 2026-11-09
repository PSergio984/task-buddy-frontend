import { describe, expect, it } from "vitest"
import { classifyProposeError } from "./proposal-cards"

const axiosErr = (status: number | undefined, detail?: unknown) => ({
  response: status === undefined ? undefined : { status, data: { detail } },
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
