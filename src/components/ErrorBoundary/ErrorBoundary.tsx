import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useFormStore } from '../../store/useFormStore'
import { deleteDraft } from '../../store/draftRepository'
import { confirmAction } from '../../platform/confirm'
import './ErrorBoundary.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    errorMessage: string
    isClearing: boolean
    clearError: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        errorMessage: '',
        isClearing: false,
        clearError: null,
    }

    static getDerivedStateFromError(error: unknown): Partial<State> {
        return {
            hasError: true,
            errorMessage: error instanceof Error ? error.message : '页面渲染失败',
        }
    }

    componentDidCatch(error: unknown, info: ErrorInfo): void {
        console.error('应用渲染失败:', error, info)
    }

    private handleReload = (): void => {
        window.location.reload()
    }

    private handleClearDraft = async (): Promise<void> => {
        const confirmed = await confirmAction(
            '确定要清除当前草稿并重新加载吗？此操作不可撤销。',
            '清除草稿'
        )
        if (!confirmed) return

        this.setState({ isClearing: true, clearError: null })
        try {
            const templateId = useFormStore.getState().currentTemplateId
            await deleteDraft(templateId)
            window.location.reload()
        } catch {
            this.setState({
                isClearing: false,
                clearError: '清除草稿失败，请检查本地存储空间后重试。',
            })
        }
    }

    render(): ReactNode {
        if (!this.state.hasError) {
            return this.props.children
        }

        return (
            <div className="error-boundary" role="alert">
                <div className="error-boundary-card">
                    <h1 className="error-boundary-title">页面出了点问题</h1>
                    <p className="error-boundary-text">
                        应用遇到了未处理的错误。你可以重新加载，或在确认后清除当前模板的草稿。
                    </p>
                    {this.state.errorMessage && (
                        <p className="error-boundary-detail">{this.state.errorMessage}</p>
                    )}
                    {this.state.clearError && (
                        <p className="error-boundary-error" role="alert">
                            {this.state.clearError}
                        </p>
                    )}
                    <div className="error-boundary-actions">
                        <button className="error-boundary-primary" onClick={this.handleReload}>
                            重新加载
                        </button>
                        <button
                            className="error-boundary-secondary"
                            onClick={() => void this.handleClearDraft()}
                            disabled={this.state.isClearing}
                        >
                            {this.state.isClearing ? '清除中…' : '清除当前草稿并重新加载'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}
