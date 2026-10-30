import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
    deleteDraft,
    DraftCorruptionError,
    DraftSchemaError,
    loadDraft,
    readCurrentTemplateId,
    resetDraftDatabase,
    saveDraft,
    writeCurrentTemplateId,
} from './draftRepository'

const sampleForm = {
    name: '刘阿姨',
    city: '上海',
    title: '育婴师',
    tags: ['39岁', '上海人'],
    highlights: ['带宝经验丰富'],
    photo: 'data:image/png;base64,AAAA',
}

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

describe('draft repository', () => {
    beforeEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
    })

    afterEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
    })

    it('round-trips fields and photo in separate stores', async () => {
        await saveDraft('nanny', sampleForm)

        const loaded = await loadDraft('nanny')

        expect(loaded?.fields).toMatchObject({
            name: '刘阿姨',
            city: '上海',
            tags: ['39岁', '上海人'],
        })
        expect(loaded?.fields.photo).toBeUndefined()
        expect(loaded?.photo).toBe('data:image/png;base64,AAAA')
        expect(loaded?.warning).toBeNull()
    })

    it('keeps the stored photo when only text changes', async () => {
        await saveDraft('nanny', sampleForm)
        await saveDraft('nanny', { ...sampleForm, name: '王阿姨' }, { persistImage: false })

        const loaded = await loadDraft('nanny')

        expect(loaded?.fields.name).toBe('王阿姨')
        expect(loaded?.photo).toBe('data:image/png;base64,AAAA')
    })

    it('deletes the draft and photo', async () => {
        await saveDraft('nanny', sampleForm)
        await deleteDraft('nanny')

        await expect(loadDraft('nanny')).resolves.toBeNull()
    })

    it('rejects unsupported schema versions', async () => {
        await saveDraft('nanny', sampleForm)
        await overwriteDraftRecord({
            schemaVersion: 99,
            templateId: 'nanny',
            fields: {},
            photoId: null,
            updatedAt: 1,
        })

        await expect(loadDraft('nanny')).rejects.toBeInstanceOf(DraftSchemaError)
    })

    it('rejects corrupted field values', async () => {
        await saveDraft('nanny', sampleForm)
        await overwriteDraftRecord({
            schemaVersion: 1,
            templateId: 'nanny',
            fields: { name: 42 },
            photoId: null,
            updatedAt: 1,
        })

        await expect(loadDraft('nanny')).rejects.toBeInstanceOf(DraftCorruptionError)
    })

    it('remembers the current template id locally', () => {
        writeCurrentTemplateId('nanny')

        expect(readCurrentTemplateId()).toBe('nanny')
    })
})
