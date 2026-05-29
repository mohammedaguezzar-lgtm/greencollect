import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Recyclez|Recycle/i);
  await expect(page.getByRole('link', { name: /Connexion|Sign in/i })).toBeVisible();
});

test('login page loads', async ({ page }) => {
  await page.goto('/fr/login');
  await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible();
});
