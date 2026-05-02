// Insights demo — career analytics + skill-gap charts.
// Skips login (handled via API in record helper).

import { record } from './lib/record.mjs'

await record({
  name: 'demo-insights',
  startUrl: '/insights',
  flow: async (page) => {
    // Let charts mount + animate.
    await page.waitForTimeout(2500)

    // Slow scroll down to reveal the lower-half charts.
    for (const top of [150, 350, 600, 850, 350, 0]) {
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'smooth' }), top)
      await page.waitForTimeout(1500)
    }

    // If there's a role selector, switch it to show charts updating.
    const roleSelect = page.locator('select').first()
    if (await roleSelect.count() > 0) {
      const options = await roleSelect.locator('option').allTextContents()
      // Pick a different option than the current one if more than one exists.
      if (options.length > 1) {
        await roleSelect.selectOption({ index: 1 }).catch(() => {})
        await page.waitForTimeout(2500)
      }
    }

    // Hover over a bar chart to surface tooltips.
    const charts = page.locator('svg.recharts-surface, .recharts-wrapper')
    const chartCount = await charts.count()
    if (chartCount > 0) {
      const box = await charts.first().boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6)
        await page.waitForTimeout(1200)
        await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5)
        await page.waitForTimeout(1500)
      }
    }

    await page.waitForTimeout(1500)
  },
})
