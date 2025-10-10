import * as React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

describe('Button Component - Debug Classes', () => {
  it('should show default button classes', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    console.log('DEFAULT BUTTON CLASSES:', button.className)
  })

  it('should show large button classes', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    console.log('LARGE BUTTON CLASSES:', button.className)

    // Check if it has any height class
    const hasH11 = button.className.includes('h-11')
    const hasH12 = button.className.includes('h-12')
    const hasH10 = button.className.includes('h-10')

    console.log('Has h-11?', hasH11)
    console.log('Has h-12?', hasH12)
    console.log('Has h-10?', hasH10)
  })

  it('should show small button classes', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    console.log('SMALL BUTTON CLASSES:', button.className)
  })

  it('should show all size variations', () => {
    const sizes = ['sm', 'default', 'lg', 'icon'] as const

    sizes.forEach(size => {
      const { container } = render(<Button size={size}>{size}</Button>)
      const button = container.querySelector('button')
      console.log(`\nSIZE "${size}" CLASSES:`, button?.className)
    })
  })
})
