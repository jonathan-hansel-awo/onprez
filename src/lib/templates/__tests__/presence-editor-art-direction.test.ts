/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'
import { getPresenceTemplate } from '@/data/presence-template-catalogue'
import { createSection } from '@/types/page-sections'

const projectRoot = process.cwd()

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('presence editor art-direction contract', () => {
  it('offers dedicated owner and process sections', () => {
    const owner = createSection('OWNER', 0)
    const process = createSection('PROCESS', 1)

    expect(owner).toMatchObject({
      type: 'OWNER',
      data: {
        eyebrow: 'Meet the owner',
        layout: 'portrait',
      },
    })
    expect(process).toMatchObject({
      type: 'PROCESS',
      data: {
        layout: 'steps',
        steps: expect.arrayContaining([expect.objectContaining({ title: 'Choose a service' })]),
      },
    })
  })

  it('uses a carousel as the default gallery composition', () => {
    const gallery = createSection('GALLERY', 0)

    expect(gallery.type).toBe('GALLERY')
    if (gallery.type === 'GALLERY') {
      expect(gallery.data.layout).toBe('carousel')
    }
  })

  it('catalogues the therapist proof template', () => {
    expect(getPresenceTemplate('stillpoint-therapy')).toMatchObject({
      name: 'Stillpoint Therapy',
      category: 'PROFESSIONAL',
      audience: expect.stringContaining('therapists'),
    })
  })

  it('does not ship prototype Try booking copy in preview service cards', () => {
    const source = readSource(
      'src/components/presence/sections/CanonicalPreviewServicesSection.tsx'
    )

    expect(source).not.toMatch(/Try booking/i)
    expect(source).toContain('Book this service')
  })

  it('keeps section foreground colours and content radii independent from button styling', () => {
    const source = readSource('src/contexts/ThemeProvider.tsx')

    expect(source).toContain('--theme-button-radius')
    expect(source).toContain('--theme-radius')
    expect(source).toContain('color: inherit')
    expect(source).not.toContain(
      "theme.buttonStyle === 'pill' ? '9999px' : '0.5rem'\n    root.style.setProperty('--theme-radius'"
    )
  })

  it('exposes premium hero styles in the editor instead of flattening templates', () => {
    const source = readSource('src/components/presence/editor/sections/HeroSectionEditor.tsx')

    expect(source).toContain('Premium Art Direction')
    expect(source).toContain('Editorial — expressive magazine type')
    expect(source).toContain('Full bleed')
    expect(source).toContain('Editorial collage')
  })
})
