import { useCallback } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { describeError } from '../../utils/errors'
import { exportPoster } from '../../utils/export'
import { focusFirstInvalidField } from '../../utils/validation'
import './ExportButton.css'

interface Props {
    posterRef: React.RefObject<HTMLDivElement | null>
}

export default function ExportButton({ posterRef }: Props) {
    const isExporting = useFormStore((state) => state.isExporting)
    const isImageProcessing = useFormStore((state) => state.isImageProcessing)
    const setExporting = useFormStore((state) => state.setExporting)
    const validateForm = useFormStore((state) => state.validateForm)
    const setNotice = useFormStore((state) => state.setNotice)
    const name = useFormStore((state) => (state.formData.name as string) || '')

    const handleExport = useCallback(async () => {
        if (!posterRef.current || isExporting || isImageProcessing) return

        if (!validateForm()) {
            focusFirstInvalidField(useFormStore.getState().validationErrors)
            return
        }

        setExporting(true)
        try {
            const result = await exportPoster(posterRef.current, name || '海报')
            if (result === 'saved') {
                setNotice('海报已保存')
            }
        } catch (error) {
            console.error('导出失败:', error)
            setNotice(`导出失败：${describeError(error, '请重试')}`)
        } finally {
            setExporting(false)
        }
    }, [posterRef, isExporting, isImageProcessing, setExporting, validateForm, setNotice, name])

    return (
        <button
            className={`export-button ${isExporting || isImageProcessing ? 'export-button--loading' : ''}`}
            onClick={handleExport}
            disabled={isExporting || isImageProcessing}
        >
            {isImageProcessing ? (
                <>⏳ 图片处理中…</>
            ) : isExporting ? (
                <>
                    <span className="export-button-spinner"></span>
                    导出中...
                </>
            ) : (
                <>📥 导出海报</>
            )}
        </button>
    )
}
