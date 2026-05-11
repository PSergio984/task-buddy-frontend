import React from "react"
import { Calendar, Flag, Layers, Tag as TagIcon, X, Plus } from "lucide-react"
import * as Icons from "lucide-react"
import { format } from "date-fns"
import { type Task, type TaskPriority, type Tag, type Project } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColorIconPicker } from "../color-icon-picker"
import { cn } from "@/lib/utils"

interface MetaSidebarProps {
  readonly isCreate: boolean
  readonly projectId: string
  readonly setProjectId: (v: string) => void
  readonly projects: readonly Project[]
  readonly priority: string
  readonly setPriority: (v: TaskPriority) => void
  readonly dueDate: Date | undefined
  readonly handleDateSelect: (d: Date | undefined) => void
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
}

const PRIORITY_STYLES = {
  HIGH: "text-red-500 bg-red-500/10 border-red-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function MetaSidebar(props: MetaSidebarProps) {
  return (
    <div className="flex-[0.35] bg-white/[0.02] p-8 space-y-6 flex flex-col overflow-y-auto no-scrollbar">
      <StatusSection {...props} />
      <PrioritySection {...props} />
      <ProjectSection {...props} />
      <DueDateSection {...props} />
      <TagsSection {...props} />
    </div>
  )
}

function StatusSection({ isCreate, task, handleUpdate }: Readonly<MetaSidebarProps>) {
  if (isCreate || !task) return null
  return (
    <div className="space-y-2">
      <label htmlFor="status-select" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</label>
      <Select
        value={task.completed ? "COMPLETED" : "PENDING"}
        onValueChange={(val) => handleUpdate({ completed: val === "COMPLETED" })}
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

function PrioritySection({ isCreate, priority, setPriority, task, handleUpdate }: Readonly<MetaSidebarProps>) {
  const currentPriority = (isCreate ? priority : task?.priority) as TaskPriority || "MEDIUM"
  return (
    <div className="space-y-2">
      <label htmlFor="priority-select" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Priority</label>
      <Select
        value={currentPriority}
        onValueChange={(val) => {
          if (isCreate) setPriority(val as TaskPriority)
          else handleUpdate({ priority: val as TaskPriority })
        }}
      >
        <SelectTrigger id="priority-select" className={cn(
          "w-full border-none rounded-xl h-10 font-bold",
          PRIORITY_STYLES[currentPriority]
        )}>
          <div className="flex items-center gap-2">
            <Flag className="h-3.5 w-3.5" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
          <SelectItem value="HIGH" className="text-red-500 font-bold">High</SelectItem>
          <SelectItem value="MEDIUM" className="text-amber-500 font-bold">Medium</SelectItem>
          <SelectItem value="LOW" className="text-blue-500 font-bold">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function ProjectSection({
  isCreate, projectId, setProjectId, projects, isProjectPickerOpen, setIsProjectPickerOpen,
  projectSearch, setProjectSearch, handleCreateProject, newProjectColor, setNewProjectColor,
  newProjectIcon, setNewProjectIcon, handleUpdate
}: Readonly<MetaSidebarProps>) {
  const selectedProject = projects.find(p => p.id.toString() === projectId)
  
  return (
    <div className="space-y-2">
      <label htmlFor="project-search" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Project</label>
      <Popover open={isProjectPickerOpen} onOpenChange={setIsProjectPickerOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-sm font-bold text-foreground/60 border border-white/5 hover:bg-white/10 transition-colors text-left">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            {projectId === "none" ? "Inbox" : selectedProject?.name || "Inbox"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="start">
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
                if (!isCreate) handleUpdate({ project_id: undefined })
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
                    if (!isCreate) handleUpdate({ project_id: p.id })
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

function DueDateSection({ isCreate, dueDate, handleDateSelect, handleUpdate }: Readonly<MetaSidebarProps>) {
  return (
    <div className="space-y-2">
      <label htmlFor="due-date-trigger" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Due Date</label>
      <Popover>
        <PopoverTrigger asChild>
          <button id="due-date-trigger" className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-sm font-bold text-foreground/60 border border-white/5 hover:bg-white/10 transition-colors text-left">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            {dueDate ? format(dueDate, "EEE, MMM d 'at' HH:mm") : "No deadline"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl flex flex-col gap-4" align="start">
          <CalendarPicker
            mode="single"
            selected={dueDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="space-y-0.5">
              <label htmlFor="time-picker" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Set Time</label>
              {dueDate?.toDateString() === new Date().toDateString() && (
                <p className="text-[8px] text-amber-500/70 font-bold uppercase">Today: Future times only</p>
              )}
            </div>
            <TimePicker
              id="time-picker"
              className="w-48"
              value={dueDate ? `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}` : "09:00"}
              onChange={(timeStr) => {
                const [hours, minutes] = timeStr.split(':').map(Number)
                const current = dueDate || new Date()
                const newDate = new Date(current)
                newDate.setHours(hours)
                newDate.setMinutes(minutes)
                if (isCreate) handleDateSelect(newDate)
                else handleUpdate({ due_date: newDate.toISOString() })
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function TagsSection({
  currentTags, handleDetachTag, isTagPickerOpen, setIsTagPickerOpen,
  tagSearch, setTagSearch, filteredTags, handleAttachTag, canCreateTag,
  handleCreateAndAttachTag, newTagColor, setNewTagColor, newTagIcon, setNewTagIcon
}: Readonly<MetaSidebarProps>) {
  return (
    <div className="space-y-2">
      <label htmlFor="tag-search" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Tags</label>
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
          <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="start">
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
  const TagIconComp = (Icons as unknown as Record<string, React.ElementType>)[tag.icon || "Tag"] || TagIcon
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
