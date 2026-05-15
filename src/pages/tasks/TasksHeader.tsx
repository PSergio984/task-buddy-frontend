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
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: SortMode
  setSortBy: (mode: SortMode) => void
  sortLabels: Record<string, string>
  isFiltersExpanded: boolean
  setIsFiltersExpanded: (expanded: boolean) => void
  selectedPriorities: string[]
  togglePriority: (p: string) => void
  clearAllFilters: () => void
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
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="relative w-full lg:max-w-md group order-2 lg:order-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 md:h-14 pl-12 pr-4 rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl text-base md:text-lg focus-visible:ring-primary/30 shadow-2xl transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto order-1 lg:order-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 md:h-14 px-6 rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all shadow-xl">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                <span className="hidden md:inline uppercase tracking-widest text-[10px]">{sortLabels[sortBy]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/10 bg-background/95 backdrop-blur-2xl p-2 shadow-2xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Sort Objectives</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={() => setSortBy(key as SortMode)}
                  className="rounded-xl font-bold text-sm py-3 px-4 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors"
                >
                  {label}
                  {sortBy === key && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={cn(
              "h-12 md:h-14 px-6 rounded-2xl border-white/10 backdrop-blur-xl font-bold flex items-center gap-3 transition-all shadow-xl",
              isFiltersExpanded || selectedPriorities.length > 0 ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 hover:bg-white/10"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline uppercase tracking-widest text-[10px]">Filter</span>
            {selectedPriorities.length > 0 && (
              <Badge variant="primary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-black">
                {selectedPriorities.length}
              </Badge>
            )}
          </Button>

          {selectedPriorities.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={clearAllFilters}
              className="h-12 md:h-14 px-4 rounded-2xl font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <X className="h-4 w-4 mr-2" />
              <span className="hidden md:inline uppercase tracking-widest text-[10px]">Clear</span>
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
            <div className="flex flex-wrap gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-4 shadow-inner">
              <div className="w-full mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Priority Matrix</span>
              </div>
              {["HIGH", "MEDIUM", "LOW"].map((p) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase border-2",
                    selectedPriorities.includes(p)
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-white/5 border-transparent text-foreground/40 hover:bg-white/10 hover:text-foreground"
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
