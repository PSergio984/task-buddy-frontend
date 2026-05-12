import React from "react"
import { Calendar, Flag, Layers, Tag as TagIcon, X, Plus } from "lucide-react"
import * as Icons from "lucide-react"
import { format, isValid } from "date-fns"
import { type Task, type TaskPriority, type Tag, type Project } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColorIconPicker } from "../color-icon-picker"
import { useSettings } from "@/contexts/SettingsContext"
import { cn } from "@/lib/utils"

interface DirtySections {
  readonly status?: boolean
  readonly priority?: boolean
  readonly project?: boolean
  readonly dueDate?: boolean
  readonly tags?: boolean
}

interface MetaSidebarProps {
  readonly isCreate: boolean
  readonly projectId: string
  readonly setProjectId: (v: string) => void
  readonly projects: readonly Project[]
  readonly priority: string
  readonly setPriority: (v: TaskPriority) => void
  readonly completed: boolean
  readonly setCompleted: (v: boolean) => void
  readonly dueDate: Date | undefined
  readonly handleDateSelect: (d: Date | undefined, preserveTime?: boolean) => void
  readonly currentTags: readonly Tag[]
  readonly handleDetachTag: (id: number) => void
  readonly isTagPickerOpen: boolean
  readonly setIsTagPickerOpen: (v: boolean) => void
  readonly tagSearch: string
  readonly setTagSearch: (v: string) => void
  readonly filteredTags: readonly Tag[]
  readonly handleAttachTag: (id: number) => void
  readonly canCreateTag: boolean
  readonly handleCreateAndAttachTag: () => void
  readonly newTagColor: string
  readonly setNewTagColor: (v: string) => void
  readonly newTagIcon: string
  readonly setNewTagIcon: (v: string) => void
  readonly isProjectPickerOpen: boolean
  readonly setIsProjectPickerOpen: (v: boolean) => void
  readonly projectSearch: string
  readonly setProjectSearch: (v: string) => void
  readonly handleCreateProject: () => void
  readonly newProjectColor: string
  readonly setNewProjectColor: (v: string) => void
  readonly newProjectIcon: string
  readonly setNewProjectIcon: (v: string) => void
  readonly task: Task | null
  readonly handleUpdate: (updates: Partial<Task>) => void
  readonly toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" | "success" }) => void
  readonly dirtySections?: DirtySections
}

const PRIORITY_STYLES = {
  HIGH: "text-red-500 bg-red-500/10 border-red-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function MetaSidebar(props: MetaSidebarProps) {
  return (
    <div className="flex-[0.35] bg-white/[0.02] p-8 space-y-6 flex flex-col overflow-y-auto no-scrollbar border-l border-white/5">
      <DueDateSection {...props} />
      {!props.isCreate && <StatusSection {...props} />}
      <PrioritySection {...props} />
      <ProjectSection {...props} />
      <TagsSection {...props} />
    </div>
  )
}

function StatusSection({ completed, setCompleted, dirtySections }: Pick<MetaSidebarProps, "completed" | "setCompleted" | "dirtySections">) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="status-select" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</label>
        {dirtySections?.status && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <Select
        value={completed ? "COMPLETED" : "PENDING"}
        onValueChange={(val) => setCompleted(val === "COMPLETED")}
      >
        <SelectTrigger id="status-select" className="w-full bg-white/5 border-none rounded-xl h-10 font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function PrioritySection({ priority, setPriority, dirtySections }: Pick<MetaSidebarProps, "priority" | "setPriority" | "dirtySections">) {
  const currentPriority = priority as TaskPriority || "MEDIUM"
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="priority-select" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Priority</label>
        {dirtySections?.priority && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <Select
        value={currentPriority}
        onValueChange={(val) => setPriority(val as TaskPriority)}
      >
        <SelectTrigger id="priority-select" className={cn(
          "w-full border-none rounded-xl h-10 font-bold text-xs uppercase tracking-widest",
          PRIORITY_STYLES[currentPriority]
        )}>
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
          <SelectItem value="HIGH" className="text-red-500 font-bold text-xs uppercase tracking-widest">High</SelectItem>
          <SelectItem value="MEDIUM" className="text-amber-500 font-bold text-xs uppercase tracking-widest">Medium</SelectItem>
          <SelectItem value="LOW" className="text-blue-500 font-bold text-xs uppercase tracking-widest">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}


function ProjectSection({
  projectId, setProjectId, projects, isProjectPickerOpen, setIsProjectPickerOpen,
  projectSearch, setProjectSearch, handleCreateProject, newProjectColor, setNewProjectColor,
  newProjectIcon, setNewProjectIcon, dirtySections
}: Pick<MetaSidebarProps, "projectId" | "setProjectId" | "projects" | "isProjectPickerOpen" | "setIsProjectPickerOpen" | "projectSearch" | "setProjectSearch" | "handleCreateProject" | "newProjectColor" | "setNewProjectColor" | "newProjectIcon" | "setNewProjectIcon" | "dirtySections">) {
  const selectedProject = projects.find(p => p.id.toString() === projectId)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="project-search" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Project</label>
        {dirtySections?.project && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <Popover open={isProjectPickerOpen} onOpenChange={setIsProjectPickerOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest text-foreground/60 border border-white/5 hover:bg-white/10 transition-all text-left">
            <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
            {projectId === "none" ? "Inbox" : selectedProject?.name || "Inbox"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="end">
          <input
            id="project-search"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            placeholder="Search or create project..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 mb-2"
          />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <button
              onClick={() => {
                setProjectId("none")
                setIsProjectPickerOpen(false)
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Layers className="h-3 w-3 text-foreground/20" />
              Inbox
            </button>
            {projects
              .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProjectId(p.id.toString())
                    setIsProjectPickerOpen(false)
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || "gray" }} />
                  {p.name}
                </button>
              ))}
            {projectSearch.trim() && !projects.some(p => p.name.toLowerCase() === projectSearch.toLowerCase()) && (
              <div className="flex items-center gap-1 border-t border-white/5 pt-2 mt-1">
                <ColorIconPicker
                  color={newProjectColor}
                  icon={newProjectIcon}
                  onSelect={(c, i) => {
                    setNewProjectColor(c)
                    setNewProjectIcon(i)
                  }}
                />
                <button
                  onClick={handleCreateProject}
                  className="flex-1 text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Create "{projectSearch}"
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function DueDateSection({ dueDate, handleDateSelect, dirtySections }: MetaSidebarProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  const quickDates = [
    { label: "Today", value: new Date() },
    { label: "Tomorrow", value: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { label: "Next Week", value: new Date(new Date().setDate(new Date().getDate() + 7)) },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="due-date-trigger" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Due Date</label>
        {dirtySections?.dueDate && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button id="due-date-trigger" className={cn(
            "flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest border transition-all hover:bg-white/10 text-left",
            dueDate ? "bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5" : "text-foreground/40 border-white/5"
          )}>
            <Calendar className={cn("h-3.5 w-3.5 shrink-0", dueDate ? "text-primary" : "text-foreground/20")} />
            {dueDate ? format(dueDate, is12h ? "EEE, MMM d 'at' hh:mm a" : "EEE, MMM d 'at' HH:mm") : "No deadline"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4 rounded-[1.5rem] border-white/10 bg-background/95 backdrop-blur-3xl flex flex-col gap-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]" align="start" side="bottom" sideOffset={8}>
          {/* Quick Date Shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            {quickDates.map((d) => (
              <Button
                key={d.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleDateSelect(d.value)
                }}
                className="text-[10px] font-black uppercase tracking-tight h-8 rounded-lg bg-white/5 hover:bg-primary/10 hover:text-primary border border-white/5"
              >
                {d.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Icons.Clock className="h-3 w-3 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Set Time</span>
              </div>


              <TimePicker
                id="time-picker"
                value={dueDate ? format(dueDate, "HH:mm") : ""}
                onChange={(timeStr) => {
                  if (!timeStr || !timeStr.includes(':')) return
                  const [hoursStr, minutesStr] = timeStr.split(':')
                  const hours = Number(hoursStr)
                  const minutes = Number(minutesStr)
                  
                  if (isNaN(hours) || isNaN(minutes)) return

                  const now = new Date()
                  const current = dueDate || now
                  const newDate = new Date(current)
                  newDate.setHours(hours)
                  newDate.setMinutes(minutes)
                  newDate.setSeconds(0)
                  newDate.setMilliseconds(0)
                  
                  if (isValid(newDate)) {
                    handleDateSelect(newDate, false)
                  }
                }}
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <CalendarPicker
                mode="single"
                selected={dueDate}
                onSelect={(day) => handleDateSelect(day)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-xl scale-[0.9] origin-top"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleDateSelect(undefined)
                setPopoverOpen(false)
              }}
              className="text-[10px] font-bold text-destructive hover:bg-destructive/10"
            >
              Clear Date
            </Button>
            <Button
              size="sm"
              onClick={() => setPopoverOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-lg bg-primary text-primary-foreground"
            >
              Set Deadline
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function TagsSection({
  currentTags, handleDetachTag, isTagPickerOpen, setIsTagPickerOpen,
  tagSearch, setTagSearch, filteredTags, handleAttachTag, canCreateTag,
  handleCreateAndAttachTag, newTagColor, setNewTagColor, newTagIcon, setNewTagIcon,
  dirtySections
}: Pick<MetaSidebarProps, "currentTags" | "handleDetachTag" | "isTagPickerOpen" | "setIsTagPickerOpen" | "tagSearch" | "setTagSearch" | "filteredTags" | "handleAttachTag" | "canCreateTag" | "handleCreateAndAttachTag" | "newTagColor" | "setNewTagColor" | "newTagIcon" | "setNewTagIcon" | "dirtySections">) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="tag-search" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Tags</label>
        {dirtySections?.tags && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <div className="flex flex-wrap gap-2">
        {currentTags?.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onDetach={() => handleDetachTag(tag.id)} />
        ))}
        <Popover open={isTagPickerOpen} onOpenChange={setIsTagPickerOpen}>
          <PopoverTrigger asChild>
            <button className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
              <Plus className="h-3 w-3 text-foreground/40" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="end">
            <input
              id="tag-search"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canCreateTag && handleCreateAndAttachTag()}
              placeholder="Search or create tag..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 mb-2"
            />
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAttachTag(tag.id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || "#6366f1" }} />
                  {tag.name}
                </button>
              ))}
              {canCreateTag && (
                <div className="flex items-center gap-1 border-t border-white/5 pt-2 mt-1">
                  <ColorIconPicker
                    color={newTagColor}
                    icon={newTagIcon}
                    onSelect={(c, i) => {
                      setNewTagColor(c)
                      setNewTagIcon(i)
                    }}
                  />
                  <button
                    onClick={handleCreateAndAttachTag}
                    className="flex-1 text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Create "{tagSearch}"
                  </button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function TagBadge({ tag, onDetach }: Readonly<{ tag: Tag; onDetach: () => void }>) {
  const TagIconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[tag.icon || "Tag"] || TagIcon
  return (
    <Badge
      className="bg-primary/5 text-primary border-primary/10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 group/tag transition-all hover:bg-primary/10"
      style={{ 
        backgroundColor: tag.color ? `${tag.color}15` : undefined,
        color: tag.color || undefined,
        borderColor: tag.color ? `${tag.color}30` : undefined
      }}
    >
      <TagIconComp className="h-2.5 w-2.5" style={{ color: tag.color || "inherit" }} />
      {tag.name}
      <button onClick={onDetach} className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-red-400">
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  )
}
