import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SidebarItemActions } from "./item-actions"


describe("SidebarItemActions", () => {
  it("renders the ellipsis trigger", () => {
    render(<SidebarItemActions onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole("button", { name: /more actions/i })).toBeDefined()
  })

  it("calls onEdit when Edit option is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<SidebarItemActions onEdit={onEdit} onDelete={vi.fn()} />)
    
    const trigger = screen.getByRole("button", { name: /more actions/i })
    await user.click(trigger)
    
    const editOption = await screen.findByRole("menuitem", { name: /edit/i })
    await user.click(editOption)
    
    expect(onEdit).toHaveBeenCalled()
  })

  it("calls onDelete when Delete option is clicked", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<SidebarItemActions onEdit={vi.fn()} onDelete={onDelete} />)
    
    const trigger = screen.getByRole("button", { name: /more actions/i })
    await user.click(trigger)
    
    const deleteOption = await screen.findByRole("menuitem", { name: /delete/i })
    await user.click(deleteOption)
    
    expect(onDelete).toHaveBeenCalled()
  })
})
