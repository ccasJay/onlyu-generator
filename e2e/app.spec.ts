import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('loads the form and preview without remote font requests', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))

    await page.goto('/')

    await expect(page.getByRole('heading', { name: /ONLY YOU/ })).toBeVisible()
    await expect(page.getByLabel('城市')).toHaveValue('上海')
    await expect(page.getByLabel('阿姨姓名')).toHaveValue('')
    await expect(page.locator('.nanny-main-title')).toHaveText('上海育婴师')
    expect(requests.some((url) => url.includes('fonts.googleapis.com'))).toBe(false)
})

test('updates the preview and restores the draft after reload', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('阿姨姓名').fill('王阿姨')
    await page.getByLabel('主标题（职位）').fill('高级育婴师')

    await expect(page.locator('.nanny-name')).toHaveText('王阿姨')
    await expect(page.locator('.nanny-main-title')).toHaveText('上海高级育婴师')
    await expect(page.getByText('已自动保存')).toBeVisible()

    await page.reload()

    await expect(page.getByLabel('阿姨姓名')).toHaveValue('王阿姨')
    await expect(page.locator('.nanny-name')).toHaveText('王阿姨')
})

test('blocks export with field-level errors when required fields are empty', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /导出海报/ }).click()

    await expect(page.getByText('请上传照片')).toBeVisible()
    await expect(page.getByText('请输入姓名')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toBeFocused()
})

test('supports keyboard tag removal, visible focus, and cancelable reset', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('城市').focus()
    await page.keyboard.press('Tab')
    const outlineStyle = await page.evaluate(
        () => getComputedStyle(document.activeElement!).outlineStyle
    )
    expect(outlineStyle).not.toBe('none')

    const tagInput = page.getByLabel('个人标签（逗号分隔）')
    await tagInput.fill('上海人')
    await tagInput.press('Enter')

    const removeButton = page.getByRole('button', { name: '删除标签 上海人' })
    await removeButton.focus()
    await page.keyboard.press('Enter')
    await expect(removeButton).toHaveCount(0)

    await page.getByLabel('阿姨姓名').fill('保留内容')
    page.once('dialog', (dialog) => void dialog.dismiss())
    await page.getByRole('button', { name: /重置/ }).click()
    await expect(page.getByLabel('阿姨姓名')).toHaveValue('保留内容')
})

test('compresses a large transparent PNG and exports a 2x PNG', async ({ page }) => {
    await page.goto('/')

    const dataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 3000
        canvas.height = 2000
        const context = canvas.getContext('2d')
        if (!context) throw new Error('canvas unavailable')
        context.clearRect(0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/png')
    })

    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
    await page.getByLabel('阿姨姓名').fill('刘阿姨')
    await page.locator('input[type="file"]').setInputFiles({
        name: 'photo.png',
        mimeType: 'image/png',
        buffer,
    })

    const preview = page.getByAltText('已上传照片预览')
    await expect(preview).toBeVisible()

    const source = await preview.getAttribute('src')
    expect(source).toMatch(/^data:image\/webp/)

    const dimensions = await page.evaluate(async (imageSource) => {
        const image = new Image()
        image.src = imageSource!
        await image.decode()
        return { width: image.naturalWidth, height: image.naturalHeight }
    }, source)
    expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(2000)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /导出海报/ }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^刘阿姨_\d{4}-\d{2}-\d{2}\.png$/)

    const path = await download.path()
    expect(path).not.toBeNull()
    const bytes = readFileSync(path!)
    expect(bytes.readUInt32BE(16)).toBe(1800)
    expect(bytes.readUInt32BE(20)).toBe(2668)
})

test('keeps the poster layout within bounds at the minimum window size and max lengths', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1100, height: 760 })
    await page.goto('/')

    await page.getByLabel('城市').fill('一二三四五六')
    await page.getByLabel('主标题（职位）').fill('一二三四五六七八')
    await page.getByLabel('阿姨姓名').fill('一二三四五六七八')
    await page.getByLabel('薪资说明').fill('一二三四五六七八九十一二三四五六')

    const tagInput = page.getByLabel('个人标签（逗号分隔）')
    for (const tag of [
        '标签一',
        '标签二',
        '标签三',
        '标签四',
        '标签五',
        '标签六',
        '标签七',
        '标签八',
    ]) {
        await tagInput.fill(tag)
        await tagInput.press('Enter')
    }

    const highlightInput = page.getByLabel('✨ 亮点文案')
    for (const highlight of ['亮点一二三四五六七八九十一二三四', '亮点二', '亮点三', '亮点四']) {
        await highlightInput.fill(highlight)
        await highlightInput.press('Enter')
    }

    await expect(page.locator('.nanny-main-title')).toHaveText('一二三四五六一二三四五六七八')
    await expect(page.locator('.nanny-name')).toHaveText('一二三四五六七八')

    await page.addStyleTag({
        content: '.nanny-poster, .nanny-poster * { font-family: sans-serif !important; }',
    })

    const sizes = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
    }))
    expect(sizes.pageWidth).toBeLessThanOrEqual(sizes.viewportWidth)

    const posterBox = await page.locator('.nanny-poster').boundingBox()
    const titleBox = await page.locator('.nanny-main-title').boundingBox()
    const nameBox = await page.locator('.nanny-name').boundingBox()
    const tagsBox = await page.locator('.nanny-tags-list').boundingBox()
    const photoBox = await page.locator('.nanny-photo-placeholder-cutout').boundingBox()
    const cardBox = await page.locator('.nanny-info-card').boundingBox()
    const footerBox = await page.locator('.nanny-brand-footer').boundingBox()
    const salaryBox = await page.locator('.nanny-salary-ribbon').boundingBox()

    expect(posterBox).not.toBeNull()
    expect(titleBox).not.toBeNull()
    expect(nameBox).not.toBeNull()
    expect(tagsBox).not.toBeNull()
    expect(photoBox).not.toBeNull()
    expect(cardBox).not.toBeNull()
    expect(footerBox).not.toBeNull()
    expect(salaryBox).not.toBeNull()

    expect(titleBox!.x).toBeGreaterThanOrEqual(posterBox!.x)
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(posterBox!.x + posterBox!.width + 1)
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(posterBox!.x + posterBox!.width + 1)
    expect(tagsBox!.x + tagsBox!.width).toBeLessThanOrEqual(photoBox!.x + 1)
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(posterBox!.x + posterBox!.width + 1)
    expect(footerBox!.x + footerBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1)
    expect(salaryBox!.x).toBeGreaterThanOrEqual(posterBox!.x)
    expect(salaryBox!.x + salaryBox!.width).toBeLessThanOrEqual(posterBox!.x + posterBox!.width + 1)
})
