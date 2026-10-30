import { useRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDefaultFormData, getTemplateById } from '../../templates'
import { useFormStore } from '../../store/useFormStore'
import ExportButton from '../ExportButton/ExportButton'
import FormPanel from './FormPanel'

const template = getTemplateById('nanny')!

function ExportHarness() {
    const posterRef = useRef<HTMLDivElement>(null)
    return (
        <>
            <div ref={posterRef} className="nanny-poster" style={{ width: 900, height: 1334 }} />
            <ExportButton posterRef={posterRef} />
        </>
    )
}

describe('FormPanel', () => {
    beforeEach(() => {
        useFormStore.setState({
            currentTemplateId: 'nanny',
            formData: getDefaultFormData(template),
            hydrationStatus: 'ready',
            saveStatus: 'idle',
            validationErrors: {},
            notice: null,
            isExporting: false,
            isImageProcessing: false,
        })
    })

    afterEach(() => {
        cleanup()
    })

    it('associates labels with inputs and updates the store', async () => {
        const user = userEvent.setup()
        render(<FormPanel />)

        const cityInput = screen.getByLabelText('城市')
        expect(cityInput).toHaveValue('上海')

        await user.clear(cityInput)
        await user.type(cityInput, '北京')

        expect(useFormStore.getState().formData.city).toBe('北京')
    })

    it('shows required field errors and blocks export', async () => {
        const user = userEvent.setup()
        render(
            <>
                <FormPanel />
                <ExportHarness />
            </>
        )

        await user.click(screen.getByRole('button', { name: /导出海报/ }))

        expect(screen.getByText('请上传照片')).toBeInTheDocument()
        expect(screen.getByText('请输入姓名')).toBeInTheDocument()
        expect(document.activeElement).toHaveAttribute('type', 'file')
        expect(useFormStore.getState().isExporting).toBe(false)
    })
})
