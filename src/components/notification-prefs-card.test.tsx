import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NotificationPrefsCard } from "./notification-prefs-card"
import type { NotificationPrefs } from "@/lib/api"

const putMutate = vi.fn()
const refetch = vi.fn()
const state = vi.hoisted(() => ({
  isOnline: true,
  data: undefined as NotificationPrefs | undefined,
  isPending: false,
  isError: false,
}))

vi.mock("@/hooks/useNotificationPrefs", () => ({
  useNotificationPrefs: () => ({
    data: state.data,
    isPending: state.isPending,
    isError: state.isError,
    refetch,
  }),
  useUpdateNotificationPrefs: () => ({ mutate: putMutate, isPending: false }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => state.isOnline,
}))

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

function prefsData(
  overrides: Partial<NotificationPrefs> = {}
): NotificationPrefs {
  return {
    prefs: {
      habit_reminder: { in_app: true, push: true, email: false },
      low_hp: { in_app: true, push: false, email: true },
    },
    quiet_hours: { start: "22:00", end: "08:00", timezone: "America/Chicago" },
    ...overrides,
  }
}

describe("NotificationPrefsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.isOnline = true
    state.isPending = false
    state.isError = false
    state.data = prefsData()
  })

  it("PUTs the whole object when a matrix cell toggles — defaulting unstored kinds", () => {
    render(<NotificationPrefsCard />)

    // streak_risk isn't in the server row — it renders the client defaults
    // ({in_app: true, push: true, email: false}) and the toggle flips push.
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Streak at risk Push" })
    )

    expect(putMutate).toHaveBeenCalledWith({
      prefs: {
        habit_reminder: { in_app: true, push: true, email: false },
        low_hp: { in_app: true, push: false, email: true },
        streak_risk: { in_app: true, push: false, email: false },
      },
      quiet_hours: {
        start: "22:00",
        end: "08:00",
        timezone: "America/Chicago",
      },
    })
  })

  it("flips a stored channel on its own kind", () => {
    render(<NotificationPrefsCard />)

    fireEvent.click(screen.getByRole("checkbox", { name: "Low HP Email" }))

    expect(putMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        prefs: expect.objectContaining({
          low_hp: { in_app: true, push: false, email: false },
        }),
      })
    )
  })

  it("PUTs the merged object when a quiet-hours boundary changes", () => {
    render(<NotificationPrefsCard />)

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "21:30" },
    })

    expect(putMutate).toHaveBeenCalledWith({
      ...prefsData(),
      quiet_hours: {
        start: "21:30",
        end: "08:00",
        timezone: "America/Chicago",
      },
    })
  })

  it("defaults quiet hours to 22:00–08:00 in the local timezone on a fresh row", () => {
    state.data = { prefs: {} } as unknown as NotificationPrefs
    render(<NotificationPrefsCard />)

    expect(screen.getByLabelText("From")).toHaveValue("22:00")
    expect(screen.getByLabelText("Until")).toHaveValue("08:00")
    expect(screen.getByLabelText("Timezone")).toHaveTextContent(LOCAL_TZ)
  })

  it("disables every write control while offline", () => {
    state.isOnline = false
    render(<NotificationPrefsCard />)

    expect(screen.getByRole("status")).toHaveTextContent(/offline/i)
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled()
    }
    expect(screen.getByLabelText("From")).toBeDisabled()
    expect(screen.getByLabelText("Until")).toBeDisabled()

    fireEvent.click(screen.getByRole("checkbox", { name: "Low HP Email" }))
    expect(putMutate).not.toHaveBeenCalled()
  })
})
