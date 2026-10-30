import { useCallback, useId, useState } from 'react'
import { compressImageFile, ImageProcessingError, validateImageFile } from '../../utils/image'
import './ImageUploader.css'

interface Props {
    label: string
    value: string | null
    onChange: (dataUrl: string | null) => void
    onBusyChange?: (busy: boolean) => void
}

function describeError(error: unknown): string {
    if (error instanceof ImageProcessingError) return error.message
    return '图片处理失败，请重试'
}

export default function ImageUploader({ label, value, onChange, onBusyChange }: Props) {
    const inputId = useId()
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return

            setError(null)

            try {
                validateImageFile(file)
            } catch (validationError) {
                setError(describeError(validationError))
                return
            }

            setIsProcessing(true)
            onBusyChange?.(true)
            try {
                const dataUrl = await compressImageFile(file)
                onChange(dataUrl)
            } catch (processingError) {
                setError(describeError(processingError))
            } finally {
                setIsProcessing(false)
                onBusyChange?.(false)
            }
        },
        [onBusyChange, onChange]
    )

    const handleClear = useCallback(() => {
        setError(null)
        onChange(null)
    }, [onChange])

    return (
        <div className="image-uploader">
            <label className="image-uploader-label" htmlFor={value ? undefined : inputId}>
                {label}
            </label>
            <div className="image-uploader-area">
                {value ? (
                    <div className="image-uploader-preview">
                        <img src={value} alt="已上传照片预览" />
                        <button
                            className="image-uploader-clear"
                            onClick={handleClear}
                            title="清除图片"
                            aria-label="清除已上传照片"
                            disabled={isProcessing}
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <label
                        className={`image-uploader-dropzone ${isProcessing ? 'image-uploader-dropzone--busy' : ''}`}
                        htmlFor={inputId}
                    >
                        <input
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleChange}
                            disabled={isProcessing}
                            hidden
                        />
                        <span className="image-uploader-icon">{isProcessing ? '⏳' : '📷'}</span>
                        <span className="image-uploader-text">
                            {isProcessing ? '正在处理图片…' : '点击上传图片'}
                        </span>
                        <span className="image-uploader-hint">支持 JPG、PNG、WebP，最大 20MB</span>
                    </label>
                )}
            </div>
            {error && (
                <p className="image-uploader-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
