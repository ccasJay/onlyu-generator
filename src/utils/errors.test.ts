import { describe, expect, it } from 'vitest'
import { describeError } from './errors'

describe('describeError', () => {
    it('preserves Tauri string errors', () => {
        expect(describeError('dialog.save not allowed')).toBe('dialog.save not allowed')
    })

    it('reads Error messages and object messages', () => {
        expect(describeError(new Error('保存失败'))).toBe('保存失败')
        expect(describeError({ message: '写入失败' })).toBe('写入失败')
    })

    it('describes DOM events such as image load failures', () => {
        expect(describeError(new Event('error'))).toBe('图片资源加载失败（error）')
    })

    it('falls back for unknown values', () => {
        expect(describeError(undefined)).toBe('未知错误')
        expect(describeError({}, '操作失败')).toBe('操作失败')
    })
})
