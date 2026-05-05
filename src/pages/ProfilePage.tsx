import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { TopNav } from "@/components/topnav"
import { Sidebar } from "@/components/sidebar"
import { useTasks } from "@/hooks/useApi"
import { User, KeyRound, Save, ArrowLeft, CheckCircle2, Circle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { sanitizeUsername, sanitizePassword } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
  { label: "One special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export function ProfilePage() {
  const { user, token, refreshUser } = useAuth()
  const { toast } = useToast()
  const { tasks } = useTasks()
  const navigate = useNavigate()
  
  const [newUsername, setNewUsername] = useState(user?.username || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdateUsername = async (e: FormEvent) => {
    e.preventDefault()
    if (!newUsername || newUsername === user?.username) return
    
    setIsUpdatingUsername(true)
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/users/me/username`,
        { username: sanitizeUsername(newUsername) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await refreshUser()
      toast({
        title: "Username updated",
        description: "Your display name has been changed successfully.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.response?.data?.detail || "Failed to update username",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "The new password and confirmation password do not match.",
        variant: "destructive",
      })
      return
    }
    
    setIsUpdatingPassword(true)
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/users/me/password`,
        {
          current_password: sanitizePassword(currentPassword),
          new_password: sanitizePassword(newPassword),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Password updated",
        description: "Your account password has been changed securely.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.response?.data?.detail || "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopNav onNewTask={() => navigate("/dashboard")} />
      
      <div className="flex flex-1">
        <Sidebar activeFilter="" onFilterChange={() => navigate("/dashboard")} tasks={tasks} />
        
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl space-y-8"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            </div>

            {/* Username Section */}
            <Card className="border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Username</h2>
                  <p className="text-sm text-muted-foreground">Update your display name</p>
                </div>
              </div>

              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="border-border bg-muted/50 text-foreground focus-visible:ring-ring/40"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingUsername || newUsername === user?.username}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingUsername ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Card>

            {/* Password Section */}
            <Card className="border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Password</h2>
                  <p className="text-sm text-muted-foreground">Change your account password</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-foreground">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="border-border bg-muted/50 text-foreground focus-visible:ring-ring/40"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-border bg-muted/50 text-foreground focus-visible:ring-ring/40"
                      required
                    />
                    
                    {/* Password Rules UI */}
                    <div className="mt-3 space-y-1.5">
                      {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(newPassword)
                        return (
                          <div key={rule.label} className="flex items-center gap-2">
                            {met ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/30" />
                            )}
                            <span className={`text-xs ${met ? "text-green-600" : "text-muted-foreground"}`}>
                              {rule.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-border bg-muted/50 text-foreground focus-visible:ring-ring/40"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
