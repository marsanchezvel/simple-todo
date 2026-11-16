import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Composer } from './Composer'
import { TaskProvider } from '../store/task-store'
import type { Task, TaskRepository } from '../types/task'

class FakeTaskRepository implements TaskRepository {
  stored: Task[] = []
  load(): Task[] {
    return []
  }
  save(tasks: Task[]): void {
    this.stored = tasks
  }
}

function renderComposer() {
  const repo = new FakeTaskRepository()
  render(
    <TaskProvider repository={repo}>
      <Composer />
    </TaskProvider>,
  )
  return repo
}

describe('Composer', () => {
  it('disables the add button while the input is empty or blank', async () => {
    const user = userEvent.setup()
    renderComposer()

    const button = screen.getByRole('button', { name: '+ Añadir tarea' })
    expect(button).toBeDisabled()

    await user.type(screen.getByLabelText('Nueva tarea'), '   ')
    expect(button).toBeDisabled()

    await user.type(screen.getByLabelText('Nueva tarea'), 'hola')
    expect(button).toBeEnabled()
  })

  it('creates a task on Enter, clears the input and keeps focus', async () => {
    const user = userEvent.setup()
    const repo = renderComposer()

    const input = screen.getByLabelText('Nueva tarea')
    await user.type(input, 'Llamar al dentista{Enter}')

    expect(repo.stored).toHaveLength(1)
    expect(repo.stored[0]).toMatchObject({
      name: 'Llamar al dentista',
      done: false,
      completedAt: null,
    })
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('creates a task on button click', async () => {
    const user = userEvent.setup()
    const repo = renderComposer()

    await user.type(screen.getByLabelText('Nueva tarea'), 'Sacar entradas')
    await user.click(screen.getByRole('button', { name: '+ Añadir tarea' }))

    expect(repo.stored).toHaveLength(1)
    expect(repo.stored[0]?.name).toBe('Sacar entradas')
  })

  it('does not create a task when pressing Enter on whitespace only', async () => {
    const user = userEvent.setup()
    const repo = renderComposer()

    const input = screen.getByLabelText('Nueva tarea')
    await user.type(input, '   {Enter}')

    expect(repo.stored).toHaveLength(0)
  })

  it('adds a second task to the store after Enter (rapid entry)', async () => {
    const user = userEvent.setup()
    const repo = renderComposer()

    const input = screen.getByLabelText('Nueva tarea')
    await user.type(input, 'Primera{Enter}')
    await user.type(input, 'Segunda{Enter}')

    expect(repo.stored.map((task) => task.name)).toEqual(['Primera', 'Segunda'])
  })
})
