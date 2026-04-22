import { test, expect, type Page } from '@playwright/test';

/**
 * Sets up a mock authenticated state in sessionStorage.
 * The Zustand auth store persists under key "ruflo-auth" using sessionStorage.
 */
async function setAuthState(page: Page) {
  await page.goto('/login'); // Navigate first so we have access to the origin's sessionStorage
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

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/dashboard');
  });

  test('loads after authentication', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(
      page.getByText('Overview of your workflows, deployments, and infrastructure'),
    ).toBeVisible();
  });

  test('shows sidebar with navigation items', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // All four nav items should be present
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Members')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
    await expect(sidebar.getByText('Billing')).toBeVisible();
  });

  test('shows top nav with user info', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Search input
    await expect(header.getByRole('searchbox', { name: 'Search' })).toBeVisible();

    // Notifications button
    await expect(header.getByRole('button', { name: 'View notifications' })).toBeVisible();

    // User menu button with initial
    await expect(header.getByRole('button', { name: 'User menu' })).toBeVisible();
  });

  test('shows content grid with sections', async ({ page }) => {
    // Verify the content section headings from the sample data
    await expect(page.getByText('Active Workflows')).toBeVisible();
    await expect(page.getByText('Recent Deployments')).toBeVisible();
    await expect(page.getByText('Team Activity')).toBeVisible();
    await expect(page.getByText('Infrastructure Health')).toBeVisible();
  });

  test('sidebar navigation highlights active item', async ({ page }) => {
    // The Dashboard nav item should have aria-current="page"
    const dashboardNavButton = page.locator('aside').getByRole('button', { name: 'Dashboard' });
    await expect(dashboardNavButton).toHaveAttribute('aria-current', 'page');

    // Other items should not have aria-current
    const membersNavButton = page.locator('aside').getByRole('button', { name: 'Members' });
    await expect(membersNavButton).not.toHaveAttribute('aria-current', 'page');
  });

  test('sidebar can collapse and expand', async ({ page }) => {
    const sidebar = page.locator('aside');

    // Sidebar starts expanded — nav item text should be visible
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Members')).toBeVisible();

    // Collapse the sidebar
    const collapseButton = page.getByRole('button', { name: 'Collapse sidebar' });
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();

    // After collapse, nav text should be hidden but sidebar still present
    await expect(sidebar).toBeVisible();
    // The text labels should no longer be visible in collapsed mode
    await expect(sidebar.getByText('Dashboard')).toBeHidden();
    await expect(sidebar.getByText('Members')).toBeHidden();

    // Expand button should now be available
    const expandButton = page.getByRole('button', { name: 'Expand sidebar' });
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    // After expand, text should be visible again
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Members')).toBeVisible();
  });

  test('user menu shows profile options on click', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: 'User menu' });
    await userMenuButton.click();

    // Menu should show user info and options
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('test@acme.com')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Sign Out' })).toBeVisible();
  });
});
