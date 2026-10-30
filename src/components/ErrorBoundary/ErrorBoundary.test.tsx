import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function BrokenView(): never {
    throw new Error('测试渲染错误')
}

describe('ErrorBoundary', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('shows a recoverable fallback instead of a blank screen', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        render(
            <ErrorBoundary>
                <BrokenView />
            </ErrorBoundary>
        )

        expect(screen.getByRole('alert')).toHaveTextContent('页面出了点问题')
        expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '清除当前草稿并重新加载' })).toBeInTheDocument()
    })
})
