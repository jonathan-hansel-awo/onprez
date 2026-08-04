import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('canonical current-state documentation', () => {
  const currentState = read('CURRENT_STATE.md')
  const packageLock = JSON.parse(read('package-lock.json'))

  it('records the resolved critical stack versions', () => {
    const expectedVersions: Record<string, string> = {
      'Next.js': packageLock.packages['node_modules/next'].version,
      'React / React DOM': packageLock.packages['node_modules/react'].version,
      TypeScript: packageLock.packages['node_modules/typescript'].version,
      'Tailwind CSS': packageLock.packages['node_modules/tailwindcss'].version,
      'Prisma CLI': packageLock.packages['node_modules/prisma'].version,
      'Prisma Client': packageLock.packages['node_modules/@prisma/client'].version,
      Playwright: packageLock.packages['node_modules/@playwright/test'].version,
      'axe Playwright': packageLock.packages['node_modules/@axe-core/playwright'].version,
      'Sentry Next.js SDK': packageLock.packages['node_modules/@sentry/nextjs'].version,
      Resend: packageLock.packages['node_modules/resend'].version,
      Stripe: packageLock.packages['node_modules/stripe'].version,
      Cloudinary: packageLock.packages['node_modules/cloudinary'].version,
    }

    for (const [label, version] of Object.entries(expectedVersions)) {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      expect(currentState).toMatch(
        new RegExp(`^\\|\\s*${escapedLabel}\\s*\\|\\s*\\\`${escapedVersion}\\\``, 'm')
      )
    }

    expect(packageLock.packages['node_modules/prisma'].version).toBe(
      packageLock.packages['node_modules/@prisma/client'].version
    )
  })

  it('keeps the orientation, architecture, roadmap, status, and update contract explicit', () => {
    for (const heading of [
      '## Ten-minute orientation',
      '## Capability status',
      '### Built',
      '### Partial or operationally unverified',
      '### Planned next',
      '### Deprecated, legacy, or not active',
      '## Actual stack versions',
      '## Architecture',
      '## Canonical documentation map',
      '## Known limitations and update rules',
    ]) {
      expect(currentState).toContain(heading)
    }

    expect(currentState).toContain(
      '[`docs/CRITICAL_ACTION_PLAN_PROGRESS.md`](./docs/CRITICAL_ACTION_PLAN_PROGRESS.md)'
    )
    expect(currentState).toContain('[`Architecture`](#architecture)')
    expect(currentState).toContain('[`docs/adr/README.md`](./docs/adr/README.md)')
    expect(currentState).toContain('P3-002')
  })

  it('keeps every relative markdown file link resolvable', () => {
    for (const sourceFile of ['README.md', 'CURRENT_STATE.md']) {
      const source = read(sourceFile)
      const sourceDirectory = path.dirname(path.join(root, sourceFile))
      const links = [...source.matchAll(/\[[^\]]+\]\((\.\.?\/[^)#]+)(?:#[^)]+)?\)/g)].map(
        match => match[1]
      )

      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        expect(fs.existsSync(path.resolve(sourceDirectory, link))).toBe(true)
      }
    }
  })

  it('labels every archived markdown document as non-normative', () => {
    const archiveRoot = path.join(root, 'docs/archive')
    const files = fs
      .readdirSync(path.join(archiveRoot, 'legacy-foundation'))
      .filter(file => file.endsWith('.md'))

    expect(files).toEqual(
      expect.arrayContaining([
        'DATABASE_SETUP.md',
        'ENVIRONMENT_VARIABLES.md',
        'SEED_DATA.md',
        'TESTING_CHECKLIST.md',
      ])
    )

    for (const file of files) {
      const document = read(`docs/archive/legacy-foundation/${file}`)
      expect(document).toContain('ARCHIVED — NOT CURRENT GUIDANCE')
      expect(document).toContain('CURRENT_STATE.md')
    }

    expect(read('docs/archive/README.md')).toContain('non-normative')
  })

  it('keeps the environment template aligned with the active provider boundaries', () => {
    const example = read('.env.example')
    for (const variable of [
      'DATABASE_URL',
      'DIRECT_URL',
      'JWT_SECRET',
      'EMAIL_VERIFICATION_TOKEN_PEPPER',
      'PASSWORD_RESET_TOKEN_PEPPER',
      'RESEND_API_KEY',
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY',
      'VAPID_PRIVATE_KEY',
      'CRON_SECRET',
    ]) {
      expect(example).toMatch(new RegExp(`^${variable}=`, 'm'))
    }

    expect(example).not.toContain('SUPABASE_')
    expect(example).not.toContain('UPLOADTHING_')
    expect(example).not.toContain('TWILIO_')
  })
})
