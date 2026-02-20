import { nannyTemplate } from './template-nanny'
import type { PosterTemplate } from './types'

/** 所有可用模板列表 */
export const templates: PosterTemplate[] = [
    nannyTemplate,
]

/** 根据 ID 获取模板 */
export function getTemplateById(id: string): PosterTemplate | undefined {
    return templates.find((t) => t.id === id)
}

/** 获取模板默认表单数据 */
export function getDefaultFormData(template: PosterTemplate): Record<string, string | string[] | null> {
    const data: Record<string, string | string[] | null> = {}
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
