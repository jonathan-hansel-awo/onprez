import { PageContent, PageSection } from './page-sections'

export interface PresenceTemplate {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'minimal' | 'creative' | 'professional'
  thumbnail: string
  content: PageContent
  isDefault?: boolean
}

export const TEMPLATE_CATEGORIES = {
  modern: 'Modern',
  classic: 'Classic',
  minimal: 'Minimal',
  creative: 'Creative',
  professional: 'Professional',
} as const
