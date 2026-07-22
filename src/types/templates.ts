import type { PageContent } from './page-sections'

export type PresenceTemplateCategory =
  | 'wellness'
  | 'beauty'
  | 'fitness'
  | 'professional'
  | 'creative'
  | 'education'

export interface PresenceTemplate {
  id: string
  name: string
  description: string
  category: PresenceTemplateCategory
  thumbnail: string
  previewHref?: string
  content: PageContent
  isDefault?: boolean
}

export const TEMPLATE_CATEGORIES: Record<PresenceTemplateCategory, string> = {
  wellness: 'Wellness',
  beauty: 'Beauty',
  fitness: 'Fitness',
  professional: 'Professional',
  creative: 'Creative',
  education: 'Education',
}
