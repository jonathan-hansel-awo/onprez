import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | OnPrez',
  description: 'The terms that apply when professionals, customers, and visitors use OnPrez.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These terms govern access to OnPrez and explain the responsibilities of OnPrez, professionals, customers, and visitors."
      lastUpdated="22 July 2026"
    >
      <section>
        <h2>1. Agreement</h2>
        <p>
          By creating an account, publishing a presence page, making a booking, or otherwise using
          OnPrez, you agree to these terms. If you use OnPrez for a business or organisation, you
          confirm that you have authority to accept these terms for it.
        </p>
        <p>
          You must be at least 18 years old and legally able to enter into a contract to create an
          OnPrez professional account.
        </p>
      </section>

      <section>
        <h2>2. What OnPrez provides</h2>
        <p>
          OnPrez provides tools for service professionals to create online presence pages, describe
          services, manage customers and appointments, receive inquiries, and enable online booking.
          Features may be introduced, changed, limited, or withdrawn as the platform develops.
        </p>
        <p>
          OnPrez is the platform provider. Unless we expressly say otherwise, OnPrez does not
          provide, supervise, recommend, or guarantee the professional services advertised by a
          business. A booking or service contract is between the customer and the relevant
          professional or business.
        </p>
      </section>

      <section>
        <h2>3. Accounts and security</h2>
        <ul>
          <li>Provide accurate information and keep it reasonably up to date.</li>
          <li>Protect passwords, multi-factor codes, and access to trusted devices.</li>
          <li>Do not share an account except through authorised team features.</li>
          <li>
            Tell us promptly at <a href="mailto:security@onprez.com">security@onprez.com</a> if you
            suspect unauthorised use.
          </li>
          <li>
            You are responsible for activity carried out through your account unless caused by our
            failure to use reasonable care.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Professional responsibilities</h2>
        <p>A professional or business using OnPrez is responsible for:</p>
        <ul>
          <li>
            the accuracy of its identity, services, prices, availability, qualifications, and
            content;
          </li>
          <li>
            holding licences, insurance, permissions, and registrations required for its services;
          </li>
          <li>
            setting and honouring booking, cancellation, refund, deposit, and customer-service
            policies;
          </li>
          <li>
            complying with consumer, tax, employment, equality, health and safety, and
            sector-specific laws;
          </li>
          <li>
            using customer information lawfully and providing any additional privacy information
            required for its own processing;
          </li>
          <li>
            ensuring that notes or custom fields do not contain unnecessary, unlawful, or
            excessively sensitive information.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Bookings and customer relationships</h2>
        <p>
          OnPrez transmits booking requests and status information using details supplied by the
          professional and customer. A confirmation displayed or emailed by OnPrez records the
          platform status; it does not guarantee the quality, legality, availability, or outcome of
          the underlying service.
        </p>
        <p>
          Customers must provide accurate contact and booking information, attend appointments on
          time, and follow the professional&apos;s disclosed policies. Questions, changes, refunds,
          and disputes about a professional service should normally be addressed to that
          professional.
        </p>
      </section>

      <section>
        <h2>6. Content and permissions</h2>
        <p>
          You retain ownership of content you upload or publish. You grant OnPrez a worldwide,
          non-exclusive, royalty-free licence to host, copy, resize, display, and transmit that
          content only as needed to operate, secure, promote, and improve the service. This licence
          ends when the content is deleted, subject to reasonable backup and legal retention.
        </p>
        <p>
          You confirm that you have the rights and permissions required for uploaded text, images,
          logos, testimonials, reviews, and other materials, including permission from identifiable
          people where required.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use</h2>
        <p>You must not use OnPrez to:</p>
        <ul>
          <li>
            break the law, facilitate harm, fraud, exploitation, or deceptive business practices;
          </li>
          <li>
            publish unlawful, infringing, hateful, harassing, sexually exploitative, or malicious
            content;
          </li>
          <li>
            impersonate another person or misrepresent qualifications, reviews, availability, or
            pricing;
          </li>
          <li>send spam or contact people without an appropriate legal basis;</li>
          <li>
            probe, bypass, overload, scrape, reverse engineer, or interfere with platform security
            or operation;
          </li>
          <li>
            upload malware, disguised files, or content that creates an unreasonable technical or
            security risk;
          </li>
          <li>
            access another user&apos;s account, customer data, or non-public information without
            permission.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Fees and paid features</h2>
        <p>
          Some features may be free, in beta, or subject to usage limits. Before charging for a paid
          plan or feature, we will show the price, billing period, included features, and applicable
          cancellation terms. Unless stated otherwise, professionals remain responsible for taxes
          arising from their own services and earnings.
        </p>
      </section>

      <section>
        <h2>9. Third-party services</h2>
        <p>
          OnPrez may rely on or link to hosting, database, email, media, monitoring, payment,
          mapping, calendar, or social-media services. Their separate terms and privacy notices may
          apply. We are not responsible for third-party products or websites outside our reasonable
          control.
        </p>
      </section>

      <section>
        <h2>10. Availability and changes</h2>
        <p>
          We aim to keep OnPrez available and reliable, but uninterrupted or error-free service is
          not guaranteed. We may perform maintenance, respond to security incidents, impose fair-use
          limits, or change features. We will take reasonable steps to communicate material changes
          that adversely affect active users.
        </p>
      </section>

      <section>
        <h2>11. Suspension and termination</h2>
        <p>
          You may stop using OnPrez at any time and may request account deletion. We may restrict,
          suspend, or terminate access where reasonably necessary to address a serious or repeated
          breach, security threat, unlawful activity, non-payment, or risk to users or the platform.
          Where appropriate, we will give notice and an opportunity to remedy the issue.
        </p>
        <p>
          Provisions that by their nature should continue after termination, including ownership,
          accrued payment obligations, liability limits, and dispute provisions, will continue.
        </p>
      </section>

      <section>
        <h2>12. Intellectual property</h2>
        <p>
          OnPrez and its software, design, branding, and documentation are protected by intellectual
          property laws. Except for the limited right to use the service under these terms, no
          rights are transferred to you. Feedback may be used to improve OnPrez without payment or
          restriction, but we will not identify you publicly without permission.
        </p>
      </section>

      <section>
        <h2>13. Responsibility and liability</h2>
        <p>
          Nothing in these terms excludes or limits liability where doing so would be unlawful,
          including liability for death or personal injury caused by negligence, fraud, or
          fraudulent misrepresentation. Your mandatory consumer rights are not affected.
        </p>
        <p>
          Subject to that, OnPrez is not responsible for losses caused by a professional&apos;s
          service, customer conduct, inaccurate user content, or events outside our reasonable
          control. For business users, OnPrez is not liable for indirect or consequential loss, lost
          profit, lost opportunity, or loss of goodwill. Any other aggregate liability arising from
          the service will not exceed the amount paid by the affected user to OnPrez in the 12
          months before the event giving rise to the claim, or £100 if no amount was paid.
        </p>
      </section>

      <section>
        <h2>14. Privacy</h2>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> explains how OnPrez handles personal
          information. Our <Link href="/cookies">Cookie Policy</Link> explains cookies and browser
          storage. Professionals must also meet their own data-protection responsibilities for
          customer information they control.
        </p>
      </section>

      <section>
        <h2>15. Changes to these terms</h2>
        <p>
          We may update these terms to reflect service, security, legal, or commercial changes. We
          will publish the updated terms and date above. We will provide reasonable advance notice
          of material changes where practicable. Continued use after the effective date means the
          updated terms apply.
        </p>
      </section>

      <section>
        <h2>16. Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of England and Wales. Courts in England and Wales
          have jurisdiction, except that a consumer living elsewhere in the United Kingdom may bring
          proceedings in the courts of the part of the UK where they live and retains any mandatory
          protections provided by local law.
        </p>
        <p>
          Before starting formal proceedings, please contact{' '}
          <a href="mailto:support@onprez.com">support@onprez.com</a> so we can try to resolve the
          matter.
        </p>
      </section>
    </LegalPage>
  )
}
