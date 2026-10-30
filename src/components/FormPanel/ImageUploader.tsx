import { useCallback } from 'react'
import './ImageUploader.css'

interface Props {
    label: string
    value: string | null
    onChange: (dataUrl: string | null) => void
}

export default function ImageUploader({ label, value, onChange }: Props) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = () => {
                onChange(reader.result as string)
            }
            reader.readAsDataURL(file)
        },
        [onChange]
    )

    const handleClear = useCallback(() => {
        onChange(null)
    }, [onChange])

    return (
        <div className="image-uploader">
            <label className="image-uploader-label">{label}</label>
            <div className="image-uploader-area">
                {value ? (
                    <div className="image-uploader-preview">
                        <img src={value} alt="预览" />
                        <button
                            className="image-uploader-clear"
                            onClick={handleClear}
                            title="清除图片"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <label className="image-uploader-dropzone">
                        <input type="file" accept="image/*" onChange={handleChange} hidden />
                        <span className="image-uploader-icon">📷</span>
                        <span className="image-uploader-text">点击上传图片</span>
                        <span className="image-uploader-hint">支持 JPG、PNG 格式</span>
                    </label>
                )}
            </div>
        </div>
    )
}
