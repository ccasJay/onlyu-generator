import { DEFAULT_PHOTO_TRANSFORM, type PhotoTransform } from '../templates/types'

export const PHOTO_SCALE_MIN = 0.5
export const PHOTO_SCALE_MAX = 2
export const PHOTO_OFFSET_X_LIMIT = 300
export const PHOTO_OFFSET_Y_LIMIT = 400

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

/** 将任意值规范为安全、可导出的照片变换 */
export function normalizePhotoTransform(value: unknown): PhotoTransform {
    if (typeof value !== 'object' || value === null) {
        return { ...DEFAULT_PHOTO_TRANSFORM }
    }

    const record = value as Record<string, unknown>
    const scale = typeof record.scale === 'number' ? record.scale : 1
    const offsetX = typeof record.offsetX === 'number' ? record.offsetX : 0
    const offsetY = typeof record.offsetY === 'number' ? record.offsetY : 0

    return {
        scale: clamp(Number.isFinite(scale) ? scale : 1, PHOTO_SCALE_MIN, PHOTO_SCALE_MAX),
        offsetX: clamp(
            Number.isFinite(offsetX) ? offsetX : 0,
            -PHOTO_OFFSET_X_LIMIT,
            PHOTO_OFFSET_X_LIMIT
        ),
        offsetY: clamp(
            Number.isFinite(offsetY) ? offsetY : 0,
            -PHOTO_OFFSET_Y_LIMIT,
            PHOTO_OFFSET_Y_LIMIT
        ),
    }
}
