import { describe, expect, it } from 'vitest'
import { normalizePhotoTransform } from './photoTransform'

describe('normalizePhotoTransform', () => {
    it('clamps scale and offsets', () => {
        expect(normalizePhotoTransform({ scale: 3, offsetX: 999, offsetY: -999 })).toEqual({
            scale: 2,
            offsetX: 300,
            offsetY: -400,
        })
    })

    it('returns defaults for missing or invalid values', () => {
        expect(normalizePhotoTransform(undefined)).toEqual({
            scale: 1,
            offsetX: 0,
            offsetY: 0,
        })
        expect(normalizePhotoTransform({ scale: Number.NaN })).toEqual({
            scale: 1,
            offsetX: 0,
            offsetY: 0,
        })
    })
})
