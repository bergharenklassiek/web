import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { allPaths } from './support/pages';

async function seriousProblems(page: Page) {
  // axe leaves the check for tap target size off by default
  const { violations } = await new AxeBuilder({ page }).options({ rules: { 'target-size': { enabled: true } } }).analyze();
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({ rule: violation.id, elements: violation.nodes.map((node) => node.target.join(' ')) }));
}

test.describe('accessibility', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'The results don\'t depend on the browser');

  for (const path of allPaths) {
    test(`${path} has no serious problems`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      expect(await seriousProblems(page)).toEqual([]);
    });
  }

  test('the reservation dialog has no serious problems', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reserveer hier' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    expect(await seriousProblems(page)).toEqual([]);
  });
});
