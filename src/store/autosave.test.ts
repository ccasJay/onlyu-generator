import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultFormData, getTemplateById } from '../templates'
import { loadDraft, resetDraftDatabase } from './draftRepository'
import { useFormStore, type SaveStatus } from './useFormStore'

const template = getTemplateById('nanny')!

async function waitForStatus(expected: SaveStatus, timeout = 2000): Promise<void> {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeout) {
        if (useFormStore.getState().saveStatus === expected) return
        await new Promise((resolve) => setTimeout(resolve, 25))
    }

    throw new Error(`saveStatus did not become ${expected}`)
}

describe('autosave', () => {
    beforeEach(async () => {
        await resetDraftDatabase()
        localStorage.clear()
        useFormStore.setState({
            currentTemplateId: 'nanny',
            formData: getDefaultFormData(template),
            hydrationStatus: 'ready',
            saveStatus: 'idle',
            notice: null,
            isExporting: false,
        })
    })

    afterEach(async () => {
        vi.unstubAllGlobals()
        await resetDraftDatabase()
        localStorage.clear()
    })

    it('reports saving then saved and persists the latest fields', async () => {
        useFormStore.getState().setField('name', '李阿姨')

        expect(useFormStore.getState().saveStatus).toBe('saving')

        await waitForStatus('saved')

        const loaded = await loadDraft('nanny')
        expect(loaded?.fields.name).toBe('李阿姨')
    })

    it('keeps in-memory data and reports an error when storage is unavailable', async () => {
        const originalIndexedDB = globalThis.indexedDB
        vi.stubGlobal('indexedDB', undefined)

        useFormStore.getState().setField('name', '仍可编辑')

        await waitForStatus('error')

        expect(useFormStore.getState().formData.name).toBe('仍可编辑')
        expect(useFormStore.getState().notice).toContain('草稿保存失败')

        vi.stubGlobal('indexedDB', originalIndexedDB)
        useFormStore.getState().setField('name', '恢复保存')

        await waitForStatus('saved')

        const loaded = await loadDraft('nanny')
        expect(loaded?.fields.name).toBe('恢复保存')
    })
})
