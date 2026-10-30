import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDefaultFormData, getTemplateById, templates } from '../templates'
import { nannyTemplate } from '../templates/template-nanny'
import { loadDraft, resetDraftDatabase, saveDraft } from './draftRepository'
import { flushDraftAutosave, useFormStore } from './useFormStore'

const testTemplate = {
    ...nannyTemplate,
    id: 'test-template',
    name: '测试模板',
}

if (!templates.some((template) => template.id === testTemplate.id)) {
    templates.push(testTemplate)
}

const nanny = getTemplateById('nanny')!

describe('template lifecycle', () => {
    beforeEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
        useFormStore.setState({
            currentTemplateId: 'nanny',
            formData: getDefaultFormData(nanny),
            hydrationStatus: 'ready',
            saveStatus: 'idle',
            notice: null,
            isExporting: false,
        })
        await flushDraftAutosave()
    })

    afterEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
    })

    it('switches templates without leaking fields and restores each draft', async () => {
        await saveDraft('nanny', { ...getDefaultFormData(nanny), name: 'A 阿姨' })
        await saveDraft('test-template', {
            ...getDefaultFormData(testTemplate),
            name: 'B 阿姨',
        })

        await useFormStore.getState().switchTemplate('test-template')

        expect(useFormStore.getState().currentTemplateId).toBe('test-template')
        expect(useFormStore.getState().formData.name).toBe('B 阿姨')

        await useFormStore.getState().switchTemplate('nanny')

        expect(useFormStore.getState().currentTemplateId).toBe('nanny')
        expect(useFormStore.getState().formData.name).toBe('A 阿姨')
    })

    it('flushes the pending save before switching templates', async () => {
        useFormStore.getState().setField('name', '待保存')

        await useFormStore.getState().switchTemplate('test-template')

        const nannyDraft = await loadDraft('nanny')
        expect(nannyDraft?.fields.name).toBe('待保存')
    })

    it('resets only the current template and keeps other drafts', async () => {
        await saveDraft('nanny', { ...getDefaultFormData(nanny), name: '保留的阿姨' })
        await saveDraft('test-template', {
            ...getDefaultFormData(testTemplate),
            name: '要重置的阿姨',
        })

        await useFormStore.getState().switchTemplate('test-template')
        await useFormStore.getState().resetCurrentTemplate()

        expect(useFormStore.getState().formData.name).toBe('')
        await expect(loadDraft('test-template')).resolves.toBeNull()

        await useFormStore.getState().switchTemplate('nanny')
        expect(useFormStore.getState().formData.name).toBe('保留的阿姨')
    })

    it('keeps the current template when the target id is unknown', async () => {
        useFormStore.getState().setField('name', '当前内容')

        await useFormStore.getState().switchTemplate('missing-template')

        expect(useFormStore.getState().currentTemplateId).toBe('nanny')
        expect(useFormStore.getState().formData.name).toBe('当前内容')
        expect(useFormStore.getState().notice).toContain('不存在')
    })
})
