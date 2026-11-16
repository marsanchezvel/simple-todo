import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTaskStore } from '../store/task-store'

/**
 * Composer (CAP-1): typing + Enter or the gradient button creates a task at
 * the top of pending, clears the input and keeps focus for rapid entry.
 * Blank input: button disabled, no task created.
 */
export function Composer() {
  const { addTask } = useTaskStore()
  const [value, setValue] = useState('')
  const composing = useRef(false)
  const canAdd = value.trim().length > 0

  const submit = () => {
    if (!canAdd) return
    addTask(value)
    setValue('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    // A form submit's native event is a SubmitEvent, which has no
    // isComposing. The composition listeners are what actually know.
    if (composing.current) return
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter that confirms an IME composition (keyCode 229) must not submit.
    const native = event.nativeEvent
    if (native.isComposing || native.keyCode === 229) event.preventDefault()
  }

  return (
    <form className="mb-4 flex gap-2.5" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
        }}
        onKeyDown={handleKeyDown}
        placeholder="¿Qué tienes que hacer?"
        aria-label="Nueva tarea"
        className="min-w-0 flex-1 transition-theme rounded-input border border-muted/25 bg-surface px-4 py-3 text-base text-text placeholder:text-muted/70 outline-none focus:border-primary focus:shadow-[0_0_12px_rgba(251,113,133,0.35)] focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={!canAdd}
        className="shrink-0 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_2px_10px_rgba(251,113,133,0.45)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        + Añadir tarea
      </button>
    </form>
  )
}
