import { test, expect, type Page } from '@playwright/test';

/**
 * Sets up a mock authenticated state in sessionStorage.
 * The Zustand auth store persists under key "ruflo-auth" using sessionStorage.
 */
async function setAuthState(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    const authState = {
      state: {
        user: {
          id: 'test-user-1',
          name: 'Test User',
          email: 'test@acme.com',
          role: 'admin',
        },
        accessToken: 'mock-access-token-for-e2e',
        isAuthenticated: true,
      },
      version: 0,
    };
    sessionStorage.setItem('ruflo-auth', JSON.stringify(authState));
  });
}

test.describe('Navigation - unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
  });

  test('root redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should end up at login since there is no auth state
    await expect(page).toHaveURL(/\/login/);
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up now' }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
  });

  test('can navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('can navigate to forgot password from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot your password?' }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
  });

  test('can navigate from forgot password back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('protected route /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route /dashboard/members redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/members');

    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route /dashboard/settings redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/settings');

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Navigation - authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
  });

  test('root redirects to /dashboard when authenticated', async ({ page }) => {
    await page.goto('/');

    // With auth state, root should resolve to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('dashboard page is accessible', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('RuFlo logo is visible in sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('RuFlo')).toBeVisible();
  });

  test('version info is visible in sidebar footer', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText('RuFlo v0.1.0')).toBeVisible();
  });
});
