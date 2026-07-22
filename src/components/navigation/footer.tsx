import Link from 'next/link'
import { Heart, ShieldCheck } from 'lucide-react'
import { footerLinks, socialLinks } from '@/data/footer'
import { CookieSettingsButton } from '@/components/privacy/cookie-settings-button'

function FooterLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith('mailto:')) {
    return (
      <a className="text-gray-600 transition-colors hover:text-onprez-blue" href={href}>
        {label}
      </a>
    )
  }

  return (
    <Link className="text-gray-600 transition-colors hover:text-onprez-blue" href={href}>
      {label}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="relative border-t border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 pb-8 pt-14">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <h2 className="mb-4 bg-gradient-to-r from-onprez-blue to-onprez-purple bg-clip-text text-3xl font-bold text-transparent">
              OnPrez
            </h2>
            <p className="max-w-md leading-relaxed text-gray-600">
              Your handle, your brand, and your bookings in one place—built for independent service
              professionals.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm transition-all hover:-translate-y-1 ${social.hoverColor}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-gray-900">Product</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-gray-900">Company</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-gray-900">Privacy</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-onprez-blue" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-gray-900">Built for trust</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Clear privacy choices, secure account cookies, and visible legal information.
            </p>
            <a
              href="mailto:privacy@onprez.com"
              className="mt-3 inline-block text-sm font-semibold text-onprez-blue hover:underline"
            >
              Privacy contact
            </a>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-5 pt-8 md:flex-row">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} OnPrez. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm">
            {footerLinks.legal.map(link => (
              <FooterLink key={link.label} {...link} />
            ))}
            <CookieSettingsButton className="text-gray-600 transition-colors hover:text-onprez-blue">
              Cookie settings
            </CookieSettingsButton>
          </div>

          <p className="flex items-center gap-2 text-sm text-gray-500">
            Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-label="care" /> for
            service professionals
          </p>
        </div>
      </div>
    </footer>
  )
}
