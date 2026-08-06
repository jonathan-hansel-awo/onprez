import { render, screen } from '@testing-library/react'
import { Logo } from '../logo'

describe('Logo', () => {
  it('renders the OnPrez wordmark as a home link', () => {
    const { container } = render(<Logo />)

    expect(screen.getByRole('link', { name: 'OnPrez home' })).toHaveAttribute('href', '/')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
