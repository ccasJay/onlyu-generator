/** 将 Error、Tauri 字符串错误和异常对象统一转成可展示的中文/原始消息 */
export function describeError(error: unknown, fallback = '未知错误'): string {
    if (error instanceof Error) {
        return error.message || fallback
    }
    if (typeof error === 'string') {
        return error || fallback
    }
    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string' && error.message) {
            return error.message
        }
        try {
            const serialized = JSON.stringify(error)
            if (serialized && serialized !== '{}') return serialized
        } catch {
            // 不可序列化对象使用 fallback
        }
    }
    return fallback
}
