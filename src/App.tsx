import { Composer } from './components/Composer'
import { TaskList } from './components/TaskList'
import { ThemeToggle } from './components/ThemeToggle'
import { Toast } from './components/Toast'
import { TaskProvider } from './store/task-store'

/**
 * Single-screen assembly (AD-5): header + composer + two list sections,
 * wrapped by the single task store (AD-1). Theme via ThemeToggle; GitHub
 * Pages deployment is deferred.
 */
export default function App() {
  return (
    <TaskProvider>
      <main className="transition-theme mx-auto w-full max-w-[640px] rounded-card bg-surface p-5 shadow-soft">
        <header className="mb-3 flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold">simple-todo</h1>
          <ThemeToggle />
        </header>
        <div aria-hidden="true" className="mb-4 h-[3px] rounded-full bg-brand-gradient" />
        <Composer />
        <TaskList />
        <Toast />
      </main>
    </TaskProvider>
  )
}
