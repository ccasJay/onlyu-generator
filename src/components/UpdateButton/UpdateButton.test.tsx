import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UpdateButton from './UpdateButton'

describe('UpdateButton', () => {
    it('is hidden outside Tauri', () => {
        render(<UpdateButton />)

        expect(screen.queryByRole('button', { name: '检查更新' })).not.toBeInTheDocument()
    })
})
