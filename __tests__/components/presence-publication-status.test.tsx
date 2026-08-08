import { fireEvent, render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { PresencePublicationStatus } from '@/components/presence/PresencePublicationStatus'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockedUsePathname = usePathname as jest.Mock
const mockedFetch = jest.fn()

describe('presence publication status notification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUsePathname.mockReturnValue('/dashboard/presence/editor')
    global.fetch = mockedFetch

    mockedFetch
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { business: { id: 'business-1', slug: 'louisebeauty' } },
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
                content: { hero: { title: 'Updated title' } },
                publishedContent: { hero: { title: 'Live title' } },
                isPublished: true,
                publishedAt: '2026-07-23T09:01:00.000Z',
                version: 2,
              },
            ],
          },
        }),
      })
  })

  it('allows the floating editor notification to be closed', async () => {
    render(<PresencePublicationStatus />)

    expect(await screen.findByText('Live with unpublished changes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close publication status notification' }))

    expect(screen.queryByLabelText('Presence publication status')).not.toBeInTheDocument()
  })
})
