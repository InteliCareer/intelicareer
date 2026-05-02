// Tracker demo — kanban + add-application modal walkthrough.
// Skips login (handled via API in record helper).

import { record, type } from './lib/record.mjs'

await record({
  name: 'demo-tracker',
  startUrl: '/tracker',
  flow: async (page) => {
    // Settle on the page, then a slow scroll so the kanban columns are visible.
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await page.waitForTimeout(2000)

    // Open the "Add Application" modal.
    const addBtn = page.locator('button:has-text("Add")').first()
    if (await addBtn.count() > 0) {
      await addBtn.click()
      await page.waitForTimeout(1500)

      // Fill it out so the demo shows a realistic add flow.
      await type(page, 'input[placeholder="Senior Backend Engineer"]', 'Backend Engineer', 50)
      await type(page, 'input[placeholder="Stripe"]', 'Vercel', 50)
      await type(page, 'input[placeholder="San Francisco, CA"]', 'Remote · EU', 50)
      await type(page, 'input[placeholder="120000"]', '110000', 30)
      await type(page, 'input[placeholder="180000"]', '160000', 30)
      await page.waitForTimeout(800)

      // Cancel rather than submit so we don't pollute the tracker on each run.
      const cancelBtn = page.locator('button:has-text("Cancel")').first()
      if (await cancelBtn.count() > 0) await cancelBtn.click()
      await page.waitForTimeout(1200)
    }

    // Tour the kanban columns by scrolling horizontally on the board.
    const board = page.locator('[class*="grid"]').first()
    if (await board.count() > 0) {
      await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
      await page.waitForTimeout(2000)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
      await page.waitForTimeout(1500)
    }

    // Click into the first application card to show the detail drawer.
    const firstCard = page.locator('[class*="cursor-pointer"]').first()
    if (await firstCard.count() > 0) {
      await firstCard.click().catch(() => {})
      await page.waitForTimeout(2500)
      // Close the drawer if it opened.
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1200)
    }

    await page.waitForTimeout(1500)
  },
})
