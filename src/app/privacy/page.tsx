import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | OnPrez',
  description: 'How OnPrez collects, uses, shares, and protects personal information.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This notice explains how OnPrez handles information about professionals, their teams, customers, and visitors."
      lastUpdated="22 July 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          OnPrez provides online presence pages, business management tools, and appointment booking
          services for service professionals. OnPrez is operated from the United Kingdom. You can
          contact us about privacy at <a href="mailto:privacy@onprez.com">privacy@onprez.com</a>.
        </p>
        <p>
          OnPrez is responsible for personal information used to operate accounts, secure the
          platform, deliver platform communications, and improve the service. A professional or
          business using OnPrez may separately be responsible for how it uses its own customer,
          inquiry, and appointment records. Customers should also review the relevant
          professional&apos;s privacy information where available.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Account and security information:</strong> email address, password hash,
            verification status, multi-factor authentication records, login history, session and
            trusted-device details, IP address, browser, and device information.
          </li>
          <li>
            <strong>Business and profile information:</strong> business name, handle, category,
            biography, contact details, location, opening hours, services, prices, branding, social
            links, images, page content, FAQs, and team membership.
          </li>
          <li>
            <strong>Customer and booking information:</strong> name, email, phone number, booking
            time, selected service, notes, preferences, status history, payment status, and booking
            source. Professionals may add further customer records where needed for their service.
          </li>
          <li>
            <strong>Inquiries, reviews, and communications:</strong> messages, replies, ratings,
            support requests, and transactional email records.
          </li>
          <li>
            <strong>Technical and usage information:</strong> requested pages, timestamps,
            referrers, diagnostic events, performance data, and optional analytics where consent is
            required and has been given.
          </li>
        </ul>
        <p>
          We usually receive information directly from you, from a professional when they manage
          their customer records, automatically from your browser or device, and from service
          providers that support delivery, security, and communications.
        </p>
      </section>

      <section>
        <h2>3. Why we use information</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Typical lawful basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Provide accounts, presence pages, bookings, inquiries, and requested features
                </td>
                <td>Contract, or steps requested before entering a contract</td>
              </tr>
              <tr>
                <td>
                  Authenticate users, prevent abuse, investigate incidents, and protect OnPrez
                </td>
                <td>Legitimate interests and legal obligations</td>
              </tr>
              <tr>
                <td>Send verification, password reset, booking, security, and service messages</td>
                <td>Contract and legitimate interests</td>
              </tr>
              <tr>
                <td>Maintain, troubleshoot, and improve reliability and accessibility</td>
                <td>Legitimate interests</td>
              </tr>
              <tr>
                <td>Run optional audience analytics or marketing communications</td>
                <td>Consent where required</td>
              </tr>
              <tr>
                <td>Comply with law, enforce terms, and establish or defend legal claims</td>
                <td>Legal obligations and legitimate interests</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Where we rely on legitimate interests, those interests include operating a secure and
          useful platform, preventing fraud, supporting users, and understanding service performance
          without overriding your rights and freedoms.
        </p>
      </section>

      <section>
        <h2>4. Who receives information</h2>
        <p>We may share information only as reasonably necessary with:</p>
        <ul>
          <li>
            the relevant professional, business owner, and authorised team members when a customer
            books, sends an inquiry, or otherwise interacts with that business;
          </li>
          <li>
            infrastructure and database providers, including Vercel and Neon, where used to host and
            operate OnPrez;
          </li>
          <li>
            communications providers such as Resend, media providers such as Cloudinary, and error
            monitoring providers such as Sentry, where those services are enabled;
          </li>
          <li>professional advisers, regulators, courts, and law-enforcement authorities;</li>
          <li>
            a buyer, investor, or successor if OnPrez is reorganised, financed, sold, or
            transferred, subject to appropriate confidentiality and data-protection safeguards.
          </li>
        </ul>
        <p>We do not sell personal information to advertisers.</p>
      </section>

      <section>
        <h2>5. International transfers</h2>
        <p>
          Some suppliers may process information outside the United Kingdom. Where required, we use
          recognised safeguards such as UK adequacy regulations, the UK International Data Transfer
          Agreement, or the UK Addendum to approved standard contractual clauses, together with
          appropriate security assessments.
        </p>
      </section>

      <section>
        <h2>6. How long we keep information</h2>
        <p>
          We keep information only for as long as it is reasonably needed for the purposes described
          above, including service delivery, security, dispute resolution, and legal obligations.
          The period depends on the record and its context.
        </p>
        <ul>
          <li>Account information is normally kept while the account remains active.</li>
          <li>
            Profile content and media may be retained for up to 90 days after account cancellation
            to support recovery and orderly deletion.
          </li>
          <li>
            Appointment and associated customer records may be retained for up to two years after
            the relevant interaction, unless the professional needs a different lawful period.
          </li>
          <li>
            Routine security and diagnostic logs are generally kept for up to 30 days, but relevant
            records may be preserved longer for an active investigation or legal claim.
          </li>
          <li>Optional analytics records are generally kept for no longer than 12 months.</li>
          <li>
            Backups and provider logs may remain for a limited additional period before being
            overwritten or securely deleted.
          </li>
        </ul>
        <p>
          A professional may need to retain customer records for its own legal, regulatory,
          insurance, or accounting obligations. Requests concerning those business-controlled
          records may need to be directed to that professional.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We use safeguards designed to protect information, including access controls, encrypted
          connections, password hashing, secure authentication cookies, rate limiting, monitoring,
          and restricted administrative access. No internet service can guarantee absolute security,
          so please use a unique password and protect your account credentials.
        </p>
      </section>

      <section id="your-rights" className="scroll-mt-28">
        <h2>8. Your privacy rights</h2>
        <p>
          Depending on the circumstances, you may have rights to access, correct, erase, restrict,
          or receive a copy of your information, and to object to certain processing. Where we rely
          on consent, you may withdraw it at any time without affecting earlier lawful processing.
        </p>
        <p>
          To exercise a right, request account export or deletion, or ask a privacy question, email{' '}
          <a href="mailto:privacy@onprez.com">privacy@onprez.com</a>. We may need to verify your
          identity. If the request concerns records controlled by a professional, we may direct the
          request to that professional or assist them in responding.
        </p>
        <aside>
          <strong>Your right to object:</strong> You may object to processing based on legitimate
          interests. You may always object to direct marketing, and we will stop using your
          information for that purpose.
        </aside>
      </section>

      <section>
        <h2>9. Complaints</h2>
        <p>
          Please contact us first so we can try to resolve your concern. You may also complain to
          the UK Information Commissioner&apos;s Office. Information about making a complaint is
          available at{' '}
          <a href="https://ico.org.uk/make-a-complaint/" rel="noreferrer" target="_blank">
            ico.org.uk
          </a>
          .
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          OnPrez accounts are intended for people aged 18 or over. A professional must not use the
          platform to collect children&apos;s information unless they have a lawful basis,
          appropriate notices, and any required parent or guardian involvement.
        </p>
      </section>

      <section>
        <h2>11. Cookies and similar storage</h2>
        <p>
          We use essential cookies and browser storage and, only with permission where required,
          optional analytics. Read our <Link href="/cookies">Cookie Policy</Link> or reopen Cookie
          settings from the footer.
        </p>
      </section>

      <section>
        <h2>12. Changes to this notice</h2>
        <p>
          We may update this notice as OnPrez develops or legal requirements change. We will publish
          the revised version here, update the date above, and provide a more prominent notice when
          a change materially affects how information is used.
        </p>
      </section>
    </LegalPage>
  )
}
