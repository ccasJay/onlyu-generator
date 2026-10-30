import { describe, expect, it, vi } from 'vitest'

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}))

import { saveAs } from 'file-saver'
import { savePng } from './savePng'

describe('savePng', () => {
    it('falls back to a browser download outside Tauri', async () => {
        await expect(savePng('data:image/png;base64,AAAA', '海报_2026-10-30.png')).resolves.toBe(
            'saved'
        )

        expect(saveAs).toHaveBeenCalledWith('data:image/png;base64,AAAA', '海报_2026-10-30.png')
    })
})
