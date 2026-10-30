import React from 'react'

/** 表单字段类型 */
export type FieldType = 'text' | 'textarea' | 'image' | 'tags' | 'highlights'

/** 单个字段定义 */
export interface FieldDefinition {
    /** 字段唯一标识 */
    key: string
    /** 字段显示名称 */
    label: string
    /** 字段类型 */
    type: FieldType
    /** 占位符文字 */
    placeholder?: string
    /** 是否必填 */
    required?: boolean
    /** 默认值 */
    defaultValue?: string | string[]
}

/** 模板的表单数据 */
export type FormData = Record<string, string | string[] | null>

/** 模板渲染组件的 Props */
export interface TemplateProps {
    data: FormData
}

/** 海报模板定义 */
export interface PosterTemplate {
    /** 模板唯一 ID */
    id: string
    /** 模板名称 */
    name: string
    /** 模板描述 */
    description: string
    /** 模板引用字段定义 */
    fields: FieldDefinition[]
    /** 海报宽度 px */
    width: number
    /** 海报高度 px */
    height: number
    /** 模板渲染组件 */
    component: React.FC<TemplateProps>
}
