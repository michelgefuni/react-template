import { expect, test } from '@playwright/test';

test('shows the sign in page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'React Template' })).toBeVisible();
});

// @feature-auth-start
test('signs in through the identity provider', async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD to run the login flow.');

  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.locator('#username').fill(username ?? '');
  await page.locator('#password').fill(password ?? '');
  await page.locator('#kc-login').click();
  await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible();
});
// @feature-auth-end
