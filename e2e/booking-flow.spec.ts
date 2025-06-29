import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('customer can complete booking process', async ({ page }) => {
    // Navigate to business page
    await page.goto('/test-salon');

    // Check page loads correctly
    await expect(page.locator('h1')).toContainText('Test Salon');

    // Click book now button
    await page.click('text=Book Now');

    // Select a service
    await page.click('text=Haircut');

    // Select a date and time
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-date="2025-01-15"]');
    await page.click('[data-time="14:00"]');

    // Fill customer information
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="phone"]', '+1234567890');

    // Submit booking
    await page.click('text=Confirm Booking');

    // Check confirmation page
    await expect(
      page.locator('[data-testid="booking-confirmation"]'),
    ).toBeVisible();
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });
});
