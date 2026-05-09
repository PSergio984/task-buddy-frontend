import { useQuery } from "@tanstack/react-query"
import { statsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function useStats() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.getOverview,
    enabled: !!user,
  })
}
