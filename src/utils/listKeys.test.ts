import { describe, expect, it } from 'vitest'
import { keyItems } from './listKeys'

describe('keyItems', () => {
    it('keeps keys stable when an unrelated middle item is removed', () => {
        const before = keyItems(['a', 'b', 'c'])
        const after = keyItems(['a', 'c'])

        expect(after[0].key).toBe(before[0].key)
        expect(after[1].key).toBe(before[2].key)
    })

    it('distinguishes duplicate values by occurrence', () => {
        expect(keyItems(['a', 'a', 'b']).map((item) => item.key)).toEqual(['a#0', 'a#1', 'b#0'])
    })
})
