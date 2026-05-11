import React, { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User, KeyRound, Save, ArrowLeft, CheckCircle2, Circle, ShieldCheck, BadgeCheck, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { sanitizeUsername, sanitizePassword, validatePassword } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import axios from "axios"

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { detail?: string })?.detail || err.message
  }
  return err instanceof Error ? err.message : "An unexpected error occurred"
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
  { label: "One special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export function ProfilePage() {
  const navigate = useNavigate()
  
  return (
    <div className="p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-3xl space-y-12"
      >
        <header className="space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-heading text-4xl font-bold tracking-tight">Account Settings</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Manage your profile information and security preferences.
          </p>
        </header>

        <div className="grid gap-8">
          <UsernameCard />
          <SecurityCard />
        </div>
      </motion.div>
    </div>
  )
}

function UsernameCard() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const [newUsername, setNewUsername] = useState("")
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Sync state when user data arrives
  if (user && !isInitialized) {
    setNewUsername(user.username || "")
    setIsInitialized(true)
  }

  const isUsernameValid = newUsername.trim().length > 0 && /^[A-Za-z0-9._@\- ]+$/.test(newUsername)
  const hasUsernameChanged = user && newUsername !== user.username && isUsernameValid

  const handleUpdateUsername = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!hasUsernameChanged) return
    
    setIsUpdatingUsername(true)
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/users/me/username`,
        { username: sanitizeUsername(newUsername) },
        { withCredentials: true }
      )
      await refreshUser()
      toast({
        title: "Username updated",
        description: "Your display name has been changed successfully.",
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      
      toast({
        title: "Update failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  return (
    <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2rem]">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Public Profile</h2>
          <p className="text-sm text-muted-foreground">How you appear to others.</p>
        </div>
      </div>

      <form onSubmit={handleUpdateUsername} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-semibold ml-1">Username</Label>
          <div className="relative group">
            <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-accent" />
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your username"
              className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg focus-visible:ring-accent/30"
            />
          </div>
          {(!newUsername || newUsername.trim().length === 0) && (
            <p className="text-[10px] font-bold text-destructive px-2">Username cannot be empty</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isUpdatingUsername || !hasUsernameChanged}
          className={cn(
            "h-12 px-8 rounded-xl font-bold shadow-lg transition-all",
            hasUsernameChanged
              ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]" 
              : "bg-muted text-muted-foreground shadow-none cursor-not-allowed opacity-50"
          )}
        >
          {isUpdatingUsername ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isUpdatingUsername ? "Updating..." : "Save Changes"}
        </Button>
      </form>
    </Card>
  )
}

function SecurityCard() {
  const { logout } = useAuth()
  const { toast } = useToast()
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleUpdatePassword = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "The new password and confirmation password do not match.",
        variant: "destructive",
      })
      return
    }

    const pwError = validatePassword(newPassword)
    if (pwError) {
      toast({
        title: "Weak password",
        description: pwError,
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
        { withCredentials: true }
      )
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Password updated",
        description: "Your account password has been changed securely.",
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      
      toast({
        title: "Update failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2rem]">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Security</h2>
          <p className="text-sm text-muted-foreground">Keep your account safe and secure.</p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <div className="grid gap-6">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
          />
          
          <div className="space-y-2">
            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggleShow={() => setShowNewPassword(!showNewPassword)}
            />
            <PasswordRules password={newPassword} />
          </div>

          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>

        <Button
          type="submit"
          disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}
          className="h-12 px-8 rounded-xl font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/10"
        >
          {isUpdatingPassword ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          {isUpdatingPassword ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Card>
  )
}

interface PasswordFieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (val: string) => void
  readonly show: boolean
  readonly onToggleShow: () => void
}

function PasswordField({ id, label, value, onChange, show, onToggleShow }: Readonly<PasswordFieldProps>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold ml-1">{label}</Label>
      <div className="relative group">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="h-14 rounded-2xl border-border bg-background/50 px-6 pr-12 text-lg focus-visible:ring-accent/30"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}

function PasswordRules({ password }: Readonly<{ password: string }>) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)
        return (
          <div key={rule.label} className="flex items-center gap-2">
            {met ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/30" />
            )}
            <span className={cn("text-xs font-medium", met ? "text-green-600" : "text-muted-foreground")}>
              {rule.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

