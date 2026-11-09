import { describe, expect, it, vi } from "vitest"
import {
  commitBreakdownCards,
  replaceCard,
  toBreakdownTaskCreateData,
  toDraftCard,
  type DraftCard,
} from "./breakdown-cards"
import type { BreakdownTaskProposal, TaskCreateData } from "@/lib/api"

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

describe("toBreakdownTaskCreateData", () => {
  it("maps card fields to the TaskCreate payload", () => {
    const card = toDraftCard(
      {
        ...proposal("Report", ["data", "draft"]),
        estimated_effort_minutes: 25,
      },
      1
    )
    card.subtasks[1].accepted = false
    const data = toBreakdownTaskCreateData(card, 4)
    expect(data.title).toBe("Report")
    expect(data.estimated_effort_minutes).toBe(25)
    expect(data.project_id).toBe(4)
    expect(data.subtasks).toEqual([{ title: "data" }])
  })
})

describe("commitBreakdownCards", () => {
  const collect = () => {
    const calls: { data: TaskCreateData; key: string }[] = []
    const createTask = vi.fn((data: TaskCreateData, key: string) => {
      calls.push({ data, key })
      return Promise.resolve({ id: calls.length })
    })
    return { calls, createTask }
  }

  const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  it("creates one task per accepted card with a unique uuid-v4 key", async () => {
    const cards = [
      toDraftCard(proposal("A"), 1),
      { ...toDraftCard(proposal("B"), 2), accepted: false },
      { ...toDraftCard(proposal("C"), 3), status: "created" as const },
      toDraftCard(proposal("D"), 4),
    ]
    const statuses: [number, DraftCard["status"]][] = []
    const { calls, createTask } = collect()

    const result = await commitBreakdownCards(
      cards,
      createTask,
      (n, s) => statuses.push([n, s]),
      undefined,
      7
    )

    expect(result).toEqual({ created: 2, failed: 0 })
    expect(createTask).toHaveBeenCalledTimes(2)
    expect(calls[0].data.title).toBe("A")
    expect(calls[0].data.project_id).toBe(7)
    expect(calls[1].data.title).toBe("D")
    for (const call of calls) {
      expect(call.key).toMatch(UUID_V4)
    }
    expect(calls[0].key).not.toBe(calls[1].key)
    expect(statuses).toEqual([
      [1, "creating"],
      [1, "created"],
      [4, "creating"],
      [4, "created"],
    ])
  })

  it("assigns each card a key via onKeyAssigned on first attempt", async () => {
    const cards = [toDraftCard(proposal("A"), 1), toDraftCard(proposal("B"), 2)]
    const assigned: [number, string][] = []
    const { calls, createTask } = collect()

    await commitBreakdownCards(cards, createTask, undefined, (n, key) =>
      assigned.push([n, key])
    )

    expect(assigned).toEqual([
      [1, calls[0].key],
      [2, calls[1].key],
    ])
  })

  it("reuses the card's persisted key on retry so a lost response replays", async () => {
    const key = "3f6f2a3e-0f6c-4d2a-9c2f-6a3f1a1e4d2b"
    const cards = [
      {
        ...toDraftCard(proposal("A"), 1),
        status: "failed" as const,
        idempotencyKey: key,
      },
    ]
    const assigned: [number, string][] = []
    const { calls, createTask } = collect()

    await commitBreakdownCards(cards, createTask, undefined, (n, k) =>
      assigned.push([n, k])
    )

    expect(calls[0].key).toBe(key)
    // A persisted key must NOT be re-assigned — it's the replay handle.
    expect(assigned).toEqual([])
  })

  it("resolves a same-key/different-body 422 as created — the first attempt landed", async () => {
    const key = "3f6f2a3e-0f6c-4d2a-9c2f-6a3f1a1e4d2b"
    // The dangerous path: a card whose POST landed server-side but read as
    // failed client-side — the user edits it, then retries. The edit keeps
    // the key (a fresh one would double-create), and the backend's 422
    // "key reused with a different body" proves the task exists.
    const edited: DraftCard = {
      ...toDraftCard(proposal("A"), 1),
      title: "Edited after failure",
      status: "failed",
      idempotencyKey: key,
    }

    const statuses: [number, DraftCard["status"]][] = []
    const createTask = vi.fn((_data: TaskCreateData, sentKey: string) => {
      expect(sentKey).toBe(key)
      return Promise.reject({
        response: {
          status: 422,
          data: {
            detail:
              "Idempotency key was already used with a different request body.",
          },
        },
      })
    })

    const result = await commitBreakdownCards([edited], createTask, (n, s) =>
      statuses.push([n, s])
    )

    expect(result).toEqual({ created: 1, failed: 0 })
    expect(statuses).toEqual([
      [1, "creating"],
      [1, "created"],
    ])
  })

  it("still marks an ordinary 422 as failed", async () => {
    const cards = [toDraftCard(proposal("A"), 1)]
    const statuses: [number, DraftCard["status"]][] = []
    const createTask = vi.fn(() =>
      Promise.reject({
        response: {
          status: 422,
          data: { detail: "title: String should have at least 1 character" },
        },
      })
    )

    const result = await commitBreakdownCards(cards, createTask, (n, s) =>
      statuses.push([n, s])
    )

    expect(result).toEqual({ created: 0, failed: 1 })
    expect(statuses).toEqual([
      [1, "creating"],
      [1, "failed"],
    ])
  })
})
