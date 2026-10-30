import { toPng } from 'html-to-image'
import { savePng, type SavePngResult } from '../platform/savePng'

const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|\p{Cc}]/gu
const MAX_FILENAME_BASE_LENGTH = 80

/** 清理导出文件名主体，去掉路径分隔符和 Windows 非法字符 */
export function sanitizeFileNameBase(name: string): string {
    const cleaned = name
        .replace(ILLEGAL_FILENAME_CHARS, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '')

    return (cleaned || '海报').slice(0, MAX_FILENAME_BASE_LENGTH)
}

/** 生成 `<姓名>_<YYYY-MM-DD>.png` */
export function buildExportFileName(name: string, date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${sanitizeFileNameBase(name)}_${year}-${month}-${day}.png`
}

function waitForImage(image: HTMLImageElement, timeoutMs = 10_000): Promise<void> {
    if (image.complete) {
        return image.naturalWidth > 0
            ? Promise.resolve()
            : Promise.reject(new Error('照片加载失败，请重新上传'))
    }

    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup()
            reject(new Error('照片加载超时，请重试'))
        }, timeoutMs)

        const cleanup = () => {
            window.clearTimeout(timeout)
            image.removeEventListener('load', handleLoad)
            image.removeEventListener('error', handleError)
        }

        const handleLoad = () => {
            cleanup()
            if (image.naturalWidth > 0) {
                resolve()
            } else {
                reject(new Error('照片加载失败，请重新上传'))
            }
        }

        const handleError = () => {
            cleanup()
            reject(new Error('照片加载失败，请重新上传'))
        }

        image.addEventListener('load', handleLoad)
        image.addEventListener('error', handleError)
    })
}

/** 等待海报字体和所有图片就绪，避免导出占位图 */
export async function waitForPosterAssets(poster: HTMLElement): Promise<void> {
    if (document.fonts) {
        await document.fonts.ready
    }

    const images = Array.from(poster.querySelectorAll('img'))
    await Promise.all(images.map((image) => waitForImage(image)))
}

/** 等待资源并以 2 倍像素比导出 PNG */
export async function exportPoster(poster: HTMLElement, name: string): Promise<SavePngResult> {
    await waitForPosterAssets(poster)

    const dataUrl = await toPng(poster, {
        pixelRatio: 2,
        cacheBust: true,
    })

    return savePng(dataUrl, buildExportFileName(name))
}
