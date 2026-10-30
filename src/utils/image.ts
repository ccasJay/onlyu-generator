export const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024
export const MAX_IMAGE_DATA_BYTES = 8 * 1024 * 1024
export const MAX_IMAGE_EDGE = 2000
const FALLBACK_IMAGE_EDGE = 1600
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SUPPORTED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i

export class ImageProcessingError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ImageProcessingError'
    }
}

function isSupportedImageFile(file: File): boolean {
    if (SUPPORTED_IMAGE_TYPES.has(file.type)) return true
    return file.type === '' && SUPPORTED_IMAGE_EXTENSIONS.test(file.name)
}

/** 同步校验文件类型与原始大小 */
export function validateImageFile(file: File): void {
    if (file.size === 0) {
        throw new ImageProcessingError('图片文件为空，请重新选择')
    }
    if (!isSupportedImageFile(file)) {
        throw new ImageProcessingError('图片格式不支持，请上传 JPG、PNG 或 WebP')
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
        throw new ImageProcessingError('图片超过 20MB，请压缩后重试')
    }
}

/** 计算 data URL 中实际二进制数据的近似字节数 */
export function getDataUrlByteLength(dataUrl: string): number {
    const separator = dataUrl.indexOf(',')
    if (separator < 0) return dataUrl.length
    const payload = dataUrl.slice(separator + 1)
    return Math.floor((payload.length * 3) / 4)
}

type DecodedImage = ImageBitmap | HTMLImageElement

async function decodeImage(file: File): Promise<DecodedImage> {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(file)
        } catch {
            // 部分 WebView 对 createImageBitmap 支持不完整，回退到 Image
        }
    }

    return await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        const objectUrl = URL.createObjectURL(file)
        image.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(image)
        }
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new ImageProcessingError('图片解码失败，请更换图片'))
        }
        image.src = objectUrl
    })
}

function releaseImage(image: DecodedImage): void {
    if ('close' in image && typeof image.close === 'function') {
        image.close()
    }
}

function renderToDataUrl(image: DecodedImage, maxEdge: number, quality: number): string {
    const longestEdge = Math.max(image.width, image.height)
    const scale = Math.min(1, maxEdge / longestEdge)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
        throw new ImageProcessingError('当前环境无法处理图片，请重试')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    const webp = canvas.toDataURL('image/webp', quality)
    if (webp.startsWith('data:image/webp')) {
        return webp
    }

    // WebP 不可用时保留透明通道，回退 PNG
    return canvas.toDataURL('image/png')
}

async function compress(file: File, maxEdge: number, quality: number): Promise<string> {
    const image = await decodeImage(file)
    try {
        return renderToDataUrl(image, maxEdge, quality)
    } finally {
        releaseImage(image)
    }
}

/** 将上传图片压缩到目标尺寸与大小；透明通道会保留 */
export async function compressImageFile(file: File): Promise<string> {
    validateImageFile(file)

    let dataUrl = await compress(file, MAX_IMAGE_EDGE, 0.92)

    if (getDataUrlByteLength(dataUrl) > MAX_IMAGE_DATA_BYTES) {
        dataUrl = await compress(file, FALLBACK_IMAGE_EDGE, 0.88)
    }

    if (getDataUrlByteLength(dataUrl) > MAX_IMAGE_DATA_BYTES) {
        throw new ImageProcessingError('图片压缩后仍超过 8MB，请更换图片')
    }

    return dataUrl
}
