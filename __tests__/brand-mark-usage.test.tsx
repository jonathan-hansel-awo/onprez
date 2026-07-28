import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { OnPrezMark } from '@/components/brand/onprez-mark'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return sourceFiles(entryPath)
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

describe('OnPrez brand mark', () => {
  it('renders decoratively by default', () => {
    const { container } = render(<OnPrezMark />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M29.8 8.6A15.5 15.5 0 1 0 35.4 14.3'
    )
  })

  it('supports accessible and single-colour contexts', () => {
    render(<OnPrezMark title="OnPrez" variant="currentColor" />)

    expect(screen.getByRole('img', { name: 'OnPrez' }).querySelector('path')).toHaveAttribute(
      'stroke',
      'currentColor'
    )
  })

  it('keeps the old sparkle motif out of rendered source', () => {
    const renderedSource = sourceFiles(path.join(process.cwd(), 'src'))
      .map(file => readFileSync(file, 'utf8'))
      .join('\n')
    const oldIconName = ['Spark', 'les'].join('')
    const oldGlyphs = [String.fromCodePoint(10024), String.fromCodePoint(10022)]

    expect(renderedSource).not.toContain(oldIconName)
    oldGlyphs.forEach(glyph => expect(renderedSource).not.toContain(glyph))
  })
})
