import {
  buildTemplateSignupHref,
  normalisePreviewBusinessName,
} from '@/lib/templates/preview-personalisation'

describe('template preview personalisation', () => {
  it('normalises whitespace and trims the preview name', () => {
    expect(normalisePreviewBusinessName('  Heavenly   Pamper Palace  ')).toBe(
      'Heavenly Pamper Palace'
    )
  })

  it('limits the preview name length', () => {
    expect(normalisePreviewBusinessName('a'.repeat(100))).toHaveLength(80)
  })

  it('preserves the selected template and business name for signup', () => {
    expect(buildTemplateSignupHref('serene-wellness', 'Heavenly Pamper Palace')).toBe(
      '/signup?template=serene-wellness&businessName=Heavenly+Pamper+Palace'
    )
  })

  it('omits an empty business name', () => {
    expect(buildTemplateSignupHref('serene-wellness', '   ')).toBe(
      '/signup?template=serene-wellness'
    )
  })
})
