import { createHash } from 'node:crypto'
import { appendFile, writeFile } from 'node:fs/promises'

import { PrismaClient } from '@prisma/client'

import {
  calculateRecoveryMetrics,
  compareDatabaseSnapshots,
  databaseTargetFingerprint,
  type DatabaseSnapshot,
  type TableFingerprint,
} from './lib/restore-verification'

const DEFAULT_RPO_TARGET_MINUTES = 5
const DEFAULT_RTO_TARGET_MINUTES = 120

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

const REPORT_PATH = process.env.RESTORE_VERIFICATION_REPORT || 'restore-verification-report.json'

type TableMetadata = {
  tableName: string
  hasId: boolean
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) throw new Error(`${name} is required`)
  return value
}

function positiveNumberEnvironment(name: string, fallback: number): number {
  const value = process.env[name]
  const number = value ? Number(value) : fallback

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number`)
  }

  return number
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`
}

async function getTableMetadata(client: PrismaClient): Promise<TableMetadata[]> {
  const rows = await client.$queryRaw<Array<{ tableName: string; hasId: boolean }>>`
    SELECT
      tables.table_name AS "tableName",
      EXISTS (
        SELECT 1
        FROM information_schema.columns AS columns
        WHERE columns.table_schema = 'public'
          AND columns.table_name = tables.table_name
          AND columns.column_name = 'id'
      ) AS "hasId"
    FROM information_schema.tables AS tables
    WHERE tables.table_schema = 'public'
      AND tables.table_type = 'BASE TABLE'
    ORDER BY tables.table_name
  `

  return rows
}

async function fingerprintTable(
  client: PrismaClient,
  table: TableMetadata
): Promise<TableFingerprint> {
  const tableIdentifier = quoteIdentifier(table.tableName)
  const identifierFields = table.hasId
    ? `COALESCE(SUM(hashtextextended(row_data."id"::text, 0)::numeric), 0)::text AS "idChecksum",
       MIN(row_data."id"::text) AS "minimumId",
       MAX(row_data."id"::text) AS "maximumId"`
    : `NULL::text AS "idChecksum", NULL::text AS "minimumId", NULL::text AS "maximumId"`
  const rows = await client.$queryRawUnsafe<Array<Omit<TableFingerprint, 'tableName'>>>(
    `SELECT
       COUNT(*)::text AS "rowCount",
       COALESCE(SUM(hashtextextended(row_to_json(row_data)::text, 0)::numeric), 0)::text AS "contentChecksum",
       ${identifierFields}
     FROM ${tableIdentifier} AS row_data`
  )

  return { tableName: table.tableName, ...rows[0] }
}

async function captureSnapshot(client: PrismaClient): Promise<DatabaseSnapshot> {
  const identity = await client.$queryRaw<Array<{ serverVersion: string }>>`
    SELECT current_setting('server_version_num') AS "serverVersion"
  `
  const schema = await client.$queryRaw<
    Array<{
      tableName: string
      columnName: string
      ordinalPosition: number
      dataType: string
      userDefinedType: string
      nullable: string
      defaultValue: string | null
    }>
  >`
    SELECT
      table_name AS "tableName",
      column_name AS "columnName",
      ordinal_position AS "ordinalPosition",
      data_type AS "dataType",
      udt_name AS "userDefinedType",
      is_nullable AS "nullable",
      column_default AS "defaultValue"
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `
  const migrationTable = await client.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS "exists"
  `
  const migrations = migrationTable[0]?.exists
    ? await client.$queryRaw<
        Array<{
          migrationName: string
          checksum: string
          finishedAt: Date | null
          rolledBackAt: Date | null
          appliedStepsCount: number
        }>
      >`
        SELECT
          migration_name AS "migrationName",
          checksum,
          finished_at AS "finishedAt",
          rolled_back_at AS "rolledBackAt",
          applied_steps_count AS "appliedStepsCount"
        FROM "_prisma_migrations"
        ORDER BY started_at, migration_name
      `
    : []
  const tableMetadata = await getTableMetadata(client)
  const tables: TableFingerprint[] = []

  for (const table of tableMetadata) {
    tables.push(await fingerprintTable(client, table))
  }

  return {
    serverVersion: identity[0].serverVersion,
    schemaHash: hash(schema),
    migrationHash: hash(migrations),
    tables,
  }
}

async function appendSummary(
  status: 'PASS' | 'FAIL',
  metrics: ReturnType<typeof calculateRecoveryMetrics>,
  differences: string[]
) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return

  const lines = [
    '## Database restore verification',
    '',
    `**Result:** ${status}`,
    `**Measured RPO:** ${metrics.rpoMinutes.toFixed(2)} minutes (target: ${metrics.rpoTargetMinutes})`,
    `**Measured RTO:** ${metrics.rtoMinutes.toFixed(2)} minutes (target: ${metrics.rtoTargetMinutes})`,
    `**Snapshot differences:** ${differences.length}`,
    '',
  ]

  if (differences.length > 0) {
    lines.push('### Differences', '', ...differences.map(difference => `- ${difference}`), '')
  }

  await appendFile(summaryPath, `${lines.join('\n')}\n`, 'utf8')
}

async function main() {
  const sourceUrl = requiredEnvironment('SOURCE_DATABASE_URL')
  const restoredUrl = requiredEnvironment('RESTORED_DATABASE_URL')
  const sourceTarget = databaseTargetFingerprint(sourceUrl)
  const restoredTarget = databaseTargetFingerprint(restoredUrl)

  if (sourceTarget === restoredTarget) {
    throw new Error('Source and restored connection URLs point to the same database target')
  }

  const verifiedAt = new Date()
  const metrics = calculateRecoveryMetrics({
    drillStartedAt: requiredEnvironment('DRILL_STARTED_UTC'),
    sourceFrozenAt: requiredEnvironment('SOURCE_FREEZE_UTC'),
    restorePointAt: requiredEnvironment('RESTORE_POINT_UTC'),
    verifiedAt,
    rpoTargetMinutes: positiveNumberEnvironment(
      'BACKUP_RPO_TARGET_MINUTES',
      DEFAULT_RPO_TARGET_MINUTES
    ),
    rtoTargetMinutes: positiveNumberEnvironment(
      'BACKUP_RTO_TARGET_MINUTES',
      DEFAULT_RTO_TARGET_MINUTES
    ),
  })
  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } }, log: ['error'] })
  const restored = new PrismaClient({
    datasources: { db: { url: restoredUrl } },
    log: ['error'],
  })

  try {
    log('Capturing read-only source database fingerprint...')
    const sourceSnapshot = await captureSnapshot(source)
    log('Capturing read-only restored database fingerprint...')
    const restoredSnapshot = await captureSnapshot(restored)
    const differences = compareDatabaseSnapshots(sourceSnapshot, restoredSnapshot)
    const targetFailures = [
      ...(!metrics.rpoWithinTarget ? ['Measured RPO exceeds its target'] : []),
      ...(!metrics.rtoWithinTarget ? ['Measured RTO exceeds its target'] : []),
    ]
    const failures = [...differences, ...targetFailures]
    const status = failures.length === 0 ? 'PASS' : 'FAIL'
    const report = {
      status,
      verifiedAt: verifiedAt.toISOString(),
      metrics,
      comparison: {
        sourceTargetHash: hash(sourceTarget),
        restoredTargetHash: hash(restoredTarget),
        sourceSchemaHash: sourceSnapshot.schemaHash,
        restoredSchemaHash: restoredSnapshot.schemaHash,
        sourceMigrationHash: sourceSnapshot.migrationHash,
        restoredMigrationHash: restoredSnapshot.migrationHash,
        sourceTableCount: sourceSnapshot.tables.length,
        restoredTableCount: restoredSnapshot.tables.length,
        differences,
      },
      failures,
    }

    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    await appendSummary(status, metrics, differences)

    log(`Restore verification: ${status}`)
    log(`RPO: ${metrics.rpoMinutes.toFixed(2)} minutes`)
    log(`RTO: ${metrics.rtoMinutes.toFixed(2)} minutes`)
    log(`Compared ${sourceSnapshot.tables.length} tables without returning PII fields`)

    if (failures.length > 0) {
      failures.forEach(failure => console.error(`- ${failure}`))
      process.exitCode = 1
    }
  } finally {
    await Promise.allSettled([source.$disconnect(), restored.$disconnect()])
  }
}

main().catch(error => {
  console.error(
    'Restore verification could not complete:',
    error instanceof Error ? error.message : 'Unknown error'
  )
  process.exitCode = 1
})
