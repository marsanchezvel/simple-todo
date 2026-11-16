import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { TaskProvider, useTaskStore, type TaskStore } from './task-store'
import { STORAGE_KEY } from '../repositories/local-storage-task.repository'
import type { Task, TaskRepository } from '../types/task'

/** Fake repository: the second allowed implementation (AD-2). */
class FakeTaskRepository implements TaskRepository {
  stored: Task[] = []
  saveCalls = 0
  load(): Task[] {
    return this.stored.map((task) => ({ ...task }))
  }
  save(tasks: Task[]): void {
    this.saveCalls += 1
    this.stored = tasks.map((task) => ({ ...task }))
  }
}

/** Renders a provider wired to a probe that exposes the store hooks. */
function renderStore(repository: TaskRepository): { store: () => TaskStore } {
  let current: TaskStore | undefined
  function Probe(): ReactNode {
    current = useTaskStore()
    return null
  }
  render(
    <TaskProvider repository={repository}>
      <Probe />
    </TaskProvider>,
  )
  return {
    store() {
      if (!current) throw new Error('store not ready')
      return current
    },
  }
}

const namesOf = (tasks: Task[]) => tasks.map((task) => task.name)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('task store', () => {
  it('adds tasks at the top of pending, newest first (CAP-1, AD-3)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      vi.setSystemTime(1_000)
      store().addTask('Llamar al dentista')
    })
    act(() => {
      vi.setSystemTime(2_000)
      store().addTask('Sacar entradas')
    })

    expect(namesOf(store().pendingTasks)).toEqual(['Sacar entradas', 'Llamar al dentista'])
    expect(store().completedTasks).toEqual([])
  })

  it('never creates a task from a blank name (I/O matrix)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      store().addTask('   ')
    })

    expect(store().totalTasks).toBe(0)
    // No task was created and nothing was mutated, so nothing is saved
    // either (the initial mount no longer persists the loaded state).
    expect(repo.saveCalls).toBe(0)
  })

  it('trims whitespace from added names', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      store().addTask('  hola  ')
    })

    expect(store().pendingTasks[0]?.name).toBe('hola')
  })

  it('renames without touching createdAt, so position is unchanged (CAP-2, AD-3)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      vi.setSystemTime(1_000)
      store().addTask('Llamar al dentista')
    })
    act(() => {
      vi.setSystemTime(2_000)
      store().addTask('Sacar entradas')
    })

    const before = store().pendingTasks[1]
    act(() => {
      store().renameTask(before.id, 'Llamar al dentista YA')
    })

    const after = store().pendingTasks[1]
    expect(after.name).toBe('Llamar al dentista YA')
    expect(after.createdAt).toBe(before.createdAt)
    expect(namesOf(store().pendingTasks)).toEqual([
      'Sacar entradas',
      'Llamar al dentista YA',
    ])
  })

  it('cancels the edit when saving an empty name (I/O matrix)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)
    act(() => {
      store().addTask('Regar plantas')
    })

    const id = store().pendingTasks[0].id
    act(() => {
      store().renameTask(id, '   ')
    })

    expect(store().pendingTasks[0].name).toBe('Regar plantas')
  })

  it('completes with completedAt set, newest completion first (CAP-4, AD-3)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      vi.setSystemTime(1_000)
      store().addTask('A')
    })
    act(() => {
      vi.setSystemTime(2_000)
      store().addTask('B')
    })
    act(() => {
      vi.setSystemTime(3_000)
      store().toggleTask(store().pendingTasks[1].id) // A
    })
    act(() => {
      vi.setSystemTime(4_000)
      store().toggleTask(store().pendingTasks[0].id) // B
    })

    expect(namesOf(store().completedTasks)).toEqual(['B', 'A'])
    expect(store().completedTasks[0].completedAt).toBe(4_000)
  })

  it('unmarking returns the task to its original creation position (CAP-5)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      vi.setSystemTime(1_000)
      store().addTask('A')
    })
    act(() => {
      vi.setSystemTime(2_000)
      store().addTask('B')
    })
    act(() => {
      vi.setSystemTime(3_000)
      store().addTask('C')
    })
    act(() => {
      vi.setSystemTime(4_000)
      store().toggleTask(store().pendingTasks.find((t) => t.name === 'A')!.id)
    })
    expect(store().completedTasks.map((t) => t.name)).toEqual(['A'])
    expect(store().completedTasks[0].completedAt).toBe(4_000)

    act(() => {
      vi.setSystemTime(9_000)
      store().toggleTask(store().completedTasks[0].id) // unmark A
    })

    // A goes back between B and C — its original creation slot.
    expect(namesOf(store().pendingTasks)).toEqual(['C', 'B', 'A'])
    const restored = store().pendingTasks.find((t) => t.name === 'A')!
    expect(restored.completedAt).toBeNull()
    expect(restored.createdAt).toBe(1_000)
  })

  it('deletes instantly and undo restores the exact task and position (CAP-3)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      vi.setSystemTime(1_000)
      store().addTask('A')
    })
    act(() => {
      vi.setSystemTime(2_000)
      store().addTask('B')
    })

    const target = store().pendingTasks[1] // A
    act(() => {
      store().deleteTask(target.id)
    })
    expect(namesOf(store().pendingTasks)).toEqual(['B'])
    expect(store().lastDeleted).toEqual(target)

    act(() => {
      store().undoDelete()
    })
    expect(namesOf(store().pendingTasks)).toEqual(['B', 'A'])
    expect(store().pendingTasks[1]).toEqual(target) // exact object, same id/fields
    expect(store().lastDeleted).toBeNull()
  })

  it('undo restores a deleted completed task into the completed section', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)

    act(() => {
      store().addTask('A')
    })
    act(() => {
      vi.setSystemTime(5_000)
      store().toggleTask(store().pendingTasks[0].id)
    })
    const completed = store().completedTasks[0]

    act(() => {
      store().deleteTask(completed.id)
    })
    expect(store().totalTasks).toBe(0)

    act(() => {
      store().undoDelete()
    })
    expect(store().completedTasks[0]).toEqual(completed)
  })

  it('expires the undo window without touching the list', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)
    act(() => {
      store().addTask('A')
    })
    act(() => {
      store().deleteTask(store().pendingTasks[0].id)
    })

    act(() => {
      store().expireUndo()
    })

    expect(store().lastDeleted).toBeNull()
    expect(store().totalTasks).toBe(0)
  })

  it('persists every mutation through the repository (AD-2)', () => {
    const repo = new FakeTaskRepository()
    const { store } = renderStore(repo)
    const savesAfterMount = repo.saveCalls

    act(() => {
      store().addTask('A')
    })
    act(() => {
      store().toggleTask(store().pendingTasks[0].id)
    })

    expect(repo.saveCalls).toBe(savesAfterMount + 2)
    expect(repo.stored[0]).toMatchObject({ name: 'A', done: true })
  })

  it('restores exact state from storage on a fresh mount (reload fidelity)', () => {
    const repo = new FakeTaskRepository()
    repo.stored = [
      { id: 'a', name: 'A', done: false, createdAt: 100, completedAt: null },
      { id: 'b', name: 'B', done: false, createdAt: 200, completedAt: null },
      { id: 'c', name: 'C', done: true, createdAt: 50, completedAt: 400 },
    ]

    const first = renderStore(repo)
    expect(namesOf(first.store().pendingTasks)).toEqual(['B', 'A'])
    expect(namesOf(first.store().completedTasks)).toEqual(['C'])

    // "Reload": a brand-new provider mounting from what was persisted.
    const reloaded = new FakeTaskRepository()
    reloaded.stored = repo.stored
    const second = renderStore(reloaded)
    expect(namesOf(second.store().pendingTasks)).toEqual(['B', 'A'])
    expect(namesOf(second.store().completedTasks)).toEqual(['C'])
  })

  it('keeps working in-memory when the repository save fails (non-fatal)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const repo: TaskRepository = {
      load: () => [],
      save: () => {
        throw new Error('quota exceeded')
      },
    }
    const { store } = renderStore(repo)

    act(() => {
      store().addTask('A')
    })

    expect(namesOf(store().pendingTasks)).toEqual(['A'])
    expect(warn).not.toHaveBeenCalled() // the port contract keeps errors inside the repository
  })

  it('does not persist on the initial mount (no [] write on first visit)', () => {
    const repo = new FakeTaskRepository()
    repo.stored = [
      { id: 'seed', name: 'Sembrada', done: false, createdAt: 1_000, completedAt: null },
    ]
    renderStore(repo)

    expect(repo.saveCalls).toBe(0)
  })

  it('wires the localStorage repository by default (provider with no props)', () => {
    window.localStorage.clear()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'seed', name: 'Sembrada', done: false, createdAt: 1_000, completedAt: null },
      ]),
    )

    let current: TaskStore | undefined
    function Probe(): ReactNode {
      current = useTaskStore()
      return null
    }
    render(<TaskProvider><Probe /></TaskProvider>)

    expect(current!.pendingTasks.map((task) => task.name)).toEqual(['Sembrada'])

    act(() => {
      current!.addTask('Nueva')
    })

    const persisted: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect((persisted as Task[]).map((task) => task.name)).toEqual(['Sembrada', 'Nueva'])

    window.localStorage.clear()
  })
})
