import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi } from "vitest"
import type { GameProfile } from "@/lib/api"

// Shared scaffolding for the game-column hook tests. The mocks register at
// import time, so test files must import this module before the hook under
// test (whose own imports pull in the mocked modules).
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: vi.fn(),
  setGameProfileCache: vi.fn(),
}))

export function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

export const profile: GameProfile = {
  level: 1,
  xp: 10,
  xp_to_next_level: 100,
  hp: 50,
  max_hp: 50,
  gold: 5,
  str_stat: 0,
  int_stat: 0,
  con_stat: 0,
  per_stat: 0,
  unspent_stat_points: 0,
  game_class: null,
  avatar_config: {},
  xp_today: 10,
  gold_today: 5,
  retention: "forever",
}

export const SERVER_TIME = "2025-11-01T10:00:00Z"
