import { createHmac } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { PrismaClient } from '@prisma/client'
import { expect, type Locator, type Page, test, type TestInfo } from '@playwright/test'

const prisma = new PrismaClient()
const runId = (process.env.E2E_RUN_ID || Date.now().toString())
  .replace(/[^a-z0-9]/gi, '')
  .slice(-14)
const fixture = {
  email: `p2-031-${runId}@example.invalid`,
  password: `Accessible-${runId}-Aa7!`,
  handle: `p2-031-${runId}`.toLowerCase().slice(0, 30),
  businessName: `Accessible Studio ${runId}`,
  serviceName: `Accessible Consultation ${runId}`,
  verificationToken: `a11y-verify-${runId}`,
}

function assertIsolatedDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required for accessibility browser tests')

  const hostname = new URL(databaseUrl).hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error(`Refusing to run accessibility tests against non-local database: ${hostname}`)
  }
}

async function removeFixture() {
  await prisma.user.deleteMany({ where: { email: fixture.email } })
  await prisma.rateLimit.deleteMany({
    where: {
      endpoint: {
        in: ['auth:signup', 'auth:verify-email', 'auth:login', 'handle:check'],
      },
    },
  })
}

async function chooseEssentialCookies(page: Page) {
  const choice = page.getByRole('button', { name: 'Essential only' })
  if (await choice.isVisible()) await choice.click()
}

async function audit(page: Page, testInfo: TestInfo, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  await testInfo.attach(`axe-${name}`, {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: 'application/json',
  })

  const summary = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map(node => node.target),
  }))
  expect(summary, `${name} must have no WCAG A/AA axe violations`).toEqual([])
}

async function reachWithTab(page: Page, target: Locator, maximumTabs = 30) {
  for (let attempt = 0; attempt < maximumTabs; attempt += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate(element => element === document.activeElement)) return
  }
  throw new Error(`Keyboard focus did not reach ${await target.getAttribute('aria-label')}`)
}

test.describe.serial('WCAG AA accessibility journey', () => {
  test.beforeAll(async () => {
    assertIsolatedDatabase()
    await removeFixture()
  })

  test.afterAll(async () => {
    await removeFixture()
    await prisma.$disconnect()
  })

  test('audits public, authentication, dashboard, presence, and booking flows', async ({
    browser,
    page,
    baseURL,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await test.step('audit public and authentication entry points', async () => {
      await page.goto('/')
      await chooseEssentialCookies(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await audit(page, testInfo, 'homepage')

      await page.goto('/signup')
      await expect(page.getByRole('form', { name: 'Create account form' })).toBeVisible()
      await audit(page, testInfo, 'signup')

      await page.goto('/login')
      const submit = page.getByRole('button', { name: 'Sign in to your account', exact: true })
      await reachWithTab(page, submit)
      const focusStyle = await submit.evaluate(element => {
        const style = getComputedStyle(element)
        return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle }
      })
      expect(
        focusStyle.boxShadow !== 'none' || focusStyle.outlineStyle !== 'none',
        'keyboard focus must be visibly indicated'
      ).toBe(true)
      await page.keyboard.press('Enter')

      const email = page.getByLabel('Email address')
      const password = page.getByLabel('Password', { exact: true })
      await expect(email).toHaveAttribute('aria-invalid', 'true')
      await expect(password).toHaveAttribute('aria-invalid', 'true')
      for (const control of [email, password]) {
        const messageId = await control.getAttribute('aria-describedby')
        expect(messageId).toBeTruthy()
        await expect(page.locator(`#${messageId}`)).toHaveAttribute('role', 'alert')
      }
      await audit(page, testInfo, 'login-validation')

      const motionDuration = await page
        .locator('main, body')
        .first()
        .evaluate(element => {
          const style = getComputedStyle(element)
          return {
            animationDuration: style.animationDuration,
            scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
            transitionDuration: style.transitionDuration,
          }
        })
      expect(motionDuration.scrollBehavior).toBe('auto')
      expect(['0s', '0.01ms']).toContain(motionDuration.animationDuration)
      expect(['0s', '0.01ms']).toContain(motionDuration.transitionDuration)
    })

    await test.step('create and verify an isolated professional account', async () => {
      await page.goto('/signup')
      await page.getByLabel('Choose your handle').fill(fixture.handle)
      await expect(page.getByText('Perfect! This handle is available')).toBeVisible()
      await page.getByLabel('Email Address').fill(fixture.email)
      await page.getByLabel('Password', { exact: true }).fill(fixture.password)
      await page.getByLabel('Business Name').fill(fixture.businessName)
      await page.getByLabel('Business Category').selectOption('CONSULTING')
      await page.getByRole('button', { name: 'Claim Your Handle' }).click()
      await expect(page.getByRole('heading', { name: /Your handle is secured!/ })).toBeVisible()

      const pepper = process.env.EMAIL_VERIFICATION_TOKEN_PEPPER
      if (!pepper) throw new Error('EMAIL_VERIFICATION_TOKEN_PEPPER is required')
      const tokenHash = createHmac('sha256', pepper).update(fixture.verificationToken).digest('hex')
      const prepared = await prisma.emailVerificationToken.updateMany({
        where: { user: { email: fixture.email }, verifiedAt: null },
        data: { token: tokenHash },
      })
      expect(prepared.count).toBe(1)

      await page.goto(`/verify-email?token=${fixture.verificationToken}`)
      await expect(page.getByRole('heading', { name: 'Email verified!' })).toBeVisible()
      await page.goto('/login')
      await page.getByLabel('Email address').fill(fixture.email)
      await page.getByLabel('Password', { exact: true }).fill(fixture.password)
      await page.getByRole('button', { name: 'Sign in to your account', exact: true }).click()
      await expect(page).toHaveURL(/\/dashboard(?:\/|$)/)
    })

    await test.step('audit authenticated setup and publish a presence', async () => {
      await page.goto('/dashboard/settings/hours')
      await expect(page.getByRole('heading', { name: 'Business Hours' })).toBeVisible()
      await page.getByRole('button', { name: 'All Days Open' }).click()
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await expect(page.getByText('Business hours saved successfully!')).toBeVisible()

      await page.goto('/dashboard/services/new')
      await expect(page.getByRole('heading', { name: 'Add New Service' })).toBeVisible()
      await audit(page, testInfo, 'dashboard-service-form')
      await page.getByLabel('Service Name').fill(fixture.serviceName)
      await page.getByLabel('Description').fill('A synthetic accessibility test service.')
      await page.getByLabel('Price (£)').fill('35')
      await page.getByLabel('Duration (minutes)').fill('30')
      await page.getByRole('button', { name: 'Create Service' }).click()
      await expect(page).toHaveURL(/\/dashboard\/services$/)

      await page.goto('/dashboard/presence/editor')
      await page.getByRole('button', { name: 'Publish', exact: true }).click()
      await expect(page.getByText('Page published successfully!')).toBeVisible()
    })

    const guestContext = await browser.newContext({ baseURL, reducedMotion: 'reduce' })
    const guest = await guestContext.newPage()

    await test.step('audit the published presence and booking steps', async () => {
      await guest.goto(`/${fixture.handle}`)
      await chooseEssentialCookies(guest)
      await expect(guest.getByText(fixture.businessName).first()).toBeVisible()
      await audit(guest, testInfo, 'published-presence')

      await guest.goto(`/${fixture.handle}/book`)
      const serviceButton = guest.getByRole('button', { name: new RegExp(fixture.serviceName) })
      await expect(guest.getByRole('heading', { name: /Select a (?:Service|Date)/ })).toBeVisible()
      if (await serviceButton.isVisible()) {
        await audit(guest, testInfo, 'booking-service')
        await serviceButton.click()
        await guest.getByRole('button', { name: 'Continue' }).click()
      }

      await expect(guest.getByRole('heading', { name: 'Select a Date' })).toBeVisible()
      await audit(guest, testInfo, 'booking-date')
      const availableDate = guest.locator('.grid.grid-cols-7.gap-1 button:not([disabled])').nth(1)
      await availableDate.click()

      await expect(guest.getByRole('heading', { name: 'Select a Time' })).toBeVisible()
      await audit(guest, testInfo, 'booking-time')
      await guest
        .getByRole('button', { name: /^\d{1,2}:\d{2} (?:AM|PM)$/, disabled: false })
        .first()
        .click()
      await guest.getByRole('button', { name: 'Continue' }).click()

      await expect(guest.getByLabel('Full Name')).toBeVisible()
      await audit(guest, testInfo, 'booking-customer-details')
    })

    await guestContext.close()
  })
})
