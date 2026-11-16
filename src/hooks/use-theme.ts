import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'simple-todo.theme'
const DARK_CLASS = 'dark'

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null // blocked storage: fall through to the applied class / system
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Non-fatal by contract: the preference just lasts this session.
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function initialTheme(): Theme {
  // The inline <head> script (index.html) resolved the same rule — stored
  // choice, else system preference — and applied the class before React
  // mounted. Read that applied class as the single source of truth so the
  // two copies of the rule cannot desync; fall back to the system query
  // only when no class is present (e.g. test environments).
  if (document.documentElement.classList.contains(DARK_CLASS)) return 'dark'
  if (readStoredTheme() === 'dark') return 'dark'
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark')
}

/**
 * Theme preference hook: manual light/dark toggle (DESIGN.md), persisted in
 * localStorage, defaulting to the system preference on first visit. The
 * boot-time resolution lives in the inline <head> script of index.html —
 * keep the two rules in sync when changing either.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    writeStoredTheme(next)
    setTheme(next)
  }

  return { theme, toggleTheme }
}
