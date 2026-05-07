import { motion } from "framer-motion"
import { getPasswordStrength } from "@/lib/auth"
import { CheckCircle2, Circle } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
}

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

export function PasswordStrengthMeter({ password }: Readonly<PasswordStrengthMeterProps>) {
  const { score, label } = getPasswordStrength(password)

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "bg-muted"
      case 1:
        return "bg-destructive"
      case 2:
        return "bg-orange-400"
      case 3:
        return "bg-yellow-400"
      case 4:
        return "bg-accent"
      default:
        return "bg-muted"
    }
  }

  const getLabelColor = (score: number) => {
    switch (score) {
      case 1:
        return "text-destructive"
      case 2:
        return "text-orange-500"
      case 3:
        return "text-yellow-500"
      case 4:
        return "text-accent"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Security Level
          </span>
          <span className={`text-xs font-bold ${getLabelColor(score)}`}>
            {label}
          </span>
        </div>
        <div className="flex h-2 w-full gap-2 px-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`strength-bar-${index}`}
              className="relative h-full flex-1 rounded-full bg-muted/50 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: score > index ? "100%" : "0%",
                }}
                className={`h-full rounded-full ${getStrengthColor(score)}`}
                transition={{ duration: 0.4, ease: "circOut" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <div
              key={rule.label}
              className="flex items-center gap-2"
            >
              {met ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground/20" />
              )}
              <span
                className={`text-[11px] font-medium transition-colors duration-200 ${
                  met ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
