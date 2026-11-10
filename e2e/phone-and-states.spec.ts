import { expect, test } from '@playwright/test';

const C = '/campaigns/barrier-serum-launch';

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('status: step line, at-risk cards, and everyone else as a list, with no sideways scroll', async ({ page }) => {
    await page.goto(`${C}/status`);
    await expect(page.getByText('Step 4 of 5: Creator status')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Campaign steps' })).toBeHidden();
    const list = page.getByRole('region', { name: 'Everyone else' });
    await expect(list.getByRole('listitem')).toHaveCount(6);
    await expect(list.getByText('replaced @runwithrio')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('readout: ranked CPA list in place of the scatter, and pools open to their creators', async ({ page }) => {
    await page.goto(`${C}/readout`);
    const ranked = page.getByRole('region', { name: 'CPA by creator' });
    await expect(ranked.getByRole('listitem')).toHaveCount(8);
    await expect(ranked.getByRole('listitem').first()).toContainText('@theskinnurse');
    await expect(ranked.getByText('off scale ▸')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Campaign data' })).toBeHidden();
    await page.getByText('Reach · 1').click();
    await expect(page.getByText('$557 CPA')).toBeVisible();
  });

  test('menu: opens with the app areas and this campaign’s steps', async ({ page }) => {
    await page.goto(`${C}/readout`);
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: '4. Status' }).click();
    await expect(page).toHaveURL(/\/status$/);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('states', () => {
  test('roster, first campaign: everyone is new and the roster sorts by fee', async ({ page }) => {
    await page.goto(`${C}/roster?state=first-campaign`);
    await expect(page.getByText('This is your first campaign')).toBeVisible();
    await expect(page.getByLabel('Sort', { exact: true })).toHaveValue('fee');
    await expect(page.locator('.roster .tag--blue').first()).toHaveText('new');
  });

  test('drafts, a model call fails: one row fails, the rest are unaffected, and Try again recovers', async ({ page }) => {
    await page.goto(`${C}/drafts?state=failed`);
    const failed = page.locator('.writing__row', { hasText: '@glow.with.gia' });
    await expect(failed.getByText('Couldn’t write a starter')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/All 6 checks pass/)).toHaveCount(7);
    await expect(page.getByRole('button', { name: 'Send to creators' })).toBeDisabled();
    await failed.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText(/All 6 checks pass/)).toHaveCount(8, { timeout: 5_000 });
    await page.getByRole('button', { name: 'Send to creators' }).click();
    await expect(page).toHaveURL(/\/drafts$/);
  });

  test('status, an account disconnects: pinned above readiness, and the reconnect link sends', async ({ page }) => {
    await page.goto(`${C}/status?state=disconnected`);
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('@theskinnurse’s Instagram disconnected');
    await alert.getByRole('button', { name: 'Send reconnect link' }).click();
    await expect(alert.getByText('Reconnect link sent to @theskinnurse')).toBeVisible();
  });

  test('readout, results still coming in: early numbers, no verdict or pools', async ({ page }) => {
    await page.goto(`${C}/readout?state=early`);
    await expect(page.getByText('Early results · 5 of 8 posts have run 7 days.')).toBeVisible();
    await expect(page.locator('.pool-card')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Verdict' })).toHaveCount(0);
  });

  test('the picker only appears in the sample campaign', async ({ page }) => {
    await page.goto(`${C}/roster`);
    await expect(page.getByText('Sample state')).toBeVisible();
    await page.goto('/campaigns');
    await page.getByRole('link', { name: 'Holiday gift set' }).first().click();
    await expect(page.getByRole('heading', { name: 'Holiday gift set', level: 1 })).toBeVisible();
    await expect(page.getByText('Sample state')).toHaveCount(0);
  });
});
