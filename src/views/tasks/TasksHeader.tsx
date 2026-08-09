import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowUpDown, Filter, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { animations } from "@/lib/animations"

type SortMode = "priority" | "due_date" | "alpha"

interface TasksHeaderProps {
  readonly searchQuery: string
  readonly setSearchQuery: (query: string) => void
  readonly sortBy: SortMode
  readonly setSortBy: (mode: SortMode) => void
  readonly sortLabels: Record<string, string>
  readonly isFiltersExpanded: boolean
  readonly setIsFiltersExpanded: (expanded: boolean) => void
  readonly selectedPriorities: string[]
  readonly togglePriority: (p: string) => void
  readonly clearAllFilters: () => void
}

export function TasksHeader({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortLabels,
  isFiltersExpanded,
  setIsFiltersExpanded,
  selectedPriorities,
  togglePriority,
  clearAllFilters,
}: TasksHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="group relative order-2 w-full lg:order-1 lg:max-w-md">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground/40 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-base shadow-2xl backdrop-blur-xl transition-all focus-visible:ring-primary/30 md:h-14 md:text-lg"
          />
        </div>

        <div className="order-1 flex w-full items-center gap-3 lg:order-2 lg:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex h-12 items-center gap-3 rounded-2xl border-white/10 bg-white/5 px-6 font-bold shadow-xl backdrop-blur-xl transition-all hover:bg-white/10 md:h-14"
              >
                <ArrowUpDown className="h-4 w-4 text-primary" />
                <span className="hidden text-[10px] tracking-widest uppercase md:inline">
                  {sortLabels[sortBy]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border-white/10 bg-background/95 p-2 shadow-2xl backdrop-blur-2xl"
            >
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Sort Objectives
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortBy(key as SortMode)}
                  className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold transition-colors focus:bg-primary focus:text-primary-foreground"
                >
                  {label}
                  {sortBy === key && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            aria-expanded={isFiltersExpanded}
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={cn(
              "flex h-12 items-center gap-3 rounded-2xl border-white/10 px-6 font-bold shadow-xl backdrop-blur-xl transition-all md:h-14",
              isFiltersExpanded || selectedPriorities.length > 0
                ? "border-primary/30 bg-primary/20 text-primary"
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden text-[10px] tracking-widest uppercase md:inline">
              Filter
            </span>
            {selectedPriorities.length > 0 && (
              <Badge
                variant="default"
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-black"
              >
                {selectedPriorities.length}
              </Badge>
            )}
          </Button>

          {selectedPriorities.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="h-12 rounded-2xl px-4 font-bold text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground md:h-14"
            >
              <X className="mr-2 h-4 w-4" />
              <span className="hidden text-[10px] tracking-widest uppercase md:inline">
                Clear
              </span>
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFiltersExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={animations.spring.gentle}
            className="overflow-hidden"
          >
            <div className="mb-4 flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner backdrop-blur-xl">
              <div className="mb-2 w-full">
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Priority Matrix
                </span>
              </div>
              {["HIGH", "MEDIUM", "LOW"].map((p) => (
                <button
                  key={p}
                  aria-pressed={selectedPriorities.includes(p)}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "rounded-xl border-2 px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all",
                    selectedPriorities.includes(p)
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-transparent bg-white/5 text-foreground/40 hover:bg-white/10 hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
