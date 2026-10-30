import { useFormStore } from '../../store/useFormStore'
import { DEFAULT_PHOTO_TRANSFORM } from '../../templates/types'
import './PhotoAdjustments.css'

export default function PhotoAdjustments() {
    const photo = useFormStore((state) => state.formData.photo)
    const photoTransform = useFormStore((state) => state.photoTransform)
    const setPhotoTransform = useFormStore((state) => state.setPhotoTransform)
    const resetPhotoTransform = useFormStore((state) => state.resetPhotoTransform)

    if (!photo) return null

    const isDefault =
        photoTransform.scale === DEFAULT_PHOTO_TRANSFORM.scale &&
        photoTransform.offsetX === DEFAULT_PHOTO_TRANSFORM.offsetX &&
        photoTransform.offsetY === DEFAULT_PHOTO_TRANSFORM.offsetY

    return (
        <div className="photo-adjustments">
            <div className="photo-adjustments-header">
                <span className="photo-adjustments-title">照片缩放</span>
                <span className="photo-adjustments-value">
                    {Math.round(photoTransform.scale * 100)}%
                </span>
            </div>
            <input
                className="photo-adjustments-range"
                type="range"
                min="50"
                max="200"
                step="1"
                value={Math.round(photoTransform.scale * 100)}
                onChange={(event) => setPhotoTransform({ scale: Number(event.target.value) / 100 })}
                aria-label="照片缩放比例"
            />
            <p className="photo-adjustments-hint">在右侧预览中拖动人物，可调整左右和上下位置。</p>
            <button
                className="photo-adjustments-reset"
                type="button"
                onClick={resetPhotoTransform}
                disabled={isDefault}
            >
                重置照片位置
            </button>
        </div>
    )
}
