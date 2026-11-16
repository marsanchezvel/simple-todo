import { useTheme, type Theme } from '../hooks/use-theme'

const LABELS: Record<Theme, string> = {
  dark: 'Cambiar a modo claro',
  light: 'Cambiar a modo oscuro',
}

/**
 * Header theme toggle (DESIGN.md Components): small icon button in the
 * header corner, sun/moon per current theme, one tap to switch. 32px visual
 * with an expanded hit area (same pattern as TaskRow) to honor the ≥44px
 * touch-target floor.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={LABELS[theme]}
      className="relative flex h-8 w-8 items-center justify-center rounded-input text-lg text-muted transition-colors after:absolute after:-inset-1.5 after:rounded-input after:content-[''] hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}
