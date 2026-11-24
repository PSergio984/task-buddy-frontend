import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MainLayout } from "../main-layout"

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Preston S." },
    logout: vi.fn(),
  }),
}))

vi.mock("@/contexts/SyncContext", () => ({
  useSync: () => ({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    conflictCount: 0,
  }),
}))

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ notifications: [], unreadCount: 0 }),
  useMarkAllRead: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/hooks/useStats", () => ({
  useStats: () => ({ data: { task_stats: { total_tasks: 5 } } }),
}))

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    activeSidebarFilter: "all",
    setFilter: vi.fn(),
  }),
}))

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
  }),
}))

vi.mock("@/contexts/FocusSessionContext", () => ({
  useFocusSession: () => ({
    session: null,
    view: null,
    isLocal: false,
    mirrored: false,
  }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

describe("MainLayout Integration with FloatingSidebar", () => {
  it("renders the FloatingSidebar with brand and view navigation", () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/tasks"]}>
          <MainLayout />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const sidebar = screen.getByTestId("floating-sidebar")
    expect(sidebar).toBeInTheDocument()
    expect(within(sidebar).getByText("TASK BUDDY")).toBeInTheDocument()
    expect(within(sidebar).getByText("PRO")).toBeInTheDocument()
    expect(within(sidebar).getByText("Focus")).toBeInTheDocument()
    expect(within(sidebar).getByText("Tasks")).toBeInTheDocument()
  })

  it("renders the main island container and navigation views", () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/focus"]}>
          <MainLayout />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const focusBtn = screen.getByRole("button", { name: /Focus/i })
    expect(focusBtn).toBeInTheDocument()
    fireEvent.click(focusBtn)
  })
})
