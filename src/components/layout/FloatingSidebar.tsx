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
        "left-island flex h-full w-[240px] flex-col gap-3 overflow-hidden select-none",
        className
      )}
      data-testid="floating-sidebar"
    >
      {/* Top Nav Card */}
      <div className="nav-island-card bg-bg flex flex-1 flex-col overflow-y-auto rounded-[16px] border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] p-3.5 shadow-sm">
        {/* Brand Cluster */}
        <div className="brand-cluster mb-3 flex items-center justify-between px-1 py-0.5">
          <div className="brand-title-wrap flex items-center gap-2 text-[13px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            <svg
              className="brand-logo-glyph h-[18px] w-[18px] shrink-0 text-[#FF5A36] text-[var(--coral-accent)]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="8" height="8" rx="2.5" />
              <rect
                x="13"
                y="3"
                width="8"
                height="8"
                rx="2.5"
                fillOpacity="0.4"
              />
              <rect
                x="3"
                y="13"
                width="8"
                height="8"
                rx="2.5"
                fillOpacity="0.4"
              />
              <rect x="13" y="13" width="8" height="8" rx="2.5" />
            </svg>
            <span className="font-bold">TASK BUDDY</span>
            <span className="brand-plan-chip rounded border border-[var(--gray-200)] border-gray-200 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.04em] text-[var(--gray-400)]">
              PRO
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle Sidebar"
            className="collapse-btn flex h-6 w-6 cursor-pointer items-center justify-center rounded-[6px] text-[var(--gray-400)] transition-colors hover:bg-[var(--gray-100)] hover:text-[var(--ink)]"
          >
            ◫
          </button>
        </div>

        {/* Quick Jump Search */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Quick jump search"
          className="sidebar-search mb-3.5 flex h-8 cursor-pointer items-center justify-between rounded-[6px] border border-[var(--gray-200)] border-gray-200 bg-[#141418] bg-[var(--gray-50)] px-2.5 text-xs text-[var(--gray-400)] transition-all hover:border-[var(--gray-300)] hover:text-[var(--ink)]"
        >
          <div className="search-left flex items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Quick jump...</span>
          </div>
          <span className="search-kbd rounded border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--gray-500)]">
            ⌘K
          </span>
        </div>

        {/* Section 01 — Views */}
        <div className="nav-section-label mb-1.5 flex items-center justify-between px-1.5 font-mono text-[9.5px] font-semibold tracking-[0.08em] text-[var(--gray-400)] uppercase">
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
                  "nav-pill-item flex h-[34px] cursor-pointer items-center justify-between rounded-[6px] border px-2.5 text-left text-[13px] font-medium transition-all",
                  isActive
                    ? "active border-[var(--gray-200)] border-gray-200 bg-[var(--gray-100)] font-semibold text-[var(--ink)] shadow-xs"
                    : "border-transparent text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--ink)]"
                )}
              >
                <div className="nav-item-left flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 stroke-[1.8]" />
                  <span>{view.label}</span>
                </div>

                {/* Right State indicator */}
                {view.id === "focus" && isActive ? (
                  <span className="mono-badge-active rounded border border-[#FFABA0] bg-[#FFD8D2] px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-[#7F1D1D]">
                    NOW
                  </span>
                ) : null}

                {view.count !== undefined ? (
                  <span className="mono-count font-mono text-[10.5px] text-[var(--gray-400)]">
                    {view.count}
                  </span>
                ) : null}

                {view.isLive ? (
                  <span className="badge-live flex items-center gap-1.5 font-mono text-[10px] text-[#10B981]">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                    <span>● 3 LIVE</span>
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Section 02 — Streams */}
        <div className="nav-section-label mt-3 mb-1.5 flex items-center justify-between px-1.5 font-mono text-[9.5px] font-semibold tracking-[0.08em] text-[var(--gray-400)] uppercase">
          <span>02 — Streams</span>
          <button
            type="button"
            aria-label="Add Stream"
            className="cursor-pointer text-xs text-[var(--gray-400)] hover:text-[var(--ink)]"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {STREAMS.map((stream) => (
            <div
              key={stream.id}
              className="nav-pill-item flex h-[34px] cursor-pointer items-center justify-between rounded-[6px] px-2.5 text-[13px] font-medium text-[var(--gray-500)] transition-all hover:bg-[var(--gray-50)] hover:text-[var(--ink)]"
            >
              <div className="nav-item-left flex items-center gap-2.5">
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full"
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
        <div className="sidebar-target-card mt-auto border-t border-[var(--gray-200)] border-gray-200 pt-3.5">
          <div className="target-meta-row mb-1.5 flex items-center justify-between font-mono text-[9.5px] tracking-[0.06em] text-[var(--gray-400)] uppercase">
            <span>DAILY TARGET:</span>
            <span className="font-semibold text-[var(--ink)]">
              3/4 SESSIONS
            </span>
          </div>
          <div className="target-bars-row grid h-1 grid-cols-4 gap-1">
            <div className="target-bar-seg filled rounded-[2px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
            <div className="target-bar-seg filled rounded-[2px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
            <div className="target-bar-seg filled rounded-[2px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
            <div className="target-bar-seg rounded-[2px] bg-[var(--gray-200)]" />
          </div>
        </div>
      </div>

      {/* Bottom Dock Card */}
      <div className="dock-island-card bg-bg flex shrink-0 flex-col gap-0.5 rounded-[16px] border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] p-1.5 shadow-sm">
        {/* Theme Row */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleTheme}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggleTheme?.()
          }}
          className="dock-row-item flex h-[34px] cursor-pointer items-center justify-between rounded-[6px] px-2.5 text-[12.5px] font-medium text-[var(--gray-500)] transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--ink)]"
        >
          <div className="dock-row-left flex items-center gap-2.5">
            {isDark ? (
              <Moon className="h-4 w-4 shrink-0 stroke-[1.8]" />
            ) : (
              <Sun className="h-4 w-4 shrink-0 stroke-[1.8]" />
            )}
            <span>Theme</span>
          </div>
          <div className="theme-segmented-pill flex gap-0.5 rounded-full border border-[var(--gray-200)] border-gray-200 bg-[var(--gray-100)] p-0.5">
            <span
              className={cn(
                "seg-opt rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold transition-all",
                !isDark
                  ? "active bg-[var(--bg)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--gray-400)]"
              )}
            >
              LIGHT
            </span>
            <span
              className={cn(
                "seg-opt rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold transition-all",
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
        <div className="dock-row-item flex h-[34px] cursor-pointer items-center justify-between rounded-[6px] px-2.5 text-[12.5px] font-medium text-[var(--gray-500)] transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--ink)]">
          <div className="dock-row-left flex items-center gap-2.5">
            <Headphones className="h-4 w-4 shrink-0 stroke-[1.8]" />
            <span>Audio</span>
          </div>
          <span className="audio-pill flex items-center gap-1.5 font-mono text-[10px] text-[var(--gray-400)]">
            <span className="wave-bars inline-flex h-[9px] items-end gap-[2px]">
              <span className="h-1 w-[2px] animate-pulse rounded-[1px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
              <span className="h-2 w-[2px] animate-pulse rounded-[1px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
              <span className="h-1.5 w-[2px] animate-pulse rounded-[1px] bg-[#FF5A36] bg-[var(--coral-accent)]" />
            </span>
            <span>LO-FI</span>
          </span>
        </div>

        {/* Settings Row */}
        <div className="dock-row-item flex h-[34px] cursor-pointer items-center justify-between rounded-[6px] px-2.5 text-[12.5px] font-medium text-[var(--gray-500)] transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--ink)]">
          <div className="dock-row-left flex items-center gap-2.5">
            <Settings className="h-4 w-4 shrink-0 stroke-[1.8]" />
            <span>Settings</span>
          </div>
          <span className="search-kbd rounded border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--gray-500)]">
            ⌘,
          </span>
        </div>

        {/* Profile Row */}
        <div className="dock-row-item profile-row mt-0.5 flex h-[42px] cursor-pointer items-center justify-between rounded-[6px] border-t border-[var(--gray-200)] border-gray-200 px-2 pt-1 text-[12.5px] transition-colors hover:bg-[var(--gray-50)]">
          <div className="dock-row-left flex items-center gap-2.5">
            <div className="user-avatar-wrap relative h-6 w-6 shrink-0">
              <div className="user-avatar-circle flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5A36] bg-[var(--coral-accent)] text-[9.5px] font-bold text-white">
                PS
              </div>
              <span className="avatar-status-dot absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full bg-[#10B981] ring-1 ring-[var(--bg)]" />
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
          <span className="text-sm tracking-widest text-[var(--gray-400)]">
            ···
          </span>
        </div>
      </div>
    </aside>
  )
}
