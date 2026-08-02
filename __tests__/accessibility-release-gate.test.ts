import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('accessibility release gate', () => {
  it('keeps axe and the accessibility browser journey in recurring CI', () => {
    const packageJson = JSON.parse(read('package.json'))
    const workflow = read('.github/workflows/e2e.yml')
    const policy = JSON.parse(read('config/test-pyramid.json'))

    expect(packageJson.devDependencies['@axe-core/playwright']).toBeDefined()
    expect(packageJson.scripts['test:a11y']).toBe('playwright test e2e/accessibility.spec.ts')
    expect(workflow).toContain('npm run test:a11y')
    expect(policy.requiredPackageScripts).toContain('test:a11y')
    expect(policy.releaseGates.find((gate: { id: string }) => gate.id === 'browser-e2e')).toEqual(
      expect.objectContaining({ requiredCommands: expect.arrayContaining(['npm run test:a11y']) })
    )
  })

  it('documents automated and assistive-technology verification boundaries', () => {
    const guide = read('docs/testing/ACCESSIBILITY_TESTING.md')

    expect(guide).toContain('WCAG 2.2 Level AA')
    expect(guide).toContain('VoiceOver')
    expect(guide).toContain('NVDA')
    expect(guide).toMatch(/colour\s+contrast/)
    expect(guide).toContain('npm run test:a11y')
  })
})
