import {
  createContext,
  useContext,
  useState,
  useCallback,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const s = localStorage.getItem(USER_STORAGE_KEY)
    if (!s) return null
    try {
      return JSON.parse(s) as AuthUser
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY)
      return null
    }
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // user is initialized synchronously from localStorage above to keep the
  // token/user initial states consistent and avoid transient authenticated
  // but empty-user states.

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
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken)

        const nextUser = normalizeAuthUser(response.data)
        if (!nextUser) {
          // Abort login if backend did not return a canonical user object
          throw new Error(
            "Login succeeded but user data is missing from the response."
          )
        }
        setUser(nextUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
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
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
        }

        const newToken = extractAccessToken(response.data)
        if (newToken) {
          setToken(newToken)
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
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

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const nextUser = normalizeAuthUser(response.data)
      if (nextUser) {
        setUser(nextUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err)
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
