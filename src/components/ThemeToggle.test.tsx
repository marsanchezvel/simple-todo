import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'
import { THEME_STORAGE_KEY } from '../hooks/use-theme'

function renderApp() {
  render(<App />)
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('starts in light mode when the system preference is light and nothing is stored', () => {
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeVisible()
  })

  it('toggles to dark with one tap and updates the accessible name', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible()
  })

  it('persists the choice under simple-todo.theme', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('restores the stored choice on a fresh mount, overriding the system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible()
  })

  it('does not write a theme preference when the user never toggles', () => {
    renderApp()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('boots dark when there is no stored choice and the system preference is dark', async () => {
    const { setPrefersColorSchemeDark } = await import('../test/setup')
    setPrefersColorSchemeDark(true)
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    setPrefersColorSchemeDark(false)
  })
})
