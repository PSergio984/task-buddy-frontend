import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useDashboardViewModel } from "./useDashboardViewModel"

const refreshTasksMock = vi.fn().mockResolvedValue({})
const refreshStatsMock = vi.fn().mockResolvedValue({})
const handleEditTaskMock = vi.fn()

vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({ handleEditTask: handleEditTaskMock }),
}))

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    activeSidebarFilter: "project:42",
    activeTagId: null,
  }),
}))

vi.mock("@/hooks/useTasks", () => ({
  useTasks: (status?: string, projectId?: number, tagId?: string) => ({
    data: [{ id: 1, title: "Test task", project_id: projectId, tag_id: tagId }],
    isLoading: false,
    refetch: refreshTasksMock,
  }),
}))

vi.mock("@/hooks/useStats", () => ({
  useStats: () => ({
    data: { total: 1, completed: 0 },
    isLoading: false,
    refetch: refreshStatsMock,
  }),
}))

describe("useDashboardViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("extracts project filter and provides tasks and stats", () => {
    const { result } = renderHook(() => useDashboardViewModel())
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].project_id).toBe(42)
    expect(result.current.stats).toEqual({ total: 1, completed: 0 })
    expect(result.current.loadingTasks).toBe(false)
  })

  it("refreshes both tasks and stats on handleRefresh", async () => {
    const { result } = renderHook(() => useDashboardViewModel())
    await act(async () => {
      await result.current.handleRefresh()
    })
    expect(refreshTasksMock).toHaveBeenCalled()
    expect(refreshStatsMock).toHaveBeenCalled()
  })
})
