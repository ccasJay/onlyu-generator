import { describe, expect, it } from 'vitest'
import { getTemplateById } from '../templates'
import type { FormData } from '../templates/types'
import { validateFormData } from './validation'

const template = getTemplateById('nanny')!

function validForm(overrides: Partial<FormData> = {}): FormData {
    return {
        photo: 'data:image/png;base64,AAAA',
        city: '上海',
        title: '育婴师',
        name: '刘阿姨',
        salary: '8500元+/26天',
        tags: ['39岁'],
        highlights: ['带宝经验丰富'],
        ...overrides,
    }
}

describe('form validation', () => {
    it('requires a photo and a non-blank name', () => {
        expect(validateFormData(template, validForm())).toEqual({})

        const errors = validateFormData(template, validForm({ photo: null, name: '   ' }))

        expect(errors.photo).toBe('请上传照片')
        expect(errors.name).toBe('请输入姓名')
    })

    it('enforces text length limits', () => {
        const errors = validateFormData(
            template,
            validForm({
                city: '一二三四五六七',
                title: '一二三四五六七八九',
                salary: '一二三四五六七八九十一二三四五六七',
            })
        )

        expect(errors.city).toContain('6')
        expect(errors.title).toContain('8')
        expect(errors.salary).toContain('16')
    })

    it('enforces tag and highlight count and item limits', () => {
        const errors = validateFormData(
            template,
            validForm({
                tags: ['一二三四五六七'],
                highlights: ['一', '二', '三', '四', '五'],
            })
        )

        expect(errors.tags).toContain('6')
        expect(errors.highlights).toContain('4')

        const countErrors = validateFormData(
            template,
            validForm({
                tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
                highlights: ['一二三四五六七八九十一二三四五六七八九十一二三四五'],
            })
        )

        expect(countErrors.tags).toContain('8')
        expect(countErrors.highlights).toContain('24')
    })
})
