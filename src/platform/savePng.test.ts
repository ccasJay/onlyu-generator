import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}))

import { saveAs } from 'file-saver'
import { savePng } from './savePng'

interface PickerWindow extends Window {
    showSaveFilePicker?: (options: unknown) => Promise<{
        createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>
            close: () => Promise<void>
        }>
    }>
}

const pickerWindow = window as PickerWindow

describe('savePng', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        delete pickerWindow.showSaveFilePicker
        vi.clearAllMocks()
    })

    it('falls back to a browser download when no picker is available', async () => {
        await expect(savePng('data:image/png;base64,AAAA', '海报_2026-10-30.png')).resolves.toBe(
            'saved'
        )

        expect(saveAs).toHaveBeenCalledWith('data:image/png;base64,AAAA', '海报_2026-10-30.png')
    })

    it('uses the browser save picker when available', async () => {
        const write = vi.fn().mockResolvedValue(undefined)
        const close = vi.fn().mockResolvedValue(undefined)
        const createWritable = vi.fn().mockResolvedValue({ write, close })
        const picker = vi.fn().mockResolvedValue({ createWritable })
        pickerWindow.showSaveFilePicker = picker
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                blob: async () => new Blob(['png']),
            })
        )

        await expect(savePng('data:image/png;base64,AAAA', '海报.png')).resolves.toBe('saved')

        expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: '海报.png' }))
        expect(write).toHaveBeenCalled()
        expect(close).toHaveBeenCalled()
        expect(saveAs).not.toHaveBeenCalled()
    })

    it('treats a cancelled picker as cancelled', async () => {
        pickerWindow.showSaveFilePicker = vi
            .fn()
            .mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }))

        await expect(savePng('data:image/png;base64,AAAA', '海报.png')).resolves.toBe('cancelled')
        expect(saveAs).not.toHaveBeenCalled()
    })
})
