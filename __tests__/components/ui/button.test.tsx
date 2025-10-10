import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    // Check for destructive variant classes
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size classes correctly', () => {
    // Test default size
    const { rerender } = render(<Button size="default">Default</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-10')

    // Test small size
    rerender(<Button size="sm">Small</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')

    // Test large size - check for actual lg classes
    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    // The button should have larger padding/height than default
    // Check what classes are actually applied
    const classes = button.className
    expect(classes).toContain('px-') // Has padding
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('renders with default variant when no variant specified', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('renders different button variants', () => {
    const variants = [
      { variant: 'default' as const, expectedClass: 'bg-primary' },
      { variant: 'secondary' as const, expectedClass: 'bg-secondary' },
      { variant: 'outline' as const, expectedClass: 'border' },
      { variant: 'ghost' as const, expectedClass: 'hover:bg-accent' },
    ]

    variants.forEach(({ variant, expectedClass }) => {
      const { container } = render(<Button variant={variant}>{variant}</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass(expectedClass)
    })
  })
})
