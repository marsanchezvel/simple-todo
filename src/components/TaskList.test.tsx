import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TaskList } from './TaskList'
import { TaskProvider } from '../store/task-store'
import type { Task, TaskRepository } from '../types/task'

class FakeTaskRepository implements TaskRepository {
  stored: Task[] = []
  constructor(initial: Task[] = []) {
    this.stored = initial
  }
  load(): Task[] {
    return this.stored.map((task) => ({ ...task }))
  }
  save(tasks: Task[]): void {
    this.stored = tasks.map((task) => ({ ...task }))
  }
}

function renderList(initial: Task[] = []) {
  const repo = new FakeTaskRepository(initial)
  render(
    <TaskProvider repository={repo}>
      <TaskList />
    </TaskProvider>,
  )
  return repo
}

describe('TaskList state patterns (I/O matrix)', () => {
  it('shows the empty-list state (✨ Todo listo por ahora) when there are no tasks', () => {
    renderList()
    expect(screen.getByText('Todo listo por ahora')).toBeVisible()
    expect(screen.getByText('Añade tu primera tarea arriba')).toBeVisible()
    expect(screen.queryByText('Pendientes')).not.toBeInTheDocument()
    expect(screen.queryByText('Completadas')).not.toBeInTheDocument()
  })

  it('shows the all-completed state (🎉 Nada pendiente) plus the Completadas section', () => {
    renderList([
      {
        id: 'done-1',
        name: 'Regar plantas',
        done: true,
        createdAt: 1_000,
        completedAt: 5_000,
      },
    ])
    expect(screen.getByText('Nada pendiente')).toBeVisible()
    expect(screen.queryByText('Nada pendiente 🎉')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendientes')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Completadas' })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Regar plantas' }).getAttribute('aria-checked')).toBe('true')
  })

  it('wraps a very long task name inside the row without breaking the layout', async () => {
    const longName = 'Tarea '.repeat(40).trim() // 240 chars
    renderList([
      { id: 'long-1', name: longName, done: false, createdAt: 1_000, completedAt: null },
    ])
    const nameButton = screen.getByRole('button', { name: longName })
    expect(nameButton).toBeVisible()
    expect(nameButton.className).toContain('wrap-anywhere')
    // The row stays a single flex row (no per-character layout break in jsdom);
    // the wrap-anywhere hook is what the CSS uses to wrap text on overflow.
    expect(nameButton.closest('li')).not.toBeNull()
  })

  it('keeps rendering the sections after deleting the last pending task from a mixed list', async () => {
    const user = userEvent.setup()
    renderList([
      { id: 'p-1', name: 'Pendiente', done: false, createdAt: 2_000, completedAt: null },
      { id: 'c-1', name: 'Completada', done: true, createdAt: 1_000, completedAt: 3_000 },
    ])
    await user.click(within(screen.getByRole('checkbox', { name: 'Pendiente' }).closest('li')!).getByRole('button', { name: 'Eliminar Pendiente' }))
    expect(screen.getByText('Nada pendiente')).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Completada' })).toBeVisible()
  })
})
