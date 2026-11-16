import React from "react"
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTaskDetailViewModel } from "./useTaskDetailViewModel"
import { api } from "@/lib/api"

const navigateMock = vi.fn()
const toastMock = vi.fn()
const mockUpdateTask = vi.fn().mockResolvedValue({})
const mockDeleteTask = vi.fn().mockResolvedValue({})

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "101" }),
  useNavigate: () => navigateMock,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

vi.mock("@/hooks/useTasks", () => ({
  useUpdateTask: () => ({ mutateAsync: mockUpdateTask, isPending: false }),
  useDeleteTask: () => ({ mutateAsync: mockDeleteTask, isPending: false }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(["task", 101], {
    id: 101,
    title: "Detail Task",
    priority: "HIGH",
    completed: false,
    due_date: "2026-11-20T10:00:00Z",
    created_at: "2026-11-14T10:00:00Z",
  })
  return function Wrapper({
    children,
  }: {
    readonly children: React.ReactNode
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useTaskDetailViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        id: 101,
        title: "Detail Task",
        priority: "HIGH",
        completed: false,
        due_date: "2026-11-20T10:00:00Z",
        created_at: "2026-11-14T10:00:00Z",
      },
    })
  })

  it("parses task ID and provides formatted dates and priority styling", () => {
    const { result } = renderHook(() => useTaskDetailViewModel(), {
      wrapper: createWrapper(),
    })
    expect(result.current.taskId).toBe(101)
    expect(result.current.task?.title).toBe("Detail Task")
    expect(result.current.priorityColor).toContain("bg-destructive")
    expect(result.current.formattedDueDate).toContain("Nov 20, 2026")
  })

  it("triggers task completion toggle and deletion mutations", async () => {
    const { result } = renderHook(() => useTaskDetailViewModel(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.toggleCompleted()
    })
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 101,
      updates: { completed: true },
      silent: true,
    })

    await act(async () => {
      await result.current.deleteTask()
    })
    expect(mockDeleteTask).toHaveBeenCalledWith({ id: 101, silent: true })
    expect(navigateMock).toHaveBeenCalledWith("/tasks")
  })

  it("handles offline queued task deletion gracefully", async () => {
    mockDeleteTask.mockResolvedValueOnce({ queued: true })
    const { result } = renderHook(() => useTaskDetailViewModel(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.deleteTask()
    })
    expect(mockDeleteTask).toHaveBeenCalledWith({ id: 101, silent: true })
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Task deleted offline",
      })
    )
    expect(navigateMock).toHaveBeenCalledWith("/tasks")
  })

  it("handles navigation helpers", () => {
    const { result } = renderHook(() => useTaskDetailViewModel(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.goBack()
    })
    expect(navigateMock).toHaveBeenCalledWith(-1)

    act(() => {
      result.current.goToTasks()
    })
    expect(navigateMock).toHaveBeenCalledWith("/tasks")
  })
})
