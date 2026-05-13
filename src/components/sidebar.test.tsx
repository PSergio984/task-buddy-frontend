import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import React from "react"

// Mock dnd-kit BEFORE importing Sidebar
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  rectSortingStrategy: vi.fn(),
  arrayMove: (array: any[]) => array,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

// Mock hooks
vi.mock("@/hooks/useProjects", () => ({
  useProjects: vi.fn(() => ({ data: [{ id: 1, name: "Project A", color: "red", icon: "Layers" }] })),
  useReorderProjects: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteProject: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateProject: vi.fn(() => ({ mutate: vi.fn() })),
  useUpdateProject: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock("@/hooks/useTags", () => ({
  useTags: vi.fn(() => ({ data: [{ id: 1, name: "Tag A", color: "blue", icon: "Tag" }] })),
  useReorderTags: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteTag: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateTag: vi.fn(() => ({ mutate: vi.fn() })),
  useUpdateTag: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}))

const mockSetActiveSidebarFilter = vi.fn()
const mockSetActiveTagId = vi.fn()

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: vi.fn(() => ({
    activeSidebarFilter: "all",
    setActiveSidebarFilter: mockSetActiveSidebarFilter,
    activeTagId: null,
    setActiveTagId: mockSetActiveTagId,
    setSelectedPriorities: vi.fn(),
    setSelectedProjects: vi.fn(),
    setSelectedTags: vi.fn(),
  })),
  FilterProvider: ({ children }: any) => <>{children}</>,
}))

// Import Sidebar after mocks
import { Sidebar } from "./sidebar"

const renderSidebar = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Sidebar isCollapsed={false} onToggle={vi.fn()} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("Sidebar CRUD Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens deletion modal when delete is clicked for a project", async () => {
    renderSidebar()
    
    const projectItem = screen.getByText("Project A").closest("div[role='button']")!
    const actionsTrigger = within(projectItem).getByRole("button", { name: /more actions/i })
    fireEvent.click(actionsTrigger)
    
    const deleteOption = await screen.findByRole("menuitem", { name: /delete/i })
    fireEvent.click(deleteOption)
    
    expect(screen.getByText(/Are you sure you want to delete "Project A"?/i)).toBeDefined()
  })

  it("opens creation/edit modal when edit is clicked for a project", async () => {
    renderSidebar()
    
    const projectItem = screen.getByText("Project A").closest("div[role='button']")!
    const actionsTrigger = within(projectItem).getByRole("button", { name: /more actions/i })
    fireEvent.click(actionsTrigger)
    
    const editOption = await screen.findByRole("menuitem", { name: /edit/i })
    fireEvent.click(editOption)
    
    // Should open CreateProjectModal with project data
    expect(screen.getByText(/Edit Project/i)).toBeDefined()
  })
})
