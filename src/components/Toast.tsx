import { useEffect } from 'react'
import { useTaskStore } from '../store/task-store'

const UNDO_WINDOW_MS = 5000
// Composer input lookup — the sensible focus target after an undo.
const COMPOSER_INPUT_SELECTOR = 'input[aria-label="Nueva tarea"]'

/**
 * Undo toast (CAP-3 safety net): pill bottom-center, `role="status"`,
 * `Deshacer` restores the exact task; auto-hides after 5s. The content
 * (text + button) is only rendered while visible: inserting it into the
 * live region is what makes screen readers announce it.
 */
export function Toast() {
  const { lastDeleted, undoDelete, expireUndo } = useTaskStore()
  const visible = lastDeleted !== null

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(expireUndo, UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [visible, lastDeleted, expireUndo])

  const handleUndo = () => {
    undoDelete()
    // Keyboard users: return focus to the composer instead of dropping to <body>.
    document.querySelector<HTMLInputElement>(COMPOSER_INPUT_SELECTOR)?.focus()
  }

  return (
    <div
      role="status"
      aria-hidden={!visible}
      className={`fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3.5 rounded-full bg-text px-4.5 py-2.5 text-sm font-semibold text-bg transition-[opacity,transform] duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {visible && (
        <>
          <span>Tarea eliminada</span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-extrabold text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Deshacer
          </button>
        </>
      )}
    </div>
  )
}
