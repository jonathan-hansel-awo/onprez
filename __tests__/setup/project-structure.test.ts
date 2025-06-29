import fs from 'fs';
import path from 'path';

describe('Area 1: Project Setup & Infrastructure', () => {
  const projectRoot = process.cwd();

  describe('Project Structure', () => {
    const requiredDirectories = [
      'src/components',
      'src',
      'src/app',
      'src/app/api',
      'src/lib',
      'src/utils',
      'src/types',
      'src/hooks',
      'src/stores',
      'src/styles',
      'public',
      '__tests__',
    ];

    requiredDirectories.forEach((dir) => {
      it(`should have ${dir} directory`, () => {
        const dirPath = path.join(projectRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('Configuration Files', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'tailwind.config.ts',
      'next.config.ts',
      'jest.config.js',
      '.eslintrc.json',
      '.prettierrc',
      'prisma/schema.prisma',
    ];

    requiredFiles.forEach((file) => {
      it(`should have ${file}`, () => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have valid tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.target).toBe('ES2017');
      expect(tsconfig.compilerOptions.module).toBe('esnext');
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
    });
  });

  describe('ESLint Configuration', () => {
    it('should have Next.js ESLint config', () => {
      const eslintPath = path.join(projectRoot, '.eslintrc.json');
      const eslintConfig = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));

      expect(eslintConfig.extends).toContain('next/core-web-vitals');
    });
  });

  describe('Environment Variables', () => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'RESEND_API_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ];

    requiredEnvVars.forEach((envVar) => {
      it(`should have ${envVar} environment variable defined`, () => {
        // In test environment, we check if the variable is at least mentioned in .env.example
        const envExamplePath = path.join(projectRoot, '.env.example');
        if (fs.existsSync(envExamplePath)) {
          const envExample = fs.readFileSync(envExamplePath, 'utf8');
          expect(envExample).toContain(envVar);
        } else {
          // Fallback: check if it's in our test environment
          expect(process.env[envVar]).toBeDefined();
        }
      });
    });
  });

  describe('Package Dependencies', () => {
    it('should have required dependencies', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredDeps = [
        'next',
        'react',
        'react-dom',
        'bcryptjs',
        '@supabase/supabase-js',
        '@supabase/ssr',
        'prisma',
        '@prisma/client',
      ];

      requiredDeps.forEach((dep) => {
        expect(
          packageJson.dependencies[dep] || packageJson.devDependencies[dep],
        ).toBeDefined();
      });
    });
  });
});
