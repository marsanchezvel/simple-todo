import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// Vitest globals are off, so RTL's automatic cleanup never registers.
afterEach(() => {
  cleanup()
})


// jsdom's crypto may lack randomUUID; the data model mandates
// crypto.randomUUID() for ids, so polyfill from Node when absent.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}
