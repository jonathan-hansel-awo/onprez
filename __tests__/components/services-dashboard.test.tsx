import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ServicesPage from '@/app/dashboard/services/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockedUseRouter = useRouter as jest.Mock
const mockedUseSearchParams = useSearchParams as jest.Mock
const mockedFetch = jest.fn()

describe('services dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRouter.mockReturnValue({ push: jest.fn() })
    mockedUseSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) })
    global.fetch = mockedFetch

    mockedFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === '/api/business/current') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { business: { id: 'business-1' } },
          }),
        }
      }

      if (url === '/api/services?businessId=business-1&active=false') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'service-1',
                name: 'Swedish Massage',
                description: 'A relaxing full-body massage',
                price: 65,
                duration: 60,
                imageUrl: 'https://example.com/swedish-massage.jpg',
                active: true,
                featured: false,
                order: 0,
                category: null,
              },
            ],
          }),
        }
      }

      if (url === '/api/service-categories?businessId=business-1') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { categories: [] },
          }),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })
  })

  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('renders persisted services from the nested dashboard API responses', async () => {
    render(<ServicesPage />)

    expect(await screen.findByText('Swedish Massage')).toBeInTheDocument()
    expect(screen.getByText('A relaxing full-body massage')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Swedish Massage' })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/services?businessId=business-1&active=false')
      expect(mockedFetch).toHaveBeenCalledWith('/api/service-categories?businessId=business-1')
    })
  })

  it('stacks image service actions within the card on mobile', async () => {
    render(<ServicesPage />)

    const serviceCard = await screen.findByTestId('service-card-service-1')
    const serviceLayout = screen.getByTestId('service-card-layout-service-1')
    const serviceActions = screen.getByTestId('service-card-actions-service-1')

    expect(serviceCard).toHaveClass('min-w-0', 'overflow-hidden')
    expect(serviceLayout).toHaveClass('flex-col', 'sm:flex-row')
    expect(serviceActions).toHaveClass('w-full', 'flex-wrap', 'sm:w-auto', 'sm:flex-nowrap')
    expect(screen.getByRole('button', { name: 'Hide Swedish Massage' })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: 'Edit Swedish Massage' })).toHaveClass(
      'min-h-11',
      'min-w-11'
    )
    expect(screen.getByRole('button', { name: 'Delete Swedish Massage' })).toHaveClass(
      'min-h-11',
      'min-w-11'
    )
  })
})
