import { describe, expect, it } from "vitest"
import { replaceCard, toDraftCard } from "./breakdown-cards"
import type { BreakdownTaskProposal } from "@/lib/api"

const proposal = (
  title: string,
  subtasks: string[] = []
): BreakdownTaskProposal => ({
  title,
  estimated_effort_minutes: null,
  subtasks: subtasks.map((title) => ({ title })),
})

describe("replaceCard", () => {
  const cards = [
    { ...toDraftCard(proposal("Buy milk"), 1), status: "created" as const },
    toDraftCard(proposal("Buy milk"), 2), // duplicate title, different card
    toDraftCard(proposal("Deploy"), 3),
  ]

  it("replaces only the targeted card by stable number", () => {
    const replacements = [toDraftCard(proposal("Split deploy step"), 4)]
    const result = replaceCard(cards, 3, replacements)
    expect(result.map((c) => c.number)).toEqual([1, 2, 3])
    expect(result[2].title).toBe("Split deploy step")
    expect(result[0].status).toBe("created") // untouched
  })

  it("keeps the target's number even when replacements differ", () => {
    // A refine that returns several tasks: the first inherits the target
    // number so existing references stay valid; siblings get their own.
    const replacements = [
      toDraftCard(proposal("A"), 4),
      toDraftCard(proposal("B"), 5),
      toDraftCard(proposal("C"), 6),
    ]
    const result = replaceCard(cards, 2, replacements)
    // #2 replaced in place by "A" (inherits number 2); B/C follow; untouched
    // #3 keeps its position at the end.
    expect(result.map((c) => c.number)).toEqual([1, 2, 5, 6, 3])
    expect(result[1].title).toBe("A")
  })

  it("matches by number even with duplicate titles", () => {
    const replacements = [toDraftCard(proposal("Fresh milk run"), 7)]
    const result = replaceCard(cards, 2, replacements)
    expect(result[1].title).toBe("Fresh milk run")
    expect(result[0].title).toBe("Buy milk") // same-titled #1 untouched
  })

  it("drops the target when a refine yields nothing", () => {
    const result = replaceCard(cards, 2, [])
    expect(result.map((c) => c.number)).toEqual([1, 3])
  })

  it("appends when the target number is absent (defensive)", () => {
    const replacements = [toDraftCard(proposal("Orphan"), 9)]
    const result = replaceCard(cards, 99, replacements)
    expect(result.map((c) => c.title)).toContain("Orphan")
  })
})

describe("toDraftCard", () => {
  it("maps a proposal with accepted defaults", () => {
    const card = toDraftCard(proposal("Task", ["sub"]), 8)
    expect(card).toMatchObject({
      number: 8,
      accepted: true,
      title: "Task",
      effortMinutes: null,
      status: "draft",
    })
    expect(card.subtasks).toEqual([{ title: "sub", accepted: true }])
  })
})
