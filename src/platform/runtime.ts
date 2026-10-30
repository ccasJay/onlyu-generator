import { isTauri } from '@tauri-apps/api/core'

/** 同时检查官方标记和 Tauri 注入对象，避免 isTauri 标记异常导致误判为浏览器 */
export function isTauriRuntime(): boolean {
    if (isTauri()) return true
    if (typeof window === 'undefined') return false
    return '__TAURI_INTERNALS__' in window
}
