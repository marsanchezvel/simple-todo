# simple-todo

A lightweight task list for the browser: create, edit, complete and delete named tasks. The list survives reloads via `localStorage` — no backend, no accounts. UI microcopy is Spanish.

## Getting started

```sh
npm install
npm run dev          # dev server at http://localhost:5173
npm test             # unit tests, single run (Vitest + Testing Library)
npm run test:watch   # unit tests in watch mode
npm run build        # type-check + production bundle in dist/
npm run preview      # serve the production bundle locally
```

## Notes

Theme toggle (light/dark) and GitHub Pages deployment are deferred — this iteration ships light mode only.
