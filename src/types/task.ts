export interface Task {
  id: string
  name: string
  done: boolean
  /** Epoch millis. Immutable: renames and toggles never touch it (AD-3). */
  createdAt: number
  /** Epoch millis; null ⇔ done is false (Conventions: data model). */
  completedAt: number | null
}

/**
 * Persistence port (AD-2). The task store is its only production consumer;
 * a test fake is the second allowed implementation.
 * Implementations must never throw: read failures yield an empty list and
 * write failures are a console warning (non-fatal convention).
 */
export interface TaskRepository {
  load(): Task[]
  save(tasks: Task[]): void
}
