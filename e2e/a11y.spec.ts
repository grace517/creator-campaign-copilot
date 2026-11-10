import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Accessibility checks (axe, WCAG 2.1 A and AA) on every screen and state, at desktop and phone widths. */

const C = '/campaigns/barrier-serum-launch';
const SCREENS = [
  '/campaigns',
  '/creators',
  '/brand-kit',
  `${C}/brief`,
  `${C}/roster`,
  `${C}/drafts`,
  `${C}/status`,
  `${C}/readout`,
  `${C}/roster?state=first-campaign`,
  `${C}/drafts?state=writing`,
  `${C}/status?state=disconnected`,
  `${C}/readout?state=early`,
];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  expect(summary).toEqual([]);
}

for (const width of [1280, 390]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of SCREENS) {
      test(`axe: ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('main, .page').first()).toBeVisible();
        await expectNoViolations(page);
      });
    }
  });
}

test('keyboard: the roster can be picked, and the readout pool card reached, without a mouse', async ({ page }) => {
  await page.goto(`${C}/roster`);
  const pick = page.getByRole('checkbox', { name: 'Pick @glow.with.gia' });
  await pick.focus();
  await page.keyboard.press('Space');
  await expect(pick).not.toBeChecked();

  await page.goto(`${C}/readout`);
  const view = page.getByRole('link', { name: 'View 4 in table' });
  for (let i = 0; i < 60 && !(await view.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(view).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Showing 4 of 8 creators')).toBeVisible();
});
