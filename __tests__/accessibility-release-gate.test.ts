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

  it('keeps homepage demo controls named and its recurring contrast fixes explicit', () => {
    const colorPicker = read('src/components/landing/panels/color-picker-panel.tsx')
    const customizable = read('src/components/landing/feature-customizable.tsx')
    const examples = read('src/components/landing/examples-carousel.tsx')
    const hero = read('src/components/landing/hero.tsx')
    const stepDots = read('src/components/landing/how-it-works/step-dots.tsx')

    expect(colorPicker).toContain('aria-label={`Use ${color.name} brand colour`}')
    expect(colorPicker).toContain('aria-pressed={selectedColor === color.value}')
    expect(customizable).toContain('aria-label={`${section.name} section`}')
    expect(customizable).not.toContain('text-xs text-gray-500')
    expect(examples).toContain('text-blue-700')
    expect(examples).not.toContain('tracking-[0.16em] opacity-60')
    expect(hero).toContain('text-emerald-800')
    expect(stepDots).toContain('h-8 w-10')
  })

  it('keeps dashboard navigation, form controls, and upload guidance contrast-safe', () => {
    const dashboardShell = read('src/components/dashboard/DashboardShell.tsx')
    const input = read('src/components/form/input.tsx')
    const select = read('src/components/form/select.tsx')
    const textArea = read('src/components/form/text-area.tsx')
    const button = read('src/components/ui/button.tsx')
    const imageUpload = read('src/components/ui/image-upload.tsx')

    expect(dashboardShell).toContain('tracking-[0.16em] text-gray-600')
    expect(input).toContain("'top-2 text-xs text-blue-700'")
    expect(select).toContain("'top-2 text-xs text-blue-700'")
    expect(textArea).toContain('top-2 text-xs text-blue-700')
    expect(input).toContain('useReducedMotion')
    expect(select).toContain('useReducedMotion')
    expect(textArea).toContain('useReducedMotion')
    expect(button).toContain('bg-transparent text-blue-700')
    expect(button).not.toContain('text-onprez-blue border')
    expect(imageUpload).toContain('text-xs text-gray-600')
    expect(imageUpload).not.toContain('text-xs text-gray-400')
  })

  it('derives readable text for custom presence theme colours', () => {
    const provider = read('src/contexts/ThemeProvider.tsx')
    const globalStyles = read('src/app/globals.css')
    const premiumSections = read('src/components/presence/premium/PremiumSectionVariants.tsx')

    expect(provider).toContain("setProperty('--theme-primary-contrast'")
    expect(provider).toContain("setProperty('--theme-accent-contrast'")
    expect(globalStyles).toContain('color: var(--theme-primary-contrast)')
    expect(globalStyles).toContain('color: var(--theme-accent-contrast)')
    expect(premiumSections).toContain('text-[var(--theme-primary-contrast,#000)]')
  })

  it('honours reduced motion throughout booking step and time-slot transitions', () => {
    const bookingWidget = read('src/components/booking/BookingWidget.tsx')
    const timeSlots = read('src/components/booking/steps/TimeSlotSelectionStep.tsx')
    const customerDetails = read('src/components/booking/steps/CustomerDetailsStep.tsx')

    expect(bookingWidget).toContain('useReducedMotion')
    expect(bookingWidget).toContain('initial={shouldReduceMotion ? false')
    expect(bookingWidget).toContain('duration: shouldReduceMotion ? 0 : 0.2')
    expect(timeSlots).toContain('useReducedMotion')
    expect(timeSlots).toContain('initial={shouldReduceMotion ? false')
    expect(timeSlots).toContain('delay: shouldReduceMotion ? 0 : index * 0.02')
    expect(customerDetails).toContain('useReducedMotion')
    expect(customerDetails).toContain('initial={shouldReduceMotion ? false')
    expect(customerDetails).toContain('delay: shouldReduceMotion ? 0')
  })
})
