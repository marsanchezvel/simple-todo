import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TaskList } from './TaskList'
import { TaskProvider } from '../store/task-store'
import type { Task, TaskRepository } from '../types/task'

const baseTask: Task = {
  id: 'task-1',
  name: 'Regar plantas',
  done: false,
  createdAt: 1_000,
  completedAt: null,
}

class FakeTaskRepository implements TaskRepository {
  stored: Task[] = []
  constructor(initial: Task[] = [baseTask]) {
    this.stored = initial
  }
  load(): Task[] {
    return this.stored.map((task) => ({ ...task }))
  }
  save(tasks: Task[]): void {
    this.stored = tasks.map((task) => ({ ...task }))
  }
}

function renderList(initial: Task[] = [baseTask]) {
  const repo = new FakeTaskRepository(initial)
  render(
    <TaskProvider repository={repo}>
      <TaskList />
    </TaskProvider>,
  )
  return repo
}

const rowOf = (name: string) =>
  screen.getByRole('checkbox', { name }).closest('li')!

describe('TaskRow (rendered through TaskList like production)', () => {
  it('toggles completion via the checkbox and reflects it in the row', async () => {
    const user = userEvent.setup()
    const repo = renderList()

    const checkbox = screen.getByRole('checkbox', { name: 'Regar plantas' })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    await user.click(checkbox)
    expect(repo.stored[0]).toMatchObject({ done: true })

    // The row remounts in the Completadas section — re-query it.
    const checkedCheckbox = screen.getByRole('checkbox', { name: 'Regar plantas' })
    expect(checkedCheckbox).toHaveAttribute('aria-checked', 'true')

    await user.click(checkedCheckbox)
    expect(repo.stored[0]).toMatchObject({ done: false, completedAt: null })
    expect(screen.getByRole('checkbox', { name: 'Regar plantas' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('moves completed rows into the Completadas section', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('checkbox', { name: 'Regar plantas' }))

    const completedSection = screen
      .getByText('Completadas')
      .closest('section')!
    expect(
      within(completedSection).getByRole('checkbox', { name: 'Regar plantas' }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('shows the completed style: muted strikethrough name', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('checkbox', { name: 'Regar plantas' }))

    // The name button's accessible name is now its text content (the pencil
    // icon owns the "Editar <name>" label).
    const nameButton = screen.getByRole('button', { name: 'Regar plantas' })
    expect(nameButton).toHaveClass('line-through', 'text-muted')
  })

  describe('inline edit', () => {
    it('opens focused with the current name, saves on Enter', async () => {
      const user = userEvent.setup()
      const repo = renderList()

      await user.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))

      const input = screen.getByLabelText('Editar tarea')
      expect(input).toHaveValue('Regar plantas')
      expect(input).toHaveFocus()

      await user.clear(input)
      await user.type(input, 'Regar rosas{Enter}')

      expect(repo.stored[0]).toMatchObject({ name: 'Regar rosas', createdAt: 1_000 })
      expect(screen.queryByLabelText('Editar tarea')).not.toBeInTheDocument()
    })

    it('cancels on Escape without saving', async () => {
      const user = userEvent.setup()
      const repo = renderList()

      await user.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))
      await user.clear(screen.getByLabelText('Editar tarea'))
      await user.type(screen.getByLabelText('Editar tarea'), 'Cambio{Escape}')

      expect(repo.stored[0]?.name).toBe('Regar plantas')
      expect(screen.queryByLabelText('Editar tarea')).not.toBeInTheDocument()
    })

    it('does not save when Enter confirms an IME composition', () => {
      const repo = renderList()

      fireEvent.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))
      const input = screen.getByLabelText('Editar tarea')
      fireEvent.change(input, { target: { value: 'かな' } })
      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true })

      expect(repo.stored[0]?.name).toBe('Regar plantas')
      expect(input).toBeInTheDocument()
    })

    it('saves on blur', async () => {
      const user = userEvent.setup()
      const repo = renderList()

      await user.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))
      const input = screen.getByLabelText('Editar tarea')
      await user.clear(input)
      await user.type(input, 'Por blur')
      await user.click(document.body)

      expect(repo.stored[0]?.name).toBe('Por blur')
    })

    it('saving an empty name cancels the edit without changes', async () => {
      const user = userEvent.setup()
      const repo = renderList()

      await user.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))
      await user.clear(screen.getByLabelText('Editar tarea'))
      await user.type(screen.getByLabelText('Editar tarea'), '   {Enter}')

      expect(repo.stored[0]?.name).toBe('Regar plantas')
    })

    it('works identically on completed tasks', async () => {
      const user = userEvent.setup()
      const repo = renderList([{ ...baseTask, done: true, completedAt: 5_000 }])

      await user.click(screen.getByRole('button', { name: 'Editar Regar plantas' }))
      await user.type(screen.getByLabelText('Editar tarea'), ' dos{Enter}')

      expect(repo.stored[0]).toMatchObject({
        name: 'Regar plantas dos',
        done: true,
        completedAt: 5_000,
      })
    })
  })

  it('deletes instantly via the trash icon', async () => {
    const user = userEvent.setup()
    const repo = renderList()

    await user.click(within(rowOf('Regar plantas')).getByRole('button', { name: 'Eliminar Regar plantas' }))

    expect(repo.stored).toEqual([])
    // Every task gone: the full empty state, not the "nothing pending" one.
    expect(screen.getByText('Todo listo por ahora')).toBeInTheDocument()
  })

  it('toggles via Space when the checkbox is keyboard-focused (a11y floor)', async () => {
    const user = userEvent.setup()
    const repo = renderList()

    await user.tab() // first tabbable element is the checkbox
    expect(screen.getByRole('checkbox', { name: 'Regar plantas' })).toHaveFocus()

    await user.keyboard('[Space]')
    expect(repo.stored[0]?.done).toBe(true)
  })

  it('shows a visible focus ring class hook on the checkbox (a11y floor)', async () => {
    const user = userEvent.setup()
    renderList()

    const checkbox = screen.getByRole('checkbox', { name: 'Regar plantas' })
    await user.tab()
    expect(checkbox).toHaveFocus()
    expect(checkbox.className).toContain('focus-visible:outline-2')
  })
})
