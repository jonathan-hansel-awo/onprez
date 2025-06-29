import fs from 'fs';
import path from 'path';

describe('Database Migrations', () => {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');

  it('should have migrations directory', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
  });

  it('should have initial migration for core tables', () => {
    if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir);
      expect(migrations.length).toBeGreaterThan(0);

      // Check that we have migration files
      const hasMigrationFiles = migrations.some((migration) => {
        const migrationPath = path.join(migrationsDir, migration);
        const stat = fs.statSync(migrationPath);
        return (
          stat.isDirectory() &&
          fs.existsSync(path.join(migrationPath, 'migration.sql'))
        );
      });

      expect(hasMigrationFiles).toBe(true);
    }
  });
});
