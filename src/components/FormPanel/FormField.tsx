import { memo, useCallback } from 'react'
import { useFormStore } from '../../store/useFormStore'
import type { FieldDefinition } from '../../templates/types'
import HighlightsInput from './HighlightsInput'
import ImageUploader from './ImageUploader'
import TagInput from './TagInput'

interface Props {
    field: FieldDefinition
}

function FormField({ field }: Props) {
    const value = useFormStore((state) => state.formData[field.key])
    const error = useFormStore((state) => state.validationErrors[field.key])
    const setField = useFormStore((state) => state.setField)
    const setImageProcessing = useFormStore((state) => state.setImageProcessing)

    const handleChange = useCallback(
        (nextValue: string | string[] | null) => {
            setField(field.key, nextValue)
        },
        [field.key, setField]
    )

    const id = `field-${field.key}`
    const errorId = `${id}-error`

    switch (field.type) {
        case 'image':
            return (
                <ImageUploader
                    label={field.label}
                    value={(value as string | null) ?? null}
                    onChange={handleChange}
                    onBusyChange={setImageProcessing}
                />
            )

        case 'tags':
            return (
                <TagInput
                    label={field.label}
                    value={(value as string[]) || []}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    maxItems={field.maxItems}
                    maxLength={field.maxLength}
                />
            )

        case 'highlights':
            return (
                <HighlightsInput
                    label={field.label}
                    value={(value as string[]) || []}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    maxItems={field.maxItems}
                    maxLength={field.maxLength}
                />
            )

        case 'textarea':
            return (
                <div className="form-field">
                    <label className="form-field-label" htmlFor={id}>
                        {field.label}
                    </label>
                    <textarea
                        id={id}
                        className="form-field-textarea"
                        value={(value as string) || ''}
                        onChange={(event) => handleChange(event.target.value)}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength ?? 200}
                        rows={3}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                    />
                </div>
            )

        default:
            return (
                <div className="form-field">
                    <label className="form-field-label" htmlFor={id}>
                        {field.label}
                    </label>
                    <input
                        id={id}
                        className="form-field-input"
                        type="text"
                        value={(value as string) || ''}
                        onChange={(event) => handleChange(event.target.value)}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                    />
                </div>
            )
    }
}

export default memo(FormField)
