import type { SectionAppearance } from '@/types/page-sections'

export const SECTION_SPACING_CLASSES: Record<
  NonNullable<SectionAppearance['spacing']>,
  string
> = {
  compact: 'py-10 md:py-14',
  normal: 'py-16 md:py-24',
  spacious: 'py-24 md:py-32',
}

export const CONTENT_WIDTH_CLASSES: Record<
  NonNullable<SectionAppearance['contentWidth']>,
  string
> = {
  narrow: 'max-w-3xl',
  standard: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
}

export function getSectionSpacing(appearance?: SectionAppearance) {
  return SECTION_SPACING_CLASSES[appearance?.spacing || 'normal']
}

export function getContentWidth(appearance?: SectionAppearance) {
  return CONTENT_WIDTH_CLASSES[appearance?.contentWidth || 'standard']
}

export function getSectionStyle(
  appearance?: SectionAppearance,
  fallbackBackground?: string,
  fallbackText?: string
) {
  return {
    backgroundColor: appearance?.backgroundColor || fallbackBackground,
    color: appearance?.textColor || fallbackText,
  }
}

export function getAccentColor(appearance?: SectionAppearance) {
  return appearance?.accentColor || 'var(--theme-primary)'
}
