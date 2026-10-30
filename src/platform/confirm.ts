import { isTauri } from '@tauri-apps/api/core'
import { confirm } from '@tauri-apps/plugin-dialog'

/** 在 Tauri 中使用原生确认框，浏览器中回退到 confirm */
export async function confirmAction(message: string, title = '请确认'): Promise<boolean> {
    if (isTauri()) {
        return confirm(message, {
            title,
            kind: 'warning',
        })
    }

    return window.confirm(message)
}
