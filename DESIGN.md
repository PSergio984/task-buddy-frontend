---
# Task Buddy — Design System
# A premium productivity application with a dual-identity design:
# clean & minimal in light mode, deep navy & warm amber in dark mode.

colors:
  # Light mode
  background: "#fafafa"
  foreground: "#09090b"
  card: "#ffffff"
  card-foreground: "#09090b"
  popover: "#ffffff"
  popover-foreground: "#09090b"
  primary: "#18181b"
  primary-foreground: "#fafafa"
  secondary: "#f4f4f5"
  secondary-foreground: "#18181b"
  muted: "#f4f4f5"
  muted-foreground: "#71717a"
  accent: "#2563eb"          # Electric blue — CTA, links, rings, active states
  accent-foreground: "#ffffff"
  destructive: "#ef4444"
  destructive-foreground: "#fafafa"
  success: "#22c55e"
  success-foreground: "#fafafa"
  border: "#e4e4e7"
  input: "#e4e4e7"
  ring: "#2563eb"
  sidebar: "#ffffff"
  sidebar-foreground: "#09090b"
  sidebar-primary: "#18181b"
  sidebar-primary-foreground: "#fafafa"
  sidebar-accent: "#f4f4f5"
  sidebar-accent-foreground: "#18181b"
  sidebar-border: "#e4e4e7"
  sidebar-ring: "#2563eb"

  # Dark mode overrides (deep navy + warm amber accent)
  dark-background: "#0f172a"
  dark-foreground: "#f1f5f9"
  dark-card: "#0f172a"
  dark-card-foreground: "#f1f5f9"
  dark-popover: "#0f172a"
  dark-popover-foreground: "#f1f5f9"
  dark-primary: "#f1f5f9"
  dark-primary-foreground: "#0f172a"
  dark-secondary: "#1f2937"
  dark-secondary-foreground: "#f1f5f9"
  dark-muted: "#111827"
  dark-muted-foreground: "#cbd5e1"
  dark-accent: "#c2a388"     # Warm amber — replaces electric blue in dark mode
  dark-accent-foreground: "#0f172a"
  dark-destructive: "#f87171"
  dark-destructive-foreground: "#000000"
  dark-success: "#34d399"
  dark-success-foreground: "#064e3b"
  dark-border: "#0b1220"
  dark-input: "#0b1220"
  dark-ring: "#c2a388"
  dark-sidebar: "#071122"    # Slightly darker than background for depth
  dark-sidebar-foreground: "#f1f5f9"
  dark-sidebar-primary: "#f1f5f9"
  dark-sidebar-primary-foreground: "#0f172a"
  dark-sidebar-accent: "#c2a388"
  dark-sidebar-accent-foreground: "#0f172a"
  dark-sidebar-border: "#0b1220"
  dark-sidebar-ring: "#c2a388"

  # Semantic feedback (toast)
  toast-success-bg: "#f0fdf4"
  toast-success-border: "#bbf7d0"
  toast-success-text: "#166534"
  toast-destructive-bg: "#fff1f2"
  toast-destructive-border: "#fecaca"
  toast-destructive-text: "#991b1b"
  dark-toast-success-bg: "#064e3b"
  dark-toast-success-border: "#065f46"
  dark-toast-success-text: "#f0fdf4"
  dark-toast-destructive-bg: "#450a0a"
  dark-toast-destructive-border: "#7f1d1d"
  dark-toast-destructive-text: "#fef2f2"

typography:
  font-family-sans: "'Plus Jakarta Sans', sans-serif"
  font-family-heading: "'Plus Jakarta Sans', sans-serif"
  # Heading style: font-black (weight 900), tracking-tighter, uppercase
  # Body style: font-medium or font-bold, normal tracking
  # Section labels: 10px, font-black, tracking-[0.3–0.4em], uppercase (all-caps micro-labels)
  # Brand tagline: 10px, font-black, tracking-[0.4em], accent color at 80% opacity
  scale:
    hero: "clamp(3rem, 8vw, 6rem)"      # Landing page headline
    h1: "2.25rem"                        # Page titles (text-4xl)
    h2: "1.5rem"                         # Section headers (text-2xl)
    h3: "1.25rem"                        # Card titles (text-xl)
    body: "0.875rem"                     # Default body (text-sm)
    caption: "0.625rem"                  # Micro-labels (text-[10px])

radii:
  sm: "0.6rem"     # calc(--radius * 0.6)
  md: "0.8rem"     # calc(--radius * 0.8)
  lg: "1rem"       # base --radius
  xl: "1.4rem"     # calc(--radius * 1.4)
  2xl: "1.8rem"    # calc(--radius * 1.8)
  3xl: "2.2rem"    # calc(--radius * 2.2)  — task cards, major containers
  4xl: "2.6rem"    # calc(--radius * 2.6)  — hero elements, tab bars
  full: "9999px"   # Pills, tags, badge chips

spacing:
  sidebar-width: "320px"
  sidebar-width-collapsed: "96px"
  content-padding-sm: "1rem"
  content-padding-md: "2rem"
  content-padding-lg: "3rem"
  section-gap: "2.5rem"    # gap-10 between major sections
  card-gap: "1.5rem"       # gap-6 between cards
  nav-item-gap: "0.5rem"   # gap-2 between nav links

elevation:
  sidebar-shadow: "20px 0 50px -20px rgba(0,0,0,0.4)"
  card-shadow: "0 1px 3px rgba(0,0,0,0.06)"
  active-nav-shadow: "0 15px 40px -10px rgba(var(--primary-rgb),0.5)"
  tooltip-shadow: "0 8px 32px rgba(0,0,0,0.3)"
  modal-shadow: "0 24px 64px rgba(0,0,0,0.2)"
  logo-shadow: "0 8px 32px rgba(var(--primary-rgb),0.3)"
  glow-dot: "0 0 10px currentColor"
  glow-ring: "0 0 5px currentColor"

motion:
  sidebar-transition: "0.5s cubic-bezier(0.4, 0, 0.2, 1)"
  page-fade-in: "opacity 0.3s ease"
  card-enter: "opacity 0s→1, scale 0.9→1, y 20→0; spring stiffness 260 damping 20"
  card-exit: "opacity 1→0, scale 1→0.9, y 0→-20"
  card-stagger-delay: "0.05s per card"
  hover-scale: "scale(1.01) on nav items; scale(1.05) on tags/buttons"
  hover-lift: "x: 4px on project rows (non-collapsed)"
  tab-transition: "framer-motion layoutId for active pill indicator"
  logo-hover: "rotate 10deg, scale 1.1"
  toggle-button: "scale 1.1 on hover, scale 0.9 on tap"
  content-slide-up: "y 24→0, opacity 0→1 over 0.4s, delayed 0.2s"

effects:
  backdrop-blur-sidebar: "backdrop-blur-3xl (72px)"
  backdrop-blur-content: "backdrop-blur-3xl"
  backdrop-blur-tab-bar: "backdrop-blur-2xl"
  sidebar-bg-opacity: "bg-background/60 (60% opacity)"
  content-bg-opacity: "bg-background/20 (20% overlay)"
  glass-panel: "bg-white/5 with backdrop-blur"
  tab-bar-bg: "bg-white/5"
  dark-sidebar-border: "border-white/5"
  icon-container: "bg-primary/10 or bg-accent/10 for section icon badges"
---

# Task Buddy — Design System

## Brand Identity

Task Buddy is positioned as an **"Elite Productivity"** tool — the tagline "The calm in the middle of the storm" defines its personality. The visual language is bold, dark, and premium, borrowing from executive dashboards and luxury productivity software. Language throughout the UI uses power-terminology: "Executive Dashboard", "Strategic Agenda", "Control Center", "Task Studio".

## Dual-Mode Identity

The application has two visually distinct but coherent personalities:

**Light Mode** — Crisp and editorial. Near-white background (`#fafafa`), near-black text (`#09090b`), and electric blue (`#2563eb`) as the sole accent. The overall feel is clean, confident, and minimal — similar to a high-end SaaS dashboard.

**Dark Mode** — Deep navy and warm amber. The background is a rich deep navy (`#0f172a`), and the accent shifts dramatically from electric blue to warm amber (`#c2a388`). This is the "signature" mode that defines Task Buddy's premium identity. The sidebar goes one step deeper (`#071122`) for clear depth hierarchy. The warm amber accent creates a sophisticated contrast against the cool navy — evoking premium watches or executive leather.

## Layout Architecture

The app uses a **fixed sidebar + scrollable content** layout.

- **Sidebar**: 320px expanded, 96px collapsed. The sidebar slides smoothly using Framer Motion with a cubic-bezier ease (`[0.4, 0, 0.2, 1]`). It uses a glass-morphism style: `bg-background/60 backdrop-blur-3xl` with a dramatic shadow `20px 0 50px -20px rgba(0,0,0,0.4)`. A floating toggle button sits at the right edge of the sidebar, `-right-5` to overlap the content boundary.
- **Content area**: `bg-background/20 backdrop-blur-3xl` — a very light wash over the background, not a solid surface. Padding scales: `p-4` → `p-8` → `p-12` across breakpoints.
- **Dashboard grid**: Stats + Audit Trail in a `lg:grid-cols-3` layout (1 col stats, 2 cols audit), with task cards below in a `xl:grid-cols-2` grid.

## Typography Conventions

All headings use `font-black` (weight 900) and `tracking-tighter` or `uppercase` — this is non-negotiable for the brand voice. Micro-labels (section dividers like "Control Center", "Projects", "Focus Tags") use `text-[10px] font-black tracking-[0.3–0.4em] uppercase` and appear at 40% opacity (`text-foreground/40`).

The brand tagline "Elite Productivity" under the logo uses `text-[10px] font-black tracking-[0.4em] text-accent/80 uppercase` — extremely wide letter-spacing with the accent color at 80% opacity.

Body text and descriptions use `font-medium` at `text-foreground/60` opacity — always secondary to the dominant heading hierarchy.

## Component Patterns

### Navigation Items (Active State)
Active nav items use `bg-primary text-primary-foreground` with a dramatic shadow: `0 15px 40px -10px rgba(primary,0.5)`. A glowing white dot (`h-2 w-2 rounded-full bg-primary-foreground shadow-[0_0_10px_white]`) is animated with `layoutId` to slide between active items. Items scale up slightly on active (`scale-[1.02]`).

### Cards
Cards use extreme border radius: `rounded-[2.5rem]` (40px). In dark mode they use `dark:bg-zinc-900`. No border — depth is conveyed through shadow and background difference alone. Task cards animate in with spring physics: stiffness 260, damping 20, staggered at 50ms per card.

### Tags & Badges
Tags are pill-shaped (`rounded-full`), using `text-[10px] font-black uppercase tracking-wider`. Active tags use `bg-primary` with a `ring-2 ring-primary/20` halo. Inactive tags use `bg-white/5` glass effect. Each tag has a tiny colored dot (`h-2 w-2 rounded-full`) with a `shadow-[0_0_5px_currentColor]` glow matching the tag's color.

### Tab Bar
The filter tab bar uses `h-14 rounded-[2rem]` with `bg-white/5 backdrop-blur-2xl`. Active tab uses `bg-primary` with `rounded-3xl`. Tab labels use `text-[10px] font-black tracking-[0.3em] uppercase`.

### Icon Containers
Section icons are wrapped in small containers: `h-10 w-10 rounded-xl bg-accent/10` or `h-12 w-12 rounded-2xl bg-primary/10`. These provide a subtle tinted background behind Lucide icons, maintaining the color system without using full-opacity fills.

### Empty States
Empty states use `rounded-[3rem] border-2 border-dashed border-border/30 bg-white/5` — a softly dashed, glass-tinted container. The empty state icon sits in a `h-20 w-20 rounded-[2rem] bg-muted/20` container. Heading uses `font-bold uppercase tracking-tight`; description uses `text-muted-foreground font-medium italic`.

### Tooltips (Collapsed Sidebar)
When the sidebar is collapsed, nav items and project/tag items show tooltips on hover. Tooltips use `bg-primary text-primary-foreground border-none px-4 py-2 rounded-xl font-bold shadow-2xl` — they look like small primary-colored chips.

## Motion Philosophy

Framer Motion is used throughout. The UI should feel **alive but not distracting**:
- Sidebar width animates on toggle (500ms, ease-out cubic-bezier)
- Page content fades in on route change (300ms)
- Cards animate in with spring physics and stagger — the list should feel like cards flowing into place, not appearing all at once
- Hover states on interactive elements use `whileHover` and `whileTap` with subtle scale changes (1.01–1.1 up, 0.9–0.98 down)
- The active nav indicator slides between items using `layoutId` — a shared layout animation

## Glassmorphism Usage

Glass effects are used selectively and layered:
1. Sidebar: `bg-background/60 backdrop-blur-3xl` — the most opaque glass surface
2. Content area: `bg-background/20 backdrop-blur-3xl` — very light wash
3. Tab bars, inactive items: `bg-white/5` with `backdrop-blur-2xl` or `backdrop-blur-2xl` — barely-there glass
4. Empty state containers: `bg-white/5` — hint of surface

The rule: the further from the primary navigation, the more transparent the glass.

## Color Usage Rules

- **Electric blue `#2563eb`** (light) / **Warm amber `#c2a388`** (dark): Used only for active states, rings, key CTAs, and the brand's accent dot. Do not dilute with overuse.
- **Primary `#18181b`** (light) / **`#f1f5f9`** (dark): Used for active nav items, primary buttons, and important filled elements.
- **Opacity modifiers** are heavily used for hierarchy: `text-foreground/60` for secondary text, `text-foreground/40` for tertiary/labels, `text-foreground/20` for disabled/hint states.
- **Project colors**: Each project has a user-assigned hex color applied to a `h-6 w-6 rounded-lg` swatch with a white Layers icon inside. Inactive swatches are at 40% opacity.
- **Tag dots**: Each tag's color is applied as both the dot background and the CSS `color` property for the `shadow-[0_0_5px_currentColor]` glow effect.
