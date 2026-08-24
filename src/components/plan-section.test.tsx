import { render, screen } from "@testing-library/react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import { PlanSection } from "./plan-section"
import type { Task } from "@/lib/api"

const tasks = [
  { id: 1, title: "Read a chapter" },
  { id: 2, title: "Call the bank" },
] as unknown as Task[]

function stubVoiceSupport(supported: boolean) {
  if (supported) {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })
    Object.defineProperty(window, "MediaRecorder", {
      value: vi.fn(),
      configurable: true,
    })
  } else {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    })
    Object.defineProperty(window, "MediaRecorder", {
      value: undefined,
      configurable: true,
    })
  }
}

afterEach(() => {
  cleanup()
  stubVoiceSupport(false)
})

describe("PlanSection voice entry", () => {
  it("does not render the mic button on unsupported browsers", () => {
    stubVoiceSupport(false)
    render(<PlanSection tasks={tasks} />)
    expect(
      screen.queryByRole("button", { name: /voice planning/i })
    ).not.toBeInTheDocument()
    // text planning stays unaffected
    expect(screen.getByText("Plan my focus")).toBeInTheDocument()
  })

  it("renders the mic button beside Plan my focus when supported", () => {
    stubVoiceSupport(true)
    render(<PlanSection tasks={tasks} />)
    expect(
      screen.getByRole("button", { name: /start voice planning/i })
    ).toBeInTheDocument()
    expect(screen.getByText("Plan my focus")).toBeInTheDocument()
  })

  it("shows the static English-first helper line while idle", () => {
    render(<PlanSection tasks={tasks} />)
    expect(
      screen.getByText(/What should I work on tonight\?/i)
    ).toBeInTheDocument()
  })
})
