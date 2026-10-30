import { create } from 'zustand'
import type { FormData } from '../templates/types'
import {
    getDefaultFormData,
    getTemplateById,
    mergeFormDataWithDefaults,
    templates,
} from '../templates'
import {
    DraftCorruptionError,
    DraftSchemaError,
    loadDraft,
    readCurrentTemplateId,
    saveDraft,
    writeCurrentTemplateId,
} from './draftRepository'

export type HydrationStatus = 'loading' | 'ready' | 'degraded'

interface FormStore {
    /** 当前选中的模板 ID */
    currentTemplateId: string
    /** 表单数据 */
    formData: FormData
    /** 草稿恢复状态 */
    hydrationStatus: HydrationStatus
    /** 非阻塞提示 */
    notice: string | null
    /** 导出中状态 */
    isExporting: boolean

    /** 从本地存储恢复草稿 */
    hydrate: () => Promise<void>
    /** 关闭提示 */
    dismissNotice: () => void
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

const defaultTemplateId = templates[0]?.id ?? 'nanny'

function appendNotice(current: string | null, next: string): string {
    return current ? `${current}；${next}` : next
}

function describeLoadError(error: unknown): string {
    if (error instanceof DraftSchemaError) {
        return '草稿版本不兼容，已使用默认内容'
    }
    if (error instanceof DraftCorruptionError) {
        return '草稿数据损坏，已使用默认内容'
    }
    return '草稿读取失败，已使用默认内容'
}

export const useFormStore = create<FormStore>((set, get) => ({
    currentTemplateId: defaultTemplateId,
    formData: {},
    hydrationStatus: 'loading',
    notice: null,
    isExporting: false,

    hydrate: async () => {
        if (get().hydrationStatus !== 'loading') return

        const storedTemplateId = readCurrentTemplateId()
        const storedTemplate = storedTemplateId ? getTemplateById(storedTemplateId) : undefined
        const template = storedTemplate ?? getTemplateById(defaultTemplateId) ?? templates[0]

        if (!template) {
            set({
                hydrationStatus: 'degraded',
                notice: '没有可用模板，请检查应用安装',
            })
            return
        }

        let formData = getDefaultFormData(template)
        let notice: string | null =
            storedTemplateId && !storedTemplate ? '上次使用的模板不存在，已切换到默认模板' : null
        let degraded = false

        try {
            const draft = await loadDraft(template.id)
            if (draft) {
                formData = mergeFormDataWithDefaults(template, draft.fields)
                formData.photo = draft.photo
                if (draft.warning) {
                    notice = appendNotice(notice, draft.warning)
                }
            }
        } catch (error) {
            degraded = true
            notice = appendNotice(notice, describeLoadError(error))
        }

        writeCurrentTemplateId(template.id)
        set({
            currentTemplateId: template.id,
            formData,
            hydrationStatus: degraded ? 'degraded' : 'ready',
            notice,
        })
    },

    dismissNotice: () => set({ notice: null }),

    setTemplate: (id) => set({ currentTemplateId: id }),

    setField: (key, value) =>
        set((state) => ({
            formData: { ...state.formData, [key]: value },
        })),

    setFormData: (data) => set({ formData: data }),

    setExporting: (v) => set({ isExporting: v }),

    resetForm: () => set({ formData: {} }),
}))

let saveTimer: ReturnType<typeof setTimeout> | null = null
let saveToken = 0

function scheduleSave(templateId: string, formData: FormData, persistImage: boolean): void {
    if (saveTimer) clearTimeout(saveTimer)

    const token = ++saveToken
    saveTimer = setTimeout(() => {
        saveTimer = null
        void saveDraft(templateId, formData, { persistImage }).catch(() => {
            if (token !== saveToken) return
            useFormStore.setState({
                notice: '草稿保存失败，请检查本地存储空间',
            })
        })
    }, 300)
}

useFormStore.subscribe((state, previous) => {
    if (previous.hydrationStatus === 'loading') return
    if (state.hydrationStatus === 'loading') return
    if (
        state.formData === previous.formData &&
        state.currentTemplateId === previous.currentTemplateId
    ) {
        return
    }

    scheduleSave(
        state.currentTemplateId,
        state.formData,
        state.formData.photo !== previous.formData.photo
    )
})
