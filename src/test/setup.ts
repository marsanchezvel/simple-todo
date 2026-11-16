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
// Defined against globalThis itself so a fully-missing crypto object
// cannot crash the polyfill.
if (!globalThis.crypto?.randomUUID) {
  const cryptoWithUUID = Object.create(globalThis.crypto ?? webcrypto)
  Object.defineProperty(cryptoWithUUID, 'randomUUID', {
    value: () => webcrypto.randomUUID(),
    configurable: true,
  })
  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoWithUUID,
    configurable: true,
  })
}

// jsdom does not implement matchMedia; the theme hook and the inline
// <head> script both read (prefers-color-scheme: dark). The stub is
// configurable so tests can simulate a dark system preference.
let prefersColorSchemeDark = false

export function setPrefersColorSchemeDark(matches: boolean): void {
  prefersColorSchemeDark = matches
}

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query.includes('(prefers-color-scheme') && query.includes('dark') ? prefersColorSchemeDark : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
