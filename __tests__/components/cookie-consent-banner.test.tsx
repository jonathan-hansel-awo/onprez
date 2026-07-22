import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/lib/test-utils'
import { CookieConsentBanner } from '@/components/privacy/cookie-consent-banner'
import {
  OPEN_COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  saveCookieConsent,
} from '@/lib/privacy/cookie-consent'

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('offers an equally available essential-only choice before optional analytics run', async () => {
    const user = userEvent.setup()
    render(<CookieConsentBanner />)

    expect(await screen.findByRole('region', { name: 'Cookie notice' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Essential only' }))

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument()
    )
    expect(readCookieConsent()?.analytics).toBe(false)
  })

  it('does not show the first-visit banner after a preference has been saved', async () => {
    saveCookieConsent(true)

    render(<CookieConsentBanner />)

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument()
    )
  })

  it('allows the footer to reopen and change an existing preference', async () => {
    const user = userEvent.setup()
    saveCookieConsent(true)
    render(<CookieConsentBanner />)

    window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))

    const analyticsCheckbox = await screen.findByRole('checkbox', {
      name: 'Allow optional analytics',
    })
    expect(analyticsCheckbox).toBeChecked()

    await user.click(analyticsCheckbox)
    await user.click(screen.getByRole('button', { name: 'Save choices' }))

    expect(readCookieConsent()?.analytics).toBe(false)
  })
})
