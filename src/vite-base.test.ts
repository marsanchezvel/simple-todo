import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const configPath = resolve(dirname(fileURLToPath(import.meta.url)), '../vite.config.ts')

describe('vite base', () => {
  it('sets the production base to /simple-todo/ and keeps the dev base /', () => {
    const source = readFileSync(configPath, 'utf8')

    expect(source).toMatch(
      /base:\s*command\s*===\s*['"]build['"]\s*\?\s*['"]\/simple-todo\/['"]\s*:\s*['"]\/['"]/,
    )
  })
})
