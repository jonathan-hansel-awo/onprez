import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

describe('Code Quality Setup', () => {
  const projectRoot = process.cwd()

  it('should have Prettier configuration', () => {
    const prettierrcPath = path.join(projectRoot, '.prettierrc')
    expect(fs.existsSync(prettierrcPath)).toBe(true)
  })

  it('should have ESLint configuration', () => {
    const eslintrcPath = path.join(projectRoot, '.eslintrc.json')
    expect(fs.existsSync(eslintrcPath)).toBe(true)
  })

  it('should have lint-staged configuration', () => {
    const lintStagedPath = path.join(projectRoot, '.lintstagedrc.js')
    expect(fs.existsSync(lintStagedPath)).toBe(true)
  })

  it('should have Husky pre-commit hook', () => {
    const preCommitPath = path.join(projectRoot, '.husky', 'pre-commit')
    expect(fs.existsSync(preCommitPath)).toBe(true)
  })

  it('should have format scripts in package.json', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    expect(packageJson.scripts.format).toBeDefined()
    expect(packageJson.scripts['format:check']).toBeDefined()
    expect(packageJson.scripts['lint:fix']).toBeDefined()
  })

  it('should format code correctly', () => {
    // Create a temporary unformatted file
    const testFile = path.join(projectRoot, 'test-format.ts')
    const unformattedCode = 'const x={a:1,b:2};console.log(x);'

    fs.writeFileSync(testFile, unformattedCode)

    try {
      // Run Prettier on the file
      execSync(`npx prettier --write ${testFile}`, { stdio: 'pipe' })

      // Read the formatted code
      const formattedCode = fs.readFileSync(testFile, 'utf8')

      // Verify it's been formatted (should have proper spacing)
      expect(formattedCode).toContain('const x = ')
      expect(formattedCode).not.toBe(unformattedCode)
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })

  it('should have proper TypeScript strictness', () => {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json')
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))

    expect(tsconfig.compilerOptions.strict).toBe(true)
  })
})
