import { useState, useCallback } from 'react'
import './TagInput.css'

interface Props {
    label: string
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    maxItems?: number
    maxLength?: number
}

export default function TagInput({
    label,
    value,
    onChange,
    placeholder,
    maxItems,
    maxLength,
}: Props) {
    const [inputValue, setInputValue] = useState('')
    const [limitError, setLimitError] = useState<string | null>(null)

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                const tag = inputValue.trim()
                if (!tag) {
                    setInputValue('')
                    return
                }
                if (maxItems && value.length >= maxItems) {
                    setLimitError(`最多添加 ${maxItems} 个标签`)
                    return
                }
                if (maxLength && tag.length > maxLength) {
                    setLimitError(`每个标签最多 ${maxLength} 个字符`)
                    return
                }
                if (!value.includes(tag)) {
                    onChange([...value, tag])
                }
                setInputValue('')
                setLimitError(null)
            } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
                setLimitError(null)
                onChange(value.slice(0, -1))
            }
        },
        [inputValue, maxItems, maxLength, value, onChange]
    )

    const handleRemove = useCallback(
        (index: number) => {
            onChange(value.filter((_, i) => i !== index))
        },
        [value, onChange]
    )

    return (
        <div className="tag-input">
            <label className="tag-input-label">{label}</label>
            <div className="tag-input-container">
                {value.map((tag, i) => (
                    <span key={i} className="tag-input-tag">
                        {tag}
                        <button
                            className="tag-input-remove"
                            onClick={() => handleRemove(i)}
                            aria-label={`删除标签 ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    className="tag-input-field"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        if (maxLength && e.target.value.length >= maxLength) {
                            setLimitError(`每个标签最多 ${maxLength} 个字符`)
                        } else {
                            setLimitError(null)
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : '继续输入...'}
                    maxLength={maxLength}
                />
            </div>
            <span className={`tag-input-hint ${limitError ? 'tag-input-hint--error' : ''}`}>
                {limitError ?? '按回车或逗号添加'}
            </span>
        </div>
    )
}
