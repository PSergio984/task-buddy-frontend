import { motion, AnimatePresence } from "framer-motion"
import { Tag as TagIcon, ChevronDown, Plus } from "lucide-react"
import * as LucideIcons from "lucide-react"
import {
  DndContext,
  closestCenter,
  type SensorDescriptor,
  type SensorOptions,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SortableSidebarItem } from "./sortable-item"
import { GripHandle } from "./grip-handle"
import { SidebarItemActions } from "./item-actions"
import type { Tag } from "@/lib/api"

interface TagsSectionProps {
  readonly isCollapsed: boolean
  readonly isTagsCollapsed: boolean
  readonly onToggleCollapse: () => void
  readonly onAddTag: () => void
  readonly tags: Tag[]
  readonly sensors: SensorDescriptor<SensorOptions>[]
  readonly onDragEnd: (event: DragEndEvent) => void
  readonly activeTagId: number | null
  readonly onTagClick: (id: number) => void
  readonly onEditTag: (tag: Tag) => void
  readonly onDeleteTag: (tag: Tag) => void
}

export function TagsSection({
  isCollapsed,
  isTagsCollapsed,
  onToggleCollapse,
  onAddTag,
  tags,
  sensors,
  onDragEnd,
  activeTagId,
  onTagClick,
  onEditTag,
  onDeleteTag,
}: TagsSectionProps) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "group/header flex items-center justify-between px-4 select-none",
          isCollapsed && "justify-center"
        )}
      >
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 text-accent/40 transition-transform duration-300",
                isTagsCollapsed && "-rotate-90"
              )}
            />
            <TagIcon className="h-3 w-3 text-accent/60" />
            <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
              Focus Tags
            </p>
          </button>
        )}
        {isCollapsed ? (
          <TagIcon className="h-4 w-4 text-foreground/20" />
        ) : tags.length < 50 ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddTag()
            }}
            className="cursor-pointer rounded-md p-1 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Add Tag"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed p-1 text-foreground/10">
                <Plus className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="border-none bg-destructive font-bold text-destructive-foreground">
              Tag limit reached (50)
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(!isTagsCollapsed || isCollapsed) && (
          <motion.div
            initial={
              isCollapsed
                ? { opacity: 1, height: "auto" }
                : { opacity: 0, height: 0 }
            }
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-2">
              {tags.length === 0 && !isCollapsed && (
                <div className="mx-2 rounded-xl border border-dashed border-border/30 bg-white/5 px-4 py-4 text-center">
                  <p className="text-[10px] font-bold text-foreground/20 uppercase">
                    No Tags
                  </p>
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={tags.map((t) => t.id)}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      isCollapsed && "flex-col items-center"
                    )}
                  >
                    {tags.map((tag) => {
                      const isActive = activeTagId === tag.id
                      const TagIconComp =
                        (
                          LucideIcons as unknown as Record<
                            string,
                            LucideIcons.LucideIcon
                          >
                        )[tag.icon || "Tag"] || LucideIcons.Tag
                      const content = (
                        <SortableSidebarItem
                          key={tag.id}
                          id={tag.id}
                          handle={
                            !isCollapsed && (
                              <GripHandle className="opacity-0 transition-opacity group-hover:opacity-100" />
                            )
                          }
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "group/item flex items-center rounded-full shadow-sm transition-all outline-none",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                                : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground",
                              isCollapsed && "p-2"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => onTagClick(tag.id)}
                              className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider uppercase outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                !isCollapsed && "pr-1.5"
                              )}
                            >
                              <TagIconComp
                                className="h-3.5 w-3.5"
                                style={{
                                  color: isActive
                                    ? "inherit"
                                    : tag.color || "gray",
                                }}
                              />
                              <div
                                className="h-1 w-1 rounded-full shadow-[0_0_5px_currentColor]"
                                style={{
                                  backgroundColor: tag.color || "gray",
                                  color: tag.color || "gray",
                                }}
                              />
                              {!isCollapsed && <span>{tag.name}</span>}
                            </button>
                            {!isCollapsed && (
                              <SidebarItemActions
                                className="mr-3 opacity-0 transition-opacity group-hover:opacity-100"
                                onEdit={() => onEditTag(tag)}
                                onDelete={() => onDeleteTag(tag)}
                              />
                            )}
                          </motion.div>
                        </SortableSidebarItem>
                      )
                      if (isCollapsed) {
                        return (
                          <Tooltip key={tag.id} delayDuration={0}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="rounded-xl border-none bg-primary px-4 py-2 font-bold text-primary-foreground shadow-2xl"
                            >
                              {tag.name}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }
                      return content
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
