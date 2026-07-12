import fs from 'fs'
import path from 'path'

describe('Deployment safety', () => {
  const projectRoot = process.cwd()
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('keeps database migrations out of the application build', () => {
    expect(packageJson.scripts.build).toBe('next build')
    expect(packageJson.scripts.build).not.toMatch(/prisma\s+migrate|db:migrate/)
  })

  it('provides explicit validation and deployment commands', () => {
    expect(packageJson.scripts['db:validate']).toBe('prisma validate')
    expect(packageJson.scripts['db:migrate:deploy']).toBe('prisma migrate deploy')
  })

  it('keeps migration deployment in a manually triggered workflow', () => {
    const workflow = fs.readFileSync(
      path.join(projectRoot, '.github', 'workflows', 'migrate.yml'),
      'utf8'
    )

    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('environment: preview')
    expect(workflow).toContain('environment: production')
    expect(workflow).toContain('needs: preview-migration')
  })
})
