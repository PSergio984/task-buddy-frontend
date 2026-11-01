/**
 * Focus-session domain logic (pure, no React).
 *
 * Two consumers: the Focus page renders every session through
 * `deriveSessionView` (server- and client-run sessions share the FocusSession
 * shape), and a fully offline session is driven by `evaluateLocal` + the local
 * verb functions, which mirror the backend's app/game/session_engine.py rules —
 * same statuses, same pause budget, same 5-minute absence grace.
 * mirror-drift: GRACE_SECONDS, the pause budget and transition rules below
 * duplicate session_engine.py — a backend change must be mirrored here.
 *
 * Scoring is server-authoritative: a local run can only emit client-claimable
 * events (`focus_phase_completed`, `damage`) — session/phase lifecycle types
 * are server-authored and /api/v1/game/events rejects them.
 */

import { del, get, set } from "idb-keyval"
import type {
  FocusSession,
  GameEventIn,
  SessionDifficulty,
  SessionMode,
  SessionPhaseIn,
  SessionPhaseOut,
  SessionStartRequest,
} from "@/lib/api"
import { createUuid } from "@/lib/utils"
import type { UserId } from "@/lib/sync-queue"

/** Long break replaces the short break after every Nth focus phase. */
const LONG_BREAK_EVERY = 4

export const GRACE_SECONDS = 300 // absence grace after a phase boundary
export const STOPWATCH_MILESTONE_SECONDS = 25 * 60

export const FOCUS_PRESETS = {
  classic: { label: "Classic", focus: 25, short: 5, long: 15 },
  quick: { label: "Quick", focus: 15, short: 3, long: 10 },
  deep: { label: "Extended", focus: 50, short: 10, long: 30 },
} as const

export type FocusPresetId = keyof typeof FOCUS_PRESETS | "custom"

export interface FocusPlanOptions {
  focusMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  /** Number of focus legs (1–8); a long break closes the plan. */
  cycles: number
}

const clampInt = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)))

/** Expand a preset into the flat phase list SessionStartIn.phases expects. */
export function buildPhasePlan(opts: FocusPlanOptions): SessionPhaseIn[] {
  const cycles = clampInt(opts.cycles, 1, 8)
  const focus = clampInt(opts.focusMinutes, 1, 600)
  const short = clampInt(opts.breakMinutes, 1, 600)
  const long = clampInt(opts.longBreakMinutes, 1, 600)
  const phases: SessionPhaseIn[] = []
  for (let i = 0; i < cycles; i++) {
    phases.push({ kind: "focus", minutes: focus })
    const longDue = (i + 1) % LONG_BREAK_EVERY === 0 || i === cycles - 1
    phases.push({ kind: "break", minutes: longDue ? long : short })
  }
  return phases
}

// ---------------------------------------------------------------------------
// Session setup — everything the settings sheet edits, in schema terms

export interface FocusSettings {
  mode: SessionMode
  presetId: FocusPresetId
  customFocus: number
  customBreak: number
  customLongBreak: number
  /** Focus legs per plan (long break closes it); presets default to 4. */
  cycles: number
  autoBreaks: boolean
  autoFocus: boolean
  /** Auto-enter the distraction-free variant on start. */
  immersive: boolean
  /** Work/break end alert tones. */
  alerts: boolean
  /** Alert loudness 0–100 (applies to the WebAudio tones). */
  alertVolume: number
  difficulty: SessionDifficulty
  pauseCount: number
  pauseSeconds: number
  taskId: number | null
  tagId: number | null
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  mode: "timer",
  presetId: "classic",
  customFocus: 25,
  customBreak: 5,
  customLongBreak: 15,
  cycles: 4,
  autoBreaks: true,
  autoFocus: false,
  immersive: false,
  alerts: true,
  alertVolume: 80,
  difficulty: "easy",
  pauseCount: 3,
  pauseSeconds: 300,
  taskId: null,
  tagId: null,
}

/** Translate UI settings into the SessionStartIn contract. */
export function sessionStartFromSettings(
  s: FocusSettings
): SessionStartRequest {
  const resolved =
    s.presetId === "custom"
      ? { focus: s.customFocus, short: s.customBreak, long: s.customLongBreak }
      : FOCUS_PRESETS[s.presetId]
  return {
    mode: s.mode,
    ...(s.mode === "timer"
      ? {
          phases: buildPhasePlan({
            focusMinutes: resolved.focus,
            breakMinutes: resolved.short,
            longBreakMinutes: resolved.long,
            cycles: s.cycles,
          }),
        }
      : {}),
    task_id: s.taskId,
    tag_id: s.tagId,
    difficulty: s.difficulty,
    auto_start_breaks: s.autoBreaks,
    auto_start_focus: s.autoFocus,
    pause_budget_count: clampInt(s.pauseCount, 0, 20),
    pause_budget_seconds: clampInt(s.pauseSeconds, 60, 3600),
  }
}

/** One-line plan summary under the setup controls ("Classic · 25/5/15 ×4"). */
export function describePlan(s: FocusSettings): string {
  if (s.mode === "stopwatch") return "Stopwatch · open-ended · milestone XP"
  const r =
    s.presetId === "custom"
      ? { label: "Custom", focus: s.customFocus, short: s.customBreak, long: s.customLongBreak }
      : FOCUS_PRESETS[s.presetId]
  return `${r.label} · ${r.focus}/${r.short}/${r.long} min × ${clampInt(s.cycles, 1, 8)} cycles`
}

// ---------------------------------------------------------------------------
// Phase/session state helpers (shared by server and local sessions)

const LIVE = new Set(["active", "paused"])

export function livePhase(session: FocusSession): SessionPhaseOut | null {
  return session.phases.find((p) => LIVE.has(p.status)) ?? null
}

export function nextPendingPhase(
  session: FocusSession
): SessionPhaseOut | null {
  return session.phases.find((p) => p.status === "pending") ?? null
}

export function completedFocusCount(session: FocusSession): number {
  return session.phases.filter(
    (p) => p.kind === "focus" && p.status === "completed"
  ).length
}

export function focusPhaseCount(session: FocusSession): number {
  return session.phases.filter((p) => p.kind === "focus").length
}

/** ISO → epoch ms; offset-less strings (SQLite datetimes) parse as UTC. */
export const ms = (iso: string | null): number | null =>
  iso === null
    ? null
    : Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`)

const iso = (epoch: number): string => new Date(epoch).toISOString()

/** Wall-clock instant an active timed phase ends (banked pauses included). */
export function phaseEndMs(phase: SessionPhaseOut): number | null {
  const start = ms(phase.started_at)
  if (start === null) return null
  return start + (phase.planned_seconds + (phase.paused_seconds || 0)) * 1000
}

/** Seconds left on a timed phase; freezes while paused. */
export function remainingSeconds(
  phase: SessionPhaseOut,
  nowMs: number
): number {
  const end = phaseEndMs(phase)
  if (end === null) return phase.planned_seconds
  const anchor =
    phase.status === "paused" && phase.pause_started_at !== null
      ? (ms(phase.pause_started_at) ?? nowMs)
      : nowMs
  return Math.max(0, Math.ceil((end - anchor) / 1000))
}

/** Clocked (unpaused) seconds a stopwatch leg has banked so far. */
export function stopwatchElapsedSeconds(
  phase: SessionPhaseOut,
  nowMs: number
): number {
  const start = ms(phase.started_at)
  if (start === null) return 0
  let anchor = nowMs
  if (phase.status === "paused" && phase.pause_started_at !== null) {
    anchor = ms(phase.pause_started_at) ?? nowMs
  } else if (phase.ended_at !== null) {
    anchor = ms(phase.ended_at) ?? nowMs
  }
  return Math.max(
    0,
    Math.floor((anchor - start) / 1000) - (phase.paused_seconds || 0)
  )
}

/** Total paused seconds on a phase, including the still-open pause. */
export function pauseUsedSeconds(
  phase: SessionPhaseOut,
  nowMs: number
): number {
  let used = phase.paused_seconds || 0
  if (phase.status === "paused" && phase.pause_started_at !== null) {
    const start = ms(phase.pause_started_at)
    if (start !== null) used += Math.max(0, Math.floor((nowMs - start) / 1000))
  }
  return used
}

/** Instant the open pause blows the seconds budget, if one is running. */
function pauseOverflowMs(
  session: FocusSession,
  phase: SessionPhaseOut
): number | null {
  if (phase.status !== "paused" || phase.kind === "stopwatch") return null
  const start = ms(phase.pause_started_at)
  if (start === null) return null
  const remaining = session.pause_budget_seconds - (phase.paused_seconds || 0)
  return start + remaining * 1000
}

/** Newest finished phase end (or session start) — the grace-window anchor. */
function lastEndMs(session: FocusSession): number {
  const ends = session.phases
    .map((p) => ms(p.ended_at))
    .filter((v): v is number => v !== null)
  return ends.length > 0 ? Math.max(...ends) : (ms(session.started_at) ?? 0)
}

export function graceDeadlineMs(session: FocusSession): number | null {
  if (livePhase(session) !== null || nextPendingPhase(session) === null) {
    return null
  }
  return lastEndMs(session) + GRACE_SECONDS * 1000
}

/** Earliest instant the session could change on its own; null = nothing due. */
export function nextDeadlineMs(session: FocusSession): number | null {
  if (session.status !== "active") return null
  const live = livePhase(session)
  if (live === null) return graceDeadlineMs(session)
  if (live.kind === "stopwatch") return null
  if (live.status === "paused") return pauseOverflowMs(session, live)
  return phaseEndMs(live)
}

// ---------------------------------------------------------------------------
// Local (offline) session — mirrors app/game/session_engine.py

export interface LocalSession {
  /** UUID prefixing every emitted client_event_id (stable across reloads). */
  client_id: string
  session: FocusSession
}

export interface LocalSessionInput {
  mode: SessionMode
  phases: SessionPhaseIn[]
  task_id: number | null
  tag_id: number | null
  difficulty: SessionDifficulty
  auto_start_breaks: boolean
  auto_start_focus: boolean
  pause_budget_count: number
  pause_budget_seconds: number
}

export function createLocalSession(
  input: LocalSessionInput,
  nowMs: number
): LocalSession {
  const plan =
    input.mode === "stopwatch"
      ? [{ kind: "stopwatch", seconds: 0 }]
      : input.phases.map((p) => ({ kind: p.kind, seconds: p.minutes * 60 }))
  const started = iso(nowMs)
  return {
    client_id: createUuid(),
    session: {
      id: 0,
      mode: input.mode,
      status: "active",
      task_id: input.task_id,
      activity_label: null,
      preset: {
        difficulty: input.difficulty,
        auto_start_breaks: input.auto_start_breaks,
        auto_start_focus: input.auto_start_focus,
        ...(input.tag_id !== null ? { tag_id: input.tag_id } : {}),
      },
      pause_budget_count: input.pause_budget_count,
      pause_budget_seconds: input.pause_budget_seconds,
      started_at: started,
      ended_at: null,
      phases: plan.map((p, i) => ({
        seq: i,
        kind: p.kind,
        status: i === 0 ? "active" : "pending",
        planned_seconds: p.seconds,
        actual_seconds: null,
        pause_count: 0,
        paused_seconds: 0,
        pause_started_at: null,
        started_at: i === 0 ? started : null,
        ended_at: null,
      })),
    },
  }
}

function difficultyOf(session: FocusSession): string {
  return session.preset?.difficulty ?? "easy"
}

function completionEvent(
  local: LocalSession,
  phase: SessionPhaseOut,
  minutes: number,
  atMs: number
): GameEventIn {
  return {
    client_event_id: `web:${local.client_id}:focus_phase_completed:${phase.seq}`,
    type: "focus_phase_completed",
    client_ts: iso(atMs),
    payload: {
      local_session_id: local.client_id,
      phase_seq: phase.seq,
      minutes,
      difficulty: difficultyOf(local.session),
    },
  }
}

function abandonEvent(
  local: LocalSession,
  reason: string,
  phaseSeq: number | null,
  atMs: number
): GameEventIn {
  // session_abandoned itself is server-authored; `damage` is the claimable
  // carrier for the HP loss an offline abandon still owes (spec: stakes).
  return {
    client_event_id: `web:${local.client_id}:session_abandoned:${reason}`,
    type: "damage",
    client_ts: iso(atMs),
    payload: {
      local_session_id: local.client_id,
      reason,
      phase_seq: phaseSeq,
      difficulty: difficultyOf(local.session),
    },
  }
}

function resolveNoLive(local: LocalSession, nowMs: number): GameEventIn[] {
  const session = local.session
  if (nextPendingPhase(session) === null) {
    session.status = "ended"
    session.ended_at = iso(lastEndMs(session))
    return []
  }
  const anchor = lastEndMs(session)
  if (nowMs < anchor + GRACE_SECONDS * 1000) return []
  const at = anchor + GRACE_SECONDS * 1000
  if (completedFocusCount(session) === 0) {
    session.status = "abandoned"
    session.ended_at = iso(at)
    return [abandonEvent(local, "absence_grace", null, at)]
  }
  session.status = "ended"
  session.ended_at = iso(at)
  return []
}

function checkPauseOverflow(
  local: LocalSession,
  phase: SessionPhaseOut,
  nowMs: number
): GameEventIn[] {
  const session = local.session
  const banked = phase.paused_seconds || 0
  const pauseStart = ms(phase.pause_started_at) ?? nowMs
  const extra = Math.floor((nowMs - pauseStart) / 1000)
  if (banked + extra <= session.pause_budget_seconds) return []
  const crossedAt = pauseStart + (session.pause_budget_seconds - banked) * 1000
  session.status = "abandoned"
  session.ended_at = iso(crossedAt)
  phase.status = "abandoned"
  phase.ended_at = iso(crossedAt)
  phase.paused_seconds = banked + extra
  phase.pause_started_at = null
  return [abandonEvent(local, "pause_overflow", phase.seq, crossedAt)]
}

function completePhase(
  local: LocalSession,
  phase: SessionPhaseOut,
  endMs: number,
  events: GameEventIn[]
): void {
  const session = local.session
  phase.status = "completed"
  phase.actual_seconds = phase.planned_seconds
  phase.ended_at = iso(endMs)
  if (phase.kind === "focus") {
    events.push(
      completionEvent(
        local,
        phase,
        Math.max(1, Math.floor(phase.planned_seconds / 60)),
        endMs
      )
    )
  }
  const next = nextPendingPhase(session)
  const auto = next?.kind === "break"
    ? session.preset?.auto_start_breaks !== false
    : session.preset?.auto_start_focus === true
  if (next !== null && auto) {
    next.status = "active"
    next.started_at = iso(endMs)
  }
}

/**
 * Replay elapsed wall-clock transitions on a client-run session; mutates in
 * place and returns the claimable scoring events each transition produced.
 * Idempotent — safe to call every render tick.
 */
export function evaluateLocal(local: LocalSession, nowMs: number): GameEventIn[] {
  const session = local.session
  if (session.status !== "active") return []
  const events: GameEventIn[] = []
  for (;;) {
    const cur = livePhase(session)
    if (cur === null) {
      events.push(...resolveNoLive(local, nowMs))
      return events
    }
    if (cur.kind === "stopwatch") return events
    if (cur.status === "paused") {
      events.push(...checkPauseOverflow(local, cur, nowMs))
      return events
    }
    const end = phaseEndMs(cur)
    if (end === null || nowMs < end) return events
    completePhase(local, cur, end, events)
  }
}

export function pauseLocal(
  local: LocalSession,
  nowMs: number
): GameEventIn[] {
  const session = local.session
  if (session.status !== "active") return []
  const phase = livePhase(session)
  if (phase === null || phase.status !== "active") {
    throw new Error("no running phase to pause")
  }
  if (phase.kind === "break") throw new Error("breaks cannot be paused")
  if (
    phase.kind === "stopwatch" ||
    phase.pause_count + 1 <= session.pause_budget_count
  ) {
    phase.pause_count += 1
    phase.pause_started_at = iso(nowMs)
    phase.status = "paused"
    return []
  }
  phase.status = "abandoned"
  phase.ended_at = iso(nowMs)
  session.status = "abandoned"
  session.ended_at = iso(nowMs)
  return [abandonEvent(local, "pause_overflow", phase.seq, nowMs)]
}

export function resumeLocal(
  local: LocalSession,
  nowMs: number
): GameEventIn[] {
  const session = local.session
  if (session.status !== "active") return []
  const phase = livePhase(session)
  if (phase === null || phase.status !== "paused") {
    throw new Error("no paused phase to resume")
  }
  const pauseStart = ms(phase.pause_started_at) ?? nowMs
  const extra = Math.floor((nowMs - pauseStart) / 1000)
  if (
    phase.kind === "focus" &&
    (phase.paused_seconds || 0) + extra > session.pause_budget_seconds
  ) {
    phase.status = "abandoned"
    phase.ended_at = iso(nowMs)
    phase.paused_seconds = (phase.paused_seconds || 0) + extra
    phase.pause_started_at = null
    session.status = "abandoned"
    session.ended_at = iso(nowMs)
    return [abandonEvent(local, "pause_overflow", phase.seq, nowMs)]
  }
  phase.paused_seconds = (phase.paused_seconds || 0) + extra
  phase.pause_started_at = null
  phase.status = "active"
  return []
}

export function advanceLocal(
  local: LocalSession,
  nowMs: number
): GameEventIn[] {
  const session = local.session
  if (session.status !== "active") return []
  const live = livePhase(session)
  if (live !== null && live.kind === "break" && live.status === "active") {
    live.status = "skipped"
    live.ended_at = iso(nowMs)
    const next = nextPendingPhase(session)
    if (next !== null) {
      next.status = "active"
      next.started_at = iso(nowMs)
      return []
    }
    session.status = "ended"
    session.ended_at = iso(nowMs)
    return []
  }
  if (live !== null) throw new Error("a phase is still running")
  const next = nextPendingPhase(session)
  if (next === null) throw new Error("no pending phase")
  next.status = "active"
  next.started_at = iso(nowMs)
  return []
}

export function stopLocal(local: LocalSession, nowMs: number): GameEventIn[] {
  const session = local.session
  const events: GameEventIn[] = []
  if (session.status !== "active") return events
  const live = livePhase(session)
  if (live !== null && live.kind === "stopwatch") {
    // Bank the open pause too — else it counts as focus time (engine parity).
    if (live.status === "paused" && live.pause_started_at !== null) {
      live.paused_seconds =
        (live.paused_seconds || 0) +
        Math.floor((nowMs - (ms(live.pause_started_at) ?? nowMs)) / 1000)
      live.pause_started_at = null
    }
    live.actual_seconds = stopwatchElapsedSeconds(live, nowMs)
    live.status = "completed"
    live.ended_at = iso(nowMs)
    // No claimable event: milestone XP is server-authored and claiming the
    // per-minute focus_phase_completed instead would over-pay (XP+gold).
  } else if (live !== null) {
    if (live.status === "paused" && live.pause_started_at !== null) {
      live.paused_seconds =
        (live.paused_seconds || 0) +
        Math.floor((nowMs - (ms(live.pause_started_at) ?? nowMs)) / 1000)
      live.pause_started_at = null
    }
    live.status = live.kind === "focus" ? "abandoned" : "skipped"
    live.ended_at = iso(nowMs)
  }
  if (live?.kind !== "stopwatch" && completedFocusCount(session) === 0) {
    session.status = "abandoned"
    session.ended_at = iso(nowMs)
    events.push(
      abandonEvent(local, "manual_stop", live?.seq ?? null, nowMs)
    )
    return events
  }
  session.status = "ended"
  session.ended_at = iso(nowMs)
  return events
}

// ---------------------------------------------------------------------------
// Local-session persistence (survives reload — sessions are wall-clock)

const localKey = (userId: UserId) => `focus-local-session:${userId}`

export async function saveLocalSession(
  userId: UserId,
  local: LocalSession
): Promise<void> {
  await set(localKey(userId), local)
}

export async function loadLocalSession(
  userId: UserId
): Promise<LocalSession | null> {
  const stored = await get<LocalSession>(localKey(userId))
  return stored?.session ? stored : null
}

export async function clearLocalSession(userId: UserId): Promise<void> {
  await del(localKey(userId))
}

// ---------------------------------------------------------------------------
// Display derivation — everything the Focus page needs, one pure call

export type SessionClockStatus =
  | "running"
  | "paused"
  | "awaiting"
  | "ended"
  | "abandoned"

export interface SessionView {
  status: SessionClockStatus
  live: SessionPhaseOut | null
  pending: SessionPhaseOut | null
  /** Seconds the ring should show (remaining for timed, elapsed stopwatch). */
  clockSeconds: number
  /** Ring fill fraction 0..1. */
  progress: number
  /** Uppercase sub-label under the clock, e.g. "FOCUS · PHASE 1/4". */
  kindLabel: string
  focusDone: number
  focusTotal: number
  /** Pause budget left on the live phase; null when pausing doesn't apply. */
  pausesLeft: number | null
  pauseUsedSec: number
  pauseBudgetSec: number
  /** Seconds until absence-grace ends the session (awaiting only). */
  graceEndsInSec: number | null
  nextDeadlineMs: number | null
}

const KIND_LABEL: Record<string, string> = {
  focus: "Focus",
  break: "Break",
  stopwatch: "Stopwatch",
}

export function deriveSessionView(
  session: FocusSession,
  nowMs: number
): SessionView {
  const live = livePhase(session)
  const pending = nextPendingPhase(session)
  const focusDone = completedFocusCount(session)
  const focusTotal = focusPhaseCount(session)
  const base = {
    live,
    pending,
    focusDone,
    focusTotal,
    pauseUsedSec: live ? pauseUsedSeconds(live, nowMs) : 0,
    pauseBudgetSec: session.pause_budget_seconds,
    nextDeadlineMs: nextDeadlineMs(session),
    graceEndsInSec: null as number | null,
    pausesLeft: null as number | null,
  }
  if (session.status !== "active") {
    return {
      ...base,
      status: session.status === "abandoned" ? "abandoned" : "ended",
      clockSeconds: 0,
      progress: 1,
      kindLabel:
        session.status === "abandoned" ? "Abandoned" : "Session complete",
    }
  }
  if (live === null) {
    const grace = graceDeadlineMs(session)
    const label =
      pending === null
        ? "Wrapping up"
        : `Up next: ${KIND_LABEL[pending.kind] ?? pending.kind}`
    return {
      ...base,
      status: "awaiting",
      clockSeconds: pending?.planned_seconds ?? 0,
      progress: 0,
      kindLabel: label,
      graceEndsInSec:
        grace === null ? null : Math.max(0, Math.ceil((grace - nowMs) / 1000)),
    }
  }
  const isStopwatch = live.kind === "stopwatch"
  const remaining = isStopwatch ? 0 : remainingSeconds(live, nowMs)
  const elapsed = isStopwatch ? stopwatchElapsedSeconds(live, nowMs) : 0
  const focusOrdinal =
    live.kind === "focus"
      ? session.phases
          .filter((p) => p.kind === "focus")
          .findIndex((p) => p.seq === live.seq) + 1
      : focusDone
  return {
    ...base,
    status: live.status === "paused" ? "paused" : "running",
    clockSeconds: isStopwatch ? elapsed : remaining,
    progress: isStopwatch
      ? (elapsed % STOPWATCH_MILESTONE_SECONDS) / STOPWATCH_MILESTONE_SECONDS
      : live.planned_seconds > 0
        ? Math.min(1, Math.max(0, 1 - remaining / live.planned_seconds))
        : 0,
    kindLabel:
      live.kind === "focus"
        ? `Focus · phase ${focusOrdinal}/${focusTotal}`
        : (KIND_LABEL[live.kind] ?? live.kind),
    pausesLeft:
      live.kind === "focus"
        ? Math.max(0, session.pause_budget_count - live.pause_count)
        : null,
  }
}

/** `m:ss` or `h:mm:ss` — the ring's center readout. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }
  return `${m}:${sec.toString().padStart(2, "0")}`
}


