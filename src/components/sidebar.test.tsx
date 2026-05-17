import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import React from "react"

// Mock dnd-kit BEFORE importing Sidebar
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  rectSortingStrategy: vi.fn(),
  arrayMove: (array: unknown[]) => array,
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

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "1", username: "testuser" },
    loading: false,
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/hooks/useTasks", () => ({
  useTasks: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateTask: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateSubtask: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteSubtask: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDetachTag: vi.fn(() => ({ mutateAsync: vi.fn() })),
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
  FilterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Sidebar isCollapsed={false} onToggle={vi.fn()} />
        </BrowserRouter>
      </QueryClientProvider>
    )
  }
}

describe("Sidebar CRUD Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens deletion modal when delete is clicked for a project", async () => {
    const { user } = renderSidebar()
    
    const projectItem = screen.getByText("Project A").closest("div[role='button']")!
    const actionsTrigger = within(projectItem as HTMLElement).getByRole("button", { name: /more actions/i })
    
    await user.click(actionsTrigger)
    
    const deleteBtn = await screen.findByRole("menuitem", { name: /delete/i })
    await user.click(deleteBtn)
    
    expect(screen.getByRole("heading", { name: /delete project/i })).toBeInTheDocument()
    expect(screen.getByText((_content, element) => {
      const hasText = (node: Element) => node.textContent === 'Type "Project A" to confirm deletion'
      return hasText(element!) && Array.from(element?.children || []).every(child => !hasText(child))
    })).toBeInTheDocument()
  })

  it("opens deletion modal when delete is clicked for a tag", async () => {
    const { user } = renderSidebar()
    
    const tagItem = screen.getByText("Tag A").closest("div")!
    const actionsTrigger = within(tagItem as HTMLElement).getByRole("button", { name: /more actions/i })
    
    await user.click(actionsTrigger)
    
    const deleteBtn = await screen.findByRole("menuitem", { name: /delete/i })
    await user.click(deleteBtn)
    
    expect(screen.getByText(/delete tag/i)).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to delete the tag "tag a"/i)).toBeInTheDocument()
  })
})
