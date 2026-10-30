import { describe, expect, it } from 'vitest'
import { buildExportFileName, sanitizeFileNameBase } from './export'

describe('export file names', () => {
    it('formats the name with the local date', () => {
        expect(buildExportFileName('刘阿姨', new Date(2026, 9, 30))).toBe('刘阿姨_2026-10-30.png')
    })

    it('removes path separators and reserved characters', () => {
        expect(sanitizeFileNameBase(' a/b:c*?"<>| ')).toBe('abc')
        expect(sanitizeFileNameBase('   ')).toBe('海报')
    })

    it('limits the file name body to 80 characters', () => {
        expect(sanitizeFileNameBase('阿'.repeat(100))).toHaveLength(80)
    })
})
