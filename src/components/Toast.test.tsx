import { act, render, screen, within } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'
import { Composer } from './Composer'
import { TaskList } from './TaskList'
import { TaskProvider } from '../store/task-store'
import type { Task, TaskRepository } from '../types/task'

const seedTasks: Task[] = [
  { id: 'a', name: 'A', done: false, createdAt: 1_000, completedAt: null },
  { id: 'b', name: 'B', done: false, createdAt: 2_000, completedAt: null },
]

class FakeTaskRepository implements TaskRepository {
  stored: Task[]
  constructor(initial: Task[] = seedTasks) {
    this.stored = initial.map((task) => ({ ...task }))
  }
  load(): Task[] {
    return this.stored.map((task) => ({ ...task }))
  }
  save(tasks: Task[]): void {
    this.stored = tasks.map((task) => ({ ...task }))
  }
}

function renderApp(initial: Task[] = seedTasks) {
  const repo = new FakeTaskRepository(initial)
  render(
    <TaskProvider repository={repo}>
      <TaskList />
      <Composer />
      <Toast />
    </TaskProvider>,
  )
  return repo
}

const rowOf = (name: string) =>
  screen.getByRole('checkbox', { name }).closest('li')!

const deleteFirstTask = () => {
  fireEvent.click(within(rowOf('A')).getByRole('button', { name: 'Eliminar A' }))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('appears with Tarea eliminada + Deshacer after an instant delete', () => {
    const repo = renderApp()

    deleteFirstTask()

    expect(screen.getByText('Tarea eliminada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
    expect(repo.stored.map((task) => task.id)).toEqual(['b'])
  })

  it('Deshacer restores the exact task and hides the toast', () => {
    const repo = renderApp()

    deleteFirstTask()
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))

    expect(repo.stored.map((task) => task.id)).toEqual(['b', 'a']) // re-inserted at the array end
    expect(repo.stored.find((task) => task.id === 'a')).toEqual(seedTasks[0]) // exact fields
    expect(screen.queryByText('Tarea eliminada')).not.toBeInTheDocument()
  })

  it('returns focus to the composer input after Deshacer', () => {
    renderApp()

    deleteFirstTask()
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))

    expect(screen.getByLabelText('Nueva tarea')).toHaveFocus()
  })

  it('auto-hides after the 5s undo window', () => {
    renderApp()

    deleteFirstTask()
    act(() => {
      vi.advanceTimersByTime(4_999)
    })
    expect(screen.getByText('Tarea eliminada')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByText('Tarea eliminada')).not.toBeInTheDocument()
  })

  it('does not restart the undo window on an unrelated mutation (regression)', () => {
    renderApp()

    deleteFirstTask()
    act(() => {
      vi.advanceTimersByTime(4_000)
    })

    // Unrelated mutation while the toast is visible: toggling task B.
    fireEvent.click(screen.getByRole('checkbox', { name: 'B' }))
    expect(screen.getByText('Tarea eliminada')).toBeInTheDocument()

    // The original 5s window must still expire on schedule.
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(screen.queryByText('Tarea eliminada')).not.toBeInTheDocument()
  })
})
