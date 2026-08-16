import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SyncStatusPill } from "./sync-status-pill"

describe("SyncStatusPill", () => {
  it("renders the offline state when disconnected", () => {
    render(
      <SyncStatusPill
        isOnline={false}
        isSyncing={false}
        pendingCount={0}
        conflictCount={0}
      />
    )
    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("renders the syncing state during a flush", () => {
    render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={true}
        pendingCount={3}
        conflictCount={0}
      />
    )
    expect(screen.getByText("Syncing…")).toBeInTheDocument()
  })

  it("shows the pending count when queued but not flushing", () => {
    render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={false}
        pendingCount={3}
        conflictCount={0}
      />
    )
    expect(screen.getByText("3 pending")).toBeInTheDocument()
  })

  it("shows the pending conflict count after a flush with conflicts", () => {
    render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={false}
        pendingCount={0}
        conflictCount={2}
      />
    )
    expect(screen.getByText("2 conflicts")).toBeInTheDocument()
  })

  it("combines pending and conflicts instead of shadowing conflicts", () => {
    render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={false}
        pendingCount={3}
        conflictCount={2}
      />
    )
    expect(screen.getByText("3 pending · 2 conflicts")).toBeInTheDocument()
  })

  it("singularizes a single conflict", () => {
    render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={false}
        pendingCount={1}
        conflictCount={1}
      />
    )
    expect(screen.getByText("1 pending · 1 conflict")).toBeInTheDocument()
  })

  it("renders nothing when online, idle, and conflict-free", () => {
    const { container } = render(
      <SyncStatusPill
        isOnline={true}
        isSyncing={false}
        pendingCount={0}
        conflictCount={0}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
