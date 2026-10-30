import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTauriRuntime } from './runtime'

describe('isTauriRuntime', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    })

    it('uses the official Tauri marker', () => {
        vi.stubGlobal('isTauri', true)
        expect(isTauriRuntime()).toBe(true)
    })

    it('detects the injected internals when the marker is missing', () => {
        Object.defineProperty(window, '__TAURI_INTERNALS__', {
            value: {},
            configurable: true,
        })
        expect(isTauriRuntime()).toBe(true)
    })

    it('is false in a plain browser', () => {
        expect(isTauriRuntime()).toBe(false)
    })
})
