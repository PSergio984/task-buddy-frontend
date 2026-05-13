import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SidebarItemActions } from "./item-actions"
import React from "react"

// Mock Radix UI DropdownMenu to avoid complex hook/portal issues in Vitest
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div onClick={onClick} className={className} data-testid="dropdown-item">
      {children}
    </div>
  ),
}))

describe("SidebarItemActions", () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the ellipsis trigger", () => {
    render(<SidebarItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByRole('button', { name: /open actions/i })).toBeInTheDocument()
  })

  it("calls onEdit when Edit option is clicked", async () => {
    const user = userEvent.setup()
    render(<SidebarItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />)

    // In our mock, content is always rendered or we can just find it
    const editButton = await screen.findByText("Edit")
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onDelete when Delete option is clicked", async () => {
    const user = userEvent.setup()
    render(<SidebarItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />)

    const deleteButton = await screen.findByText("Delete")
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it("stops event propagation on trigger click", async () => {
    const user = userEvent.setup()
    const parentClick = vi.fn()
    render(
      <div onClick={parentClick}>
        <SidebarItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />
      </div>
    )

    await user.click(screen.getByRole('button', { name: /open actions/i }))
    expect(parentClick).not.toHaveBeenCalled()
  })
})
