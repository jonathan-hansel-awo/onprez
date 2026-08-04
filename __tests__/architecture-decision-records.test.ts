import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const adrRoot = path.join(root, 'docs/adr')
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')
const index = read('docs/adr/README.md')
const adrFiles = fs
  .readdirSync(adrRoot)
  .filter(file => /^\d{4}-[a-z0-9-]+\.md$/.test(file))
  .sort()
const indexedFiles = [...index.matchAll(/\]\(\.\/(\d{4}-[a-z0-9-]+\.md)\)/g)].map(match => match[1])
const records = adrFiles.map(file => ({ file, content: read(`docs/adr/${file}`) }))

describe('architecture decision records', () => {
  it('defines the ADR purpose and lifecycle', () => {
    expect(index).toContain('Architecture Decision Records (ADRs) preserve the reasoning')
    for (const status of ['Proposed', 'Accepted', 'Superseded', 'Deprecated']) {
      expect(index).toContain(`**${status}**`)
    }
  })

  it('defines the mandatory record shape', () => {
    expect(index).toContain('## Required record shape')
    for (const heading of [
      'Context',
      'Decision',
      'Consequences',
      'Alternatives considered',
      'Implementation evidence',
    ]) {
      expect(index).toContain(`**${heading}**`)
    }
  })

  it('indexes the eight foundational decisions', () => {
    expect(indexedFiles).toEqual(
      expect.arrayContaining([
        '0001-neon-postgresql.md',
        '0002-custom-authentication.md',
        '0003-vercel-deployment.md',
        '0004-prisma-data-access.md',
        '0005-cloudinary-media.md',
        '0006-business-identity-and-public-handles.md',
        '0007-transactional-booking-conflict-control.md',
        '0008-public-presence-caching.md',
      ])
    )
  })

  it('keeps ADR numbers unique and sequential', () => {
    const numbers = adrFiles.map(file => Number(file.slice(0, 4)))
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('keeps every indexed ADR resolvable', () => {
    expect(indexedFiles.length).toBeGreaterThanOrEqual(8)
    for (const file of indexedFiles) {
      expect(fs.existsSync(path.join(adrRoot, file))).toBe(true)
    }
  })

  it('keeps every numbered ADR in the index', () => {
    expect(indexedFiles.sort()).toEqual(adrFiles)
  })

  it('matches each record title to its filename number', () => {
    for (const { file, content } of records) {
      expect(content).toMatch(new RegExp(`^# ADR-${file.slice(0, 4)}: .+`, 'm'))
    }
  })

  it('records an ISO decision date for every ADR', () => {
    for (const { content } of records) {
      expect(content).toMatch(/^- \*\*Date:\*\* \d{4}-\d{2}-\d{2}$/m)
    }
  })

  it('uses a recognised lifecycle status for every ADR', () => {
    for (const { content } of records) {
      expect(content).toMatch(/^- \*\*Status:\*\* (Proposed|Accepted|Superseded|Deprecated)$/m)
    }
  })

  it('includes every required decision section in every ADR', () => {
    for (const { content } of records) {
      for (const heading of [
        'Context',
        'Decision',
        'Consequences',
        'Alternatives considered',
        'Implementation evidence',
      ]) {
        expect(content).toContain(`## ${heading}`)
      }
    }
  })

  it('links the live architecture and roadmap to the ADR index', () => {
    const currentState = read('CURRENT_STATE.md')
    const roadmap = read('docs/CRITICAL_ACTION_PLAN_PROGRESS.md')

    expect(currentState).toContain('[`docs/adr/README.md`](./docs/adr/README.md)')
    expect(currentState).toContain('P3-002')
    expect(roadmap).toContain('P2-033 — Add Architecture Decision Records** — **Complete**')
    expect(roadmap).toContain('**Next planned item:** P3-002')
  })
})
