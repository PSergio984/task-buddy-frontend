import { describe, expect, it, vi } from "vitest"
import type { ImportTaskProposal, TaskCreateData } from "@/lib/api"
import {
  IMPORT_TEXT_LIMIT,
  committableCards,
  commitImportCards,
  isAcceptedImportFile,
  isoToDateInput,
  readImportFile,
  toImportDraftCard,
  toTaskCreateData,
  validateImportText,
  type ImportCardStatus,
} from "./import-cards"

const proposal = (
  title: string,
  overrides: Partial<ImportTaskProposal> = {}
): ImportTaskProposal => ({
  title,
  description: null,
  proposed_deadline: null,
  priority: "MEDIUM",
  suggested_project_id: null,
  subtasks: [],
  ...overrides,
})

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe("readImportFile", () => {
  it("reads a .md file to text", async () => {
    const file = new File(["buy milk\nemail dentist"], "notes.md")
    await expect(readImportFile(file)).resolves.toBe("buy milk\nemail dentist")
  })

  it("reads a .txt file to text", async () => {
    const file = new File(["hello"], "TODO.TXT")
    await expect(readImportFile(file)).resolves.toBe("hello")
  })

  it("rejects non-.md/.txt files with a clear message", async () => {
    const file = new File(["{}"], "data.json")
    await expect(readImportFile(file)).rejects.toThrow(
      "Only .md and .txt files can be imported."
    )
  })

  it("rejects a file over the character limit", async () => {
    const file = new File(["x".repeat(IMPORT_TEXT_LIMIT + 1)], "big.txt")
    await expect(readImportFile(file)).rejects.toThrow("the limit is 10,000")
  })
})

describe("isAcceptedImportFile", () => {
  it("accepts .md and .txt case-insensitively", () => {
    expect(isAcceptedImportFile("a.md")).toBe(true)
    expect(isAcceptedImportFile("a.TXT")).toBe(true)
    expect(isAcceptedImportFile("a.pdf")).toBe(false)
    expect(isAcceptedImportFile("markdown")).toBe(false)
  })
})

describe("validateImportText", () => {
  it("rejects empty/whitespace text", () => {
    expect(validateImportText("")).not.toBeNull()
    expect(validateImportText("   \n")).not.toBeNull()
  })

  it("rejects text over the limit", () => {
    const text = "x".repeat(IMPORT_TEXT_LIMIT + 1)
    expect(validateImportText(text)).toContain("10,000")
  })

  it("accepts text at or under the limit", () => {
    expect(validateImportText("one task")).toBeNull()
    expect(validateImportText("x".repeat(IMPORT_TEXT_LIMIT))).toBeNull()
  })
})

describe("isoToDateInput", () => {
  it("takes the date prefix from ISO datetimes and dates", () => {
    expect(isoToDateInput("2026-03-04T09:30:00Z")).toBe("2026-03-04")
    expect(isoToDateInput("2026-03-04")).toBe("2026-03-04")
  })

  it("returns null for missing or malformed values", () => {
    expect(isoToDateInput(null)).toBeNull()
    expect(isoToDateInput("someday")).toBeNull()
  })
})

describe("toImportDraftCard", () => {
  it("maps a proposal with included defaults", () => {
    const card = toImportDraftCard(
      proposal("Report", {
        description: "Q3 numbers",
        proposed_deadline: "2026-03-04T00:00:00Z",
        priority: "HIGH",
        suggested_project_id: 7,
        subtasks: [{ title: "gather data" }],
      }),
      3
    )
    expect(card).toMatchObject({
      number: 3,
      included: true,
      title: "Report",
      description: "Q3 numbers",
      deadline: "2026-03-04",
      priority: "HIGH",
      projectId: 7,
      status: "draft",
    })
    expect(card.subtasks).toEqual([{ title: "gather data", accepted: true }])
  })

  it("prefers the suggestion over the fallback project", () => {
    expect(
      toImportDraftCard(proposal("T", { suggested_project_id: 7 }), 1, 9)
        .projectId
    ).toBe(7)
    expect(toImportDraftCard(proposal("T"), 1, 9).projectId).toBe(9)
    expect(toImportDraftCard(proposal("T"), 1).projectId).toBeNull()
  })
})

describe("committableCards", () => {
  it("excludes unchecked and already-created cards", () => {
    const cards = [
      { ...toImportDraftCard(proposal("A"), 1), included: false },
      toImportDraftCard(proposal("B"), 2),
      {
        ...toImportDraftCard(proposal("C"), 3),
        status: "created" as const,
      },
    ]
    expect(committableCards(cards).map((c) => c.title)).toEqual(["B"])
  })
})

describe("toTaskCreateData", () => {
  it("maps card fields to the TaskCreate payload", () => {
    const card = {
      ...toImportDraftCard(
        proposal("Report", {
          description: "Q3 numbers",
          priority: "LOW",
          suggested_project_id: 5,
          subtasks: [{ title: "data" }, { title: "draft" }],
        }),
        1
      ),
      deadline: "2026-03-04",
    }
    card.subtasks[1].accepted = false
    const data = toTaskCreateData(card)
    expect(data.title).toBe("Report")
    expect(data.description).toBe("Q3 numbers")
    expect(data.priority).toBe("LOW")
    expect(data.project_id).toBe(5)
    expect(data.due_date).toBe(new Date("2026-03-04T00:00:00").toISOString())
    expect(data.subtasks).toEqual([{ title: "data" }])
  })

  it("omits empty optionals", () => {
    const data = toTaskCreateData(toImportDraftCard(proposal("Bare"), 1))
    expect(data).not.toHaveProperty("description")
    expect(data).not.toHaveProperty("project_id")
    expect(data).not.toHaveProperty("due_date")
    expect(data.subtasks).toEqual([])
  })
})

describe("commitImportCards", () => {
  const collect = () => {
    const calls: { data: TaskCreateData; key: string }[] = []
    const createTask = vi.fn((data: TaskCreateData, key: string) => {
      calls.push({ data, key })
      return Promise.resolve({ id: calls.length })
    })
    return { calls, createTask }
  }

  it("creates one task per included card with a unique uuid-v4 key", async () => {
    const cards = [
      toImportDraftCard(proposal("A", { priority: "HIGH" }), 1),
      { ...toImportDraftCard(proposal("B"), 2), included: false },
      toImportDraftCard(proposal("C", { suggested_project_id: 4 }), 3),
    ]
    const statuses: [number, ImportCardStatus][] = []
    const { calls, createTask } = collect()

    const result = await commitImportCards(cards, createTask, (n, s) =>
      statuses.push([n, s])
    )

    expect(result).toEqual({ created: 2, failed: 0 })
    expect(createTask).toHaveBeenCalledTimes(2)
    expect(calls[0].data.title).toBe("A")
    expect(calls[0].data.priority).toBe("HIGH")
    expect(calls[1].data.title).toBe("C")
    expect(calls[1].data.project_id).toBe(4)
    for (const call of calls) {
      expect(call.key).toMatch(UUID_V4)
    }
    expect(calls[0].key).not.toBe(calls[1].key)
    expect(statuses).toEqual([
      [1, "creating"],
      [1, "created"],
      [3, "creating"],
      [3, "created"],
    ])
  })

  it("marks failures and leaves them committable for a retry", async () => {
    const cards = [
      toImportDraftCard(proposal("A"), 1),
      toImportDraftCard(proposal("B"), 2),
    ]
    const statuses: [number, ImportCardStatus][] = []
    let calls = 0
    const createTask = vi.fn((_data: TaskCreateData, _key: string) => {
      calls += 1
      return calls === 1
        ? Promise.resolve({ id: 1 })
        : Promise.reject(new Error("boom"))
    })

    const result = await commitImportCards(cards, createTask, (n, s) =>
      statuses.push([n, s])
    )

    expect(result).toEqual({ created: 1, failed: 1 })
    expect(statuses).toEqual([
      [1, "creating"],
      [1, "created"],
      [2, "creating"],
      [2, "failed"],
    ])
    // A retry targets only the failed card — "created" never re-posts.
    const retried = cards.map((c, i) => ({
      ...c,
      status: (i === 0 ? "created" : "failed") as ImportCardStatus,
    }))
    const { calls: retryCalls, createTask: retryCreate } = collect()
    await commitImportCards(retried, retryCreate)
    expect(retryCalls.map((c) => c.data.title)).toEqual(["B"])
  })
})
