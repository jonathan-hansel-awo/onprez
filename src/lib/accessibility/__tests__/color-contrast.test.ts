import { getAccessibleTextColor } from '../color-contrast'

describe('getAccessibleTextColor', () => {
  it('uses white for dark brand colours', () => {
    expect(getAccessibleTextColor('#1D4ED8')).toBe('#FFFFFF')
    expect(getAccessibleTextColor('#111')).toBe('#FFFFFF')
  })

  it('uses black when white would miss WCAG AA contrast', () => {
    expect(getAccessibleTextColor('#3B82F6')).toBe('#000000')
    expect(getAccessibleTextColor('#10B981')).toBe('#000000')
    expect(getAccessibleTextColor('#fff')).toBe('#000000')
  })

  it('fails safely for an unsupported colour value', () => {
    expect(getAccessibleTextColor('var(--unexpected-colour)')).toBe('#000000')
  })
})
