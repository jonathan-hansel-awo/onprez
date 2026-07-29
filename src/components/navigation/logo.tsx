import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'

type LogoVariant = 'gradient' | 'white' | 'ink'

interface LogoProps {
  href?: string
  className?: string
  variant?: LogoVariant
}

interface LogoSVGProps {
  className?: string
  variant?: LogoVariant
  title?: string
}

export function Logo({ href = '/', className = 'h-8 w-auto', variant = 'gradient' }: LogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-sm transition-transform duration-200 hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
      aria-label="OnPrez home"
    >
      {variant === 'gradient' ? (
        <Image
          src="/onprez-wordmark.png"
          width={616}
          height={176}
          className={className}
          alt=""
          draggable={false}
        />
      ) : (
        <LogoSVG className={className} variant={variant} />
      )}
    </Link>
  )
}

export function LogoSVG({ className = 'h-8 w-auto', variant = 'gradient', title }: LogoSVGProps) {
  const gradientId = useId().replace(/:/g, '')
  const paint =
    variant === 'gradient' ? `url(#${gradientId})` : variant === 'white' ? '#FFFFFF' : '#172033'

  return (
    <svg
      viewBox="0 0 154 44"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="5" y1="7" x2="149" y2="37">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <path
        d="M29.8 8.6A15.5 15.5 0 1 0 35.4 14.3"
        fill="none"
        stroke={paint}
        strokeWidth="5.8"
        strokeLinecap="round"
      />
      <text
        x="43"
        y="31.5"
        fill={paint}
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="27"
        fontWeight="750"
        letterSpacing="-1.25"
      >
        nPrez
      </text>
    </svg>
  )
}
