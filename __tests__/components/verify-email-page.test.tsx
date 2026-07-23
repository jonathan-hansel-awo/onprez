import { render, screen } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import VerifyEmailPage from '@/app/(auth)/verify-email/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockedUseRouter = useRouter as jest.Mock
const mockedUseSearchParams = useSearchParams as jest.Mock

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRouter.mockReturnValue({ push: jest.fn() })
  })

  it('tells a newly signed-up user that a verification email was sent', async () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams('email=louise%40example.com'))

    render(<VerifyEmailPage />)

    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument()
    expect(screen.getByText('louise@example.com')).toBeInTheDocument()
    expect(screen.getByText(/check your junk folder/i)).toBeInTheDocument()
    expect(screen.getByText(/saved as a/i)).toHaveTextContent('draft')
    expect(screen.getByText(/click/i)).toHaveTextContent('Publish')
    expect(screen.queryByRole('heading', { name: 'Verifying your email...' })).not.toBeInTheDocument()
  })
})
