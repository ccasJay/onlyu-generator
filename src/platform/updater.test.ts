import { describe, expect, it } from 'vitest'
import { canCheckForUpdates, checkForUpdate, downloadAndInstall, isNewerVersion } from './updater'

describe('updater platform guard', () => {
    it('is disabled outside Tauri', async () => {
        expect(canCheckForUpdates()).toBe(false)
        await expect(checkForUpdate()).resolves.toBeNull()
    })

    it('refuses to install without a checked update', async () => {
        await expect(downloadAndInstall(() => undefined)).rejects.toThrow('没有可安装的更新')
    })

    it('only accepts strictly newer versions', () => {
        expect(isNewerVersion('0.2.1', '0.2.0')).toBe(true)
        expect(isNewerVersion('0.10.0', '0.9.9')).toBe(true)
        expect(isNewerVersion('0.2.0', '0.2.0')).toBe(false)
        expect(isNewerVersion('0.1.9', '0.2.0')).toBe(false)
    })
})
