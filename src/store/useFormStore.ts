import { create } from 'zustand'
import type { FormData } from '../templates/types'

interface FormStore {
    /** 当前选中的模板 ID */
    currentTemplateId: string
    /** 表单数据 */
    formData: FormData
    /** 导出中状态 */
    isExporting: boolean

    /** 设置当前模板 */
    setTemplate: (id: string) => void
    /** 更新单个字段 */
    setField: (key: string, value: string | string[] | null) => void
    /** 批量设置表单数据（切换模板时用） */
    setFormData: (data: FormData) => void
    /** 设置导出状态 */
    setExporting: (v: boolean) => void
    /** 重置表单 */
    resetForm: () => void
}

export const useFormStore = create<FormStore>((set) => ({
    currentTemplateId: 'nanny',
    formData: {},
    isExporting: false,

    setTemplate: (id) => set({ currentTemplateId: id }),

    setField: (key, value) =>
        set((state) => ({
            formData: { ...state.formData, [key]: value },
        })),

    setFormData: (data) => set({ formData: data }),

    setExporting: (v) => set({ isExporting: v }),

    resetForm: () => set({ formData: {} }),
}))
