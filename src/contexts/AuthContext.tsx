import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"
import axios from "axios"
import {
  extractAccessToken,
  getAuthErrorMessage,
  normalizeAuthUser,
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  type AuthUser,
} from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  /** username field carries the email value — OAuth2 spec field name */
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (credentials: {
    username: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const TOKEN_STORAGE_KEY = "auth_token"
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

  const [token, setToken] = useState<string | null>(() => {
    return globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const nextUser = normalizeAuthUser(response.data)
      if (nextUser) {
        setUser(nextUser)
        globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
      }
      setError(null)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          // Token is invalid/expired
          setToken(null)
          setUser(null)
          globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY)
          globalThis.localStorage.removeItem(USER_STORAGE_KEY)
        } else {
          setError(err.response?.data?.detail || "Failed to refresh user profile")
        }
      } else {
        setError("Failed to refresh user profile")
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  // user is initialized synchronously from localStorage above to keep the
  // token/user initial states consistent and avoid transient authenticated
  // but empty-user states.
  // Then we refresh it on mount to ensure we have the latest data.
  useEffect(() => {
    if (token) {
      refreshUser()
    }
  }, []) // Only on mount

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      setLoading(true)
      setError(null)
      try {
        const body = new URLSearchParams()
        body.set("username", sanitizeUsername(credentials.username))
        body.set("password", sanitizePassword(credentials.password))

        const response = await axios.post(
          `${API_BASE_URL}/api/v1/users/token`,
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )
        const newToken = extractAccessToken(response.data)

        if (!newToken) {
          throw new Error("Login response did not include an access token.")
        }

        setToken(newToken)
        globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, newToken)

        const nextUser = normalizeAuthUser(response.data)
        if (!nextUser) {
          // Abort login if backend did not return a canonical user object
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
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/users/register`,
          {
            username: sanitizeUsername(credentials.username),
            email: sanitizeEmail(credentials.email),
            password: sanitizePassword(credentials.password),
          }
        )

        // Prefer canonical user data from the backend. Do not invent an id
        // client-side. If the registration response includes normalized user
        // data, persist it; otherwise, do not set a client-side user and
        // require the user to authenticate via the login flow.
        const nextUser = normalizeAuthUser(response.data)
        if (nextUser) {
          setUser(nextUser)
          globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
        }

        const newToken = extractAccessToken(response.data)
        if (newToken) {
          setToken(newToken)
          globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
        }
      } catch (err) {
        setError(getAuthErrorMessage(err, "Registration failed."))
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    if (token) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/users/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // Log the logout failure but continue with local state cleanup
        // to ensure the user is logged out on the client side.
        console.error("Logout request failed, cleaning up local session anyway.", err);
      }
    }
    setToken(null)
    setUser(null)
    setError(null)
    globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY)
    globalThis.localStorage.removeItem(USER_STORAGE_KEY)
  }, [token])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, loading, error, login, register, logout, refreshUser])

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

