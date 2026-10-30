import { isTauri } from '@tauri-apps/api/core'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
    version: string
    currentVersion: string
    notes: string
}

export interface DownloadProgress {
    percent: number | null
    downloaded: number
    total: number | null
}

let pendingUpdate: Update | null = null

function versionParts(version: string): number[] {
    return version
        .split('.')
        .slice(0, 3)
        .map((part) => Number.parseInt(part, 10) || 0)
}

export function isNewerVersion(latest: string, current: string): boolean {
    const latestParts = versionParts(latest)
    const currentParts = versionParts(current)

    for (let index = 0; index < 3; index += 1) {
        const latestPart = latestParts[index] ?? 0
        const currentPart = currentParts[index] ?? 0
        if (latestPart !== currentPart) return latestPart > currentPart
    }

    return false
}

export function canCheckForUpdates(): boolean {
    return isTauri()
}

/** 检查更新；超时或非 Tauri 环境返回 null/抛错，由调用方决定是否静默 */
export async function checkForUpdate(timeoutMs = 15_000): Promise<UpdateInfo | null> {
    if (!canCheckForUpdates()) return null

    if (pendingUpdate) {
        await pendingUpdate.close()
        pendingUpdate = null
    }

    const checkTask = check()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutTask = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('检查更新超时，请稍后重试')), timeoutMs)
    })

    try {
        const update = await Promise.race([checkTask, timeoutTask])
        if (!update) return null

        if (!isNewerVersion(update.version, update.currentVersion)) {
            await update.close()
            throw new Error('更新版本无效或低于当前版本，已拒绝安装')
        }

        pendingUpdate = update
        return {
            version: update.version,
            currentVersion: update.currentVersion,
            notes: update.body ?? '',
        }
    } finally {
        if (timer) clearTimeout(timer)
        void checkTask.then((update) => {
            if (!update) return
            if (pendingUpdate !== update) {
                void update.close()
            }
        })
    }
}

/** 下载并安装已检查到的更新，进度回调可能没有总大小 */
export async function downloadAndInstall(
    onProgress: (progress: DownloadProgress) => void
): Promise<void> {
    if (!pendingUpdate) {
        throw new Error('没有可安装的更新')
    }

    let total: number | null = null
    let downloaded = 0

    await pendingUpdate.downloadAndInstall((event) => {
        if (event.event === 'Started') {
            total = event.data.contentLength ?? null
            downloaded = 0
            onProgress({ percent: 0, downloaded, total })
            return
        }

        if (event.event === 'Progress') {
            downloaded += event.data.chunkLength
            onProgress({
                percent: total ? Math.min(100, Math.round((downloaded / total) * 100)) : null,
                downloaded,
                total,
            })
            return
        }

        onProgress({ percent: 100, downloaded, total })
    })

    await pendingUpdate.close()
    pendingUpdate = null
}

/** 安装完成后重启应用 */
export async function restartApp(): Promise<void> {
    await relaunch()
}
