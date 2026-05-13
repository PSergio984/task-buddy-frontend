import React, { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { useSettings } from "@/contexts/SettingsContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  User, KeyRound, Save, ArrowLeft, CheckCircle2, 
  Circle, ShieldCheck, BadgeCheck, Eye, EyeOff, 
  Settings2, Clock, Bell
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { sanitizeUsername, sanitizePassword, validatePassword } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import axios from "axios"
import { useRegisterPush, useVapidKey } from "@/hooks/useNotifications"

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

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

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

        <div className="grid gap-12">
          <UsernameCard />
          <PreferencesCard />
          <SecurityCard />
        </div>
      </motion.div>
    </div>
  )
}

function PreferencesCard() {
  const { timeFormat, setTimeFormat } = useSettings()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const { toast } = useToast()
  
  const { data: vapidData, isLoading: isLoadingVapid } = useVapidKey()
  const registerPush = useRegisterPush()

  React.useEffect(() => {
    const checkPermission = async () => {
      if ("Notification" in window && "serviceWorker" in navigator) {
        if (Notification.permission === "granted") {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setPushEnabled(!!subscription)
        } else {
          setPushEnabled(false)
        }
      }
    }
    checkPermission()
  }, [])

  const handleTogglePush = async (enabled: boolean) => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast({
        title: "Not supported",
        description: "Your browser does not support push notifications.",
        variant: "destructive",
      })
      return
    }

    if (enabled) {
      setIsRegistering(true)
      try {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          toast({
            title: "Permission denied",
            description: "You need to allow notifications to enable this feature.",
            variant: "destructive",
          })
          setPushEnabled(false)
          return
        }

        if (!vapidData?.public_key) {
          throw new Error("Push notification service is temporarily unavailable. Please try again in a few moments.")
        }

        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Service worker initialization timed out. Please refresh the page.")), 10000)
          )
        ]) as ServiceWorkerRegistration
        
        // Unsubscribe existing if any to be safe
        const existingSubscription = await registration.pushManager.getSubscription()
        if (existingSubscription) {
          await existingSubscription.unsubscribe()
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.public_key),
        })

        const sub = subscription.toJSON()
        await registerPush.mutateAsync({
          endpoint: sub.endpoint!,
          p256dh: sub.keys!.p256dh,
          auth: sub.keys!.auth,
        })
        
        setPushEnabled(true)
        toast({
          title: "Push enabled",
          description: "You will now receive notifications in this browser.",
          variant: "success",
        })
      } catch (err) {
        console.error("Failed to subscribe to push notifications:", err)
        setPushEnabled(false)
        toast({
          title: "Setup failed",
          description: "Could not register for push notifications.",
          variant: "destructive",
        })
      } finally {
        setIsRegistering(false)
      }
    } else {
      // Disabling
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
        setPushEnabled(false)
        toast({
          title: "Push disabled",
          description: "You will no longer receive notifications in this browser.",
        })
      } catch (err) {
        console.error("Failed to unsubscribe from push notifications:", err)
      }
    }
  }

  return (
    <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2rem]">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Settings2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Preferences</h2>
          <p className="text-sm text-muted-foreground">Customize your workspace experience.</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Time Display Format</Label>
          </div>
          
          <div className="flex p-1.5 bg-muted/30 rounded-2xl w-fit">
            {(["12h", "24h"] as const).map((format) => (
              <button
                key={format}
                onClick={() => setTimeFormat(format)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  timeFormat === format 
                    ? "bg-background text-foreground shadow-lg scale-100" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95"
                )}
              >
                {format === "12h" ? "12-Hour (AM/PM)" : "24-Hour"}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">
            Affects timestamps in activity logs and task due dates.
          </p>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Push Notifications</Label>
          </div>
          
          <div className="flex p-1.5 bg-muted/30 rounded-2xl w-fit">
            {([true, false] as const).map((enabled) => (
              <button
                key={enabled ? "on" : "off"}
                disabled={isRegistering || isLoadingVapid}
                onClick={() => handleTogglePush(enabled)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  pushEnabled === enabled 
                    ? "bg-background text-foreground shadow-lg scale-100" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95",
                  (isRegistering || isLoadingVapid) && "opacity-50 cursor-not-allowed"
                )}
              >
                {enabled ? (isRegistering ? "Enabling..." : (isLoadingVapid ? "Loading..." : "Enabled")) : "Disabled"}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">
            Receive browser notifications for upcoming and overdue tasks.
          </p>
        </div>
      </div>
    </Card>
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

  const handleUpdateUsername = async (e: React.FormEvent) => {
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
        variant: "success",
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
        <div className="flex items-center gap-3">
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
          {hasUsernameChanged && (
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdatingUsername}
              onClick={() => setNewUsername(user?.username ?? "")}
              className="h-12 px-6 rounded-xl font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </Button>
          )}
        </div>
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
        variant: "success",
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
