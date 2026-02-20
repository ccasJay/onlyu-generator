import { useEffect, useRef, useState } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { getTemplateById } from '../../templates'
import './PreviewPanel.css'

interface Props {
    posterRef: React.RefObject<HTMLDivElement | null>
}

export default function PreviewPanel({ posterRef }: Props) {
    const { currentTemplateId, formData } = useFormStore()
    const template = getTemplateById(currentTemplateId)
    const viewportRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.45)

    // 根据视口大小动态计算缩放比例
    useEffect(() => {
        if (!template || !viewportRef.current) return

        const calculateScale = () => {
            const vp = viewportRef.current
            if (!vp) return
            const vpW = vp.clientWidth - 48 // padding
            const vpH = vp.clientHeight - 48
            const scaleX = vpW / template.width
            const scaleY = vpH / template.height
            setScale(Math.min(scaleX, scaleY, 1))
        }

        calculateScale()
        const observer = new ResizeObserver(calculateScale)
        observer.observe(viewportRef.current)
        return () => observer.disconnect()
    }, [template])

    if (!template) return null

    const TemplateComponent = template.component

    return (
        <div className="preview-panel">
            <div className="preview-panel-header">
                <h3 className="preview-panel-title">👁 实时预览</h3>
                <span className="preview-panel-scale">{Math.round(scale * 100)}%</span>
            </div>
            <div className="preview-panel-viewport" ref={viewportRef}>
                <div
                    className="preview-panel-scaler"
                    style={{
                        transform: `scale(${scale})`,
                    }}
                >
                    <div
                        ref={posterRef}
                        className="preview-panel-poster"
                        style={{
                            width: template.width,
                            height: template.height,
                        }}
                    >
                        <TemplateComponent data={formData} />
                    </div>
                </div>
            </div>
        </div>
    )
}
