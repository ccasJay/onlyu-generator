import { useCallback } from 'react'
import { toPng } from 'html-to-image'
import { saveAs } from 'file-saver'
import { useFormStore } from '../../store/useFormStore'
import './ExportButton.css'

interface Props {
    posterRef: React.RefObject<HTMLDivElement | null>
}

export default function ExportButton({ posterRef }: Props) {
    const { isExporting, setExporting, formData } = useFormStore()

    const handleExport = useCallback(async () => {
        if (!posterRef.current || isExporting) return

        setExporting(true)
        try {
            const dataUrl = await toPng(posterRef.current, {
                quality: 1,
                pixelRatio: 2, // 2 倍清晰度
                cacheBust: true,
            })

            const name = (formData.name as string) || '海报'
            const timestamp = new Date().toISOString().slice(0, 10)
            saveAs(dataUrl, `${name}_${timestamp}.png`)
        } catch (err) {
            console.error('导出失败:', err)
            alert('导出失败，请重试')
        } finally {
            setExporting(false)
        }
    }, [posterRef, isExporting, setExporting, formData.name])

    return (
        <button
            className={`export-button ${isExporting ? 'export-button--loading' : ''}`}
            onClick={handleExport}
            disabled={isExporting}
        >
            {isExporting ? (
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
