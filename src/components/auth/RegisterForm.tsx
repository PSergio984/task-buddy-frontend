import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  User,
} from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
} from "@/models/auth.model"
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"
import { CharacterCounter } from "../ui/character-counter"
import { useRegisterViewModel } from "@/viewmodels/useRegisterViewModel"

export function RegisterForm() {
  const vm = useRegisterViewModel()

  const getSubmitButtonContent = () => {
    if (vm.loading) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-6 w-6 rounded-full border-2 border-primary-foreground border-t-transparent"
        />
      )
    }
    if (vm.passwordStrength.score < 4 && vm.password.length > 0) {
      return "Password too weak"
    }
    return (
      <span className="flex items-center gap-2">
        Create Account <ArrowRight className="h-5 w-5" />
      </span>
    )
  }

  const PasswordEyeIcon = vm.showPassword ? EyeOff : Eye
  const ConfirmPasswordEyeIcon = vm.showConfirmPassword ? EyeOff : Eye

  return (
    <form onSubmit={vm.handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="username"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Username
          </Label>
          <CharacterCounter current={vm.username.length} limit={50} />
        </div>
        <div className="group relative">
          <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="username"
            type="text"
            placeholder="your_handle"
            value={vm.username}
            onChange={(e) => vm.setUsername(sanitizeUsername(e.target.value))}
            maxLength={50}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
        </div>
        {(vm.submitAttempted || vm.username.length > 0) && vm.usernameError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {vm.usernameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="email"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Email Address
          </Label>
          <CharacterCounter current={vm.email.length} limit={254} />
        </div>
        <div className="group relative">
          <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={vm.email}
            onChange={(e) => vm.setEmail(sanitizeEmail(e.target.value))}
            maxLength={254}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
        </div>
        {(vm.submitAttempted || vm.email.length > 0) && vm.emailError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {vm.emailError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="password"
            title="At least 8 characters"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Password
          </Label>
          <CharacterCounter current={vm.password.length} limit={128} />
        </div>
        <div className="group relative">
          <KeyRound className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="password"
            type={vm.showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={vm.password}
            onChange={(e) => vm.setPassword(sanitizePassword(e.target.value))}
            maxLength={128}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => vm.setShowPassword(!vm.showPassword)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-foreground/60 transition-colors hover:text-foreground"
          >
            <PasswordEyeIcon className="h-5 w-5" />
          </button>
        </div>
        <PasswordStrengthMeter password={vm.password} />
        {(vm.submitAttempted || vm.password.length > 0) && vm.passwordError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {vm.passwordError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          title="Passwords must match"
          className="ml-1 text-sm font-black tracking-widest text-foreground uppercase"
        >
          Confirm Password
        </Label>
        <div className="group relative">
          <BadgeCheck className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="confirmPassword"
            type={vm.showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={vm.confirmPassword}
            onChange={(e) =>
              vm.setConfirmPassword(sanitizePassword(e.target.value))
            }
            required
            className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => vm.setShowConfirmPassword(!vm.showConfirmPassword)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-foreground/60 transition-colors hover:text-foreground"
          >
            <ConfirmPasswordEyeIcon className="h-5 w-5" />
          </button>
        </div>
        {(vm.submitAttempted || vm.confirmPassword.length > 0) &&
          vm.confirmPasswordError && (
            <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
              {vm.confirmPasswordError}
            </p>
          )}
      </div>

      <Button
        type="submit"
        disabled={vm.loading || !vm.isFormValid}
        className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {getSubmitButtonContent()}
      </Button>
    </form>
  )
}
