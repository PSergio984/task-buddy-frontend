import React from "react"
import { motion } from "framer-motion"
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
  type LucideIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AvatarCard } from "@/components/avatar-picker"
import { cn } from "@/lib/utils"
import { NotificationPrefsCard } from "@/components/notification-prefs-card"
import { Checkbox } from "@/components/ui/checkbox"
import { CharacterCounter } from "@/components/ui/character-counter"
import {
  useProfileViewModel,
  type ProfileViewModel,
} from "@/viewmodels/useProfileViewModel"
import type {
  PasswordRule,
  ConfirmationSettingItem,
} from "@/models/profile.model"

const CONFIRMATION_ICONS: Record<ConfirmationSettingItem["key"], LucideIcon> = {
  skipTaskCompletionConfirm: CheckSquare,
  skipSubtaskCompletionConfirm: CheckCircle2,
  skipTaskDeletionConfirm: Trash2,
  skipSubtaskDeletionConfirm: Trash2,
  skipTagDeletionConfirm: Tag,
  skipTagDetachmentConfirm: XCircle,
}

export function ProfilePage() {
  const navigate = useNavigate()
  const vm = useProfileViewModel()

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
              aria-label="Back to dashboard"
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
          <UsernameCard vm={vm.username} />
          <AvatarCard />
          <PreferencesCard vm={vm.preferences} />
          <NotificationPrefsCard />
          <ConfirmationPreferencesCard vm={vm.confirmations} />
          <SecurityCard vm={vm.security} />
        </div>
      </motion.div>
    </div>
  )
}

function ConfirmationPreferencesCard({
  vm,
}: Readonly<{
  vm: ProfileViewModel["confirmations"]
}>) {
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
        {vm.settings.map((setting) => {
          const Icon = CONFIRMATION_ICONS[setting.key]
          const isSkip = vm.userPreferences[setting.key]

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
                      vm.userPreferences.setPreference(setting.key, !checked)
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

function PreferencesCard({
  vm,
}: Readonly<{
  vm: ProfileViewModel["preferences"]
}>) {
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
                onClick={() => vm.setTimeFormat(format)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                  vm.timeFormat === format
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
                disabled={vm.isRegisteringPush || vm.isLoadingVapid}
                onClick={() => vm.togglePush(enabled)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                  vm.pushEnabled === enabled
                    ? "scale-100 bg-background text-foreground shadow-lg"
                    : "scale-95 text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  (vm.isRegisteringPush || vm.isLoadingVapid) &&
                    "cursor-not-allowed opacity-50"
                )}
              >
                {(() => {
                  if (!enabled) return "Disabled"
                  if (vm.isRegisteringPush) return "Enabling..."
                  if (vm.isLoadingVapid) return "Loading..."
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

function UsernameCard({
  vm,
}: Readonly<{
  vm: ProfileViewModel["username"]
}>) {
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

      <form onSubmit={vm.update} className="space-y-6">
        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between">
            <Label htmlFor="username" className="text-sm font-semibold">
              Username
            </Label>
            <CharacterCounter
              current={vm.effectiveUsername.length}
              limit={50}
            />
          </div>
          <div className="group relative">
            <BadgeCheck className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />
            <Input
              id="username"
              value={vm.effectiveUsername}
              onChange={(e) => vm.setDraft(e.target.value)}
              maxLength={50}
              placeholder="Enter your username"
              className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg focus-visible:ring-accent/30"
            />
          </div>
          {vm.validation.error && (
            <p className="px-2 text-[10px] font-bold text-destructive">
              {vm.validation.error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={vm.isUpdating || !vm.hasChanged}
            className={cn(
              "h-12 rounded-xl px-8 font-bold shadow-lg transition-all",
              vm.hasChanged
                ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]"
                : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 shadow-none"
            )}
          >
            {vm.isUpdating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
              />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {vm.isUpdating ? "Updating..." : "Save Changes"}
          </Button>
          {vm.hasChanged && (
            <Button
              type="button"
              variant="ghost"
              disabled={vm.isUpdating}
              onClick={vm.cancel}
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

function SecurityCard({
  vm,
}: Readonly<{
  vm: ProfileViewModel["security"]
}>) {
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

      <form onSubmit={vm.update} className="space-y-6">
        <div className="grid gap-6">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={vm.currentPassword}
            onChange={vm.setCurrentPassword}
            show={vm.showCurrentPassword}
            onToggleShow={() =>
              vm.setShowCurrentPassword(!vm.showCurrentPassword)
            }
          />

          <div className="space-y-2">
            <PasswordField
              id="new-password"
              label="New Password"
              value={vm.newPassword}
              onChange={vm.setNewPassword}
              show={vm.showNewPassword}
              onToggleShow={() => vm.setShowNewPassword(!vm.showNewPassword)}
            />
            <PasswordRules password={vm.newPassword} rules={vm.passwordRules} />
          </div>

          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={vm.confirmPassword}
            onChange={vm.setConfirmPassword}
            show={vm.showConfirmPassword}
            onToggleShow={() =>
              vm.setShowConfirmPassword(!vm.showConfirmPassword)
            }
          />
        </div>

        <Button
          type="submit"
          disabled={
            vm.isUpdating ||
            !vm.newPassword ||
            vm.newPassword !== vm.confirmPassword
          }
          className="h-12 rounded-xl bg-accent px-8 font-bold shadow-lg shadow-accent/10 hover:bg-accent/90"
        >
          {vm.isUpdating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
            />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          {vm.isUpdating ? "Updating..." : "Update Password"}
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

function PasswordRules({
  password,
  rules,
}: Readonly<{
  password: string
  rules: readonly PasswordRule[]
}>) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-1">
      {rules.map((rule) => {
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
