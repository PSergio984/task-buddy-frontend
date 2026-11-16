import { renderHook, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { useTasksViewModel } from "./useTasksViewModel"

const { mockTasks } = vi.hoisted(() => ({
  mockTasks: [
    {
      id: 1,
      user_id: 1,
      title: "Task 1",
      completed: false,
      priority: "HIGH" as const,
      created_at: "2026-11-01T10:00:00Z",
      updated_at: "2026-11-01T10:00:00Z",
    },
    {
      id: 2,
      user_id: 1,
      title: "Task 2",
      completed: true,
      priority: "LOW" as const,
      created_at: "2026-11-01T10:00:00Z",
      updated_at: "2026-11-01T10:00:00Z",
    },
  ],
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-123" }, logout: vi.fn() }),
}))

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    activeSidebarFilter: "all",
    activeStatus: "all",
    setActiveStatus: vi.fn(),
    activeTagId: null,
    selectedPriorities: [],
    setSelectedPriorities: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/hooks/useProjects", () => ({
  useProjects: () => ({ data: [] }),
}))

vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({ data: [] }),
}))

vi.mock("@/hooks/useTasks", () => ({
  useTasks: () => ({ data: mockTasks, isLoading: false, refetch: vi.fn() }),
  useUpdateTask: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useUpdateSubtask: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useDeleteSubtask: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useDetachTag: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}))

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({
    skipTaskCompletionConfirm: false,
    skipSubtaskCompletionConfirm: false,
    skipTagDetachmentConfirm: false,
    skipSubtaskDeletionConfirm: false,
    setPreference: vi.fn(),
  }),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useTasksViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage.clear()
  })

  it("exposes structured reactive state, mode switches, and tasks", () => {
    const { result } = renderHook(() => useTasksViewModel(), {
      wrapper: makeWrapper(),
    })

    expect(result.current.viewMode).toBe("grid")
    expect(result.current.tasks).toHaveLength(2)
    expect(result.current.sortedTasks).toHaveLength(2)
    expect(typeof result.current.handleToggleComplete).toBe("function")
    expect(typeof result.current.handleConfirmAction).toBe("function")

    act(() => {
      result.current.setViewMode("list")
    })
    expect(result.current.viewMode).toBe("list")
  })

  it("opens confirmation modal when completing a task without skip preference", async () => {
    const { result } = renderHook(() => useTasksViewModel(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      await result.current.handleToggleComplete(1)
    })

    expect(result.current.confirmData).toEqual({
      type: "task",
      id: 1,
      title: "Task 1",
      completed: true,
    })

    act(() => {
      result.current.closeConfirmModal()
    })
    expect(result.current.confirmData).toBeNull()
  })
})
