import "server-only";

export type ChatTaskStatus =
  | "queued"
  | "generating"
  | "finalizing"
  | "completed"
  | "failed";

export type ChatTask = {
  id: string;
  status: ChatTaskStatus;
  messageCount: number;
  totalChars: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

const TASK_TTL_MS = 10 * 60 * 1000;
const tasks = new Map<string, ChatTask>();

function nowIso(): string {
  return new Date().toISOString();
}

function pruneExpiredTasks() {
  const now = Date.now();
  for (const [id, task] of tasks.entries()) {
    const updated = new Date(task.updatedAt).getTime();
    if (Number.isNaN(updated) || now - updated > TASK_TTL_MS) {
      tasks.delete(id);
    }
  }
}

export function createTask(input: {
  messageCount: number;
  totalChars: number;
}): ChatTask {
  pruneExpiredTasks();
  const timestamp = nowIso();
  const task: ChatTask = {
    id: crypto.randomUUID(),
    status: "queued",
    messageCount: input.messageCount,
    totalChars: input.totalChars,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  tasks.set(task.id, task);
  return task;
}

export function getTask(id: string): ChatTask | null {
  pruneExpiredTasks();
  return tasks.get(id) ?? null;
}

export function updateTask(
  id: string,
  patch: Partial<Pick<ChatTask, "status" | "error">>
): ChatTask | null {
  const current = getTask(id);
  if (!current) return null;

  const next: ChatTask = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  tasks.set(id, next);
  return next;
}
