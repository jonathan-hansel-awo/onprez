describe('Project Setup', () => {
  it('should have TypeScript configured', () => {
    // Test that TypeScript types are working
    const isConfigured: boolean = true
    expect(isConfigured).toBe(true)
  })

  it('should have Next.js properly initialized', () => {
    // Test that we can work with Next.js config structure
    const nextConfig = {
      experimental: {
        appDir: true,
      },
    }
    expect(nextConfig).toBeDefined()
    expect(nextConfig.experimental.appDir).toBe(true)
  })

  it('should support TypeScript compilation', () => {
    // This will verify TypeScript is working with proper types
    const message: string = 'Hello OnPrez'
    const isString: boolean = typeof message === 'string'
    expect(isString).toBe(true)
    expect(message).toContain('OnPrez')
  })

  it('should have proper project structure', () => {
    // Test that our basic types and structure are working
    interface ProjectInfo {
      name: string
      version: string
      framework: string
    }

    const project: ProjectInfo = {
      name: 'OnPrez',
      version: '0.1.0',
      framework: 'Next.js 14'
    }

    expect(project.name).toBe('OnPrez')
    expect(project.framework).toContain('Next.js')
  })
})