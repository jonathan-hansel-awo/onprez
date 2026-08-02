import { createHmac } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { expect, test } from '@playwright/test'

const prisma = new PrismaClient()
const runId = (process.env.E2E_RUN_ID || Date.now().toString())
  .replace(/[^a-z0-9]/gi, '')
  .slice(-14)
const fixture = {
  email: `p2-030-${runId}@example.invalid`,
  password: `CoreLoop-${runId}-Aa7!`,
  handle: `p2-030-${runId}`.toLowerCase().slice(0, 30),
  businessName: `Core Loop Studio ${runId}`,
  serviceName: `Launch Consultation ${runId}`,
  customerName: `Core Loop Customer ${runId}`,
  customerEmail: `p2-030-customer-${runId}@example.invalid`,
  verificationToken: `verify-${runId}`,
}

function assertIsolatedDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required for browser E2E tests')

  const hostname = new URL(databaseUrl).hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error(`Refusing to run browser E2E against non-local database host: ${hostname}`)
  }
}

async function removeFixture() {
  await prisma.user.deleteMany({ where: { email: fixture.email } })
  await prisma.rateLimit.deleteMany({
    where: {
      endpoint: {
        in: ['auth:signup', 'auth:verify-email', 'auth:login', 'handle:check', 'booking:create'],
      },
    },
  })
}

test.describe.serial('first sellable user loop', () => {
  test.beforeAll(async () => {
    assertIsolatedDatabase()
    await removeFixture()
  })

  test.afterAll(async () => {
    await removeFixture()
    await prisma.$disconnect()
  })

  test('signup, publish, guest booking, and owner management work through real browsers', async ({
    browser,
    page,
    baseURL,
  }) => {
    await test.step('claim a handle and create the professional account', async () => {
      await page.goto('/signup')
      await page.getByLabel('Choose your handle').fill(fixture.handle)
      await expect(page.getByText('Perfect! This handle is available')).toBeVisible()
      await page.getByLabel('Email Address').fill(fixture.email)
      await page.getByLabel('Password', { exact: true }).fill(fixture.password)
      await page.getByLabel('Business Name').fill(fixture.businessName)
      await page.getByLabel('Business Category').selectOption('CONSULTING')
      await page.getByRole('button', { name: 'Claim Your Handle' }).click()
      await expect(page.getByRole('heading', { name: /Your handle is secured!/ })).toBeVisible()

      const verificationPepper = process.env.EMAIL_VERIFICATION_TOKEN_PEPPER
      if (!verificationPepper) {
        throw new Error('EMAIL_VERIFICATION_TOKEN_PEPPER is required for browser E2E tests')
      }
      const tokenHash = createHmac('sha256', verificationPepper)
        .update(fixture.verificationToken)
        .digest('hex')
      const prepared = await prisma.emailVerificationToken.updateMany({
        where: { user: { email: fixture.email }, verifiedAt: null },
        data: { token: tokenHash },
      })
      expect(prepared.count).toBe(1)

      await page.goto(`/verify-email?token=${fixture.verificationToken}`)
      await expect(page.getByRole('heading', { name: 'Email verified!' })).toBeVisible()
    })

    await test.step('sign in and configure business availability', async () => {
      await page.goto('/login')
      await page.getByLabel('Email address').fill(fixture.email)
      await page.getByLabel('Password', { exact: true }).fill(fixture.password)
      await page.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(page).toHaveURL(/\/dashboard(?:\/|$)/)
      await expect(page.getByRole('heading', { name: /Welcome|Dashboard/i }).first()).toBeVisible()

      await page.goto('/dashboard/settings/hours')
      await expect(page.getByRole('heading', { name: 'Business Hours' })).toBeVisible()
      await page.getByRole('button', { name: 'All Days Open' }).click()
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await expect(page.getByText('Business hours saved successfully!')).toBeVisible()
    })

    await test.step('create an active bookable service', async () => {
      await page.goto('/dashboard/services/new')
      await page.getByLabel('Service Name').fill(fixture.serviceName)
      await page
        .getByLabel('Description')
        .fill('A realistic consultation used only by the isolated browser test.')
      await page.getByLabel('Price (£)').fill('35')
      await page.getByLabel('Duration (minutes)').fill('30')
      await page.getByRole('button', { name: 'Create Service' }).click()
      await expect(page).toHaveURL(/\/dashboard\/services$/)
      await expect(page.getByText(fixture.serviceName, { exact: true })).toBeVisible()
    })

    await test.step('publish and share the public presence', async () => {
      await page.goto('/dashboard/presence/editor')
      await expect(page.getByRole('heading', { name: 'Edit Presence' })).toBeVisible()
      await page.getByRole('button', { name: 'Publish', exact: true }).click()
      await expect(page.getByText('Page published successfully!')).toBeVisible()

      await page.goto('/dashboard/sharing')
      await expect(page.getByRole('heading', { name: 'Share your presence' })).toBeVisible()
      await page.getByRole('button', { name: 'Copy link' }).click()
      await expect(page.getByRole('button', { name: 'Link ready to share' })).toBeVisible()
    })

    const customerContext = await browser.newContext({
      baseURL,
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const customerPage = await customerContext.newPage()

    await test.step('complete a public booking as a guest customer', async () => {
      const publicResponse = await customerPage.goto(`/${fixture.handle}`)
      expect(publicResponse?.status()).toBe(200)
      await expect(customerPage.getByText(fixture.businessName).first()).toBeVisible()

      await customerPage.goto(`/${fixture.handle}/book`)
      await customerPage.getByRole('button', { name: new RegExp(fixture.serviceName) }).click()
      await customerPage.getByRole('button', { name: 'Continue' }).click()

      await expect(customerPage.getByRole('heading', { name: 'Select a Date' })).toBeVisible()
      const availableDate = customerPage
        .locator('.grid.grid-cols-7.gap-1 button:not([disabled])')
        .first()
      await expect(availableDate).toBeVisible()
      await availableDate.click()

      await expect(customerPage.getByRole('heading', { name: 'Select a Time' })).toBeVisible()
      const availableTime = customerPage
        .getByRole('button', { name: /^\d{1,2}:\d{2} (?:AM|PM)$/ })
        .first()
      await expect(availableTime).toBeVisible()
      await availableTime.click()
      await customerPage.getByRole('button', { name: 'Continue' }).click()

      await customerPage.getByLabel('Full Name').fill(fixture.customerName)
      await customerPage.getByLabel('Email Address').fill(fixture.customerEmail)
      await customerPage.getByRole('button', { name: 'Continue' }).click()
      await customerPage.getByRole('button', { name: 'Confirm Booking' }).click()
      await expect(customerPage.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible()
    })

    await customerContext.close()

    await test.step('manage the booking from the professional dashboard', async () => {
      await page.goto('/dashboard/bookings')
      await expect(page.getByText(fixture.customerName, { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'View' }).first().click()

      await expect(page.getByRole('dialog', { name: 'Booking Details' })).toBeVisible()
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(page.getByRole('dialog', { name: 'Cancel Appointment' })).toBeVisible()
      await page.getByRole('button', { name: /Customer Request/ }).click()
      const notificationSwitch = page.getByRole('switch')
      await notificationSwitch.click()
      await expect(notificationSwitch).toHaveAttribute('aria-checked', 'false')
      await page.getByRole('button', { name: 'Cancel Appointment' }).click()
      await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible()

      const response = await page.request.get('/api/dashboard/first-sellable-loop')
      expect(response.ok()).toBe(true)
      const payload = await response.json()
      expect(payload.data.firstSellableLoop).toMatchObject({
        completedCount: 7,
        totalCount: 7,
        isComplete: true,
        withinTarget: true,
      })
    })
  })
})
