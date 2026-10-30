import { confirm } from '@tauri-apps/plugin-dialog'
import { isTauriRuntime } from './runtime'

/** 在 Tauri 中使用原生确认框，浏览器中回退到 confirm */
export async function confirmAction(message: string, title = '请确认'): Promise<boolean> {
    if (isTauriRuntime()) {
        return confirm(message, {
            title,
            kind: 'warning',
        })
    }

    return window.confirm(message)
}
