import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Sidebar } from "./sidebar"
import { BrowserRouter } from "react-router-dom"
import { FilterProvider } from "@/contexts/FilterContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

// Mock necessary hooks and modules
const mockToast = vi.fn()
vi.mock("@/hooks/useProjects", () => ({
  useProjects: () => ({ data: [{ id: 1, name: "Project 1", color: "blue", icon: "Layers" }] }),
  useReorderProjects: () => ({ mutate: vi.fn() }),
  useCreateProject: () => ({ mutateAsync: vi.fn() }),
  useUpdateProject: () => ({ mutateAsync: vi.fn() }),
  useDeleteProject: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({ data: [{ id: 1, name: "Tag 1", color: "red", icon: "Tag" }] }),
  useDeleteTag: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useReorderTags: () => ({ mutate: vi.fn() }),
  useCreateTag: () => ({ mutateAsync: vi.fn() }),
  useUpdateTag: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock problematic Radix UI components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock SidebarItemActions since it's used in Sidebar
interface SidebarItemActionsProps {
  onEdit: () => void
  onDelete: () => void
}

vi.mock("./sidebar/item-actions", () => ({
  SidebarItemActions: ({ onEdit, onDelete }: SidebarItemActionsProps) => (
    <div data-testid="item-actions">
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}))

// Mock Modals to avoid complex hook/portal issues in Vitest
interface DeleteConfirmationModalProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
}

vi.mock("./delete-confirmation-modal", () => ({
  DeleteConfirmationModal: ({ open, title, description, onConfirm }: DeleteConfirmationModalProps) => 
    open ? (
      <div data-testid="delete-modal">
        <h1>{title}</h1>
        <p>{description}</p>
        <button onClick={onConfirm}>Delete</button>
      </div>
    ) : null
}))

interface ModalProps {
  open: boolean
}

vi.mock("./create-project-modal", () => ({
  CreateProjectModal: ({ open }: ModalProps) => 
    open ? <div data-testid="edit-project-modal">Edit Project</div> : null
}))

vi.mock("./create-tag-modal", () => ({
  CreateTagModal: ({ open }: ModalProps) => 
    open ? <div data-testid="edit-tag-modal">Edit Tag</div> : null
}))

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
      <FilterProvider>
        <BrowserRouter>
          <Sidebar isCollapsed={false} onToggle={vi.fn()} />
        </BrowserRouter>
      </FilterProvider>
    </QueryClientProvider>
  )
}

describe("Sidebar Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders project and tag items with actions", () => {
    renderSidebar()
    expect(screen.getByText("Project 1")).toBeDefined()
    expect(screen.getByText("Tag 1")).toBeDefined()
  })

  it("opens deletion modal when delete is clicked", async () => {
    renderSidebar()
    
    // Find delete button in project actions
    const deleteButtons = screen.getAllByText("Delete")
    fireEvent.click(deleteButtons[0]) // Click first one (project)
    
    // Check if DeleteConfirmationModal title is shown
    expect(screen.getByText("Delete Project")).toBeDefined()
    expect(screen.getByText(/Are you sure you want to delete "Project 1"/i)).toBeDefined()
  })

  it("opens edit modal when edit is clicked", async () => {
    renderSidebar()
    
    // Find edit button in project actions
    const editButtons = screen.getAllByText("Edit")
    fireEvent.click(editButtons[0]) // Click first one (project)
    
    // Check if Edit Project modal title is shown
    expect(screen.getByText("Edit Project")).toBeDefined()
  })

  it("resets filter and shows toast when active project is deleted", async () => {
    renderSidebar()
    
    // 1. Click on Project 1 to make it active
    fireEvent.click(screen.getByText("Project 1"))
    
    // 2. Click delete on Project 1
    const deleteButtons = screen.getAllByText("Delete")
    fireEvent.click(deleteButtons[0])
    
    // 3. Confirm deletion
    const deleteModalButton = screen.getAllByRole("button", { name: "Delete" }).find(
      btn => !btn.closest('[data-testid="item-actions"]')
    )
    if (deleteModalButton) fireEvent.click(deleteModalButton)
    
    // 4. Verify toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Project deleted",
        variant: "success"
      }))
    })
  })
})
