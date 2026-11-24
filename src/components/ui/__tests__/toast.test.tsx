import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast"

describe("Toast component Apple-grade floating tokens", () => {
  it("renders default toast with rounded-[16px] and card elevation", () => {
    render(
      <ToastProvider>
        <Toast data-testid="toast-root">
          <ToastTitle>Notification</ToastTitle>
          <ToastDescription>Task updated</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toast = screen.getByTestId("toast-root")
    expect(toast).toHaveClass("rounded-[16px]")
    expect(toast).toHaveClass("shadow-lg")
  })

  it("renders destructive variant with WCAG AAA warm salmon chip (#FFD8D2 and #7F1D1D)", () => {
    render(
      <ToastProvider>
        <Toast variant="destructive" data-testid="toast-destructive">
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Sync failed</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toast = screen.getByTestId("toast-destructive")
    expect(toast).toBeInTheDocument()
    const iconContainer = toast.querySelector(".rounded-xl")
    expect(iconContainer).toHaveClass("bg-[#FFD8D2]")
    expect(iconContainer).toHaveClass("text-[#7F1D1D]")
  })

  it("renders success variant with appropriate status icon and elevation", () => {
    render(
      <ToastProvider>
        <Toast variant="success" data-testid="toast-success">
          <ToastTitle>Saved</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toast = screen.getByTestId("toast-success")
    expect(toast).toBeInTheDocument()
    const iconContainer = toast.querySelector(".rounded-xl")
    expect(iconContainer).toBeInTheDocument()
  })
})
