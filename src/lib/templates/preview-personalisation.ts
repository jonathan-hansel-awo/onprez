const MAX_PREVIEW_BUSINESS_NAME_LENGTH = 80

export function normalisePreviewBusinessName(value: string | null | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ').slice(0, MAX_PREVIEW_BUSINESS_NAME_LENGTH)
}

export function buildTemplateSignupHref(templateSlug: string, businessName?: string): string {
  const params = new URLSearchParams({ template: templateSlug })
  const normalisedName = normalisePreviewBusinessName(businessName)

  if (normalisedName) {
    params.set('businessName', normalisedName)
  }

  return `/api/templates/select?${params.toString()}`
}
