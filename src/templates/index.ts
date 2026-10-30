import { nannyTemplate } from './template-nanny'
import type { FieldDefinition, FormData, PosterTemplate } from './types'

/** 所有可用模板列表 */
export const templates: PosterTemplate[] = [nannyTemplate]

/** 根据 ID 获取模板 */
export function getTemplateById(id: string): PosterTemplate | undefined {
    return templates.find((t) => t.id === id)
}

/** 获取模板默认表单数据 */
export function getDefaultFormData(template: PosterTemplate): FormData {
    const data: FormData = {}
    for (const field of template.fields) {
        if (field.defaultValue !== undefined) {
            data[field.key] = field.defaultValue
        } else if (field.type === 'tags' || field.type === 'highlights') {
            data[field.key] = []
        } else if (field.type === 'image') {
            data[field.key] = null
        } else {
            data[field.key] = ''
        }
    }
    return data
}

/** 判断草稿中的值是否符合字段类型 */
export function isFieldValueCompatible(field: FieldDefinition, value: unknown): boolean {
    switch (field.type) {
        case 'image':
            return value === null || typeof value === 'string'
        case 'tags':
        case 'highlights':
            return Array.isArray(value) && value.every((item) => typeof item === 'string')
        default:
            return typeof value === 'string'
    }
}

/** 用模板默认值补齐草稿字段，并丢弃模板中不存在的字段 */
export function mergeFormDataWithDefaults(template: PosterTemplate, stored: FormData): FormData {
    const merged = getDefaultFormData(template)

    for (const field of template.fields) {
        const value = stored[field.key]
        if (value !== undefined && isFieldValueCompatible(field, value)) {
            merged[field.key] = value
        }
    }

    return merged
}
