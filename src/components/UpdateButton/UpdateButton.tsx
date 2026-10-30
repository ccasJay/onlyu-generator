import { useCallback, useEffect, useRef, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { useFormStore } from '../../store/useFormStore'
import {
    canCheckForUpdates,
    checkForUpdate,
    downloadAndInstall,
    restartApp,
    type UpdateInfo,
} from '../../platform/updater'
import './UpdateButton.css'

type Phase = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

function describeError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

export default function UpdateButton() {
    const supported = canCheckForUpdates()
    const setNotice = useFormStore((state) => state.setNotice)
    const [currentVersion, setCurrentVersion] = useState('')
    const [phase, setPhase] = useState<Phase>('idle')
    const [info, setInfo] = useState<UpdateInfo | null>(null)
    const [progress, setProgress] = useState<number | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const phaseRef = useRef<Phase>('idle')
    const primaryButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        phaseRef.current = phase
    }, [phase])

    useEffect(() => {
        if (!supported) return
        void getVersion()
            .then(setCurrentVersion)
            .catch(() => undefined)
    }, [supported])

    const runCheck = useCallback(
        async (silent: boolean) => {
            if (phaseRef.current === 'checking' || phaseRef.current === 'downloading') {
                return
            }

            setPhase('checking')
            setErrorMessage(null)

            try {
                const result = await checkForUpdate()
                if (!result) {
                    setPhase('idle')
                    if (!silent) setNotice('已是最新版本')
                    return
                }

                setInfo(result)
                setDialogOpen(true)
                setPhase('available')
            } catch (error) {
                setPhase('error')
                if (!silent) {
                    setNotice(`检查更新失败：${describeError(error, '请稍后重试')}`)
                }
            }
        },
        [setNotice]
    )

    useEffect(() => {
        if (!supported) return
        const timer = window.setTimeout(() => void runCheck(true), 2500)
        return () => window.clearTimeout(timer)
    }, [runCheck, supported])

    useEffect(() => {
        if (!dialogOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && phaseRef.current !== 'downloading') {
                setDialogOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        primaryButtonRef.current?.focus()
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [dialogOpen, phase])

    const handleInstall = useCallback(async () => {
        setPhase('downloading')
        setProgress(null)
        setErrorMessage(null)

        try {
            await downloadAndInstall((next) => setProgress(next.percent))
            setPhase('ready')
        } catch (error) {
            setPhase('error')
            setErrorMessage(describeError(error, '下载或安装更新失败，请重试'))
        }
    }, [])

    const handleRestart = useCallback(async () => {
        setErrorMessage(null)
        try {
            await restartApp()
        } catch (error) {
            setPhase('ready')
            setErrorMessage(describeError(error, '重启失败，请手动重启应用'))
        }
    }, [])

    if (!supported) return null

    const primaryLabel = phase === 'ready' ? '立即重启' : phase === 'error' ? '重试' : '下载并安装'
    const primaryAction = phase === 'ready' ? handleRestart : handleInstall
    const isBusy = phase === 'checking' || phase === 'downloading'

    return (
        <div className="update-control">
            <button
                className="app-update-btn"
                onClick={() => void runCheck(false)}
                disabled={isBusy}
            >
                {phase === 'checking'
                    ? '检查中…'
                    : phase === 'downloading'
                      ? '下载中…'
                      : '检查更新'}
            </button>

            {dialogOpen && info && (
                <div className="update-dialog-backdrop">
                    <div
                        className="update-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="update-dialog-title"
                    >
                        <h2 id="update-dialog-title" className="update-dialog-title">
                            发现新版本
                        </h2>
                        <p className="update-dialog-version">
                            当前版本 {info.currentVersion || currentVersion || '-'} → 最新版本{' '}
                            {info.version}
                        </p>
                        <pre className="update-dialog-notes">{info.notes || '暂无更新说明'}</pre>

                        {phase === 'downloading' && (
                            <div className="update-dialog-progress" role="status">
                                <div className="update-dialog-progress-track">
                                    <div
                                        className="update-dialog-progress-bar"
                                        style={{ width: `${progress ?? 0}%` }}
                                    />
                                </div>
                                <span>{progress === null ? '正在下载…' : `${progress}%`}</span>
                            </div>
                        )}

                        {phase === 'ready' && (
                            <p className="update-dialog-ready">
                                更新已下载，重启应用后生效。当前草稿会自动保留。
                            </p>
                        )}

                        {errorMessage && (
                            <p className="update-dialog-error" role="alert">
                                {errorMessage}
                            </p>
                        )}

                        <div className="update-dialog-actions">
                            {phase !== 'downloading' && (
                                <button
                                    ref={primaryButtonRef}
                                    className="update-dialog-primary"
                                    onClick={() => void primaryAction()}
                                >
                                    {primaryLabel}
                                </button>
                            )}
                            {phase !== 'downloading' && (
                                <button
                                    className="update-dialog-secondary"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    稍后
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
