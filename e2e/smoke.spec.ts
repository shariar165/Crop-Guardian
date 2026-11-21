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

test('showcase mode opens /officer and /account without signing in', async ({ page }) => {
  for (const path of ['/officer', '/account']) {
    await page.goto(path)
    expect(new URL(page.url()).pathname).toBe(path)
  }
})
