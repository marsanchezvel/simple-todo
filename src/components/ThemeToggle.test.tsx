import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { THEME_STORAGE_KEY } from '../hooks/use-theme'
import { setPrefersColorSchemeDark } from '../test/setup'

function renderApp() {
  render(<App />)
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  setPrefersColorSchemeDark(false)
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

  it('boots dark when there is no stored choice and the system preference is dark', () => {
    setPrefersColorSchemeDark(true)
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('keeps a stored light choice when the system preference is dark', () => {
    setPrefersColorSchemeDark(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeVisible()
  })

  it('pins the pre-paint script to the same storage key and light rule', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(indexHtml).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
    expect(indexHtml).toContain("stored === 'dark'")
    expect(indexHtml).toContain("stored !== 'light'")
  })
})
