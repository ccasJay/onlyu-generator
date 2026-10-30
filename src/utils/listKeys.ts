export interface KeyedItem {
    key: string
    value: string
}

/** 为字符串数组生成内容稳定的 key；重复内容用出现序号区分 */
export function keyItems(items: string[]): KeyedItem[] {
    const occurrences = new Map<string, number>()

    return items.map((value) => {
        const occurrence = occurrences.get(value) ?? 0
        occurrences.set(value, occurrence + 1)
        return {
            key: `${value}#${occurrence}`,
            value,
        }
    })
}
