import { useRef, useEffect, useCallback } from 'react'
import FormPanel from './components/FormPanel/FormPanel'
import PreviewPanel from './components/PreviewPanel/PreviewPanel'
import ExportButton from './components/ExportButton/ExportButton'
import { useFormStore } from './store/useFormStore'
import { getTemplateById, getDefaultFormData } from './templates'
import logoImg from './assets/logo.jpg'
import './App.css'

function App() {
    const posterRef = useRef<HTMLDivElement>(null)
    const {
        currentTemplateId,
        hydrationStatus,
        hydrate,
        notice,
        dismissNotice,
        resetForm,
        setFormData,
    } = useFormStore()
    const template = getTemplateById(currentTemplateId)

    useEffect(() => {
        void hydrate()
    }, [hydrate])

    const handleReset = useCallback(() => {
        if (template && confirm('确定要重置所有内容吗？')) {
            resetForm()
            setTimeout(() => {
                setFormData(getDefaultFormData(template))
            }, 0)
        }
    }, [template, resetForm, setFormData])

    if (hydrationStatus === 'loading') {
        return (
            <div className="app-loading" role="status">
                正在恢复草稿…
            </div>
        )
    }

    return (
        <div className="app">
            {/* 顶部导航栏 */}
            <header className="app-header">
                <div className="app-header-brand">
                    <img src={logoImg} alt="ONLY YOU Logo" className="app-header-logo" />
                    <div className="app-header-info">
                        <h1 className="app-header-title">ONLY YOU 宣传图生成器</h1>
                        <p className="app-header-subtitle">欧利优家政服务有限公司</p>
                    </div>
                </div>
                <div className="app-header-actions">
                    <button className="app-reset-btn" onClick={handleReset}>
                        🔄 重置
                    </button>
                    <ExportButton posterRef={posterRef} />
                </div>
            </header>

            {notice && (
                <div className="app-notice" role="status">
                    <span>{notice}</span>
                    <button
                        className="app-notice-close"
                        onClick={dismissNotice}
                        aria-label="关闭提示"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* 主内容区 */}
            <main className="app-main">
                <aside className="app-sidebar">
                    <FormPanel />
                </aside>
                <section className="app-preview">
                    <PreviewPanel posterRef={posterRef} />
                </section>
            </main>
        </div>
    )
}

export default App
