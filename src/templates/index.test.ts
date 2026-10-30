import { describe, expect, it } from 'vitest'
import { getDefaultFormData, getTemplateById } from './index'

describe('template defaults', () => {
    it('builds defaults from field metadata', () => {
        const template = getTemplateById('nanny')

        expect(template).toBeDefined()

        const defaults = getDefaultFormData(template!)

        expect(defaults).toMatchObject({
            photo: null,
            city: '上海',
            title: '育婴师',
            tags: [],
            highlights: [],
        })
    })
})
