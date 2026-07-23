import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PresencePage from '@/app/dashboard/presence/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockedUseRouter = useRouter as jest.Mock
const mockedFetch = jest.fn()

describe('presence dashboard publication status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRouter.mockReturnValue({ push: jest.fn() })
    global.fetch = mockedFetch
  })

  it('shows an unpublished presence page as a draft and does not offer a live-page link', async () => {
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
            pages: [{ slug: 'home', isPublished: false }],
          },
        }),
      })

    render(<PresencePage />)

    expect(await screen.findByText('Draft — not live')).toBeInTheDocument()
    expect(screen.getByText('Your presence page is not live yet')).toBeInTheDocument()
    expect(screen.getByText('Edit and publish')).toBeInTheDocument()
    expect(screen.queryByText('View live page')).not.toBeInTheDocument()
    expect(screen.getByText(/becomes accessible after you publish/i)).toBeInTheDocument()
  })

  it('shows the live link only after the page has been published', async () => {
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
            pages: [{ slug: 'home', isPublished: true }],
          },
        }),
      })

    render(<PresencePage />)

    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.getByText('View live page')).toBeInTheDocument()
    expect(screen.getByText('Edit Presence')).toBeInTheDocument()
    expect(screen.queryByText('Your presence page is not live yet')).not.toBeInTheDocument()
  })
})
