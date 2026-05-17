import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"
import { api } from "@/lib/api"
import axios from "axios"
import { queryClient } from "@/lib/query-client"
import {
  getAuthErrorMessage,
  normalizeAuthUser,
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  type AuthUser,
} from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  /** username field carries the email value — OAuth2 spec field name */
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (credentials: {
    username: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_STORAGE_KEY = "auth_user"

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const s = globalThis.localStorage.getItem(USER_STORAGE_KEY)
    if (!s) return null
    try {
      return JSON.parse(s) as AuthUser
    } catch {
      globalThis.localStorage.removeItem(USER_STORAGE_KEY)
      return null
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    await Promise.resolve()
    try {
      await api.post("/api/v1/users/logout", {})
    } catch (err) {
      console.error("Logout request failed, cleaning up local session anyway.", err)
    }
    setUser(null)
    setError(null)
    globalThis.localStorage.removeItem(USER_STORAGE_KEY)
    queryClient.clear()
  }, [])

  const refreshUser = useCallback(async () => {
    await Promise.resolve()
    try {
      const response = await api.get("/api/v1/users/me")
      const nextUser = normalizeAuthUser(response.data)
      if (nextUser) {
        setUser(nextUser)
        globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
      }
      setError(null)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          // Token is invalid/expired or not present
          setUser(null)
          globalThis.localStorage.removeItem(USER_STORAGE_KEY)
        } else {
          setError((err.response?.data as { detail?: string })?.detail || "Failed to refresh user profile")
        }
      } else {
        setError("Failed to refresh user profile")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount, attempt to refresh the user and listen for unauthorized events
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()

    const handleUnauthorized = () => {
      logout()
    }

    globalThis.addEventListener("auth:unauthorized", handleUnauthorized)
    return () => {
      globalThis.removeEventListener("auth:unauthorized", handleUnauthorized)
    }
  }, [refreshUser, logout])

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      setLoading(true)
      setError(null)
      try {
        const body = new URLSearchParams()
        body.set("username", sanitizeUsername(credentials.username))
        body.set("password", sanitizePassword(credentials.password))

        const response = await api.post(
          "/api/v1/users/token",
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )
        
        // Backend now sets the HttpOnly cookie automatically.
        // We just need to normalize the user data from the response.
        const nextUser = normalizeAuthUser(response.data)
        if (!nextUser) {
          throw new Error(
            "Login succeeded but user data is missing from the response."
          )
        }
        setUser(nextUser)
        globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
      } catch (err) {
        setError(getAuthErrorMessage(err, "Login failed."))
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const register = useCallback(
    async (credentials: {
      username: string
      email: string
      password: string
    }) => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.post(
          "/api/v1/users/register",
          {
            username: sanitizeUsername(credentials.username),
            email: sanitizeEmail(credentials.email),
            password: sanitizePassword(credentials.password),
          }
        )

        const nextUser = normalizeAuthUser(response.data)
        if (nextUser) {
          setUser(nextUser)
          globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
        }
        setError(null)
        } catch (err) {
        setError(getAuthErrorMessage(err, "Registration failed."))
        throw err
        } finally {
        setLoading(false)
        }
        },
        []
        )
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  }), [user, loading, error, login, register, logout, refreshUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
