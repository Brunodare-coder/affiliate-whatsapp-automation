/**
 * In-memory diagnostic logger for real-time debugging.
 * Stores the last 200 log entries per user.
 */

export interface DiagLog {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  category: string;
  message: string;
  userId?: number;
}

let logCounter = 0;
// Map<userId, DiagLog[]>
const userLogs = new Map<number, DiagLog[]>();
// Global logs (not tied to a user)
const globalLogs: DiagLog[] = [];
const MAX_LOGS = 200;

function addLog(userId: number | undefined, level: DiagLog["level"], category: string, message: string): void {
  const entry: DiagLog = {
    id: ++logCounter,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    userId,
  };

  if (userId !== undefined) {
    if (!userLogs.has(userId)) {
      userLogs.set(userId, []);
    }
    const logs = userLogs.get(userId)!;
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  } else {
    globalLogs.push(entry);
    if (globalLogs.length > MAX_LOGS) globalLogs.splice(0, globalLogs.length - MAX_LOGS);
  }
}

export function diagInfo(userId: number | undefined, category: string, message: string): void {
  console.log(`[Diag][${category}] ${message}`);
  addLog(userId, "info", category, message);
}

export function diagWarn(userId: number | undefined, category: string, message: string): void {
  console.warn(`[Diag][${category}] ${message}`);
  addLog(userId, "warn", category, message);
}

export function diagError(userId: number | undefined, category: string, message: string): void {
  console.error(`[Diag][${category}] ${message}`);
  addLog(userId, "error", category, message);
}

export function diagSuccess(userId: number | undefined, category: string, message: string): void {
  console.log(`[Diag][${category}] ✓ ${message}`);
  addLog(userId, "success", category, message);
}

export function getDiagLogs(userId: number, since?: number): DiagLog[] {
  const logs = userLogs.get(userId) || [];
  if (since !== undefined) {
    return logs.filter((l) => l.id > since);
  }
  return [...logs];
}

export function clearDiagLogs(userId: number): void {
  userLogs.delete(userId);
}
