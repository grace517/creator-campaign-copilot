import { expect, test } from '@playwright/test';

/**
 * The five steps on the sample data, in one session (state lives in memory, so the test moves with in-app links,
 * never a reload): pick creators, approve drafts, swap in a backup, open the readout, click a pool card, and
 * check the table filters.
 */
test('a brand runs the sample campaign from brief to readout', async ({ page }) => {
  await page.goto('/campaigns/barrier-serum-launch/brief');
  await expect(page.getByRole('heading', { name: 'Barrier Serum launch', level: 1 })).toBeVisible();

  // Brief → Roster
  await page.getByRole('link', { name: /Next: pick creators/ }).click();
  await expect(page).toHaveURL(/\/roster$/);
  const draftLink = page.getByRole('link', { name: /Draft messages for \d+ creators/ });
  const before = Number((await draftLink.textContent())!.match(/\d+/)![0]);

  // Pick creators: unpick one and pick them back; the count follows.
  const pick = page.getByRole('checkbox', { name: 'Pick @glow.with.gia' });
  await pick.uncheck();
  await expect(page.getByRole('link', { name: `Draft messages for ${before - 1} creators` })).toBeVisible();
  await pick.check();
  await page.getByRole('link', { name: `Draft messages for ${before} creators` }).click();

  // Drafts: approve every passing draft.
  await expect(page).toHaveURL(/\/drafts$/);
  await page.getByRole('button', { name: /Approve all passing \(\d+\)/ }).click();
  await expect(page.getByRole('button', { name: /Approve all passing/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'Next: creator status' }).click();

  // Status: swap a backup in for @sunlit.sam, who hasn't connected Instagram.
  await expect(page).toHaveURL(/\/status$/);
  const sam = page.locator('.risk-card', { hasText: '@sunlit.sam' });
  await sam.getByRole('button', { name: 'Swap in a backup' }).click();
  const backups = page.getByRole('group', { name: 'Backups for @sunlit.sam' });
  const swap = backups.getByRole('button', { name: /^Swap in @/ }).first();
  const backup = (await swap.textContent())!.replace('Swap in ', '');
  await swap.click();
  await expect(page.getByText(`@sunlit.sam, who was replaced by ${backup}`)).toBeVisible();

  // Readout: a pool card filters the table, and the filters change what it shows.
  await page.getByRole('list', { name: 'Campaign steps' }).getByRole('link', { name: /Readout/ }).click();
  await expect(page).toHaveURL(/\/readout$/);
  await expect(page.getByRole('heading', { name: /Creators beat paid social by 24%/ })).toBeVisible();
  await page.getByRole('link', { name: 'View 4 in table' }).click();
  const data = page.getByRole('region', { name: 'Campaign data' });
  await expect(data.getByText('Showing 4 of 8 creators')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Showing in table ↓' })).toBeVisible();
});

test('the table filters by pool and by creator', async ({ page }) => {
  await page.goto('/campaigns/barrier-serum-launch/readout');
  const data = page.getByRole('region', { name: 'Campaign data' });
  await expect(data.getByText('Showing 8 of 8 creators')).toBeVisible();
  await data.getByRole('combobox', { name: 'Pool' }).selectOption({ label: 'Pool: Reach' });
  await expect(data.getByText('Showing 1 of 8 creators')).toBeVisible();
  await expect(data.locator('tbody').getByText('@sunlit.sam')).toBeVisible();
});

test('a sign-up target on the brief fills List builders on the readout', async ({ page }) => {
  await page.goto('/campaigns/barrier-serum-launch/readout');
  await expect(page.getByRole('heading', { name: 'List builders', level: 4 })).toHaveCount(0);
  await expect(page.getByText('No creators this campaign: List builders')).toBeVisible();

  await page.getByRole('list', { name: 'Campaign steps' }).getByRole('link', { name: /Brief/ }).click();
  await page.getByLabel('Target cost per sign-up (optional)').fill('$17');
  await page.getByRole('list', { name: 'Campaign steps' }).getByRole('link', { name: /Readout/ }).click();
  const card = page.locator('.pool-card', { has: page.getByRole('heading', { name: 'List builders' }) });
  await expect(card).toContainText('@budgetbeautyb');
  await expect(card).toContainText('$15.25 per sign-up, 10% under the $17.00 goal');
});
