import { useId, type SVGProps } from 'react'

type OnPrezMarkVariant = 'gradient' | 'currentColor' | 'white' | 'ink'

interface OnPrezMarkProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  variant?: OnPrezMarkVariant
  title?: string
}

export function OnPrezMark({
  className = 'h-5 w-5',
  variant = 'gradient',
  title,
  ...props
}: OnPrezMarkProps) {
  const gradientId = useId().replace(/:/g, '')
  const paint =
    variant === 'gradient'
      ? `url(#${gradientId})`
      : variant === 'white'
        ? '#FFFFFF'
        : variant === 'ink'
          ? '#172033'
          : 'currentColor'

  return (
    <svg
      {...props}
      viewBox="0 0 44 44"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="4" y1="5" x2="40" y2="39">
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
    </svg>
  )
}
