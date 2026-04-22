import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('loads with correct elements', async ({ page }) => {
    // Heading
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Email and password inputs
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

    // Sign in button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // OAuth buttons
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft' })).toBeVisible();
  });

  test('shows validation error for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please fill in all fields');
  });

  test('shows validation error when only email is filled', async ({ page }) => {
    await page.getByPlaceholder('you@company.com').fill('user@acme.com');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please fill in all fields');
  });

  test('shows validation error when only password is filled', async ({ page }) => {
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please fill in all fields');
  });

  test('navigates to signup page via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up now' }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
  });

  test('navigates to forgot password via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot your password?' }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
  });
});

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('loads with all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByText('Create your enterprise account')).toBeVisible();

    // All input fields
    await expect(page.getByPlaceholder('Jane Smith')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Inc.')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('Min. 8 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Re-enter your password')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // OAuth buttons
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft' })).toBeVisible();

    // Link back to login
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('rejects personal email domains', async ({ page }) => {
    await page.getByPlaceholder('Jane Smith').fill('Test User');
    await page.getByPlaceholder('Acme Inc.').fill('Test Corp');
    await page.getByPlaceholder('you@company.com').fill('user@gmail.com');
    await page.getByPlaceholder('Min. 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('password123');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Please use your company email address')).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    await page.getByPlaceholder('Jane Smith').fill('Test User');
    await page.getByPlaceholder('Acme Inc.').fill('Test Corp');
    await page.getByPlaceholder('you@company.com').fill('user@testcorp.com');
    await page.getByPlaceholder('Min. 8 characters').fill('password123');
    await page.getByPlaceholder('Re-enter your password').fill('differentpassword');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Full name is required')).toBeVisible();
    await expect(page.getByText('Company name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('navigates to login page via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});

test.describe('Forgot password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('loads with correct elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByText('Enter your email and we will send you a reset link')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('shows validation error for empty email submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please enter your email address');
  });

  test('navigates back to login via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth guard', () => {
  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    // Ensure no auth state exists in sessionStorage
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });
});
