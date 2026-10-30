import { useState, useCallback } from 'react'
import './HighlightsInput.css'

interface Props {
    label: string
    value: string[]
    onChange: (items: string[]) => void
    placeholder?: string
}

export default function HighlightsInput({ label, value, onChange, placeholder }: Props) {
    const [inputValue, setInputValue] = useState('')

    const handleAdd = useCallback(() => {
        const text = inputValue.trim()
        if (text) {
            onChange([...value, text])
            setInputValue('')
        }
    }, [inputValue, value, onChange])

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
            <label className="highlights-label">{label}</label>

            {/* 已添加的亮点列表 */}
            {value.length > 0 && (
                <ul className="highlights-list">
                    {value.map((item, i) => (
                        <li key={i} className="highlights-item">
                            <span className="highlights-dot"></span>
                            <span className="highlights-text">{item}</span>
                            <button className="highlights-remove" onClick={() => handleRemove(i)}>
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* 输入区 */}
            <div className="highlights-add">
                <input
                    className="highlights-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || '输入一条亮点文案...'}
                />
                <button
                    className="highlights-add-btn"
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                >
                    + 添加
                </button>
            </div>
            <span className="highlights-hint">按回车或点击添加，支持添加多条</span>
        </div>
    )
}
