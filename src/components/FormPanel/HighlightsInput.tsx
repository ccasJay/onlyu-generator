import { useCallback, useId, useState } from 'react'
import './HighlightsInput.css'

interface Props {
    label: string
    value: string[]
    onChange: (items: string[]) => void
    placeholder?: string
    maxItems?: number
    maxLength?: number
}

export default function HighlightsInput({
    label,
    value,
    onChange,
    placeholder,
    maxItems,
    maxLength,
}: Props) {
    const inputId = useId()
    const [inputValue, setInputValue] = useState('')
    const [limitError, setLimitError] = useState<string | null>(null)

    const handleAdd = useCallback(() => {
        const text = inputValue.trim()
        if (!text) return
        if (maxItems && value.length >= maxItems) {
            setLimitError(`最多添加 ${maxItems} 条亮点`)
            return
        }
        if (maxLength && text.length > maxLength) {
            setLimitError(`每条亮点最多 ${maxLength} 个字符`)
            return
        }

        onChange([...value, text])
        setInputValue('')
        setLimitError(null)
    }, [inputValue, maxItems, maxLength, value, onChange])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
            }
        },
        [handleAdd]
    )

    const handleRemove = useCallback(
        (index: number) => {
            onChange(value.filter((_, i) => i !== index))
        },
        [value, onChange]
    )

    return (
        <div className="highlights-input">
            <label className="highlights-label" htmlFor={inputId}>
                {label}
            </label>

            {/* 已添加的亮点列表 */}
            {value.length > 0 && (
                <ul className="highlights-list">
                    {value.map((item, i) => (
                        <li key={i} className="highlights-item">
                            <span className="highlights-dot"></span>
                            <span className="highlights-text">{item}</span>
                            <button
                                className="highlights-remove"
                                onClick={() => handleRemove(i)}
                                aria-label={`删除亮点 ${item}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* 输入区 */}
            <div className="highlights-add">
                <input
                    id={inputId}
                    className="highlights-field"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        if (maxLength && e.target.value.length >= maxLength) {
                            setLimitError(`每条亮点最多 ${maxLength} 个字符`)
                        } else {
                            setLimitError(null)
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || '输入一条亮点文案...'}
                    maxLength={maxLength}
                />
                <button
                    className="highlights-add-btn"
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                >
                    + 添加
                </button>
            </div>
            <span className={`highlights-hint ${limitError ? 'highlights-hint--error' : ''}`}>
                {limitError ?? '按回车或点击添加，支持添加多条'}
            </span>
        </div>
    )
}
