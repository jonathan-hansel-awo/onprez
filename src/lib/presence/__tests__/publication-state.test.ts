import {
  formatPublishedAt,
  getPresencePublicationState,
  presenceContentsMatch,
} from '@/lib/presence/publication-state'

describe('presence publication state', () => {
  const publishedAt = '2026-07-31T12:00:00.000Z'

  it('identifies a private draft that has never been published', () => {
    const state = getPresencePublicationState({
      isPublished: false,
      draftContent: [{ id: 'hero' }],
      publishedContent: null,
      publishedAt: null,
    })

    expect(state.kind).toBe('draft')
    expect(state.label).toBe('Draft — not live')
    expect(state.publishedAt).toBeNull()
  })

  it('identifies a live page whose draft matches the published snapshot', () => {
    const content = [{ id: 'hero', content: { title: 'Welcome' } }]
    const state = getPresencePublicationState({
      isPublished: true,
      draftContent: content,
      publishedContent: content,
      publishedAt,
    })

    expect(state.kind).toBe('published')
    expect(state.label).toBe('Live — up to date')
    expect(state.hasUnpublishedChanges).toBe(false)
  })

  it('identifies saved draft edits that customers cannot see yet', () => {
    const state = getPresencePublicationState({
      isPublished: true,
      draftContent: [{ id: 'hero', content: { title: 'New headline' } }],
      publishedContent: [{ id: 'hero', content: { title: 'Current live headline' } }],
      publishedAt,
    })

    expect(state.kind).toBe('published-with-changes')
    expect(state.label).toBe('Live with unpublished changes')
    expect(state.hasUnpublishedChanges).toBe(true)
    expect(state.customerViewDescription).toContain('last published snapshot')
  })

  it('compares equivalent JSON content independently of object key order', () => {
    expect(
      presenceContentsMatch(
        [{ content: { title: 'Hello', enabled: true }, id: 'hero' }],
        [{ id: 'hero', content: { enabled: true, title: 'Hello' } }]
      )
    ).toBe(true)
  })

  it('flags a legacy live page without a protected snapshot', () => {
    const state = getPresencePublicationState({
      isPublished: true,
      draftContent: [{ id: 'hero' }],
      publishedContent: null,
      publishedAt,
    })

    expect(state.kind).toBe('published-without-snapshot')
    expect(state.label).toBe('Live — republish recommended')
  })

  it('formats a valid last-published timestamp and rejects invalid values', () => {
    expect(formatPublishedAt(publishedAt)).toMatch(/31 Jul 2026/)
    expect(formatPublishedAt('not-a-date')).toBeNull()
  })
})
