import React, { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { useSettings } from "@/contexts/SettingsContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  User,
  KeyRound,
  Save,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ShieldCheck,
  BadgeCheck,
  Eye,
  EyeOff,
  Settings2,
  Clock,
  Bell,
  HelpCircle,
  AlertTriangle,
  CheckSquare,
  Trash2,
  Tag,
  XCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  sanitizeUsername,
  sanitizePassword,
  validatePassword,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import axios from "axios"
import { useRegisterPush, useVapidKey } from "@/hooks/useNotifications"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { CharacterCounter } from "@/components/ui/character-counter"

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data

    // Handle Pydantic validation errors (array of errors)
    if (data && typeof data === "object" && "detail" in data) {
      const detail = data.detail
      if (Array.isArray(detail)) {
        // Extract the first human-readable error message
        return detail.map((e) => e.msg).join(", ") || "Invalid input data"
      }
      if (typeof detail === "string") {
        return detail
      }
    }

    return err.message
  }
  return err instanceof Error ? err.message : "An unexpected error occurred"
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
  {
    label: "One special character",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
]

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replaceAll("-", "+")
    .replaceAll("_", "/")
  const rawData = globalThis.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.codePointAt(i) ?? 0
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
            <h1 className="font-heading text-4xl font-bold tracking-tight">
              Account Settings
            </h1>
          </div>
          <p className="ml-14 text-muted-foreground">
            Manage your profile information and security preferences.
          </p>
        </header>

        <div className="grid gap-12">
          <UsernameCard />
          <PreferencesCard />
          <ConfirmationPreferencesCard />
          <SecurityCard />
        </div>
      </motion.div>
    </div>
  )
}

function ConfirmationPreferencesCard() {
  const { user } = useAuth()
  const preferences = useUserPreferences(user?.id ?? "default")

  const confirmationSettings = [
    {
      key: "skipTaskCompletionConfirm",
      label: "Task Completion",
      description: "Confirm before marking a major task as finished.",
      icon: CheckSquare,
      destructive: false,
    },
    {
      key: "skipSubtaskCompletionConfirm",
      label: "Subtask Completion",
      description: "Confirm before marking subtasks as complete.",
      icon: CheckCircle2,
      destructive: false,
    },
    {
      key: "skipTaskDeletionConfirm",
      label: "Task Deletion",
      description: "Ask for confirmation before permanently deleting a task.",
      icon: Trash2,
      destructive: true,
    },
    {
      key: "skipSubtaskDeletionConfirm",
      label: "Subtask Deletion",
      description: "Ask for confirmation before removing a subtask.",
      icon: Trash2,
      destructive: true,
    },
    {
      key: "skipTagDeletionConfirm",
      label: "Tag Deletion",
      description: "Confirm before deleting a tag from the system.",
      icon: Tag,
      destructive: true,
    },
    {
      key: "skipTagDetachmentConfirm",
      label: "Tag Removal",
      description: "Confirm before removing a tag from a specific task.",
      icon: XCircle,
      destructive: false,
    },
  ] as const

  return (
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <HelpCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Confirmation Prompts</h2>
          <p className="text-sm text-muted-foreground">
            Control which actions require a second look.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {confirmationSettings.map((setting) => {
          const Icon = setting.icon
          const isSkip = preferences[setting.key]

          return (
            <div
              key={setting.key}
              className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  setting.destructive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={setting.key}
                    className="cursor-pointer text-sm font-bold tracking-tight"
                  >
                    {setting.label}
                  </label>
                  <Checkbox
                    id={setting.key}
                    checked={!isSkip}
                    onCheckedChange={(checked) => {
                      preferences.setPreference(setting.key, !checked)
                    }}
                    className="h-5 w-5 rounded-lg border-2"
                  />
                </div>
                <p className="text-[10px] leading-relaxed font-medium text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 px-2 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-[10px] font-bold tracking-widest text-amber-600/80 uppercase">
          Disabling confirmations will execute actions immediately. Use with
          caution.
        </p>
      </div>
    </Card>
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
      if (
        "Notification" in globalThis &&
        "serviceWorker" in globalThis.navigator
      ) {
        if (globalThis.Notification.permission === "granted") {
          const registration = await globalThis.navigator.serviceWorker.ready
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
    if (
      !("Notification" in globalThis) ||
      !("serviceWorker" in globalThis.navigator)
    ) {
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
        const permission = await globalThis.Notification.requestPermission()
        if (permission !== "granted") {
          toast({
            title: "Permission denied",
            description:
              "You need to allow notifications to enable this feature.",
            variant: "destructive",
          })
          setPushEnabled(false)
          return
        }

        if (!vapidData?.public_key) {
          throw new Error(
            "Push notification service is temporarily unavailable. Please try again in a few moments."
          )
        }

        const registration = (await Promise.race([
          globalThis.navigator.serviceWorker.ready,
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Service worker initialization timed out. Please refresh the page."
                  )
                ),
              10000
            )
          ),
        ])) as ServiceWorkerRegistration

        // Unsubscribe existing if any to be safe
        const existingSubscription =
          await registration.pushManager.getSubscription()
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

        let description = "Could not register for push notifications."
        if (
          err instanceof Error &&
          err.message.includes("push service error")
        ) {
          description =
            "Your browser's push service is unavailable. If using Brave, enable 'Use Google Services for Push Messaging' in Privacy settings."
        }

        toast({
          title: "Setup failed",
          description,
          variant: "destructive",
        })
      } finally {
        setIsRegistering(false)
      }
    } else {
      // Disabling
      try {
        const registration = await globalThis.navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
        setPushEnabled(false)
        toast({
          title: "Push disabled",
          description:
            "You will no longer receive notifications in this browser.",
        })
      } catch (err) {
        console.error("Failed to unsubscribe from push notifications:", err)
      }
    }
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Settings2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Customize your workspace experience.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="ml-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Time Display Format</Label>
          </div>

          <div className="flex w-fit rounded-2xl bg-muted/30 p-1.5">
            {(["12h", "24h"] as const).map((format) => (
              <button
                key={format}
                onClick={() => setTimeFormat(format)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                  timeFormat === format
                    ? "scale-100 bg-background text-foreground shadow-lg"
                    : "scale-95 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {format === "12h" ? "12-Hour (AM/PM)" : "24-Hour"}
              </button>
            ))}
          </div>
          <p className="ml-1 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
            Affects timestamps in activity logs and task due dates.
          </p>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-4">
          <div className="ml-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Push Notifications</Label>
          </div>

          <div className="flex w-fit rounded-2xl bg-muted/30 p-1.5">
            {([true, false] as const).map((enabled) => (
              <button
                key={enabled ? "on" : "off"}
                disabled={isRegistering || isLoadingVapid}
                onClick={() => handleTogglePush(enabled)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                  pushEnabled === enabled
                    ? "scale-100 bg-background text-foreground shadow-lg"
                    : "scale-95 text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  (isRegistering || isLoadingVapid) &&
                    "cursor-not-allowed opacity-50"
                )}
              >
                {(() => {
                  if (!enabled) return "Disabled"
                  if (isRegistering) return "Enabling..."
                  if (isLoadingVapid) return "Loading..."
                  return "Enabled"
                })()}
              </button>
            ))}
          </div>
          <p className="ml-1 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
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
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)

  const effectiveUsername = usernameDraft ?? user?.username ?? ""
  const trimmedUsername = effectiveUsername.trim()
  const isUsernameLongEnough = trimmedUsername.length >= 3
  const isUsernameFormatValid = /^[A-Za-z0-9._@\- ]+$/.test(effectiveUsername)
  const isUsernameValid = isUsernameLongEnough && isUsernameFormatValid
  const hasUsernameChanged =
    Boolean(user) && trimmedUsername !== user?.username && isUsernameValid

  const handleUpdateUsername = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    if (!isUsernameValid || !hasUsernameChanged) return

    setIsUpdatingUsername(true)
    try {
      const sanitized = sanitizeUsername(trimmedUsername)
      await axios.patch(
        `${API_BASE_URL}/api/v1/users/me/username`,
        { username: sanitized },
        { withCredentials: true }
      )
      await refreshUser()
      setUsernameDraft(null)
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
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Public Profile</h2>
          <p className="text-sm text-muted-foreground">
            How you appear to others.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdateUsername} className="space-y-6">
        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between">
            <Label htmlFor="username" className="text-sm font-semibold">
              Username
            </Label>
            <CharacterCounter current={effectiveUsername.length} limit={50} />
          </div>
          <div className="group relative">
            <BadgeCheck className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />
            <Input
              id="username"
              value={effectiveUsername}
              onChange={(e) => setUsernameDraft(e.target.value)}
              maxLength={50}
              placeholder="Enter your username"
              className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg focus-visible:ring-accent/30"
            />
          </div>
          {!effectiveUsername || effectiveUsername.trim().length === 0 ? (
            <p className="px-2 text-[10px] font-bold text-destructive">
              Username cannot be empty
            </p>
          ) : !isUsernameLongEnough ? (
            <p className="px-2 text-[10px] font-bold text-destructive">
              Username must be at least 3 characters
            </p>
          ) : !isUsernameFormatValid ? (
            <p className="px-2 text-[10px] font-bold text-destructive">
              Invalid characters in username
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isUpdatingUsername || !hasUsernameChanged}
            className={cn(
              "h-12 rounded-xl px-8 font-bold shadow-lg transition-all",
              hasUsernameChanged
                ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]"
                : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 shadow-none"
            )}
          >
            {isUpdatingUsername ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
              />
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
              onClick={() => setUsernameDraft(null)}
              className="h-12 rounded-xl px-6 font-bold text-muted-foreground transition-all hover:text-foreground"
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

  const handleUpdatePassword = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
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
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Security</h2>
          <p className="text-sm text-muted-foreground">
            Keep your account safe and secure.
          </p>
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
          disabled={
            isUpdatingPassword ||
            !newPassword ||
            newPassword !== confirmPassword
          }
          className="h-12 rounded-xl bg-accent px-8 font-bold shadow-lg shadow-accent/10 hover:bg-accent/90"
        >
          {isUpdatingPassword ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
            />
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: Readonly<PasswordFieldProps>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="ml-1 text-sm font-semibold">
        {label}
      </Label>
      <div className="group relative">
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
          className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
            <span
              className={cn(
                "text-xs font-medium",
                met ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {rule.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
