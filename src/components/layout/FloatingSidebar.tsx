import React from "react"
import {
  Search,
  Timer,
  ListChecks,
  Flame,
  Users,
  Sun,
  Moon,
  Headphones,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface FloatingSidebarProps {
  activeView: string
  onSelectView?: (view: string) => void
  theme?: "light" | "dark"
  onToggleTheme?: () => void
  onToggleCollapse?: () => void
  className?: string
}

interface ViewConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  isLive?: boolean
}

const VIEWS: ViewConfig[] = [
  { id: "focus", label: "Focus", icon: Timer },
  { id: "tasks", label: "Tasks", icon: ListChecks, count: 14 },
  { id: "habits", label: "Habits", icon: Flame, count: 5 },
  { id: "rooms", label: "Rooms", icon: Users, isLive: true },
]

interface StreamConfig {
  id: string
  name: string
  color: string
  priority: string
}

const STREAMS: StreamConfig[] = [
  { id: "tokens", name: "Design Tokens", color: "#FF5A36", priority: "P1" },
  { id: "mobile", name: "Mobile Parity", color: "#6366F1", priority: "P2" },
  { id: "tauri", name: "Tauri Desktop", color: "#10B981", priority: "P3" },
]

export function FloatingSidebar({
  activeView = "focus",
  onSelectView,
  theme = "dark",
  onToggleTheme,
  onToggleCollapse,
  className,
}: FloatingSidebarProps) {
  const isDark = theme === "dark"

  return (
    <aside
      className={cn(
        "left-island flex flex-col gap-3 w-[240px] h-full overflow-hidden select-none",
        className
      )}
      data-testid="floating-sidebar"
    >
      {/* Top Nav Card */}
      <div className="nav-island-card flex-1 rounded-[16px] border border-gray-200 border-[var(--gray-200)] bg-bg bg-[var(--bg)] p-3.5 shadow-sm flex flex-col overflow-y-auto">
        {/* Brand Cluster */}
        <div className="brand-cluster flex items-center justify-between mb-3 px-1 py-0.5">
          <div className="brand-title-wrap flex items-center gap-2 font-bold text-[13px] tracking-[-0.02em] text-[var(--ink)]">
            <svg
              className="brand-logo-glyph w-[18px] h-[18px] text-[#FF5A36] text-[var(--coral-accent)] shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="8" height="8" rx="2.5" />
              <rect x="13" y="3" width="8" height="8" rx="2.5" fillOpacity="0.4" />
              <rect x="3" y="13" width="8" height="8" rx="2.5" fillOpacity="0.4" />
              <rect x="13" y="13" width="8" height="8" rx="2.5" />
            </svg>
            <span className="font-bold">TASK BUDDY</span>
            <span className="brand-plan-chip font-mono text-[9px] font-semibold text-[var(--gray-400)] border border-gray-200 border-[var(--gray-200)] px-1.5 py-0.5 rounded tracking-[0.04em]">
              PRO
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle Sidebar"
            className="collapse-btn text-[var(--gray-400)] hover:text-[var(--ink)] hover:bg-[var(--gray-100)] flex items-center justify-center w-6 h-6 rounded-[6px] transition-colors cursor-pointer"
          >
            ◫
          </button>
        </div>

        {/* Quick Jump Search */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Quick jump search"
          className="sidebar-search h-8 px-2.5 rounded-[6px] border border-gray-200 border-[var(--gray-200)] bg-[#141418] bg-[var(--gray-50)] text-[var(--gray-400)] hover:text-[var(--ink)] hover:border-[var(--gray-300)] flex items-center justify-between mb-3.5 text-xs transition-all cursor-pointer"
        >
          <div className="search-left flex items-center gap-2">
            <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Quick jump...</span>
          </div>
          <span className="search-kbd font-mono text-[10px] bg-[var(--bg)] border border-gray-200 border-[var(--gray-200)] px-1.5 py-0.5 rounded text-[var(--gray-500)]">
            ⌘K
          </span>
        </div>

        {/* Section 01 — Views */}
        <div className="nav-section-label flex items-center justify-between font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--gray-400)] px-1.5 mb-1.5">
          <span>01 — Views</span>
        </div>

        <nav aria-label="Views Navigation" className="flex flex-col gap-0.5">
          {VIEWS.map((view) => {
            const Icon = view.icon
            const isActive =
              activeView?.toLowerCase() === view.id.toLowerCase() ||
              activeView === view.label

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => onSelectView?.(view.id)}
                className={cn(
                  "nav-pill-item h-[34px] flex items-center justify-between px-2.5 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer border text-left",
                  isActive
                    ? "active bg-[var(--gray-100)] text-[var(--ink)] font-semibold border-gray-200 border-[var(--gray-200)] shadow-xs"
                    : "text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)] border-transparent"
                )}
              >
                <div className="nav-item-left flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 stroke-[1.8]" />
                  <span>{view.label}</span>
                </div>

                {/* Right State indicator */}
                {view.id === "focus" && isActive ? (
                  <span className="mono-badge-active font-mono text-[9.5px] font-bold text-[#7F1D1D] bg-[#FFD8D2] border border-[#FFABA0] rounded px-1.5 py-0.5 tracking-wider">
                    NOW
                  </span>
                ) : null}

                {view.count !== undefined ? (
                  <span className="mono-count font-mono text-[10.5px] text-[var(--gray-400)]">
                    {view.count}
                  </span>
                ) : null}

                {view.isLive ? (
                  <span className="badge-live font-mono text-[10px] text-[#10B981] flex items-center gap-1.5">
                    <span className="dot-live w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                    <span>● 3 LIVE</span>
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Section 02 — Streams */}
        <div className="nav-section-label flex items-center justify-between font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--gray-400)] px-1.5 mt-3 mb-1.5">
          <span>02 — Streams</span>
          <button
            type="button"
            aria-label="Add Stream"
            className="text-xs text-[var(--gray-400)] hover:text-[var(--ink)] cursor-pointer"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {STREAMS.map((stream) => (
            <div
              key={stream.id}
              className="nav-pill-item h-[34px] flex items-center justify-between px-2.5 rounded-[6px] text-[13px] font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)] transition-all cursor-pointer"
            >
              <div className="nav-item-left flex items-center gap-2.5">
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ backgroundColor: stream.color }}
                />
                <span>{stream.name}</span>
              </div>
              <span className="mono-count font-mono text-[10.5px] text-[var(--gray-400)]">
                {stream.priority}
              </span>
            </div>
          ))}
        </div>

        {/* Daily Target Mini-Widget */}
        <div className="sidebar-target-card mt-auto pt-3.5 border-t border-gray-200 border-[var(--gray-200)]">
          <div className="target-meta-row flex justify-between items-center font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--gray-400)] mb-1.5">
            <span>DAILY TARGET:</span>
            <span className="text-[var(--ink)] font-semibold">3/4 SESSIONS</span>
          </div>
          <div className="target-bars-row grid grid-cols-4 gap-1 h-1">
            <div className="target-bar-seg filled bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[2px]" />
            <div className="target-bar-seg filled bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[2px]" />
            <div className="target-bar-seg filled bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[2px]" />
            <div className="target-bar-seg bg-[var(--gray-200)] rounded-[2px]" />
          </div>
        </div>
      </div>

      {/* Bottom Dock Card */}
      <div className="dock-island-card rounded-[16px] border border-gray-200 border-[var(--gray-200)] bg-bg bg-[var(--bg)] p-1.5 shadow-sm flex flex-col gap-0.5 shrink-0">
        {/* Theme Row */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleTheme}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggleTheme?.()
          }}
          className="dock-row-item h-[34px] px-2.5 rounded-[6px] flex items-center justify-between text-[12.5px] font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          <div className="dock-row-left flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-4 h-4 shrink-0 stroke-[1.8]" />
            ) : (
              <Sun className="w-4 h-4 shrink-0 stroke-[1.8]" />
            )}
            <span>Theme</span>
          </div>
          <div className="theme-segmented-pill flex bg-[var(--gray-100)] border border-gray-200 border-[var(--gray-200)] rounded-full p-0.5 gap-0.5">
            <span
              className={cn(
                "seg-opt font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full transition-all",
                !isDark
                  ? "active bg-[var(--bg)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--gray-400)]"
              )}
            >
              LIGHT
            </span>
            <span
              className={cn(
                "seg-opt font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full transition-all",
                isDark
                  ? "active bg-[var(--bg)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--gray-400)]"
              )}
            >
              DARK
            </span>
          </div>
        </div>

        {/* Audio Row */}
        <div className="dock-row-item h-[34px] px-2.5 rounded-[6px] flex items-center justify-between text-[12.5px] font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)] transition-colors cursor-pointer">
          <div className="dock-row-left flex items-center gap-2.5">
            <Headphones className="w-4 h-4 shrink-0 stroke-[1.8]" />
            <span>Audio</span>
          </div>
          <span className="audio-pill font-mono text-[10px] text-[var(--gray-400)] flex items-center gap-1.5">
            <span className="wave-bars inline-flex items-end gap-[2px] h-[9px]">
              <span className="w-[2px] h-1 bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[1px] animate-pulse" />
              <span className="w-[2px] h-2 bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[1px] animate-pulse" />
              <span className="w-[2px] h-1.5 bg-[#FF5A36] bg-[var(--coral-accent)] rounded-[1px] animate-pulse" />
            </span>
            <span>LO-FI</span>
          </span>
        </div>

        {/* Settings Row */}
        <div className="dock-row-item h-[34px] px-2.5 rounded-[6px] flex items-center justify-between text-[12.5px] font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)] transition-colors cursor-pointer">
          <div className="dock-row-left flex items-center gap-2.5">
            <Settings className="w-4 h-4 shrink-0 stroke-[1.8]" />
            <span>Settings</span>
          </div>
          <span className="search-kbd font-mono text-[10px] bg-[var(--bg)] border border-gray-200 border-[var(--gray-200)] px-1.5 py-0.5 rounded text-[var(--gray-500)]">
            ⌘,
          </span>
        </div>

        {/* Profile Row */}
        <div className="dock-row-item profile-row h-[42px] px-2 pt-1 mt-0.5 border-t border-gray-200 border-[var(--gray-200)] rounded-[6px] flex items-center justify-between text-[12.5px] hover:bg-[var(--gray-50)] transition-colors cursor-pointer">
          <div className="dock-row-left flex items-center gap-2.5">
            <div className="user-avatar-wrap relative w-6 h-6 shrink-0">
              <div className="user-avatar-circle w-6 h-6 rounded-full bg-[#FF5A36] bg-[var(--coral-accent)] text-white flex items-center justify-center text-[9.5px] font-bold">
                PS
              </div>
              <span className="avatar-status-dot absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#10B981] ring-1 ring-[var(--bg)]" />
            </div>
            <div className="user-text-wrap flex flex-col text-left leading-[1.15]">
              <span className="user-name-title text-xs font-semibold text-[var(--ink)]">
                Preston S.
              </span>
              <span className="user-subline font-mono text-[9px] text-[var(--gray-400)]">
                Studio · Pro Tier
              </span>
            </div>
          </div>
          <span className="text-[var(--gray-400)] text-sm tracking-widest">···</span>
        </div>
      </div>
    </aside>
  )
}
