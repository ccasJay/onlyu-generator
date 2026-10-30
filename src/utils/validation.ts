import type { FormData, PosterTemplate } from '../templates/types'

export type ValidationErrors = Record<string, string>

function isBlank(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    return false
}

function requiredMessage(key: string, label: string): string {
    if (key === 'photo') return '请上传照片'
    if (key === 'name') return '请输入姓名'
    return `请填写${label}`
}

/** 校验模板字段；返回按字段 key 索引的中文错误 */
export function validateFormData(template: PosterTemplate, data: FormData): ValidationErrors {
    const errors: ValidationErrors = {}

    for (const field of template.fields) {
        const value = data[field.key]

        if (field.required && isBlank(value)) {
            errors[field.key] = requiredMessage(field.key, field.label)
            continue
        }

        if (value === null || value === undefined) continue

        if (field.type === 'tags' || field.type === 'highlights') {
            if (!Array.isArray(value)) {
                errors[field.key] = `${field.label}格式不正确`
                continue
            }
            if (field.maxItems && value.length > field.maxItems) {
                errors[field.key] = `${field.label}最多 ${field.maxItems} 条`
            }
            if (
                field.maxLength &&
                value.some((item) => typeof item === 'string' && item.length > field.maxLength!)
            ) {
                errors[field.key] = `${field.label}每条最多 ${field.maxLength} 个字符`
            }
            continue
        }

        if (field.type !== 'image' && typeof value === 'string') {
            const maxLength = field.maxLength ?? (field.type === 'textarea' ? 200 : undefined)
            if (maxLength && value.length > maxLength) {
                errors[field.key] = `${field.label}最多 ${maxLength} 个字符`
            }
        }
    }

    return errors
}

/** 聚焦第一个校验失败字段，便于导出失败后直接修正 */
export function focusFirstInvalidField(errors: ValidationErrors): void {
    const firstKey = Object.keys(errors)[0]
    if (!firstKey) return

    const container = document.querySelector<HTMLElement>(`[data-field-key="${firstKey}"]`)
    const target = container?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, button'
    )

    if (target) {
        target.focus()
    } else {
        container?.focus()
    }
    container?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}
