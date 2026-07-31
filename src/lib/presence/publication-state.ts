export type PresencePublicationKind =
  | 'draft'
  | 'published'
  | 'published-with-changes'
  | 'published-without-snapshot'

export interface PresencePublicationStateInput {
  isPublished: boolean
  draftContent: unknown
  publishedContent: unknown | null
  publishedAt: string | Date | null
}

export interface PresencePublicationState {
  kind: PresencePublicationKind
  label: string
  shortDescription: string
  customerViewDescription: string
  hasUnpublishedChanges: boolean
  publishedAt: string | null
}

function normaliseJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normaliseJson)

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normaliseJson((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  return value
}

export function presenceContentsMatch(draftContent: unknown, publishedContent: unknown): boolean {
  return JSON.stringify(normaliseJson(draftContent)) === JSON.stringify(normaliseJson(publishedContent))
}

function toIsoString(value: string | Date | null): string | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function getPresencePublicationState({
  isPublished,
  draftContent,
  publishedContent,
  publishedAt,
}: PresencePublicationStateInput): PresencePublicationState {
  const publishedAtIso = toIsoString(publishedAt)

  if (!isPublished) {
    return {
      kind: 'draft',
      label: 'Draft — not live',
      shortDescription: 'Your current page is saved privately and is not visible to customers.',
      customerViewDescription: publishedAtIso
        ? 'Customers cannot access the page. The last published version remains stored for reference.'
        : 'Customers cannot access the page because it has never been published.',
      hasUnpublishedChanges: false,
      publishedAt: publishedAtIso,
    }
  }

  if (publishedContent === null || publishedContent === undefined) {
    return {
      kind: 'published-without-snapshot',
      label: 'Live — republish recommended',
      shortDescription: 'This page is live but does not yet have a protected published snapshot.',
      customerViewDescription:
        'Customers currently see the saved page content. Republish once to establish a separate live snapshot.',
      hasUnpublishedChanges: false,
      publishedAt: publishedAtIso,
    }
  }

  const hasUnpublishedChanges = !presenceContentsMatch(draftContent, publishedContent)

  if (hasUnpublishedChanges) {
    return {
      kind: 'published-with-changes',
      label: 'Live with unpublished changes',
      shortDescription: 'Your draft has saved changes that are not on the live page yet.',
      customerViewDescription:
        'The editor shows your current draft. Customers still see the last published snapshot until you publish again.',
      hasUnpublishedChanges: true,
      publishedAt: publishedAtIso,
    }
  }

  return {
    kind: 'published',
    label: 'Live — up to date',
    shortDescription: 'Your saved draft matches the version customers can currently see.',
    customerViewDescription: 'The editor and the public page are showing the same published content.',
    hasUnpublishedChanges: false,
    publishedAt: publishedAtIso,
  }
}

export function formatPublishedAt(value: string | Date | null): string | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
