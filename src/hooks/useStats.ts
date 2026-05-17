import { useQuery } from "@tanstack/react-query"
import { statsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function useStats() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["stats", { userId: user?.id }],
    queryFn: statsApi.getOverview,
    enabled: !!user,
  })
}
