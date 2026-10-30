import { useCallback } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { getTemplateById } from '../../templates'
import type { FieldDefinition } from '../../templates/types'
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
    const {
        currentTemplateId,
        formData,
        setField,
        saveStatus,
        setImageProcessing,
        validationErrors,
    } = useFormStore()
    const template = getTemplateById(currentTemplateId)

    const handleFieldChange = useCallback(
        (key: string, value: string | string[] | null) => {
            setField(key, value)
        },
        [setField]
    )

    const renderControl = (field: FieldDefinition) => {
        switch (field.type) {
            case 'image':
                return (
                    <ImageUploader
                        label={field.label}
                        value={(formData[field.key] as string | null) ?? null}
                        onChange={(v) => handleFieldChange(field.key, v)}
                        onBusyChange={setImageProcessing}
                    />
                )

            case 'tags':
                return (
                    <TagInput
                        label={field.label}
                        value={(formData[field.key] as string[]) || []}
                        onChange={(v) => handleFieldChange(field.key, v)}
                        placeholder={field.placeholder}
                        maxItems={field.maxItems}
                        maxLength={field.maxLength}
                    />
                )

            case 'highlights':
                return (
                    <HighlightsInput
                        label={field.label}
                        value={(formData[field.key] as string[]) || []}
                        onChange={(v) => handleFieldChange(field.key, v)}
                        placeholder={field.placeholder}
                        maxItems={field.maxItems}
                        maxLength={field.maxLength}
                    />
                )

            case 'textarea': {
                const inputId = `field-${field.key}`
                const errorId = `${inputId}-error`
                return (
                    <div className="form-field">
                        <label className="form-field-label" htmlFor={inputId}>
                            {field.label}
                        </label>
                        <textarea
                            id={inputId}
                            className="form-field-textarea"
                            value={(formData[field.key] as string) || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            rows={3}
                            aria-invalid={Boolean(validationErrors[field.key])}
                            aria-describedby={validationErrors[field.key] ? errorId : undefined}
                        />
                    </div>
                )
            }

            default: {
                const inputId = `field-${field.key}`
                const errorId = `${inputId}-error`
                return (
                    <div className="form-field">
                        <label className="form-field-label" htmlFor={inputId}>
                            {field.label}
                        </label>
                        <input
                            id={inputId}
                            className="form-field-input"
                            type="text"
                            value={(formData[field.key] as string) || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            aria-invalid={Boolean(validationErrors[field.key])}
                            aria-describedby={validationErrors[field.key] ? errorId : undefined}
                        />
                    </div>
                )
            }
        }
    }

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
                {template.fields.map((field) => (
                    <div key={field.key} className="form-field-slot" data-field-key={field.key}>
                        {renderControl(field)}
                        {validationErrors[field.key] && (
                            <p
                                id={`field-${field.key}-error`}
                                className="form-field-error"
                                role="alert"
                            >
                                {validationErrors[field.key]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
