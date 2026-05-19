import React from "react"
import { Calendar, Flag, Layers, Tag as TagIcon, X, Plus } from "lucide-react"
import * as Icons from "lucide-react"
import { format, isValid } from "date-fns"
import { type Task, type TaskPriority, type Tag, type Project } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  readonly localUnsavedProjects?: readonly {
    name: string
    color: string
    icon: string
    tempId: number
  }[]
  readonly priority: string
  readonly setPriority: (v: TaskPriority) => void
  readonly completed: boolean
  readonly setCompleted: (v: boolean) => void
  readonly dueDate: Date | undefined
  readonly handleDateSelect: (
    d: Date | undefined,
    preserveTime?: boolean
  ) => void
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
  readonly toast: (props: {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success"
  }) => void
  readonly dirtySections?: DirtySections
  readonly isCreatingTag?: boolean
  readonly isCreatingProject?: boolean
  readonly allTags?: readonly Tag[]
}

const PRIORITY_STYLES = {
  HIGH: "text-red-500 bg-red-500/10 border-red-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function MetaSidebar(props: MetaSidebarProps) {
  return (
    <div className="no-scrollbar flex flex-1 flex-col space-y-6 overflow-y-auto border-t border-white/5 bg-white/[0.02] p-6 md:p-8 lg:flex-[0.35] lg:border-t-0 lg:border-l">
      <DueDateSection {...props} />
      {!props.isCreate && <StatusSection {...props} />}
      <PrioritySection {...props} />
      <ProjectSection {...props} />
      <TagsSection {...props} totalTagsCount={props.allTags?.length || 0} />
    </div>
  )
}

function StatusSection({
  completed,
  setCompleted,
  dirtySections,
}: Pick<MetaSidebarProps, "completed" | "setCompleted" | "dirtySections">) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="status-select"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Status
        </label>
        {dirtySections?.status && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <Select
        value={completed ? "COMPLETED" : "PENDING"}
        onValueChange={(val) => setCompleted(val === "COMPLETED")}
      >
        <SelectTrigger
          id="status-select"
          className="h-10 w-full rounded-xl border-none bg-white/5 font-bold"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-background/95 backdrop-blur-xl">
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function PrioritySection({
  priority,
  setPriority,
  dirtySections,
}: Pick<MetaSidebarProps, "priority" | "setPriority" | "dirtySections">) {
  const currentPriority = (priority as TaskPriority) || "MEDIUM"
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="priority-select"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Priority
        </label>
        {dirtySections?.priority && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <Select
        value={currentPriority}
        onValueChange={(val) => setPriority(val as TaskPriority)}
      >
        <SelectTrigger
          id="priority-select"
          className={cn(
            "h-10 w-full rounded-xl border-none text-xs font-bold tracking-widest uppercase",
            PRIORITY_STYLES[currentPriority]
          )}
        >
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-background/95 backdrop-blur-xl">
          <SelectItem
            value="HIGH"
            className="text-xs font-bold tracking-widest text-red-500 uppercase"
          >
            High
          </SelectItem>
          <SelectItem
            value="MEDIUM"
            className="text-xs font-bold tracking-widest text-amber-500 uppercase"
          >
            Medium
          </SelectItem>
          <SelectItem
            value="LOW"
            className="text-xs font-bold tracking-widest text-blue-500 uppercase"
          >
            Low
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function ProjectSection({
  projectId,
  setProjectId,
  projects,
  isProjectPickerOpen,
  setIsProjectPickerOpen,
  projectSearch,
  setProjectSearch,
  handleCreateProject,
  newProjectColor,
  setNewProjectColor,
  newProjectIcon,
  setNewProjectIcon,
  dirtySections,
  isCreatingProject,
  localUnsavedProjects,
}: Pick<
  MetaSidebarProps,
  | "projectId"
  | "setProjectId"
  | "projects"
  | "isProjectPickerOpen"
  | "setIsProjectPickerOpen"
  | "projectSearch"
  | "setProjectSearch"
  | "handleCreateProject"
  | "newProjectColor"
  | "setNewProjectColor"
  | "newProjectIcon"
  | "setNewProjectIcon"
  | "dirtySections"
  | "isCreatingProject"
  | "localUnsavedProjects"
>) {
  const selectedProject = projects.find((p) => p.id.toString() === projectId)
  const tempProject = localUnsavedProjects?.find(
    (p) => p.tempId.toString() === projectId
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="project-search"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Project
        </label>
        {dirtySections?.project && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <Popover open={isProjectPickerOpen} onOpenChange={setIsProjectPickerOpen}>
        <PopoverTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-left text-xs font-black tracking-widest text-foreground/60 uppercase transition-all hover:bg-white/10">
            <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
            {projectId === "none"
              ? "Inbox"
              : selectedProject?.name ||
                tempProject?.name ||
                `Project #${projectId}`}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 rounded-xl border-white/10 bg-background/95 p-2 backdrop-blur-xl"
          align="end"
        >
          <input
            id="project-search"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isCreatingProject && handleCreateProject()
            }
            disabled={isCreatingProject}
            placeholder="Search or create project..."
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none disabled:opacity-50"
          />
          <div className="max-h-40 space-y-1 overflow-y-auto">
            <button
              onClick={() => {
                setProjectId("none")
                setIsProjectPickerOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-bold transition-colors hover:bg-white/5"
            >
              <Layers className="h-3 w-3 text-foreground/20" />
              Inbox
            </button>
            {projects
              .filter((p) =>
                p.name.toLowerCase().includes(projectSearch.toLowerCase())
              )
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProjectId(p.id.toString())
                    setIsProjectPickerOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.color || "gray" }}
                  />
                  {p.name}
                </button>
              ))}
            {projectSearch.trim() &&
              !projects.some(
                (p) => p.name.toLowerCase() === projectSearch.toLowerCase()
              ) && (
                <div className="mt-1 flex items-center gap-1 border-t border-white/5 pt-2">
                  {projects.length < 20 ? (
                    <>
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
                        disabled={isCreatingProject}
                        className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                      >
                        <Plus
                          className={cn(
                            "h-3 w-3",
                            isCreatingProject && "animate-spin"
                          )}
                        />
                        {isCreatingProject
                          ? "Creating..."
                          : `Create "${projectSearch}"`}
                      </button>
                    </>
                  ) : (
                    <p className="px-3 py-2 text-[10px] font-bold tracking-tight text-destructive/60 uppercase">
                      Project limit reached (20)
                    </p>
                  )}
                </div>
              )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function DueDateSection({
  dueDate,
  handleDateSelect,
  dirtySections,
}: MetaSidebarProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  const quickDates = [
    { label: "Today", value: new Date() },
    {
      label: "Tomorrow",
      value: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
    {
      label: "Next Week",
      value: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  ]

  const dateFormatStr = is12h
    ? "EEE, MMM d 'at' hh:mm a"
    : "EEE, MMM d 'at' HH:mm"
  const formattedDueDate = dueDate
    ? format(dueDate, dateFormatStr)
    : "No deadline"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="due-date-trigger"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Due Date
        </label>
        {dirtySections?.dueDate && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            id="due-date-trigger"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border bg-white/5 p-3 text-left text-xs font-black tracking-widest uppercase transition-all hover:bg-white/10",
              dueDate
                ? "border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5"
                : "border-white/5 text-foreground/40"
            )}
          >
            <Calendar
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                dueDate ? "text-primary" : "text-foreground/20"
              )}
            />
            {formattedDueDate}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-[320px] flex-col gap-6 rounded-[1.5rem] border-white/10 bg-background/95 p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
          align="start"
          side="bottom"
          sideOffset={8}
        >
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
                className="h-8 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black tracking-tight uppercase hover:bg-primary/10 hover:text-primary"
              >
                {d.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Icons.Clock className="h-3 w-3 text-primary" />
                <span className="text-[9px] font-black tracking-widest text-foreground/40 uppercase">
                  Set Time
                </span>
              </div>

              <TimePicker
                id="time-picker"
                value={dueDate ? format(dueDate, "HH:mm") : ""}
                onChange={(timeStr) => {
                  if (!timeStr?.includes(":")) return
                  const [hoursStr, minutesStr] = timeStr.split(":")
                  const hours = Number(hoursStr)
                  const minutes = Number(minutesStr)

                  if (Number.isNaN(hours) || Number.isNaN(minutes)) return

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
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                className="origin-top scale-[0.9] rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
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
              className="h-8 rounded-lg bg-primary px-4 text-[10px] font-black tracking-widest text-primary-foreground uppercase"
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
  currentTags,
  handleDetachTag,
  isTagPickerOpen,
  setIsTagPickerOpen,
  tagSearch,
  setTagSearch,
  filteredTags,
  handleAttachTag,
  canCreateTag,
  handleCreateAndAttachTag,
  newTagColor,
  setNewTagColor,
  newTagIcon,
  setNewTagIcon,
  dirtySections,
  isCreatingTag,
  totalTagsCount,
}: Pick<
  MetaSidebarProps,
  | "currentTags"
  | "handleDetachTag"
  | "isTagPickerOpen"
  | "setIsTagPickerOpen"
  | "tagSearch"
  | "setTagSearch"
  | "filteredTags"
  | "handleAttachTag"
  | "canCreateTag"
  | "handleCreateAndAttachTag"
  | "newTagColor"
  | "setNewTagColor"
  | "newTagIcon"
  | "setNewTagIcon"
  | "dirtySections"
  | "isCreatingTag"
> & { totalTagsCount: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="tag-search"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Tags
        </label>
        {dirtySections?.tags && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {currentTags?.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onDetach={() => handleDetachTag(tag.id)}
          />
        ))}
        {currentTags.length < 10 ? (
          <Popover open={isTagPickerOpen} onOpenChange={setIsTagPickerOpen}>
            <PopoverTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary/10 hover:text-primary">
                <Plus className="h-3 w-3 text-foreground/40" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 rounded-xl border-white/10 bg-background/95 p-2 backdrop-blur-xl"
              align="end"
            >
              <input
                id="tag-search"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  canCreateTag &&
                  !isCreatingTag &&
                  handleCreateAndAttachTag()
                }
                disabled={isCreatingTag}
                placeholder="Search or create tag..."
                className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none disabled:opacity-50"
              />
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAttachTag(tag.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color || "#6366f1" }}
                    />
                    {tag.name}
                  </button>
                ))}
                {canCreateTag && (
                  <div className="mt-1 flex items-center gap-1 border-t border-white/5 pt-2">
                    {totalTagsCount < 50 ? (
                      <>
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
                          disabled={isCreatingTag}
                          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                        >
                          <Plus
                            className={cn(
                              "h-3 w-3",
                              isCreatingTag && "animate-spin"
                            )}
                          />
                          {isCreatingTag
                            ? "Creating..."
                            : `Create "${tagSearch}"`}
                        </button>
                      </>
                    ) : (
                      <p className="px-3 py-2 text-[10px] font-bold tracking-tight text-destructive/60 uppercase">
                        Tag limit reached (50)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-full bg-white/5 text-foreground/10">
                <Plus className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="border-none bg-destructive font-bold text-destructive-foreground">
              Tag limit reached (10 per task)
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

function TagBadge({
  tag,
  onDetach,
}: Readonly<{ tag: Tag; onDetach: () => void }>) {
  const TagIconComp =
    (
      Icons as unknown as Record<
        string,
        React.ComponentType<{ className?: string; style?: React.CSSProperties }>
      >
    )[tag.icon || "Tag"] || TagIcon
  return (
    <Badge
      className="group/tag flex items-center gap-1.5 rounded-full border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-black text-primary uppercase transition-all hover:bg-primary/10"
      style={{
        backgroundColor: tag.color ? `${tag.color}15` : undefined,
        color: tag.color || undefined,
        borderColor: tag.color ? `${tag.color}30` : undefined,
      }}
    >
      <TagIconComp
        className="h-2.5 w-2.5"
        style={{ color: tag.color || "inherit" }}
      />
      {tag.name}
      <button
        onClick={onDetach}
        className="opacity-0 transition-opacity group-hover/tag:opacity-100 hover:text-red-400"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  )
}
