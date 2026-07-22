import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { CookieSettingsButton } from '@/components/privacy/cookie-settings-button'

export const metadata: Metadata = {
  title: 'Cookie Policy | OnPrez',
  description: 'How OnPrez uses cookies and similar browser storage, and how to manage choices.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="This policy explains the cookies and similar browser storage used by OnPrez, why they are used, and the choices available to you."
      lastUpdated="22 July 2026"
    >
      <section>
        <h2>1. What cookies and browser storage are</h2>
        <p>
          Cookies are small text files stored by a website in your browser. OnPrez also uses local
          storage and session storage, which keep small pieces of information on your device. The
          same privacy rules can apply to these technologies when they store or access information.
        </p>
      </section>

      <section>
        <h2>2. Essential storage</h2>
        <p>
          Essential storage is needed to provide a service you request, keep the platform secure, or
          remember a privacy choice. It is not used for advertising and cannot be disabled through
          our banner because parts of OnPrez would otherwise stop working.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Technology</th>
                <th>Purpose</th>
                <th>Typical duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>accessToken</code>
                </td>
                <td>Authenticates a signed-in account and protects private areas.</td>
                <td>Up to 24 hours, or up to 30 days when “remember me” is selected</td>
              </tr>
              <tr>
                <td>
                  <code>refreshToken</code>
                </td>
                <td>Securely renews an authenticated session.</td>
                <td>Up to 7 days, or up to 30 days when “remember me” is selected</td>
              </tr>
              <tr>
                <td>
                  <code>onprez:cookie-consent:v1</code>
                </td>
                <td>Stores your essential-only or optional-analytics choice in local storage.</td>
                <td>Until you clear browser data or the consent version changes</td>
              </tr>
              <tr>
                <td>Booking confirmation session storage</td>
                <td>
                  Temporarily carries the submitted email within the current tab so a new booking
                  can be displayed without putting the email in the URL.
                </td>
                <td>Until the browser tab or session is closed</td>
              </tr>
              <tr>
                <td>Signup progress session storage</td>
                <td>
                  Temporarily remembers non-password signup fields while the signup flow is in
                  progress.
                </td>
                <td>Until signup completes, the data is cleared, or the session ends</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Optional analytics</h2>
        <p>
          Optional analytics help us understand which pages are used and whether the service works
          well across devices. They remain disabled unless you actively accept them. When Google
          Analytics is configured, it may use cookies such as <code>_ga</code> and{' '}
          <code>_ga_*</code>. The exact duration is controlled by the analytics configuration and
          will not exceed the period stated by the provider without an updated notice.
        </p>
        <p>
          OnPrez does not currently use the cookie banner to obtain consent for personalised
          advertising. We will update this policy and request an appropriate choice before adding
          advertising or other materially different non-essential tracking.
        </p>
      </section>

      <section>
        <h2>4. Security and diagnostics</h2>
        <p>
          Hosting and error-monitoring providers may receive limited technical information such as
          IP address, browser details, request timing, and error diagnostics to deliver and secure
          the service. Where this activity is strictly necessary for security or service operation,
          it is not treated as optional audience analytics. We configure providers to minimise data
          and avoid collecting form content where practical.
        </p>
      </section>

      <section>
        <h2>5. Managing your choices</h2>
        <p>
          You can accept optional analytics, use essential storage only, or change your choice
          later. Withdrawing optional analytics is as easy as accepting it. When you switch
          analytics off, OnPrez attempts to remove common analytics cookies set for the current
          site.
        </p>
        <CookieSettingsButton className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-onprez-blue to-onprez-purple px-5 py-3 font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2" />
        <p>
          You can also delete or block cookies through your browser settings. Blocking essential
          cookies may prevent sign-in and other requested features from working. Browser controls
          vary, so consult your browser&apos;s help documentation.
        </p>
      </section>

      <section>
        <h2>6. Changes and contact</h2>
        <p>
          We may update this policy when technologies or legal requirements change. Questions can be
          sent to <a href="mailto:privacy@onprez.com">privacy@onprez.com</a>.
        </p>
      </section>
    </LegalPage>
  )
}
