export type TableFingerprint = {
  tableName: string
  rowCount: string
  contentChecksum: string
  idChecksum: string | null
  minimumId: string | null
  maximumId: string | null
}

export type DatabaseSnapshot = {
  serverVersion: string
  schemaHash: string
  migrationHash: string
  tables: TableFingerprint[]
}

export type RecoveryMetrics = {
  rpoMinutes: number
  rtoMinutes: number
  rpoTargetMinutes: number
  rtoTargetMinutes: number
  rpoWithinTarget: boolean
  rtoWithinTarget: boolean
}

type RecoveryMetricInput = {
  drillStartedAt: string
  sourceFrozenAt: string
  restorePointAt: string
  verifiedAt?: Date
  rpoTargetMinutes: number
  rtoTargetMinutes: number
}

function parseTimestamp(value: string, name: string): Date {
  const timestamp = new Date(value)

  if (!value || Number.isNaN(timestamp.getTime())) {
    throw new Error(`${name} must be a valid ISO-8601 timestamp`)
  }

  return timestamp
}

export function calculateRecoveryMetrics(input: RecoveryMetricInput): RecoveryMetrics {
  const verifiedAt = input.verifiedAt ?? new Date()
  const drillStartedAt = parseTimestamp(input.drillStartedAt, 'DRILL_STARTED_UTC')
  const sourceFrozenAt = parseTimestamp(input.sourceFrozenAt, 'SOURCE_FREEZE_UTC')
  const restorePointAt = parseTimestamp(input.restorePointAt, 'RESTORE_POINT_UTC')

  if (drillStartedAt.getTime() > sourceFrozenAt.getTime()) {
    throw new Error('SOURCE_FREEZE_UTC cannot be earlier than DRILL_STARTED_UTC')
  }

  if (sourceFrozenAt.getTime() > verifiedAt.getTime()) {
    throw new Error('SOURCE_FREEZE_UTC cannot be in the future')
  }

  if (restorePointAt.getTime() > verifiedAt.getTime()) {
    throw new Error('RESTORE_POINT_UTC cannot be in the future')
  }

  if (restorePointAt.getTime() > sourceFrozenAt.getTime()) {
    throw new Error('RESTORE_POINT_UTC cannot be later than SOURCE_FREEZE_UTC')
  }

  const rpoMinutes = Math.max(0, (sourceFrozenAt.getTime() - restorePointAt.getTime()) / 60_000)
  const rtoMinutes = Math.max(0, (verifiedAt.getTime() - drillStartedAt.getTime()) / 60_000)

  return {
    rpoMinutes,
    rtoMinutes,
    rpoTargetMinutes: input.rpoTargetMinutes,
    rtoTargetMinutes: input.rtoTargetMinutes,
    rpoWithinTarget: rpoMinutes <= input.rpoTargetMinutes,
    rtoWithinTarget: rtoMinutes <= input.rtoTargetMinutes,
  }
}

export function compareDatabaseSnapshots(
  source: DatabaseSnapshot,
  restored: DatabaseSnapshot
): string[] {
  const differences: string[] = []

  if (source.serverVersion !== restored.serverVersion) {
    differences.push('PostgreSQL server versions differ')
  }

  if (source.schemaHash !== restored.schemaHash) {
    differences.push('Database schemas differ')
  }

  if (source.migrationHash !== restored.migrationHash) {
    differences.push('Prisma migration histories differ')
  }

  const sourceTables = new Map(source.tables.map(table => [table.tableName, table]))
  const restoredTables = new Map(restored.tables.map(table => [table.tableName, table]))
  const tableNames = [...new Set([...sourceTables.keys(), ...restoredTables.keys()])].sort()

  for (const tableName of tableNames) {
    const sourceTable = sourceTables.get(tableName)
    const restoredTable = restoredTables.get(tableName)

    if (!sourceTable) {
      differences.push(`Table ${tableName} exists only in the restored database`)
      continue
    }

    if (!restoredTable) {
      differences.push(`Table ${tableName} is missing from the restored database`)
      continue
    }

    if (sourceTable.rowCount !== restoredTable.rowCount) {
      differences.push(
        `Table ${tableName} row count differs (${sourceTable.rowCount} vs ${restoredTable.rowCount})`
      )
    }

    if (sourceTable.contentChecksum !== restoredTable.contentChecksum) {
      differences.push(`Table ${tableName} content fingerprint differs`)
    }

    if (
      sourceTable.idChecksum !== restoredTable.idChecksum ||
      sourceTable.minimumId !== restoredTable.minimumId ||
      sourceTable.maximumId !== restoredTable.maximumId
    ) {
      differences.push(`Table ${tableName} identifier fingerprint differs`)
    }
  }

  return differences
}

export function databaseTargetFingerprint(databaseUrl: string): string {
  let parsed: URL

  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new Error('Database connection URL is invalid')
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('Restore verification requires PostgreSQL connection URLs')
  }

  return `${parsed.hostname.toLowerCase()}:${parsed.port || '5432'}${parsed.pathname}`
}
