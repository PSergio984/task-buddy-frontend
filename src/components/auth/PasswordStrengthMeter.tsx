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

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label } = getPasswordStrength(password)

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "bg-muted"
      case 1:
        return "bg-red-500"
      case 2:
        return "bg-orange-500"
      case 3:
        return "bg-yellow-500"
      case 4:
        return "bg-green-500"
      default:
        return "bg-muted"
    }
  }

  const getLabelColor = (score: number) => {
    switch (score) {
      case 1:
        return "text-red-600"
      case 2:
        return "text-orange-600"
      case 3:
        return "text-yellow-600"
      case 4:
        return "text-green-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Password Strength
          </span>
          <span className={`text-xs font-bold ${getLabelColor(score)}`}>
            {label}
          </span>
        </div>
        <div className="flex h-1.5 w-full gap-1.5 overflow-hidden">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative h-full flex-1 rounded-full bg-muted"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: score > index ? "100%" : "0%",
                }}
                className={`h-full rounded-full ${getStrengthColor(score)}`}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      </div>

      <ul
        className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2"
        aria-label="Password requirements"
      >
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <li
              key={rule.label}
              className="flex items-center gap-2"
            >
              {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
              ) : (
                <Circle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/30" />
              )}
              <span
                className={`text-[11px] transition-colors duration-150 ${
                  met ? "text-green-600 font-medium" : "text-muted-foreground"
                }`}
              >
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
