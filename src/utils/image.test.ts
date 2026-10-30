import { describe, expect, it } from 'vitest'
import {
    getDataUrlByteLength,
    ImageProcessingError,
    MAX_IMAGE_FILE_BYTES,
    validateImageFile,
} from './image'

function makeFile(name: string, type: string, size = 10): File {
    return new File([new Uint8Array(size)], name, { type })
}

describe('image validation', () => {
    it('accepts supported image types', () => {
        expect(() => validateImageFile(makeFile('photo.jpg', 'image/jpeg'))).not.toThrow()
        expect(() => validateImageFile(makeFile('photo.png', 'image/png'))).not.toThrow()
        expect(() => validateImageFile(makeFile('photo.webp', 'image/webp'))).not.toThrow()
    })

    it('rejects unsupported types and empty files', () => {
        expect(() => validateImageFile(makeFile('photo.gif', 'image/gif'))).toThrow(
            ImageProcessingError
        )
        expect(() => validateImageFile(makeFile('empty.png', 'image/png', 0))).toThrow(
            '图片文件为空'
        )
    })

    it('rejects files over 20MB', () => {
        const file = makeFile('large.png', 'image/png')
        Object.defineProperty(file, 'size', { value: MAX_IMAGE_FILE_BYTES + 1 })

        expect(() => validateImageFile(file)).toThrow('图片超过 20MB')
    })

    it('calculates approximate binary length from a data URL', () => {
        expect(getDataUrlByteLength('data:image/png;base64,AAAA')).toBe(3)
    })
})
