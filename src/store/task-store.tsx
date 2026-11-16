import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { Task, TaskRepository } from '../types/task'
import { localStorageTaskRepository } from '../repositories/local-storage-task.repository'

/* ------------------------------------------------------------------ */
/* State & actions (AD-1: single owner of all task state)              */
/* ------------------------------------------------------------------ */

export interface TaskState {
  /** Unordered source of truth; every list order is derived (AD-3). */
  tasks: Task[]
  /** Task removed by the last delete and still undoable, or null. */
  lastDeleted: Task | null
}

export type TaskAction =
  | { type: 'add'; name: string }
  | { type: 'rename'; id: string; name: string }
  | { type: 'delete'; id: string }
  | { type: 'restore' }
  | { type: 'toggle'; id: string }
  | { type: 'expire-undo' }

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'add': {
      const name = action.name.trim()
      if (!name) return state // blank names never create tasks
      const task: Task = {
        id: crypto.randomUUID(),
        name,
        done: false,
        createdAt: Date.now(),
        completedAt: null,
      }
      return { ...state, tasks: [...state.tasks, task] }
    }

    case 'rename': {
      const name = action.name.trim()
      if (!name) return state // empty name on save cancels the edit
      // Name-only mutation: createdAt untouched, so derived position is stable.
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, name } : task,
        ),
      }
    }

    case 'delete': {
      const removed = state.tasks.find((task) => task.id === action.id)
      if (!removed) return state
      return {
        tasks: state.tasks.filter((task) => task.id !== action.id),
        lastDeleted: removed,
      }
    }

    case 'restore': {
      if (!state.lastDeleted) return state
      // Re-insert the exact task object; the derivations restore its position.
      return { tasks: [...state.tasks, state.lastDeleted], lastDeleted: null }
    }

    case 'toggle': {
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.id) return task
          const done = !task.done
          return { ...task, done, completedAt: done ? Date.now() : null }
        }),
      }
    }

    case 'expire-undo': {
      if (!state.lastDeleted) return state
      return { ...state, lastDeleted: null }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ordering derivations — pure, the only place order exists (AD-3)     */
/* ------------------------------------------------------------------ */

/** Pending: newest creation first. */
export function derivePendingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => !task.done)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Completed: most recent completion first. */
export function deriveCompletedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
}

/* ------------------------------------------------------------------ */
/* Context + provider (AD-4: React primitives only)                    */
/* ------------------------------------------------------------------ */

export interface TaskStore {
  pendingTasks: Task[]
  completedTasks: Task[]
  lastDeleted: Task | null
  totalTasks: number
  addTask(name: string): void
  renameTask(id: string, name: string): void
  deleteTask(id: string): void
  undoDelete(): void
  expireUndo(): void
  toggleTask(id: string): void
}

const TaskContext = createContext<TaskStore | null>(null)

function initTasks(tasks: Task[]): TaskState {
  return { tasks, lastDeleted: null }
}

export function TaskProvider({
  repository = localStorageTaskRepository,
  children,
}: {
  repository?: TaskRepository
  children: ReactNode
}) {
  const [loaded] = useState(() => repository.load())
  const [state, dispatch] = useReducer(taskReducer, loaded, initTasks)

  // Every mutation persists (EXPERIENCE.md persistence contract). The initial
  // mount is skipped: state is exactly what the repository loaded, so a first
  // visit never writes [] and blocked-storage users get no warning on load.
  // The repository keeps write failures non-fatal; the guard here is
  // defense-in-depth so the UI never crashes on a save.
  useEffect(() => {
    if (state.tasks === loaded) return
    try {
      repository.save(state.tasks)
    } catch {
      // Non-fatal by contract (AD-2): UI keeps working in-memory.
    }
  }, [repository, state.tasks, loaded])

  // Action callbacks are stable (dispatch never changes), so consumers like
  // the Toast can key timers on lastDeleted alone without re-arming on every
  // unrelated state change.
  const addTask = useCallback((name: string) => dispatch({ type: 'add', name }), [])
  const renameTask = useCallback((id: string, name: string) => dispatch({ type: 'rename', id, name }), [])
  const deleteTask = useCallback((id: string) => dispatch({ type: 'delete', id }), [])
  const undoDelete = useCallback(() => dispatch({ type: 'restore' }), [])
  const expireUndo = useCallback(() => dispatch({ type: 'expire-undo' }), [])
  const toggleTask = useCallback((id: string) => dispatch({ type: 'toggle', id }), [])

  const store = useMemo<TaskStore>(
    () => ({
      pendingTasks: derivePendingTasks(state.tasks),
      completedTasks: deriveCompletedTasks(state.tasks),
      lastDeleted: state.lastDeleted,
      totalTasks: state.tasks.length,
      addTask,
      renameTask,
      deleteTask,
      undoDelete,
      expireUndo,
      toggleTask,
    }),
    [state, addTask, renameTask, deleteTask, undoDelete, expireUndo, toggleTask],
  )

  return <TaskContext.Provider value={store}>{children}</TaskContext.Provider>
}

export function useTaskStore(): TaskStore {
  const store = useContext(TaskContext)
  if (!store) throw new Error('useTaskStore must be used inside <TaskProvider>')
  return store
}
