import type { Task, TaskRepository } from '../types/task'

export const STORAGE_KEY = 'simple-todo.v1'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.done !== 'boolean' ||
    typeof candidate.createdAt !== 'number'
  ) {
    return false
  }
  // Data-model invariant: completedAt === null ⇔ done === false.
  const completedAt: unknown = candidate.completedAt
  return candidate.done ? typeof completedAt === 'number' : completedAt === null
}

/** localStorage implementation of the TaskRepository port (AD-2). */
export class LocalStorageTaskRepository implements TaskRepository {
  load(): Task[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw === null) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      // Keep the first occurrence of each id: duplicates in the payload
      // would otherwise collapse into one task for every derivation.
      const seen = new Set<string>()
      return parsed
        .filter(isTask)
        .filter((task) => {
          if (seen.has(task.id)) return false
          seen.add(task.id)
          return true
        })
    } catch {
      // Storage read failure: start with an empty list (I/O matrix).
      return []
    }
  }

  save(tasks: Task[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      // Quota / blocked storage: keep working in-memory, warn only.
      console.warn('simple-todo: no se pudo guardar la lista; los cambios solo durarán esta sesión.', error)
    }
  }
}

export const localStorageTaskRepository = new LocalStorageTaskRepository()
