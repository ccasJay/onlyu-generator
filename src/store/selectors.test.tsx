import { act, cleanup, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDefaultFormData, getTemplateById } from '../templates'
import { useFormStore } from './useFormStore'

const template = getTemplateById('nanny')!

let nameRenders = 0
let cityRenders = 0

function NameProbe() {
    const name = useFormStore((state) => state.formData.name)
    useEffect(() => {
        nameRenders += 1
    })
    return <span data-testid="name">{name as string}</span>
}

function CityProbe() {
    const city = useFormStore((state) => state.formData.city)
    useEffect(() => {
        cityRenders += 1
    })
    return <span data-testid="city">{city as string}</span>
}

describe('store selectors', () => {
    beforeEach(() => {
        nameRenders = 0
        cityRenders = 0
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

    it('does not rerender a field that only selects unrelated state', () => {
        render(
            <>
                <NameProbe />
                <CityProbe />
            </>
        )

        expect(nameRenders).toBe(1)
        expect(cityRenders).toBe(1)

        act(() => {
            useFormStore.getState().setField('city', '北京')
        })

        expect(cityRenders).toBe(2)
        expect(nameRenders).toBe(1)
    })
})
