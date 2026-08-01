/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

const ROOTS = ['src', '__tests__']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const PATTERNS = [
  '/api/upload/image',
  'cloudinary',
  'Cloudinary',
  'next/image',
  '<img',
  'imageUrl',
  'logoUrl',
  'coverImageUrl',
  'galleryImages',
]

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

describe('P2-019 repository audit', () => {
  it('prints image upload and delivery call sites', () => {
    const matches = ROOTS.flatMap(root => walk(path.join(process.cwd(), root)))
      .filter(file => EXTENSIONS.has(path.extname(file)))
      .flatMap(file => {
        const relative = path.relative(process.cwd(), file)
        if (relative === '__tests__/p2-019-repository-audit.test.ts') return []

        const lines = fs.readFileSync(file, 'utf8').split('\n')
        const matchedLines = lines
          .map((line, index) => ({ line: index + 1, text: line.trim() }))
          .filter(entry => PATTERNS.some(pattern => entry.text.includes(pattern)))

        return matchedLines.length ? [{ path: relative, matches: matchedLines }] : []
      })

    console.log(`P2_019_AUDIT_START\n${JSON.stringify(matches, null, 2)}\nP2_019_AUDIT_END`)
    expect(matches.length).toBeGreaterThan(0)
  })
})
