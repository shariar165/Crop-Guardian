import { expect, test } from '@playwright/test'

const INTRO_SEEN = () => localStorage.setItem('crop-guardian:intro-seen', '1')

test('the intro\'s পরের button is on screen without scrolling', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'পরের' })).toBeInViewport()
})

test('the bottom nav stays on screen while Home scrolls', async ({ page }) => {
  await page.addInitScript(INTRO_SEEN)
  await page.goto('/')
  await page.mouse.wheel(0, 600)
  await expect(page.getByRole('navigation', { name: 'মূল মেনু' })).toBeInViewport({ ratio: 1 })
})

test('the camera\'s shutter, gallery and crop switch fit on a 360×640 screen', async ({ page }) => {
  await page.goto('/camera')
  await expect(page.getByRole('button', { name: 'ছবি তুলুন', exact: true }).last()).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('button', { name: 'গ্যালারি থেকে ছবি নিন' })).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('radiogroup', { name: 'কোন ফসলের পাতা' })).toBeInViewport({ ratio: 1 })
})

// The answer comes from here, not the models: the crash was in rendering a new turn, and the eval
// is what tests the answers.
test('/ask stays up after a question', async ({ page }) => {
  await page.route('**/api/ask', (route) =>
    route.fulfill({ json: { answer: 'পরীক্ষার উত্তর।', sources: [], escalate: false, note: null } }),
  )
  await page.goto('/ask')
  await page.getByLabel('আপনার প্রশ্ন').fill('আলুর পাতায় দাগ কেন?')
  await page.getByRole('button', { name: 'পাঠান' }).click()
  await expect(page.getByText('পরীক্ষার উত্তর।')).toBeVisible()
  // A second turn re-runs the scroll effect, which is when the old bug crashed the page.
  await page.getByLabel('আপনার প্রশ্ন').fill('আরেকটা প্রশ্ন?')
  await page.getByRole('button', { name: 'পাঠান' }).click()
  await expect(page.getByText('পরীক্ষার উত্তর।')).toHaveCount(2)
  await expect(page.getByText("This page couldn't load")).toHaveCount(0)
})

test('showcase mode opens /officer and /account without signing in, as the demo officer', async ({ page }) => {
  for (const path of ['/officer', '/account']) {
    await page.goto(path)
    expect(new URL(page.url()).pathname).toBe(path)
    await expect(page.getByText('ডেমো কর্মকর্তা')).toBeVisible()
  }
})

// On a danger day the card's camera button replaces the big one under it; on other days the card
// has none and the big one shows. Either way there is exactly one, whatever today's weather is.
test('Home has one «পাতার ছবি তুলুন» besides the nav, in season or out', async ({ page }) => {
  await page.addInitScript(INTRO_SEEN)
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'পাতার ছবি তুলুন' })).toHaveCount(1)
  const danger = (await page.getByRole('heading', { name: 'আজই পাতা দেখুন' }).count()) > 0
  // Planted today, the potato field isn't up yet: no decision card, so the big button shows.
  await page.evaluate(() =>
    localStorage.setItem('crop-guardian:fields', JSON.stringify([{ season: 'potato', planted: new Date().toISOString().slice(0, 10) }])),
  )
  await page.reload()
  await expect(page.getByRole('heading', { name: 'আজই পাতা দেখুন' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'পাতার ছবি তুলুন' })).toHaveCount(1)
  test.info().annotations.push({ type: 'weather', description: danger ? 'danger day: checked the card button' : 'not a danger day' })
})

test('the gear opens Settings, and «বড়» text grows the text and stays after a reload', async ({ page }) => {
  await page.addInitScript(INTRO_SEEN)
  await page.goto('/')
  await page.getByRole('link', { name: 'সেটিংস' }).click()
  await expect(page.getByRole('heading', { name: 'সেটিংস', level: 1 })).toBeVisible()
  const size = () => page.getByRole('radiogroup', { name: 'লেখার আকার' })
  await size().getByRole('radio', { name: 'বড়' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('18px')
  // Only text grows: the page still fits the 360px screen.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  await size().getByRole('radio', { name: 'স্বাভাবিক' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-text', 'large')
})

test('«সব মুছুন» in Settings clears the phone, and the intro shows again', async ({ page }) => {
  await page.goto('/settings')
  await page.evaluate(() => {
    localStorage.setItem('crop-guardian:intro-seen', '1')
    localStorage.setItem('crop-guardian:fields', JSON.stringify([{ season: 'potato', planted: '2026-11-01' }]))
    localStorage.setItem('cg-ask', '[]')
    localStorage.setItem('other-site', 'kept')
  })
  await page.getByRole('button', { name: 'সব মুছুন' }).click()
  await page.getByRole('button', { name: 'হ্যাঁ, মুছুন' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  await expect(page.getByRole('button', { name: 'পরের' })).toBeVisible()
  const left = await page.evaluate(() => Object.keys(localStorage).sort())
  expect(left).toEqual(['other-site'])
})
