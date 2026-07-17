'use client'

import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'

interface LuxuryWellnessPreviewProps {
  template: TemplateCatalogueItem
  businessName: string
  businessNameInput: string
  setBusinessNameInput: Dispatch<SetStateAction<string>>
  signupHref: string
}

function placeholderImage(label: string, toneA: string, toneB: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${toneA}"/><stop offset="1" stop-color="${toneB}"/></linearGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .08"/></feComponentTransfer></filter></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="920" cy="280" r="260" fill="white" fill-opacity=".12"/><circle cx="260" cy="1180" r="360" fill="white" fill-opacity=".08"/><rect width="100%" height="100%" filter="url(#grain)" opacity=".55"/><text x="72" y="1400" fill="white" fill-opacity=".8" font-family="Georgia,serif" font-size="34" letter-spacing="5">${label}</text></svg>`
  )}`
}

const heroImage = placeholderImage('SPA INTERIOR PLACEHOLDER', '#63584d', '#b5a18c')
const ritualImage = placeholderImage('TREATMENT PLACEHOLDER', '#8f7966', '#d2c3b3')
const portraitImage = placeholderImage('PRACTITIONER PLACEHOLDER', '#53483f', '#aa9682')
const detailImage = placeholderImage('DETAIL PLACEHOLDER', '#75695f', '#cab8a6')

export function LuxuryWellnessPreview({
  template,
  businessName,
  businessNameInput,
  setBusinessNameInput,
  signupHref,
}: LuxuryWellnessPreviewProps) {
  return (
    <main className="min-h-screen bg-[#f3eee7] text-[#29241f]">
      <div className="sticky top-0 z-[70] border-b border-[#2f2923]/10 bg-[#f8f4ee]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d61]">
              Temporary flagship preview · not claimed or published
            </p>
            <p className="truncate font-serif text-lg text-[#2d2823]">{template.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="hidden border-b border-[#40372f] pb-1 text-sm font-medium sm:inline-flex"
            >
              All templates
            </Link>
            <Link
              href={signupHref}
              className="rounded-full bg-[#2f2923] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Use this design
            </Link>
          </div>
        </div>
      </div>

      <section className="border-b border-[#2f2923]/10 bg-[#ede5db] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75675b]">
              Personalise the preview
            </p>
            <p className="mt-1 max-w-xl text-sm text-[#6a5d52]">
              This browser-only preview does not reserve the name or publish a page.
            </p>
          </div>
          <input
            id="preview-business-name"
            type="text"
            value={businessNameInput}
            maxLength={80}
            onChange={event => setBusinessNameInput(event.target.value)}
            className="min-h-12 w-full rounded-full border border-[#7d6e60]/30 bg-[#f8f4ee] px-5 text-[#29241f] outline-none ring-offset-2 focus:ring-2 focus:ring-[#51453b] md:max-w-md"
            placeholder="Enter your business name"
            autoComplete="organization"
          />
        </div>
      </section>

      <section className="relative mx-auto grid min-h-[760px] max-w-[1600px] overflow-hidden bg-[#302a25] lg:grid-cols-[0.9fr_1.4fr]">
        <div className="relative z-10 flex flex-col justify-between px-6 py-12 text-[#f7f1ea] sm:px-12 lg:px-16 lg:py-16">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d9cabc]">
            <span>Private wellness studio</span>
            <span>By appointment</span>
          </div>
          <div className="max-w-xl py-20 lg:py-10">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#d6c3b2]">
              Restore · Rebalance · Renew
            </p>
            <h1 className="font-serif text-6xl leading-[0.95] sm:text-7xl lg:text-[7rem]">
              {businessName}
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#e2d7cd] sm:text-xl">
              A quiet destination for restorative rituals, considered care, and unhurried moments.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href={signupHref}
                className="rounded-full bg-[#f0e5da] px-6 py-3 text-sm font-semibold text-[#302a25]"
              >
                Book a treatment
              </Link>
              <a href="#treatments" className="border-b border-[#e5d8cb] pb-1 text-sm font-medium">
                Explore treatments
              </a>
            </div>
          </div>
          <p className="max-w-sm text-xs uppercase tracking-[0.2em] text-[#bfae9f]">
            Personalised treatments · Calm surroundings · Thoughtful aftercare
          </p>
        </div>
        <div className="relative min-h-[520px] lg:min-h-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${heroImage}")` }}
            role="img"
            aria-label="Placeholder for a luxurious spa interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#302a25]/55 via-transparent to-transparent lg:bg-gradient-to-r" />
          <div className="absolute bottom-8 right-8 rounded-full border border-white/30 bg-black/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-white backdrop-blur">
            Replace with signature interior photography
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#806f61]">
              The philosophy
            </p>
            <h2 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.03] sm:text-6xl md:text-7xl">
              Care that feels deeply personal, never hurried.
            </h2>
          </div>
          <div className="border-l border-[#5d5147]/20 pl-6 lg:pl-10">
            <p className="text-lg leading-8 text-[#62574e]">
              Every appointment begins with a thoughtful consultation and ends with practical
              aftercare. The experience is designed around how you feel, not simply the treatment
              you select.
            </p>
            <p className="mt-6 font-serif text-2xl italic text-[#40372f]">
              “A softer pace. A more considered kind of care.”
            </p>
          </div>
        </div>
      </section>

      <section id="treatments" className="bg-[#ded2c5] px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#746456]">
                Curated treatment menu
              </p>
              <h2 className="mt-5 font-serif text-5xl sm:text-6xl">Choose your ritual.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#62564c]">
              Demonstration services and prices are placeholders. Replace them with your real
              treatment menu before publishing.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="group relative min-h-[620px] overflow-hidden bg-[#51463d] text-white">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]"
                style={{ backgroundImage: `url("${ritualImage}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-xs uppercase tracking-[0.24em] text-white/75">Signature ritual</p>
                <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <h3 className="font-serif text-4xl sm:text-5xl">Deep Rest Ceremony</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
                      A slow, full-body restorative treatment with warm compresses and personalised
                      pressure.
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-serif text-3xl">£95</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">90 minutes</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-6">
              {[
                ['Quiet Reset', '45 minutes', '£58', 'Focused care for shoulders, neck, and scalp.'],
                ['Radiance Ritual', '60 minutes', '£72', 'A restorative facial and sculpting massage.'],
              ].map(([name, duration, price, description]) => (
                <article
                  key={name}
                  className="flex min-h-[295px] flex-col justify-between border border-[#4f443b]/15 bg-[#f4eee7] p-7 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#7a6c61]">Treatment</p>
                    <p className="font-serif text-2xl">{price}</p>
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl">{name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#685b50]">{description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#4f443b]/15 pt-4 text-xs uppercase tracking-[0.18em] text-[#74665a]">
                      <span>{duration}</span>
                      <Link href={signupHref}>Book</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-3">
          {[
            ['01', 'Consultation', 'We begin with how you feel, what you need, and what comfort means to you.'],
            ['02', 'Personal ritual', 'Your treatment is adapted in the room rather than delivered from a rigid script.'],
            ['03', 'Rest and aftercare', 'You leave with space to settle and thoughtful guidance for the days ahead.'],
          ].map(([number, title, description]) => (
            <article key={number} className="border-t border-[#4e433a]/25 pt-6">
              <p className="font-serif text-5xl text-[#9d8977]">{number}</p>
              <h3 className="mt-10 font-serif text-3xl">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#66594f]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#312b26] px-5 py-24 text-[#f4ece4] sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative min-h-[620px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${portraitImage}")` }}
              role="img"
              aria-label="Placeholder portrait for the practitioner"
            />
            <div className="absolute bottom-6 left-6 bg-[#eee4d9] px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-[#3c342e]">
              Replace with practitioner portrait
            </div>
          </div>
          <div className="lg:pl-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c9b6a5]">
              Meet your practitioner
            </p>
            <h2 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">
              Skilled hands. Calm presence. Considered care.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#d8cbc0]">
              Add your real biography, qualifications, treatment philosophy, and specialist areas
              here. This section is designed to establish trust without relying on fabricated
              ratings or inflated claims.
            </p>
            <div className="mt-10 grid gap-5 border-t border-white/15 pt-8 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#ad9b8d]">Specialism</p>
                <p className="mt-2 font-serif text-2xl">Restorative bodywork</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#ad9b8d]">Approach</p>
                <p className="mt-2 font-serif text-2xl">Personal and unhurried</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-h-[720px] lg:grid-cols-2">
        <div
          className="min-h-[520px] bg-cover bg-center"
          style={{ backgroundImage: `url("${detailImage}")` }}
          role="img"
          aria-label="Placeholder for spa detail photography"
        />
        <div className="flex items-center bg-[#ece3d9] px-7 py-20 sm:px-14 lg:px-20">
          <blockquote className="max-w-2xl">
            <p className="font-serif text-5xl leading-[1.08] sm:text-6xl">
              “The kind of experience that makes the rest of the day feel different.”
            </p>
            <footer className="mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-[#74675d]">
              Demonstration testimonial · replace with verified customer feedback
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-[#4d4239]/20 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#796b60]">
              Visit the studio
            </p>
            <h2 className="mt-6 font-serif text-5xl">Everything you need before arriving.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#66594f]">
              Replace this demonstration location with your real address, accessibility details,
              parking guidance, and arrival instructions.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#827367]">Opening hours</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-5"><dt>Monday–Thursday</dt><dd>9:00–19:00</dd></div>
                <div className="flex justify-between gap-5"><dt>Friday</dt><dd>9:00–17:00</dd></div>
                <div className="flex justify-between gap-5"><dt>Weekend</dt><dd>By appointment</dd></div>
              </dl>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#827367]">Before your visit</p>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                <li>Please arrive ten minutes early.</li>
                <li>Share any allergies or sensitivities.</li>
                <li>Wear comfortable clothing.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#27221e] px-5 py-28 text-center text-white sm:px-8 md:py-40">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("${heroImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-[#27221e]/75" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d8c6b5]">
            Begin your quieter chapter
          </p>
          <h2 className="mt-7 font-serif text-6xl leading-tight sm:text-7xl">
            Make space for how you want to feel.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#ded3ca]">
            Continue to signup to claim your business handle and turn this temporary composition into
            an editable, unpublished OnPrez page.
          </p>
          <Link
            href={signupHref}
            className="mt-10 inline-flex rounded-full bg-[#efe4d9] px-7 py-3.5 text-sm font-semibold text-[#302a25]"
          >
            Continue with this design
          </Link>
        </div>
      </section>

      <footer className="bg-[#1f1b18] px-5 pb-28 pt-8 text-center text-xs leading-6 text-[#bcaea2] md:pb-8">
        All business details, treatments, prices, testimonials, locations, and imagery shown here are
        fictional placeholders. The entered name is temporary and does not establish ownership.
      </footer>

      <div className="fixed inset-x-4 bottom-4 z-[80] flex items-center justify-between gap-4 rounded-full border border-white/15 bg-[#29231f]/95 p-2 pl-5 text-white shadow-2xl backdrop-blur md:hidden">
        <span className="truncate text-sm font-medium">Start building {businessName}</span>
        <Link href={signupHref} className="shrink-0 rounded-full bg-[#efe4d9] px-4 py-2 text-sm font-semibold text-[#29231f]">
          Continue
        </Link>
      </div>
    </main>
  )
}
