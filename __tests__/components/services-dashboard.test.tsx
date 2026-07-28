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
                imageUrl: null,
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

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/services?businessId=business-1&active=false')
      expect(mockedFetch).toHaveBeenCalledWith('/api/service-categories?businessId=business-1')
    })
  })
})
