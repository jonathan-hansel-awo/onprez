import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { Hero } from '../hero'
import { homepagePositioning } from '../homepage-positioning'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const push = jest.fn()

describe('Hero', () => {
  beforeEach(() => {
    push.mockReset()
    mockUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
  })

  it('renders the approved positioning, calls to action, and stylist image', () => {
    render(<Hero />)

    expect(screen.getByRole('heading', { level: 1 })).toContainElement(
      screen.getByText(homepagePositioning.headlineLines[0])
    )
    expect(screen.getByRole('heading', { level: 1 })).toContainElement(
      screen.getByText(homepagePositioning.headlineLines[1])
    )
    expect(screen.getByText(homepagePositioning.summary)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: homepagePositioning.primaryCta })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: homepagePositioning.secondaryCta })).toHaveAttribute(
      'href',
      '/examples'
    )
    expect(
      screen.getByRole('img', { name: 'Example hair stylist in her salon' })
    ).toBeInTheDocument()
  })

  it('normalises a requested handle before forwarding to signup', () => {
    render(<Hero />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Choose your OnPrez handle' }), {
      target: { value: '  Crown & Canvas!  ' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: homepagePositioning.primaryCta }).closest('form')!
    )

    expect(push).toHaveBeenCalledWith('/signup?handle=crown-canvas')
  })

  it('forwards an empty handle to signup', () => {
    render(<Hero />)

    fireEvent.submit(
      screen.getByRole('button', { name: homepagePositioning.primaryCta }).closest('form')!
    )

    expect(push).toHaveBeenCalledWith('/signup')
  })
})
