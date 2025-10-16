import { render, screen } from '@/lib/test-utils'
import { Header } from '../header'

describe('Header Component', () => {
  it('renders the OnPrez logo', () => {
    render(<Header />)
    expect(screen.getByText('OnPrez')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: /Features/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Examples/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pricing/i })).toBeInTheDocument()
  })

  it('renders Sign In and Get Started buttons', () => {
    render(<Header />)

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument()
  })
})
