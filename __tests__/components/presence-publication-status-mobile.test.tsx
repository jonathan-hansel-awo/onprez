import { render, screen } from '@/lib/test-utils'
import { usePathname } from 'next/navigation'
import { PresencePublicationStatus } from '@/components/presence/PresencePublicationStatus'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockedUsePathname = usePathname as jest.Mock

function mockPublicationStatusFetches() {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { business: { id: 'business-1', slug: 'studio' } },
      }),
    })
    .mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          pages: [
            {
              id: 'page-1',
              slug: 'home',
              content: { sections: [] },
              publishedContent: { sections: [] },
              isPublished: true,
              publishedAt: '2026-08-08T10:00:00.000Z',
              version: 3,
            },
          ],
        },
      }),
    }) as typeof fetch
}

describe('presence publication status on mobile', () => {
  afterEach(() => {
    jest.clearAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('hides the floating editor status panel below the md breakpoint', async () => {
    mockedUsePathname.mockReturnValue('/dashboard/presence/editor')
    mockPublicationStatusFetches()

    render(<PresencePublicationStatus />)

    const panel = await screen.findByRole('complementary', {
      name: 'Presence publication status',
    })

    expect(panel).toHaveClass('hidden', 'md:block')
  })
})
