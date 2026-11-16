import { useTaskStore } from '../store/task-store'
import { TaskRow } from './TaskRow'

function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="mb-2 mt-2 text-[13px] font-semibold tracking-[0.08em] text-muted uppercase"
    >
      {children}
    </h2>
  )
}

function EmptyState({ emoji, text, sub }: { emoji: string; text: string; sub?: string }) {
  return (
    <div className="pt-9 pb-5 text-center text-muted">
      <div className="mb-2 text-[30px]" aria-hidden="true">
        {emoji}
      </div>
      <div>{text}</div>
      {sub ? <div className="text-sm">{sub}</div> : null}
    </div>
  )
}

/**
 * Task list (ordering + state patterns): pending section newest-first,
 * completed section below ("Completadas", most recent completion first),
 * empty states per EXPERIENCE.md (✨ empty list / 🎉 nothing pending).
 */
export function TaskList() {
  const { pendingTasks, completedTasks, totalTasks } = useTaskStore()
  const hasTasks = totalTasks > 0

  return (
    <>
      {pendingTasks.length > 0 && (
        <section aria-labelledby="pending-label" className="mb-2">
          <SectionLabel id="pending-label">Pendientes</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {hasTasks && pendingTasks.length === 0 && (
        <EmptyState emoji="🎉" text="Nada pendiente" />
      )}

      {completedTasks.length > 0 && (
        <section aria-labelledby="completed-label" className="mt-4">
          <SectionLabel id="completed-label">Completadas</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {!hasTasks && (
        <EmptyState
          emoji="✨"
          text="Todo listo por ahora"
          sub="Añade tu primera tarea arriba"
        />
      )}
    </>
  )
}
