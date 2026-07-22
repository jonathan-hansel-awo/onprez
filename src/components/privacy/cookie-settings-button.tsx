'use client'

import type { ButtonHTMLAttributes } from 'react'
import { openCookiePreferences } from '@/lib/privacy/cookie-consent'

type CookieSettingsButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'>

export function CookieSettingsButton({
  children = 'Open cookie settings',
  ...props
}: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={openCookiePreferences} {...props}>
      {children}
    </button>
  )
}
