import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SortableSidebarItem } from "./sortable-item"
import React from "react"

// Mock dnd-kit hooks since they require a DndContext parent
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: { "aria-describedby": "DndDescribedBy" },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
}))

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(),
    },
  },
}))

describe("SortableSidebarItem", () => {
  it("renders children correctly", () => {
    render(
      <SortableSidebarItem id="test-1">
        <span>Test Item</span>
      </SortableSidebarItem>
    )
    expect(screen.getByText("Test Item")).toBeDefined()
  })

  it("renders with a handle if provided", () => {
    const Handle = () => <button data-testid="drag-handle">Grip</button>
    render(
      <SortableSidebarItem id="test-1" handle={<Handle />}>
        <span>Test Item</span>
      </SortableSidebarItem>
    )
    expect(screen.getByTestId("drag-handle")).toBeDefined()
  })
})
