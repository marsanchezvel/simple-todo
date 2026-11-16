import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LocalStorageTaskRepository,
  STORAGE_KEY,
} from './local-storage-task.repository'
import type { Task } from '../types/task'

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  name: 'Llamar al dentista',
  done: false,
  createdAt: 1_000,
  completedAt: null,
  ...overrides,
})

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LocalStorageTaskRepository', () => {
  describe('load', () => {
    it('returns an empty list when nothing is stored', () => {
      const repo = new LocalStorageTaskRepository()
      expect(repo.load()).toEqual([])
    })

    it('round-trips tasks saved under key simple-todo.v1 (reload fidelity)', () => {
      const repo = new LocalStorageTaskRepository()
      const tasks = [
        task({ id: 'a', createdAt: 100, done: true, completedAt: 300 }),
        task({ id: 'b', createdAt: 200 }),
      ]
      repo.save(tasks)

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(tasks))
      expect(new LocalStorageTaskRepository().load()).toEqual(tasks)
    })

    it('starts with an empty list on corrupted JSON (storage read failure)', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not json')
      const repo = new LocalStorageTaskRepository()
      expect(repo.load()).toEqual([])
    })

    it('starts with an empty list when the payload is not an array', () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: [] }))
      expect(new LocalStorageTaskRepository().load()).toEqual([])
    })

    it('drops malformed entries instead of crashing the list', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([task({ id: 'ok' }), { bad: true }, null, 'nope']),
      )
      expect(new LocalStorageTaskRepository().load()).toEqual([task({ id: 'ok' })])
    })

    it('drops entries violating the completedAt-null ⇔ done invariant', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: 'bad-1', name: 'x', done: true, createdAt: 1, completedAt: null },
          { id: 'bad-2', name: 'y', done: false, createdAt: 2, completedAt: 5 },
          task({ id: 'ok' }),
        ]),
      )
      expect(new LocalStorageTaskRepository().load()).toEqual([task({ id: 'ok' })])
    })

    it('dedupes duplicate ids, keeping the first occurrence', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          task({ id: 'dup', name: 'primera' }),
          task({ id: 'dup', name: 'segunda' }),
        ]),
      )
      expect(new LocalStorageTaskRepository().load()).toEqual([
        task({ id: 'dup', name: 'primera' }),
      ])
    })
  })

  describe('save', () => {
    it('writes the whole list as a single JSON array under simple-todo.v1', () => {
      const repo = new LocalStorageTaskRepository()
      const tasks = [task({ id: 'x' })]
      repo.save(tasks)
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(tasks)
    })

    it('warns and keeps working when storage write fails (quota/blocked)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // setItem lives on Storage.prototype — spy there so every instance is covered.
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const repo = new LocalStorageTaskRepository()
      expect(() => repo.save([task()])).not.toThrow()
      expect(warn).toHaveBeenCalledTimes(1)
    })
  })
})
