import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const repositoryRoot = process.cwd()
const landingDirectory = join(repositoryRoot, 'src/components/landing')
const homepagePath = join(repositoryRoot, 'src/app/page.tsx')

const removedFabricatedSources = [
  'src/components/landing/social-proof-stream.tsx',
  'src/components/landing/social-proof-stream-dual.tsx',
  'src/components/landing/activity-card.tsx',
  'src/components/landing/testimonials-bento.tsx',
  'src/components/landing/testimonial-tiles.tsx',
  'src/data/activities.ts',
  'src/data/testimonials.ts',
]

const prohibitedClaims = [
  'Join Thousands of Professionals',
  'Real activity happening right now',
  'Live activity from professionals worldwide',
  'Loved by Professionals',
  "Join thousands of service professionals who've transformed their business with OnPrez",
  'My booking rate increased by 40% in the first month!',
  'Monthly Bookings',
  'Hours Saved',
  'Average Rating',
]

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const fullPath = join(directory, entry)

    if (statSync(fullPath).isDirectory()) {
      return entry === '__tests__' ? [] : collectSourceFiles(fullPath)
    }

    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : []
  })
}

describe('homepage marketing integrity', () => {
  it('uses demonstrable product proof instead of fabricated social proof', () => {
    const homepage = readFileSync(homepagePath, 'utf8')

    expect(homepage).toContain('<HomepageScenario />')
    expect(homepage).toContain('<LazyExamplesCarousel />')
    expect(homepage).toContain('<LazyPricingSection />')
    expect(homepage).not.toContain('SocialProofStream')
    expect(homepage).not.toContain('TestimonialsBento')
  })

  it('removes the fabricated activity and testimonial implementation', () => {
    for (const source of removedFabricatedSources) {
      expect(existsSync(join(repositoryRoot, source))).toBe(false)
    }
  })

  it('blocks the known unsupported claims from public landing-page source', () => {
    const publicMarketingSource = [homepagePath, ...collectSourceFiles(landingDirectory)]
      .map(path => readFileSync(path, 'utf8'))
      .join('\n')

    for (const claim of prohibitedClaims) {
      expect(publicMarketingSource).not.toContain(claim)
    }
  })
})
