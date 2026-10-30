import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { getTemplateById } from '../../templates'
import './PreviewPanel.css'

interface DragState {
    pointerId: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
}

interface Props {
    posterRef: React.RefObject<HTMLDivElement | null>
}

export default function PreviewPanel({ posterRef }: Props) {
    const currentTemplateId = useFormStore((state) => state.currentTemplateId)
    const formData = useFormStore((state) => state.formData)
    const photoTransform = useFormStore((state) => state.photoTransform)
    const setPhotoTransform = useFormStore((state) => state.setPhotoTransform)
    const template = getTemplateById(currentTemplateId)
    const viewportRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<DragState | null>(null)
    const [scale, setScale] = useState(0.45)

    // 根据视口大小动态计算缩放比例
    useEffect(() => {
        if (!template || !viewportRef.current) return

        const calculateScale = () => {
            const vp = viewportRef.current
            if (!vp) return
            // 增加视口内边距，留出更多呼吸空间
            const paddingX = 80
            const paddingY = 60
            const vpW = vp.clientWidth - paddingX
            const vpH = vp.clientHeight - paddingY
            // 让宽幅海报可以被正确缩放
            const scaleX = vpW / template.width
            const scaleY = vpH / template.height
            setScale(Math.min(scaleX, scaleY, 1))
        }

        calculateScale()
        const observer = new ResizeObserver(calculateScale)
        observer.observe(viewportRef.current)
        return () => observer.disconnect()
    }, [template])

    const handlePhotoPointerDown = useCallback(
        (event: React.PointerEvent<HTMLImageElement>) => {
            if (!formData.photo) return
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: photoTransform.offsetX,
                offsetY: photoTransform.offsetY,
            }
        },
        [formData.photo, photoTransform.offsetX, photoTransform.offsetY]
    )

    const handlePhotoPointerMove = useCallback(
        (event: React.PointerEvent<HTMLImageElement>) => {
            const drag = dragRef.current
            if (!drag || drag.pointerId !== event.pointerId) return

            const previewScale = Math.max(scale, 0.01)
            setPhotoTransform({
                offsetX: drag.offsetX + (event.clientX - drag.startX) / previewScale,
                offsetY: drag.offsetY + (event.clientY - drag.startY) / previewScale,
            })
        },
        [scale, setPhotoTransform]
    )

    const handlePhotoPointerUp = useCallback((event: React.PointerEvent<HTMLImageElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return
        dragRef.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }, [])

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
                        <TemplateComponent
                            data={formData}
                            photoTransform={photoTransform}
                            onPhotoPointerDown={formData.photo ? handlePhotoPointerDown : undefined}
                            onPhotoPointerMove={formData.photo ? handlePhotoPointerMove : undefined}
                            onPhotoPointerUp={formData.photo ? handlePhotoPointerUp : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
