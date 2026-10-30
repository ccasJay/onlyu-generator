import { useCallback } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { getTemplateById } from '../../templates'
import ImageUploader from './ImageUploader'
import TagInput from './TagInput'
import HighlightsInput from './HighlightsInput'
import './FormPanel.css'

const saveStatusLabels = {
    saving: '保存中…',
    saved: '已自动保存',
    error: '保存失败',
} as const

export default function FormPanel() {
    const { currentTemplateId, formData, setField, saveStatus } = useFormStore()
    const template = getTemplateById(currentTemplateId)

    const handleFieldChange = useCallback(
        (key: string, value: string | string[] | null) => {
            setField(key, value)
        },
        [setField]
    )

    if (!template) return null

    return (
        <div className="form-panel">
            <div className="form-panel-header">
                <h2 className="form-panel-title">📝 海报内容编辑</h2>
                <div className="form-panel-meta">
                    <p className="form-panel-subtitle">
                        {template.name} · {template.width}×{template.height}
                    </p>
                    {saveStatus !== 'idle' && (
                        <span
                            className={`form-panel-save-status form-panel-save-status--${saveStatus}`}
                            role="status"
                        >
                            {saveStatusLabels[saveStatus]}
                        </span>
                    )}
                </div>
            </div>

            <div className="form-panel-fields">
                {template.fields.map((field) => {
                    switch (field.type) {
                        case 'image':
                            return (
                                <ImageUploader
                                    key={field.key}
                                    label={field.label}
                                    value={(formData[field.key] as string | null) ?? null}
                                    onChange={(v) => handleFieldChange(field.key, v)}
                                />
                            )

                        case 'tags':
                            return (
                                <TagInput
                                    key={field.key}
                                    label={field.label}
                                    value={(formData[field.key] as string[]) || []}
                                    onChange={(v) => handleFieldChange(field.key, v)}
                                    placeholder={field.placeholder}
                                />
                            )

                        case 'highlights':
                            return (
                                <HighlightsInput
                                    key={field.key}
                                    label={field.label}
                                    value={(formData[field.key] as string[]) || []}
                                    onChange={(v) => handleFieldChange(field.key, v)}
                                    placeholder={field.placeholder}
                                />
                            )

                        case 'textarea':
                            return (
                                <div key={field.key} className="form-field">
                                    <label className="form-field-label">{field.label}</label>
                                    <textarea
                                        className="form-field-textarea"
                                        value={(formData[field.key] as string) || ''}
                                        onChange={(e) =>
                                            handleFieldChange(field.key, e.target.value)
                                        }
                                        placeholder={field.placeholder}
                                        rows={3}
                                    />
                                </div>
                            )

                        default:
                            return (
                                <div key={field.key} className="form-field">
                                    <label className="form-field-label">{field.label}</label>
                                    <input
                                        className="form-field-input"
                                        type="text"
                                        value={(formData[field.key] as string) || ''}
                                        onChange={(e) =>
                                            handleFieldChange(field.key, e.target.value)
                                        }
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            )
                    }
                })}
            </div>
        </div>
    )
}
