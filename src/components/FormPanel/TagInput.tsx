import { useState, useCallback } from 'react'
import './TagInput.css'

interface Props {
    label: string
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
}

export default function TagInput({ label, value, onChange, placeholder }: Props) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                const tag = inputValue.trim()
                if (tag && !value.includes(tag)) {
                    onChange([...value, tag])
                }
                setInputValue('')
            } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
                onChange(value.slice(0, -1))
            }
        },
        [inputValue, value, onChange]
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
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    className="tag-input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : '继续输入...'}
                />
            </div>
            <span className="tag-input-hint">按回车或逗号添加</span>
        </div>
    )
}
