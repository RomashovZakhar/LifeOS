import { db } from "./database";
import { todayDate } from "./dates";
import type {
  Exercise,
  SessionExercise,
  SessionSet,
  TrackingMode,
  WorkoutSession,
  WorkoutTemplate,
} from "./types";

export function elapsedSeconds(
  session: WorkoutSession,
  now = Date.now(),
): number {
  const started = Date.parse(session.startedAt);
  if (Number.isNaN(started)) return 0;
  const pauseAccum = session.pauseAccumulatedSeconds || 0;
  if (session.pausedAt) {
    const paused = Date.parse(session.pausedAt);
    return Math.max(0, Math.floor((paused - started) / 1000) - pauseAccum);
  }
  return Math.max(0, Math.floor((now - started) / 1000) - pauseAccum);
}

export function isValidSet(mode: TrackingMode, set: SessionSet): boolean {
  if (mode === "weight_reps") {
    return (
      set.weightKg != null &&
      set.reps != null &&
      set.weightKg >= 0 &&
      set.reps >= 0
    );
  }
  if (mode === "reps_only") {
    return set.reps != null && set.reps >= 0;
  }
  return set.durationSeconds != null && set.durationSeconds > 0;
}

export function sessionHasValidFinish(
  session: WorkoutSession,
  modeByExerciseId: Map<string, TrackingMode>,
): boolean {
  if (session.exercises.length === 0) return false;
  let any = false;
  for (const se of session.exercises) {
    const mode = modeByExerciseId.get(se.exerciseId) ?? "weight_reps";
    for (const set of se.sets) {
      if (isValidSet(mode, set)) {
        any = true;
        break;
      }
    }
    if (any) break;
  }
  return any;
}

export async function getPortalTracker() {
  return db.trackers.where("type").equals("workout_portal").first();
}

export async function getSessionByDate(
  date: string,
): Promise<WorkoutSession | undefined> {
  return db.workout_sessions.where("date").equals(date).first();
}

export async function getSession(
  id: string,
): Promise<WorkoutSession | undefined> {
  return db.workout_sessions.get(id);
}

export async function putSession(session: WorkoutSession): Promise<void> {
  await db.workout_sessions.put({
    ...session,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await db.workout_sessions.delete(id);
}

export async function startEmptySession(date: string): Promise<WorkoutSession> {
  const existing = await getSessionByDate(date);
  if (existing) return existing;
  if (date > todayDate()) throw new Error("Cannot start future session");

  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    date,
    status: "in_progress",
    startedAt: new Date().toISOString(),
    pausedAt: null,
    pauseAccumulatedSeconds: 0,
    endedAt: null,
    durationSeconds: null,
    templateId: null,
    exercises: [],
    updatedAt: new Date().toISOString(),
  };
  await db.workout_sessions.add(session);
  return session;
}

export async function startSessionFromTemplate(
  date: string,
  templateId: string,
): Promise<WorkoutSession> {
  const existing = await getSessionByDate(date);
  if (existing) return existing;
  if (date > todayDate()) throw new Error("Cannot start future session");

  const template = await db.workout_templates.get(templateId);
  if (!template) throw new Error("Template not found");

  const exercises: SessionExercise[] = template.exerciseIds.map(
    (exerciseId, i) => ({
      id: crypto.randomUUID(),
      exerciseId,
      sortOrder: i,
      sets: [
        {
          id: crypto.randomUUID(),
          sortOrder: 0,
        },
      ],
    }),
  );

  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    date,
    status: "in_progress",
    startedAt: new Date().toISOString(),
    pausedAt: null,
    pauseAccumulatedSeconds: 0,
    endedAt: null,
    durationSeconds: null,
    templateId,
    exercises,
    updatedAt: new Date().toISOString(),
  };
  await db.workout_sessions.add(session);
  return session;
}

export async function pauseSession(id: string): Promise<WorkoutSession | null> {
  const s = await getSession(id);
  if (!s || s.status !== "in_progress" || s.pausedAt) return s ?? null;
  const next = { ...s, pausedAt: new Date().toISOString() };
  await putSession(next);
  return next;
}

export async function resumeSession(
  id: string,
): Promise<WorkoutSession | null> {
  const s = await getSession(id);
  if (!s || s.status !== "in_progress" || !s.pausedAt) return s ?? null;
  const pausedAt = Date.parse(s.pausedAt);
  const extra = Math.max(0, Math.floor((Date.now() - pausedAt) / 1000));
  const next: WorkoutSession = {
    ...s,
    pauseAccumulatedSeconds: s.pauseAccumulatedSeconds + extra,
    pausedAt: null,
  };
  await putSession(next);
  return next;
}

export async function finishSession(
  id: string,
): Promise<WorkoutSession | null> {
  const s = await getSession(id);
  if (!s || s.status !== "in_progress") return s ?? null;

  const exercises = await db.exercises.toArray();
  const modeById = new Map(exercises.map((e) => [e.id, e.trackingMode]));
  if (!sessionHasValidFinish(s, modeById)) {
    throw new Error("Finish validation failed");
  }

  let working = s;
  if (working.pausedAt) {
    const resumed = await resumeSession(id);
    if (resumed) working = resumed;
  }

  const endedAt = new Date().toISOString();
  const durationSeconds = elapsedSeconds(
    { ...working, pausedAt: null },
    Date.parse(endedAt),
  );
  const next: WorkoutSession = {
    ...working,
    status: "completed",
    endedAt,
    durationSeconds,
    pausedAt: null,
  };
  await putSession(next);
  return next;
}

/** Finish with a user-entered duration (forgot finish / approximate time). */
export async function finishSessionWithDuration(
  id: string,
  durationSeconds: number,
): Promise<WorkoutSession | null> {
  const s = await getSession(id);
  if (!s || s.status !== "in_progress") return s ?? null;

  const exercises = await db.exercises.toArray();
  const modeById = new Map(exercises.map((e) => [e.id, e.trackingMode]));
  if (!sessionHasValidFinish(s, modeById)) {
    throw new Error("Finish validation failed");
  }

  let working = s;
  if (working.pausedAt) {
    const resumed = await resumeSession(id);
    if (resumed) working = resumed;
  }

  const endedAt = new Date().toISOString();
  const next: WorkoutSession = {
    ...working,
    status: "completed",
    endedAt,
    durationSeconds: Math.max(0, Math.floor(durationSeconds)),
    pausedAt: null,
  };
  await putSession(next);
  return next;
}

export async function updateSessionDuration(
  id: string,
  durationSeconds: number,
): Promise<void> {
  const s = await getSession(id);
  if (!s || s.status !== "completed") return;
  await putSession({
    ...s,
    durationSeconds: Math.max(0, Math.floor(durationSeconds)),
  });
}

export async function reorderSessionExercises(
  sessionId: string,
  orderedSessionExerciseIds: string[],
): Promise<void> {
  const s = await getSession(sessionId);
  if (!s) return;
  const byId = new Map(s.exercises.map((e) => [e.id, e]));
  const exercises = orderedSessionExerciseIds
    .map((id, i) => {
      const ex = byId.get(id);
      return ex ? { ...ex, sortOrder: i } : null;
    })
    .filter((e): e is SessionExercise => e != null);
  await putSession({ ...s, exercises });
}

export async function removeSessionExercise(
  sessionId: string,
  sessionExerciseId: string,
): Promise<void> {
  const s = await getSession(sessionId);
  if (!s) return;
  const exercises = s.exercises
    .filter((e) => e.id !== sessionExerciseId)
    .map((e, i) => ({ ...e, sortOrder: i }));
  await putSession({ ...s, exercises });
}

export async function appendExerciseToSession(
  sessionId: string,
  exerciseId: string,
): Promise<{ session: WorkoutSession; already: boolean }> {
  const s = await getSession(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.exercises.some((e) => e.exerciseId === exerciseId)) {
    return { session: s, already: true };
  }
  const se: SessionExercise = {
    id: crypto.randomUUID(),
    exerciseId,
    sortOrder: s.exercises.length,
    sets: [{ id: crypto.randomUUID(), sortOrder: 0 }],
  };
  const next = { ...s, exercises: [...s.exercises, se] };
  await putSession(next);
  return { session: next, already: false };
}

export async function updateSessionExerciseSets(
  sessionId: string,
  sessionExerciseId: string,
  sets: SessionSet[],
): Promise<void> {
  const s = await getSession(sessionId);
  if (!s) return;
  const exercises = s.exercises.map((e) =>
    e.id === sessionExerciseId
      ? {
          ...e,
          sets: sets.map((set, i) => ({ ...set, sortOrder: i })),
        }
      : e,
  );
  await putSession({ ...s, exercises });
}

export async function listActiveExercises(): Promise<Exercise[]> {
  const all = await db.exercises.toArray();
  return all
    .filter((e) => !e.archivedAt)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function createExercise(input: {
  name: string;
  trackingMode: TrackingMode;
}): Promise<Exercise> {
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    trackingMode: input.trackingMode,
    createdAt: new Date().toISOString(),
    archivedAt: null,
  };
  await db.exercises.add(exercise);
  return exercise;
}

export async function renameExercise(
  id: string,
  name: string,
): Promise<void> {
  const ex = await db.exercises.get(id);
  if (!ex || ex.archivedAt) return;
  const next = name.trim();
  if (!next || next === ex.name) return;
  await db.exercises.put({ ...ex, name: next });
}

/**
 * Soft-remove from catalog (04b). Sessions keep exerciseId;
 * strip id from all templates.
 */
export async function archiveExercise(id: string): Promise<void> {
  const ex = await db.exercises.get(id);
  if (!ex || ex.archivedAt) return;
  await db.exercises.put({
    ...ex,
    archivedAt: new Date().toISOString(),
  });
  const templates = await db.workout_templates.toArray();
  await db.transaction("rw", db.workout_templates, async () => {
    for (const t of templates) {
      if (!t.exerciseIds.includes(id)) continue;
      await putTemplate({
        ...t,
        exerciseIds: t.exerciseIds.filter((x) => x !== id),
      });
    }
  });
}

/** Last completed session before `beforeDate` that includes exerciseId. */
export async function lastCompletedSetsForExercise(
  exerciseId: string,
  beforeDate: string,
): Promise<SessionSet[] | null> {
  const sessions = await db.workout_sessions
    .where("status")
    .equals("completed")
    .toArray();
  const prior = sessions
    .filter((s) => s.date < beforeDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const s of prior) {
    const se = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (se && se.sets.length > 0) return se.sets;
  }
  return null;
}

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const all = await db.workout_templates.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export async function getTemplate(
  id: string,
): Promise<WorkoutTemplate | undefined> {
  return db.workout_templates.get(id);
}

export async function createTemplate(name: string): Promise<WorkoutTemplate> {
  const t: WorkoutTemplate = {
    id: crypto.randomUUID(),
    name: name.trim() || "Шаблон",
    exerciseIds: [],
    updatedAt: new Date().toISOString(),
  };
  await db.workout_templates.add(t);
  return t;
}

export async function putTemplate(t: WorkoutTemplate): Promise<void> {
  await db.workout_templates.put({
    ...t,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.workout_templates.delete(id);
}

/** Ordered exercise ids from session (by sortOrder). */
export function sessionExerciseIds(session: WorkoutSession): string[] {
  return [...session.exercises]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((e) => e.exerciseId);
}

/** True if add/remove/reorder vs template.exerciseIds. */
export function sessionDiffersFromTemplate(
  template: WorkoutTemplate,
  session: WorkoutSession,
): boolean {
  const ids = sessionExerciseIds(session);
  const base = template.exerciseIds;
  if (ids.length !== base.length) return true;
  return ids.some((id, i) => id !== base[i]);
}

export async function syncTemplateFromSession(
  templateId: string,
  session: WorkoutSession,
): Promise<void> {
  const t = await getTemplate(templateId);
  if (!t) return;
  await putTemplate({
    ...t,
    exerciseIds: sessionExerciseIds(session),
  });
}

export function setSummaryLine(mode: TrackingMode, sets: SessionSet[]): string {
  const parts: string[] = [];
  for (const set of sets) {
    if (mode === "weight_reps") {
      if (set.weightKg == null && set.reps == null) continue;
      parts.push(`${set.weightKg ?? "—"}×${set.reps ?? "—"}`);
    } else if (mode === "reps_only") {
      if (set.reps == null) continue;
      parts.push(String(set.reps));
    } else if (set.durationSeconds) {
      parts.push(formatSetDuration(set.durationSeconds));
    }
  }
  if (parts.length === 0) return "…";
  return `${sets.length}× ${parts[0]}${parts.length > 1 ? "…" : ""}`;
}

function formatSetDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
