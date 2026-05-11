import React from "react"
import { format } from "date-fns"
import { 
  Trash2, Plus, Edit3, CheckCircle2, ListTodo, Folder, Shield, Activity 
} from "lucide-react"

export interface AuditEntry {
  id: number
  action: string
  details: string
  created_at: string
  user_id: number
  target_type: string
  target_id?: number | null
}

const bold = (text: string) => <span className="font-bold text-foreground">"{text}"</span>

/** Returns a human-readable date group label */
export function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === yesterday.getTime()) return "Yesterday"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/** Groups a flat array of log entries into date-keyed buckets */
export function groupByDate(logs: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const map: Record<string, AuditEntry[]> = {}
  for (const entry of logs) {
    const label = getDateGroupLabel(entry.created_at)
    if (!map[label]) map[label] = []
    map[label].push(entry)
  }
  return Object.entries(map).map(([label, entries]) => ({ label, entries }))
}

function getTargetName(details: string, type: string): string {
  if (!details) return ""
  const patterns = [
    // Support "Action type: Name | Changes"
    new RegExp(String.raw`${type}:\s*([^|:,(]+)`, 'i'),
    new RegExp(String.raw`${type}\s*['"]?([^'":,|]+)['"]?`, 'i'),
    new RegExp(String.raw`^Updated ${type}:\s*(.+?)(?:\s*[|(|]|$)`, 'i'),
    new RegExp(String.raw`^Refined ${type}:\s*["']?([^"']+)`, 'i')
  ]
  for (const p of patterns) {
    const m = p.exec(details)
    if (m?.[1]) return m[1].trim()
  }
  return ""
}

function parseTagChange(details: string, name: string): React.ReactNode {
  const tagMatch = /tag\s*['"]?([^'":|]+)['"]?/i.exec(details)
  const tagName = tagMatch?.[1]?.trim()
  return <span>Added tag {tagName ? bold(tagName) : "a tag"} to {name ? bold(name) : "task"}</span>
}

function parseFieldChanges(details: string, name: string): React.ReactNode {
  // Support both (fields: ...) and | Changes: ...
  const fieldsMatch = /\| Changes:\s*(.+)$/i.exec(details) || /\(fields:\s*([^)]+?)\)/i.exec(details)
  if (!fieldsMatch) return null
  
  const fieldChanges = fieldsMatch[1].split(",").map(f => f.trim())
  
  // Custom parsing for better readability of "field: 'old' -> 'new'"
  const parsedChanges = fieldChanges.map(change => {
    const match = /^([^:]+):\s*['"]?([^'"]*)['"]?\s*->\s*['"]?([^'"]*)['"]?$/i.exec(change)
    if (match) {
      const field = match[1].trim()
      const from = match[2].trim()
      const to = match[3].trim()
      
      // Special handling for specific fields
      if (field === 'due_date') return `Rescheduled from ${formatAuditDate(from)} to ${formatAuditDate(to)}`
      if (field === 'project_id' || field === 'project') return `Moved project`
      if (field === 'completed') return to === 'True' ? 'Marked as done' : 'Reopened'
      
      return `${field}: ${from} → ${to}`
    }
    return change
  })

  return (
    <span>
      Updated {name ? bold(name) : "task"}
      <span className="text-muted-foreground ml-1">
        ({parsedChanges.map((change, i) => <span key={i}>{i > 0 && ", "}{change}</span>)})
      </span>
    </span>
  )
}

function formatAuditDate(dateStr: string): string {
  if (!dateStr) return "none"
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) return `Today ${format(date, "h:mm a")}`
    
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow ${format(date, "h:mm a")}`

    if (Math.abs(diff) < 7 * 24 * 60 * 60 * 1000) {
      return format(date, "EEEE h:mm a") // e.g. Wednesday 2:00 PM
    }

    return format(date, "MMM d, h:mm a")
  } catch {
    return dateStr
  }
}

function parseDateChange(details: string, name: string): React.ReactNode {
  const dateMatch = /due_date\s*from\s*['"]?([^'"]+)['"]?\s*to\s*['"]?([^'"]+)['"]?/i.exec(details)
  if (!dateMatch) return null
  
  const from = formatAuditDate(dateMatch[1])
  const to = formatAuditDate(dateMatch[2])
  
  return (
    <span>
      Rescheduled {name ? bold(name) : "task"} from {bold(from)} to {bold(to)}
    </span>
  )
}

function parseProjectChange(details: string, name: string): React.ReactNode {
  const projMatch = /project\s*from\s*['"]?([^'"]+)['"]?\s*to\s*['"]?([^'"]+)['"]?/i.exec(details)
  if (!projMatch) return null
  
  return (
    <span>
      Moved {name ? bold(name) : "task"} from {bold(projMatch[1])} to {bold(projMatch[2])}
    </span>
  )
}

function handleTaskUpdate(detLow: string, details: string, name: string): React.ReactNode {
  if (detLow.includes("completed: true") || detLow.includes("status: completed")) 
    return <span>Marked {name ? bold(name) : "a task"} as done</span>
  
  if (detLow.includes("completed: false")) 
    return <span>Reopened {name ? bold(name) : "a task"}</span>
  
  if (detLow.includes("attached tag")) return parseTagChange(details, name)
  if (detLow.includes("detached tag")) return <span>Removed a tag from {name ? bold(name) : "task"}</span>
  
  if (detLow.includes("due_date from")) return parseDateChange(details, name)
  if (detLow.includes("project from")) return parseProjectChange(details, name)

  const fieldView = parseFieldChanges(details, name)
  if (fieldView) return fieldView
  
  return <span>Updated task {name ? bold(name) : ""}</span>
}

export function describeTaskAction(act: string, details: string): React.ReactNode {
  const name = getTargetName(details, "task")
  
  if (act.includes("create")) {
    return name ? <span>Created task {bold(name)}</span> : "Created a new task"
  }
  
  if (act.includes("update")) return handleTaskUpdate(details?.toLowerCase() || "", details, name)
  if (act.includes("delete")) return <span>Deleted task {name ? bold(name) : "a task"}</span>
  
  return null
}

export function describeSubtaskAction(act: string, details: string): React.ReactNode {
  const subName = getTargetName(details, "subtask")
  // Refined regex to capture parent task name more reliably
  const parentMatch = /(?:to|on|from|in)\s*task\s*['"]?([^'":,|]+)['"]?/i.exec(details)
  const parentName = parentMatch?.[1]?.trim()

  const subNode = subName ? bold(subName) : "subtask"
  const parentNode = parentName ? <> to task {bold(parentName)}</> : ""

  if (act.includes("create")) 
    return <span>Added subtask {subNode}{parentNode}</span>
  
  if (act.includes("update")) {
    if (details?.toLowerCase().includes("marked completed") || details?.toLowerCase().includes("completed: false -> true")) 
      return <span>Finished subtask {subNode}{parentNode}</span>
    
    const fieldView = parseFieldChanges(details, subName)
    if (fieldView) return fieldView
    
    return <span>Updated subtask {subNode}{parentNode}</span>
  }
  
  if (act.includes("delete")) 
    return <span>Removed subtask {subNode}{parentNode}</span>
  
  return <span>Activity on subtask {subNode}{parentNode}</span>
}

export function describeProjectAction(act: string, details: string): React.ReactNode {
  const name = getTargetName(details, "project")
  if (act.includes("create")) return <span>Created project {name ? bold(name) : "a project"}</span>
  if (act.includes("update")) {
    const fieldView = parseFieldChanges(details, name)
    if (fieldView) return fieldView
    return <span>Updated project {name ? bold(name) : "a project"}</span>
  }
  if (act.includes("delete")) return <span>Deleted project {name ? bold(name) : "a project"}</span>
  return null
}

export function describeAction(action: string, details: string, targetType: string, targetId?: number | null): React.ReactNode {
  const act = action?.toLowerCase() || ""
  const target = targetType?.toUpperCase() || ""

  if (target === "TASK") return describeTaskAction(act, details) || details
  if (target === "SUBTASK") return describeSubtaskAction(act, details) || details
  if (target === "PROJECT" || target === "GROUP") return describeProjectAction(act, details) || details

  const humanAction = action?.replaceAll("_", " ") || "Activity"
  return details || (targetId ? `${humanAction} on ${targetType} #${targetId}` : humanAction)
}

export const EXCLUDED_ACTIONS = new Set(["login", "logout", "user_login", "user_logout"])

export function isExcluded(action: string): boolean {
  const act = action?.toLowerCase() || ""
  return Array.from(EXCLUDED_ACTIONS).some(ex => act.includes(ex))
}

interface IconConfig {
  delete?: React.ReactNode
  create?: React.ReactNode
  update?: React.ReactNode
  default: React.ReactNode
}

export function getAuditIcon(action: string, targetType: string) {
  const act = action?.toLowerCase() || ""
  const type = targetType?.toUpperCase() || ""
  
  const iconMap: Record<string, IconConfig> = {
    TASK: {
      delete: <Trash2 className="h-4 w-4 text-rose-400" />,
      create: <Plus className="h-4 w-4 text-emerald-400" />,
      update: <Edit3 className="h-4 w-4 text-sky-400" />,
      default: <CheckCircle2 className="h-4 w-4 text-blue-400" />
    },
    SUBTASK: {
      delete: <Trash2 className="h-4 w-4 text-rose-400" />,
      create: <Plus className="h-4 w-4 text-indigo-400" />,
      default: <ListTodo className="h-4 w-4 text-indigo-400" />
    },
    PROJECT: {
      delete: <Trash2 className="h-4 w-4 text-rose-400" />,
      create: <Plus className="h-4 w-4 text-emerald-400" />,
      default: <Folder className="h-4 w-4 text-amber-400" />
    },
    GROUP: {
      delete: <Trash2 className="h-4 w-4 text-rose-400" />,
      create: <Plus className="h-4 w-4 text-emerald-400" />,
      default: <Folder className="h-4 w-4 text-amber-400" />
    },
    USER: {
      delete: <Shield className="h-4 w-4 text-purple-400" />,
      create: <Shield className="h-4 w-4 text-purple-400" />,
      default: <Shield className="h-4 w-4 text-purple-400" />
    }
  }

  const config = iconMap[type]
  if (!config) return <Activity className="h-4 w-4 text-muted-foreground" />
  
  if (act.includes('delete')) return config.delete
  if (act.includes('create')) return config.create
  if (act.includes('update') && config.update) return config.update
  return config.default
}
