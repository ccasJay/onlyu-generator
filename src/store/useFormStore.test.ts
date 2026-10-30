import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetDraftDatabase, saveDraft, writeCurrentTemplateId } from './draftRepository'
import { useFormStore } from './useFormStore'

async function overwriteDraftRecord(record: unknown): Promise<void> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('onlyu-generator')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })

    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('drafts', 'readwrite')
        transaction.objectStore('drafts').put(record)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
    db.close()
}

describe('useFormStore hydration', () => {
    beforeEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
        useFormStore.setState({
            currentTemplateId: 'nanny',
            formData: {},
            hydrationStatus: 'loading',
            notice: null,
            isExporting: false,
        })
    })

    afterEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
    })

    it('uses template defaults when no draft exists', async () => {
        await useFormStore.getState().hydrate()

        const state = useFormStore.getState()

        expect(state.hydrationStatus).toBe('ready')
        expect(state.formData).toMatchObject({
            city: '上海',
            title: '育婴师',
            photo: null,
            tags: [],
        })
    })

    it('restores the draft and fills fields missing from older drafts', async () => {
        writeCurrentTemplateId('nanny')
        await saveDraft('nanny', {
            city: '北京',
            name: '王阿姨',
            photo: 'data:image/png;base64,BBBB',
            tags: [],
            highlights: [],
        })

        await useFormStore.getState().hydrate()

        const state = useFormStore.getState()

        expect(state.hydrationStatus).toBe('ready')
        expect(state.formData.city).toBe('北京')
        expect(state.formData.name).toBe('王阿姨')
        expect(state.formData.title).toBe('育婴师')
        expect(state.formData.photo).toBe('data:image/png;base64,BBBB')
    })

    it('falls back to defaults and degrades when the draft is incompatible', async () => {
        writeCurrentTemplateId('nanny')
        await saveDraft('nanny', { name: '旧草稿' })
        await overwriteDraftRecord({
            schemaVersion: 99,
            templateId: 'nanny',
            fields: { name: '旧草稿' },
            photoId: null,
            updatedAt: 1,
        })

        await useFormStore.getState().hydrate()

        const state = useFormStore.getState()

        expect(state.hydrationStatus).toBe('degraded')
        expect(state.formData.title).toBe('育婴师')
        expect(state.notice).toContain('草稿版本不兼容')
    })

    it('falls back to the default template when the remembered template is unknown', async () => {
        writeCurrentTemplateId('missing-template')

        await useFormStore.getState().hydrate()

        const state = useFormStore.getState()

        expect(state.currentTemplateId).toBe('nanny')
        expect(state.notice).toContain('模板不存在')
    })
})
