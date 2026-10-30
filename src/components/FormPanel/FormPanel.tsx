import { useFormStore } from '../../store/useFormStore'
import { getTemplateById } from '../../templates'
import FormField from './FormField'
import './FormPanel.css'

const saveStatusLabels = {
    saving: '保存中…',
    saved: '已自动保存',
    error: '保存失败',
} as const

export default function FormPanel() {
    const currentTemplateId = useFormStore((state) => state.currentTemplateId)
    const saveStatus = useFormStore((state) => state.saveStatus)
    const template = getTemplateById(currentTemplateId)

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
                        <FormField field={field} />
                        <FieldError fieldKey={field.key} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function FieldError({ fieldKey }: { fieldKey: string }) {
    const error = useFormStore((state) => state.validationErrors[fieldKey])
    if (!error) return null

    return (
        <p id={`field-${fieldKey}-error`} className="form-field-error" role="alert">
            {error}
        </p>
    )
}
