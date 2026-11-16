# simple-todo

A lightweight task list for the browser: create, edit, complete and delete named tasks. The list survives reloads via `localStorage` — no backend, no accounts. UI microcopy is Spanish. Light and dark theme with a header toggle (system preference by default, choice persisted).

## Getting started

Node.js 24 or newer is required.

```sh
npm install
npm run dev          # dev server at http://localhost:5173
npm test             # unit tests, single run (Vitest + Testing Library)
npm run test:watch   # unit tests in watch mode
npm run build        # type-check + production bundle in dist/
npm run preview      # serve the production bundle locally
```

## Notes

Published at https://marsanchezvel.github.io/simple-todo/.
