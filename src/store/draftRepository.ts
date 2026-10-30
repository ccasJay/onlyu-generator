import { DEFAULT_PHOTO_TRANSFORM, type FormData, type PhotoTransform } from '../templates/types'
import { normalizePhotoTransform } from '../utils/photoTransform'

const DB_NAME = 'onlyu-generator'
const DB_VERSION = 1
const DRAFT_STORE = 'drafts'
const IMAGE_STORE = 'images'
const TEMPLATE_STORAGE_KEY = 'onlyu-generator:current-template'

export const DRAFT_SCHEMA_VERSION = 1

export class DraftSchemaError extends Error {
    constructor() {
        super('草稿版本不受支持')
        this.name = 'DraftSchemaError'
    }
}

export class DraftCorruptionError extends Error {
    constructor(message = '草稿数据损坏') {
        super(message)
        this.name = 'DraftCorruptionError'
    }
}

interface DraftRecord {
    schemaVersion: number
    templateId: string
    fields: FormData
    photoId: string | null
    photoTransform?: PhotoTransform
    updatedAt: number
}

interface ImageRecord {
    id: string
    dataUrl: string
    updatedAt: number
}

export interface LoadedDraft {
    fields: FormData
    photo: string | null
    photoTransform: PhotoTransform
    updatedAt: number
    warning: string | null
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    if (typeof indexedDB === 'undefined') {
        return Promise.reject(new Error('当前环境不支持本地草稿存储'))
    }

    const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(DRAFT_STORE)) {
                db.createObjectStore(DRAFT_STORE, { keyPath: 'templateId' })
            }
            if (!db.objectStoreNames.contains(IMAGE_STORE)) {
                db.createObjectStore(IMAGE_STORE, { keyPath: 'id' })
            }
        }

        request.onsuccess = () => {
            const db = request.result
            db.onversionchange = () => {
                db.close()
                dbPromise = null
            }
            resolve(db)
        }

        request.onerror = () => {
            reject(request.error ?? new Error('无法打开本地草稿数据库'))
        }

        request.onblocked = () => {
            reject(new Error('本地草稿数据库被其他窗口占用'))
        }
    })

    dbPromise = promise
    void promise.catch(() => {
        if (dbPromise === promise) {
            dbPromise = null
        }
    })
    return promise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('本地存储请求失败'))
    })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error('本地存储事务失败'))
        transaction.onabort = () => reject(transaction.error ?? new Error('本地存储事务已中止'))
    })
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFormValue(value: unknown): value is string | string[] | null {
    return (
        value === null ||
        typeof value === 'string' ||
        (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    )
}

function parseDraft(value: unknown, templateId: string): DraftRecord {
    if (!isRecord(value)) {
        throw new DraftCorruptionError()
    }
    if (value.schemaVersion !== DRAFT_SCHEMA_VERSION) {
        throw new DraftSchemaError()
    }
    if (value.templateId !== templateId || !isRecord(value.fields)) {
        throw new DraftCorruptionError()
    }

    const fields: FormData = {}
    for (const [key, fieldValue] of Object.entries(value.fields)) {
        if (!isFormValue(fieldValue)) {
            throw new DraftCorruptionError()
        }
        fields[key] = fieldValue
    }
    delete fields.photo

    if (value.photoId !== null && typeof value.photoId !== 'string') {
        throw new DraftCorruptionError()
    }
    if (typeof value.updatedAt !== 'number') {
        throw new DraftCorruptionError()
    }

    return {
        schemaVersion: DRAFT_SCHEMA_VERSION,
        templateId,
        fields,
        photoId: value.photoId,
        photoTransform: normalizePhotoTransform(value.photoTransform),
        updatedAt: value.updatedAt,
    }
}

function parseImage(value: unknown): ImageRecord {
    if (!isRecord(value) || typeof value.dataUrl !== 'string' || typeof value.id !== 'string') {
        throw new DraftCorruptionError('草稿照片数据损坏')
    }

    return {
        id: value.id,
        dataUrl: value.dataUrl,
        updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
    }
}

/** 读取指定模板的草稿；不存在时返回 null */
export async function loadDraft(templateId: string): Promise<LoadedDraft | null> {
    const db = await openDatabase()
    const transaction = db.transaction([DRAFT_STORE, IMAGE_STORE], 'readonly')
    const draftStore = transaction.objectStore(DRAFT_STORE)
    const imageStore = transaction.objectStore(IMAGE_STORE)

    const rawDraft = await requestToPromise(draftStore.get(templateId))
    if (rawDraft === undefined) {
        await transactionDone(transaction)
        return null
    }

    const draft = parseDraft(rawDraft, templateId)
    let photo: string | null = null
    let warning: string | null = null

    if (draft.photoId) {
        const rawImage = await requestToPromise(imageStore.get(draft.photoId))
        if (rawImage === undefined) {
            warning = '草稿照片数据缺失，已保留其他内容'
        } else {
            photo = parseImage(rawImage).dataUrl
        }
    }

    await transactionDone(transaction)

    return {
        fields: draft.fields,
        photo,
        photoTransform: draft.photoTransform ?? { ...DEFAULT_PHOTO_TRANSFORM },
        updatedAt: draft.updatedAt,
        warning,
    }
}

export interface SaveDraftOptions {
    /** 照片未变化时跳过图片写入，避免每次输入重写大图 */
    persistImage?: boolean
    /** 照片缩放与偏移 */
    photoTransform?: PhotoTransform
}

/** 保存草稿；照片和文本分仓写入 */
export async function saveDraft(
    templateId: string,
    formData: FormData,
    options: SaveDraftOptions = {}
): Promise<void> {
    const db = await openDatabase()
    const transaction = db.transaction([DRAFT_STORE, IMAGE_STORE], 'readwrite')
    const draftStore = transaction.objectStore(DRAFT_STORE)
    const imageStore = transaction.objectStore(IMAGE_STORE)
    const now = Date.now()

    const fields: FormData = { ...formData }
    delete fields.photo

    const photo = formData.photo
    const photoDataUrl = typeof photo === 'string' && photo.length > 0 ? photo : null
    const photoId = photoDataUrl ? `${templateId}:photo` : null

    if (photoId && photoDataUrl) {
        if (options.persistImage !== false) {
            imageStore.put({
                id: photoId,
                dataUrl: photoDataUrl,
                updatedAt: now,
            } satisfies ImageRecord)
        }
    } else {
        imageStore.delete(`${templateId}:photo`)
    }

    draftStore.put({
        schemaVersion: DRAFT_SCHEMA_VERSION,
        templateId,
        fields,
        photoId,
        photoTransform: options.photoTransform ?? { ...DEFAULT_PHOTO_TRANSFORM },
        updatedAt: now,
    } satisfies DraftRecord)

    await transactionDone(transaction)
}

/** 删除指定模板的草稿和照片 */
export async function deleteDraft(templateId: string): Promise<void> {
    const db = await openDatabase()
    const transaction = db.transaction([DRAFT_STORE, IMAGE_STORE], 'readwrite')
    transaction.objectStore(DRAFT_STORE).delete(templateId)
    transaction.objectStore(IMAGE_STORE).delete(`${templateId}:photo`)
    await transactionDone(transaction)
}

/** 读取上次使用的模板 ID */
export function readCurrentTemplateId(): string | null {
    try {
        return localStorage.getItem(TEMPLATE_STORAGE_KEY)
    } catch {
        return null
    }
}

/** 记住当前模板 ID */
export function writeCurrentTemplateId(templateId: string): void {
    try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, templateId)
    } catch {
        // 模板偏好写入失败不应阻塞编辑
    }
}

/** 测试或清空数据时关闭并删除本地数据库 */
export async function resetDraftDatabase(): Promise<void> {
    const existing = dbPromise
    dbPromise = null
    if (existing) {
        try {
            ;(await existing).close()
        } catch {
            // 数据库可能已经关闭
        }
    }

    if (typeof indexedDB === 'undefined') return

    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error ?? new Error('无法清空本地草稿数据库'))
        request.onblocked = () => reject(new Error('本地草稿数据库被其他窗口占用'))
    })
}
