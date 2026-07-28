import { detectInstallPlatform, isStandaloneDisplay } from '../install'

describe('PWA install environment', () => {
  it('detects iPhone and iPad browsers', () => {
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPhone',
        maxTouchPoints: 5,
      })
    ).toBe('ios')

    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      })
    ).toBe('ios')
  })

  it('distinguishes Android from desktop browsers', () => {
    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0',
      })
    ).toBe('android')

    expect(
      detectInstallPlatform({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0',
      })
    ).toBe('desktop')
  })

  it('recognises standalone display mode on supporting browsers and iOS', () => {
    expect(isStandaloneDisplay(true, false)).toBe(true)
    expect(isStandaloneDisplay(false, true)).toBe(true)
    expect(isStandaloneDisplay(false, false)).toBe(false)
  })
})
