import { invoke, isTauri } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { saveAs } from 'file-saver'

export type SavePngResult = 'saved' | 'cancelled'

function dataUrlToBase64(dataUrl: string): string {
    const separator = dataUrl.indexOf(',')
    if (separator < 0 || !dataUrl.slice(0, separator).includes('base64')) {
        throw new Error('导出图片数据无效')
    }
    return dataUrl.slice(separator + 1)
}

/** 在 Tauri 中弹出原生保存对话框，在浏览器中回退为下载 */
export async function savePng(dataUrl: string, fileName: string): Promise<SavePngResult> {
    if (isTauri()) {
        const path = await save({
            defaultPath: fileName,
            filters: [{ name: 'PNG 图片', extensions: ['png'] }],
        })

        if (!path) return 'cancelled'

        await invoke('save_png', {
            path,
            base64Data: dataUrlToBase64(dataUrl),
        })
        return 'saved'
    }

    saveAs(dataUrl, fileName)
    return 'saved'
}
