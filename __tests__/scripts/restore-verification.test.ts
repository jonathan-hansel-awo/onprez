/** @jest-environment node */

import {
  calculateRecoveryMetrics,
  compareDatabaseSnapshots,
  databaseTargetFingerprint,
  type DatabaseSnapshot,
} from '../../scripts/lib/restore-verification'

const snapshot: DatabaseSnapshot = {
  serverVersion: '170005',
  schemaHash: 'schema-hash',
  migrationHash: 'migration-hash',
  tables: [
    {
      tableName: 'appointments',
      rowCount: '2',
      contentChecksum: 'content-123',
      idChecksum: '123',
      minimumId: 'appointment-1',
      maximumId: 'appointment-2',
    },
  ],
}

describe('restore verification helpers', () => {
  it('accepts identical database snapshots', () => {
    expect(compareDatabaseSnapshots(snapshot, structuredClone(snapshot))).toEqual([])
  })

  it('reports schema, migration, table, count, and identifier differences without row data', () => {
    const restored: DatabaseSnapshot = {
      serverVersion: '160010',
      schemaHash: 'different-schema',
      migrationHash: 'different-migrations',
      tables: [
        {
          tableName: 'appointments',
          rowCount: '1',
          contentChecksum: 'content-456',
          idChecksum: '456',
          minimumId: 'appointment-1',
          maximumId: 'appointment-1',
        },
        {
          tableName: 'unexpected_table',
          rowCount: '0',
          contentChecksum: '0',
          idChecksum: null,
          minimumId: null,
          maximumId: null,
        },
      ],
    }

    expect(compareDatabaseSnapshots(snapshot, restored)).toEqual([
      'PostgreSQL server versions differ',
      'Database schemas differ',
      'Prisma migration histories differ',
      'Table appointments row count differs (2 vs 1)',
      'Table appointments content fingerprint differs',
      'Table appointments identifier fingerprint differs',
      'Table unexpected_table exists only in the restored database',
    ])
  })

  it('calculates RPO and RTO against configured targets', () => {
    expect(
      calculateRecoveryMetrics({
        drillStartedAt: '2026-07-17T08:00:00.000Z',
        sourceFrozenAt: '2026-07-17T08:10:00.000Z',
        restorePointAt: '2026-07-17T08:07:00.000Z',
        verifiedAt: new Date('2026-07-17T09:30:00.000Z'),
        rpoTargetMinutes: 5,
        rtoTargetMinutes: 120,
      })
    ).toEqual({
      rpoMinutes: 3,
      rtoMinutes: 90,
      rpoTargetMinutes: 5,
      rtoTargetMinutes: 120,
      rpoWithinTarget: true,
      rtoWithinTarget: true,
    })
  })

  it('rejects impossible drill chronology', () => {
    expect(() =>
      calculateRecoveryMetrics({
        drillStartedAt: '2026-07-17T08:30:00.000Z',
        sourceFrozenAt: '2026-07-17T08:00:00.000Z',
        restorePointAt: '2026-07-17T07:59:00.000Z',
        verifiedAt: new Date('2026-07-17T09:00:00.000Z'),
        rpoTargetMinutes: 5,
        rtoTargetMinutes: 120,
      })
    ).toThrow('SOURCE_FREEZE_UTC cannot be earlier than DRILL_STARTED_UTC')

    expect(() =>
      calculateRecoveryMetrics({
        drillStartedAt: '2026-07-17T08:00:00.000Z',
        sourceFrozenAt: '2026-07-17T08:10:00.000Z',
        restorePointAt: '2026-07-17T08:11:00.000Z',
        verifiedAt: new Date('2026-07-17T09:00:00.000Z'),
        rpoTargetMinutes: 5,
        rtoTargetMinutes: 120,
      })
    ).toThrow('RESTORE_POINT_UTC cannot be later than SOURCE_FREEZE_UTC')
  })

  it('creates a credential-free database target fingerprint', () => {
    expect(
      databaseTargetFingerprint(
        'postgresql://private-user:private-password@source.example.test:5432/onprez?sslmode=require'
      )
    ).toBe('source.example.test:5432/onprez')
  })
})
