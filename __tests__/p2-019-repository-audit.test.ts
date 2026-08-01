/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

describe('P2-019 repository audit', () => {
  it('lists upload callers and image renderers', () => {
    const files = walk(path.join(process.cwd(), 'src')).filter(file => /\.(?:ts|tsx)$/.test(file))
    const uploadCallers = files
      .filter(file => fs.readFileSync(file, 'utf8').includes('/api/upload/image'))
      .map(file => path.relative(process.cwd(), file))
    const cloudinaryRenderers = files
      .filter(file => /\bCldImage\b/.test(fs.readFileSync(file, 'utf8')))
      .map(file => path.relative(process.cwd(), file))
    const rawImageRenderers = files
      .filter(file => /<img\b/.test(fs.readFileSync(file, 'utf8')))
      .map(file => path.relative(process.cwd(), file))

    throw new Error(
      JSON.stringify({ uploadCallers, cloudinaryRenderers, rawImageRenderers }, null, 2)
    )
  })
})
