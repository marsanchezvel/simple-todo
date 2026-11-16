import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Task } from '../types/task'
import { useTaskStore } from '../store/task-store'

/**
 * Task row (CAP-2/3/4/5): circle checkbox, inline edit, delete icon.
 * Keyboard: Space toggles the checkbox, Enter/Escape drive the edit,
 * every control has a ≥44px hit area and a visible focus ring.
 */
export function TaskRow({ task }: { task: Task }) {
  const { renameTask, toggleTask, deleteTask } = useTaskStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(task.name)
    setEditing(true)
  }

  const saveEdit = () => {
    if (draft.trim()) renameTask(task.id, draft)
    setEditing(false)
  }

  const cancelEdit = () => setEditing(false)

  useEffect(() => {
    if (!editing) return
    const input = editInputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [editing])

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') saveEdit()
    if (event.key === 'Escape') cancelEdit()
  }

  return (
    <li
      className={`group flex items-center gap-3 rounded-item px-4 py-3 transition-colors hover:bg-primary/6 focus-within:bg-primary/6 ${
        editing ? 'bg-primary/6 shadow-[inset_0_0_0_2px_rgba(124,58,237,0.25)]' : ''
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.name}
        onClick={() => toggleTask(task.id)}
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-transparent transition-colors before:absolute before:-inset-2.5 before:rounded-full before:content-[''] hover:border-primary/70 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-checked:border-primary aria-checked:bg-primary aria-checked:text-white"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path d="M3 8.5l3.2 3.2L13 5" className={task.done ? 'check-draw' : undefined} />
        </svg>
      </button>

      {editing ? (
        <input
          ref={editInputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={saveEdit}
          aria-label="Editar tarea"
          className="min-w-0 flex-1 border-b-2 border-primary bg-transparent py-0.5 text-base text-text outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className={`min-w-0 flex-1 cursor-text text-left text-base leading-normal wrap-anywhere focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 ${
            task.done ? 'text-muted line-through' : 'text-text'
          }`}
        >
          {task.name}
        </button>
      )}

      <div className="row-actions flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Editar ${task.name}`}
          onClick={startEdit}
          className="relative flex h-8 w-8 items-center justify-center rounded-input text-base text-muted transition-colors after:absolute after:-inset-1.5 after:rounded-input after:content-[''] hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          ✏️
        </button>
        <button
          type="button"
          aria-label={`Eliminar ${task.name}`}
          onClick={() => deleteTask(task.id)}
          className="relative flex h-8 w-8 items-center justify-center rounded-input text-base text-muted transition-colors after:absolute after:-inset-1.5 after:rounded-input after:content-[''] hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          🗑️
        </button>
      </div>
    </li>
  )
}
