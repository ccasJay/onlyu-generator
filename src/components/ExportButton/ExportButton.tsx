import { useCallback } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { exportPoster } from '../../utils/export'
import { focusFirstInvalidField } from '../../utils/validation'
import './ExportButton.css'

interface Props {
    posterRef: React.RefObject<HTMLDivElement | null>
}

export default function ExportButton({ posterRef }: Props) {
    const { isExporting, isImageProcessing, setExporting, validateForm, setNotice, formData } =
        useFormStore()

    const handleExport = useCallback(async () => {
        if (!posterRef.current || isExporting || isImageProcessing) return

        if (!validateForm()) {
            focusFirstInvalidField(useFormStore.getState().validationErrors)
            return
        }

        setExporting(true)
        try {
            const result = await exportPoster(
                posterRef.current,
                (formData.name as string) || '海报'
            )
            if (result === 'saved') {
                setNotice('海报已保存')
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : '导出失败，请重试'
            setNotice(`导出失败：${message}`)
        } finally {
            setExporting(false)
        }
    }, [
        posterRef,
        isExporting,
        isImageProcessing,
        setExporting,
        validateForm,
        setNotice,
        formData.name,
    ])

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
