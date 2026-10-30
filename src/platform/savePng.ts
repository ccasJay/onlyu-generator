import { invoke } from '@tauri-apps/api/core'
import { downloadDir, join } from '@tauri-apps/api/path'
import { save } from '@tauri-apps/plugin-dialog'
import { saveAs } from 'file-saver'
import { isTauriRuntime } from './runtime'

export type SavePngResult = 'saved' | 'cancelled'

interface WritableFileStreamLike {
    write(data: Blob): Promise<void>
    close(): Promise<void>
    abort?(): Promise<void>
}

interface FileHandleLike {
    createWritable(): Promise<WritableFileStreamLike>
}

type ShowSaveFilePicker = (options: {
    suggestedName?: string
    types?: Array<{ description?: string; accept: Record<string, string[]> }>
}) => Promise<FileHandleLike>

function dataUrlToBase64(dataUrl: string): string {
    const separator = dataUrl.indexOf(',')
    if (separator < 0 || !dataUrl.slice(0, separator).includes('base64')) {
        throw new Error('导出图片数据无效')
    }
    return dataUrl.slice(separator + 1)
}

function isAbortError(error: unknown): boolean {
    return (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            error.name === 'AbortError')
    )
}

async function nativeDefaultPath(fileName: string): Promise<string> {
    try {
        return await join(await downloadDir(), fileName)
    } catch {
        return fileName
    }
}

async function saveWithFilePicker(
    dataUrl: string,
    fileName: string
): Promise<SavePngResult | null> {
    const picker = (window as Window & { showSaveFilePicker?: ShowSaveFilePicker })
        .showSaveFilePicker

    if (!picker) return null

    let handle: FileHandleLike
    try {
        handle = await picker({
            suggestedName: fileName,
            types: [
                {
                    description: 'PNG 图片',
                    accept: { 'image/png': ['.png'] },
                },
            ],
        })
    } catch (error) {
        if (isAbortError(error)) return 'cancelled'
        return null
    }

    const writable = await handle.createWritable()
    try {
        const blob = await (await fetch(dataUrl)).blob()
        await writable.write(blob)
        await writable.close()
        return 'saved'
    } catch {
        await writable.abort?.()
        throw new Error('写入文件失败，请重试')
    }
}

/** 在 Tauri 中弹出原生保存对话框，浏览器优先使用保存位置选择器 */
export async function savePng(dataUrl: string, fileName: string): Promise<SavePngResult> {
    if (isTauriRuntime()) {
        const path = await save({
            title: '保存海报',
            defaultPath: await nativeDefaultPath(fileName),
            filters: [{ name: 'PNG 图片', extensions: ['png'] }],
            canCreateDirectories: true,
        })

        if (!path) return 'cancelled'

        await invoke('save_png', {
            path,
            base64Data: dataUrlToBase64(dataUrl),
        })
        return 'saved'
    }

    const picked = await saveWithFilePicker(dataUrl, fileName)
    if (picked) return picked

    saveAs(dataUrl, fileName)
    return 'saved'
}
