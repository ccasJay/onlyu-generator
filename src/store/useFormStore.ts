import { create } from 'zustand'
import type { FormData } from '../templates/types'
import {
    getDefaultFormData,
    getTemplateById,
    mergeFormDataWithDefaults,
    templates,
} from '../templates'
import { validateFormData, type ValidationErrors } from '../utils/validation'
import {
    deleteDraft,
    DraftCorruptionError,
    DraftSchemaError,
    loadDraft,
    readCurrentTemplateId,
    saveDraft,
    writeCurrentTemplateId,
} from './draftRepository'

export type HydrationStatus = 'loading' | 'ready' | 'degraded'
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface FormStore {
    /** 当前选中的模板 ID */
    currentTemplateId: string
    /** 表单数据 */
    formData: FormData
    /** 草稿恢复状态 */
    hydrationStatus: HydrationStatus
    /** 自动保存状态 */
    saveStatus: SaveStatus
    /** 非阻塞提示 */
    notice: string | null
    /** 字段校验错误 */
    validationErrors: ValidationErrors
    /** 导出中状态 */
    isExporting: boolean
    /** 图片处理中状态 */
    isImageProcessing: boolean

    /** 从本地存储恢复草稿 */
    hydrate: () => Promise<void>
    /** 关闭提示 */
    dismissNotice: () => void
    /** 切换模板；先保存当前模板，再恢复目标模板草稿或默认值 */
    switchTemplate: (id: string) => Promise<void>
    /** 更新单个字段 */
    setField: (key: string, value: string | string[] | null) => void
    /** 批量设置表单数据（切换模板时用） */
    setFormData: (data: FormData) => void
    /** 校验当前模板，返回是否通过 */
    validateForm: () => boolean
    /** 设置导出状态 */
    setExporting: (v: boolean) => void
    /** 设置图片处理状态 */
    setImageProcessing: (v: boolean) => void
    /** 删除当前模板草稿并恢复默认值 */
    resetCurrentTemplate: () => Promise<void>
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
    saveStatus: 'idle',
    notice: null,
    validationErrors: {},
    isExporting: false,
    isImageProcessing: false,

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
        let restored = false

        try {
            const draft = await loadDraft(template.id)
            if (draft) {
                restored = true
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
            saveStatus: restored ? 'saved' : 'idle',
            validationErrors: {},
            isImageProcessing: false,
            notice,
        })
    },

    dismissNotice: () => set({ notice: null }),

    switchTemplate: async (id) => {
        const current = get()
        if (id === current.currentTemplateId) return

        const target = getTemplateById(id)
        if (!target) {
            set({ notice: `模板 ${id} 不存在，已保留当前模板` })
            return
        }

        const saved = await flushPendingSave()
        if (!saved) {
            set({
                saveStatus: 'error',
                notice: '当前草稿保存失败，暂时无法切换模板',
            })
            return
        }

        let formData = getDefaultFormData(target)
        let notice: string | null = null
        let restored = false

        try {
            const draft = await loadDraft(target.id)
            if (draft) {
                restored = true
                formData = mergeFormDataWithDefaults(target, draft.fields)
                formData.photo = draft.photo
                if (draft.warning) {
                    notice = draft.warning
                }
            }
        } catch (error) {
            notice = describeLoadError(error)
        }

        writeCurrentTemplateId(target.id)
        suppressNextSave = true
        set({
            currentTemplateId: target.id,
            formData,
            hydrationStatus: 'ready',
            saveStatus: restored ? 'saved' : 'idle',
            validationErrors: {},
            isImageProcessing: false,
            notice,
        })
        suppressNextSave = false
    },

    setField: (key, value) =>
        set((state) => {
            const validationErrors = { ...state.validationErrors }
            delete validationErrors[key]
            return {
                formData: { ...state.formData, [key]: value },
                validationErrors,
            }
        }),

    setFormData: (data) => set({ formData: data, validationErrors: {} }),

    validateForm: () => {
        const { currentTemplateId, formData } = get()
        const template = getTemplateById(currentTemplateId)
        if (!template) return false

        const validationErrors = validateFormData(template, formData)
        set({ validationErrors })
        return Object.keys(validationErrors).length === 0
    },

    setExporting: (v) => set({ isExporting: v }),

    setImageProcessing: (v) => set({ isImageProcessing: v }),

    resetCurrentTemplate: async () => {
        const template = getTemplateById(get().currentTemplateId)
        if (!template) {
            set({ notice: '当前模板不存在，无法重置' })
            return
        }

        await flushPendingSave()

        try {
            await deleteDraft(template.id)
        } catch {
            set({ notice: '重置失败，请检查本地存储空间' })
            return
        }

        suppressNextSave = true
        set({
            formData: getDefaultFormData(template),
            saveStatus: 'idle',
            validationErrors: {},
            isImageProcessing: false,
            notice: null,
        })
        suppressNextSave = false
    },
}))

interface PendingSave {
    templateId: string
    formData: FormData
    persistImage: boolean
    token: number
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let saveToken = 0
let pendingSave: PendingSave | null = null
let suppressNextSave = false

async function performSave(pending: PendingSave): Promise<boolean> {
    try {
        await saveDraft(pending.templateId, pending.formData, {
            persistImage: pending.persistImage,
        })
        if (pending.token === saveToken) {
            useFormStore.setState({ saveStatus: 'saved' })
        }
        return true
    } catch {
        if (pending.token === saveToken) {
            useFormStore.setState({
                saveStatus: 'error',
                notice: '草稿保存失败，请检查本地存储空间',
            })
        }
        return false
    }
}

function scheduleSave(templateId: string, formData: FormData, persistImage: boolean): void {
    if (saveTimer) clearTimeout(saveTimer)

    const token = ++saveToken
    pendingSave = { templateId, formData, persistImage, token }
    useFormStore.setState({ saveStatus: 'saving' })
    saveTimer = setTimeout(() => {
        saveTimer = null
        const pending = pendingSave
        pendingSave = null
        if (pending) {
            void performSave(pending)
        }
    }, 300)
}

async function flushPendingSave(): Promise<boolean> {
    if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
    }

    const pending = pendingSave
    pendingSave = null
    if (!pending) return true

    return performSave(pending)
}

/** 立即完成当前待保存的草稿；用于切换模板、关闭前或测试隔离 */
export async function flushDraftAutosave(): Promise<boolean> {
    return flushPendingSave()
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
    if (suppressNextSave) {
        suppressNextSave = false
        return
    }

    scheduleSave(
        state.currentTemplateId,
        state.formData,
        state.formData.photo !== previous.formData.photo
    )
})
