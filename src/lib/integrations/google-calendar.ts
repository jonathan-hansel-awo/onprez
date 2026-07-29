import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

export const GOOGLE_CALENDAR_OAUTH_COOKIE = 'onprez_google_calendar_oauth'

export interface GoogleCalendarConnection {
  connected: true
  calendarId: string
  accountEmail: string | null
  encryptedRefreshToken: string
  tokenIv: string
  scopes: string[]
  connectedAt: string
  lastSyncedAt: string | null
  lastError: string | null
}

interface GoogleTokenResponse {
  access_token: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  token_type?: string
  id_token?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getEncryptionKey(): Buffer {
  const source =
    process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY ||
    process.env.MFA_ENCRYPTION_KEY ||
    process.env.JWT_SECRET

  if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY) {
    throw new Error('GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY is required in production')
  }

  return createHash('sha256')
    .update(source || 'development-only-google-calendar-key')
    .digest()
}

export function encryptGoogleCalendarToken(value: string): { encrypted: string; iv: string } {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encrypted: `${encrypted.toString('base64url')}.${tag.toString('base64url')}`,
    iv: iv.toString('base64url'),
  }
}

export function decryptGoogleCalendarToken(encrypted: string, iv: string): string {
  const [ciphertext, authTag] = encrypted.split('.')
  if (!ciphertext || !authTag) throw new Error('Invalid encrypted Google Calendar token')

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function getGoogleCalendarOAuthConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || ''
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${appUrl.replace(/\/$/, '')}/api/business/calendar/google/callback`

  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && redirectUri),
  }
}

export function buildGoogleCalendarAuthorizationUrl(
  state: string,
  loginHint?: string | null
): string {
  const config = getGoogleCalendarOAuthConfig()
  if (!config.configured) throw new Error('Google Calendar OAuth is not configured')

  const url = new URL(GOOGLE_AUTH_ENDPOINT)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent select_account')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('scope', `${GOOGLE_CALENDAR_SCOPE} openid email`)
  url.searchParams.set('state', state)
  if (loginHint) url.searchParams.set('login_hint', loginHint)
  return url.toString()
}

async function parseGoogleError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string
      error_description?: string
      message?: string
    }
    return (
      payload.error_description ||
      payload.message ||
      payload.error ||
      `Google API error ${response.status}`
    )
  } catch {
    return `Google API error ${response.status}`
  }
}

export async function exchangeGoogleCalendarCode(code: string): Promise<GoogleTokenResponse> {
  const config = getGoogleCalendarOAuthConfig()
  if (!config.configured) throw new Error('Google Calendar OAuth is not configured')

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(await parseGoogleError(response))
  return (await response.json()) as GoogleTokenResponse
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const config = getGoogleCalendarOAuthConfig()
  if (!config.configured) throw new Error('Google Calendar OAuth is not configured')

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(await parseGoogleError(response))
  const tokens = (await response.json()) as GoogleTokenResponse
  return tokens.access_token
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!response.ok) return null
  const payload = (await response.json()) as { email?: string }
  return payload.email || null
}

export function readGoogleCalendarConnection(settings: unknown): GoogleCalendarConnection | null {
  const root = asRecord(settings)
  const integrations = asRecord(root.integrations)
  const value = asRecord(integrations.googleCalendar)

  if (
    value.connected !== true ||
    typeof value.encryptedRefreshToken !== 'string' ||
    typeof value.tokenIv !== 'string'
  ) {
    return null
  }

  return {
    connected: true,
    calendarId: typeof value.calendarId === 'string' ? value.calendarId : 'primary',
    accountEmail: typeof value.accountEmail === 'string' ? value.accountEmail : null,
    encryptedRefreshToken: value.encryptedRefreshToken,
    tokenIv: value.tokenIv,
    scopes: Array.isArray(value.scopes)
      ? value.scopes.filter((scope): scope is string => typeof scope === 'string')
      : [GOOGLE_CALENDAR_SCOPE],
    connectedAt:
      typeof value.connectedAt === 'string' ? value.connectedAt : new Date(0).toISOString(),
    lastSyncedAt: typeof value.lastSyncedAt === 'string' ? value.lastSyncedAt : null,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
  }
}

export function mergeGoogleCalendarConnection(
  settings: unknown,
  connection: GoogleCalendarConnection | null
): Record<string, unknown> {
  const root = { ...asRecord(settings) }
  const integrations = { ...asRecord(root.integrations) }

  if (connection) integrations.googleCalendar = connection
  else delete integrations.googleCalendar

  if (Object.keys(integrations).length > 0) root.integrations = integrations
  else delete root.integrations

  return root
}

export async function storeGoogleCalendarConnection(input: {
  businessId: string
  refreshToken: string
  accessToken: string
  scopes?: string
}) {
  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    select: { settings: true },
  })
  if (!business) throw new Error('Business not found')

  const encrypted = encryptGoogleCalendarToken(input.refreshToken)
  const accountEmail = await fetchGoogleAccountEmail(input.accessToken)
  const now = new Date().toISOString()
  const connection: GoogleCalendarConnection = {
    connected: true,
    calendarId: 'primary',
    accountEmail,
    encryptedRefreshToken: encrypted.encrypted,
    tokenIv: encrypted.iv,
    scopes: input.scopes?.split(' ').filter(Boolean) || [GOOGLE_CALENDAR_SCOPE],
    connectedAt: now,
    lastSyncedAt: null,
    lastError: null,
  }

  await prisma.business.update({
    where: { id: input.businessId },
    data: {
      settings: mergeGoogleCalendarConnection(
        business.settings,
        connection
      ) as Prisma.InputJsonValue,
    },
  })

  return connection
}

export async function disconnectGoogleCalendar(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { settings: true },
  })
  if (!business) throw new Error('Business not found')

  const connection = readGoogleCalendarConnection(business.settings)
  if (connection) {
    try {
      const refreshToken = decryptGoogleCalendarToken(
        connection.encryptedRefreshToken,
        connection.tokenIv
      )
      await fetch(GOOGLE_REVOKE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: refreshToken }),
      })
    } catch (error) {
      logger.warn('google_calendar.disconnect_revoke_failed', {
        businessId,
        errorType: error instanceof Error ? error.name : typeof error,
      })
    }
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      settings: mergeGoogleCalendarConnection(business.settings, null) as Prisma.InputJsonValue,
    },
  })
}

function readEventId(metadata: unknown): string | null {
  const integrations = asRecord(asRecord(metadata).integrations)
  const google = asRecord(integrations.googleCalendar)
  return typeof google.eventId === 'string' ? google.eventId : null
}

function mergeEventMetadata(
  metadata: unknown,
  value: { eventId?: string | null; syncedAt?: string; error?: string | null }
): Record<string, unknown> {
  const root = { ...asRecord(metadata) }
  const integrations = { ...asRecord(root.integrations) }
  const google = { ...asRecord(integrations.googleCalendar) }

  if (value.eventId === null) delete google.eventId
  else if (value.eventId) google.eventId = value.eventId
  if (value.syncedAt) google.syncedAt = value.syncedAt
  if (value.error === null) delete google.error
  else if (value.error) google.error = value.error

  integrations.googleCalendar = google
  root.integrations = integrations
  return root
}

async function updateConnectionStatus(
  businessId: string,
  connection: GoogleCalendarConnection,
  update: { lastSyncedAt?: string | null; lastError?: string | null }
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { settings: true },
  })
  if (!business) return

  await prisma.business.update({
    where: { id: businessId },
    data: {
      settings: mergeGoogleCalendarConnection(business.settings, {
        ...connection,
        ...update,
      }) as Prisma.InputJsonValue,
    },
  })
}

function googleEventBody(appointment: {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  startTime: Date
  endTime: Date
  timezone: string
  service: { name: string }
  business: { name: string; address: string | null }
}) {
  return {
    summary: `${appointment.service.name} — ${appointment.customerName}`,
    description: [
      `OnPrez booking reference: ${appointment.id.slice(0, 8).toUpperCase()}`,
      `Customer: ${appointment.customerName}`,
      `Email: ${appointment.customerEmail}`,
      ...(appointment.customerPhone ? [`Phone: ${appointment.customerPhone}`] : []),
      `Service: ${appointment.service.name}`,
    ].join('\n'),
    location: appointment.business.address || undefined,
    start: { dateTime: appointment.startTime.toISOString(), timeZone: appointment.timezone },
    end: { dateTime: appointment.endTime.toISOString(), timeZone: appointment.timezone },
    status: 'confirmed',
    transparency: 'opaque',
    extendedProperties: { private: { onprezAppointmentId: appointment.id } },
  }
}

export async function syncAppointmentToGoogleCalendar(
  appointmentId: string
): Promise<{ success: boolean; skipped?: boolean; eventId?: string; error?: string }> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true } },
      business: { select: { name: true, address: true, settings: true } },
    },
  })

  if (!appointment || appointment.status !== 'CONFIRMED') {
    return { success: true, skipped: true }
  }

  const connection = readGoogleCalendarConnection(appointment.business.settings)
  if (!connection) return { success: true, skipped: true }

  try {
    const refreshToken = decryptGoogleCalendarToken(
      connection.encryptedRefreshToken,
      connection.tokenIv
    )
    const accessToken = await refreshGoogleAccessToken(refreshToken)
    const existingEventId = readEventId(appointment.metadata)
    const calendarId = encodeURIComponent(connection.calendarId || 'primary')
    const eventBody = googleEventBody(appointment)

    let response: Response
    if (existingEventId) {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(existingEventId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      )

      if (response.status === 404) {
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          }
        )
      }
    } else {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      )
    }

    if (!response.ok) throw new Error(await parseGoogleError(response))
    const event = (await response.json()) as { id?: string }
    if (!event.id) throw new Error('Google Calendar did not return an event ID')

    const syncedAt = new Date().toISOString()
    await Promise.all([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          metadata: mergeEventMetadata(appointment.metadata, {
            eventId: event.id,
            syncedAt,
            error: null,
          }) as Prisma.InputJsonValue,
        },
      }),
      updateConnectionStatus(appointment.businessId, connection, {
        lastSyncedAt: syncedAt,
        lastError: null,
      }),
    ])

    logger.info('google_calendar.booking_synced', {
      bookingId: appointment.id,
      businessId: appointment.businessId,
    })
    return { success: true, eventId: event.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Calendar sync failed'
    logger.warn('google_calendar.booking_sync_failed', {
      bookingId: appointment.id,
      businessId: appointment.businessId,
      errorType: error instanceof Error ? error.name : typeof error,
    })
    await Promise.allSettled([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          metadata: mergeEventMetadata(appointment.metadata, {
            error: message,
          }) as Prisma.InputJsonValue,
        },
      }),
      updateConnectionStatus(appointment.businessId, connection, { lastError: message }),
    ])
    return { success: false, error: message }
  }
}

export async function removeAppointmentFromGoogleCalendar(
  appointmentId: string
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      businessId: true,
      metadata: true,
      business: { select: { settings: true } },
    },
  })
  if (!appointment) return { success: true, skipped: true }

  const eventId = readEventId(appointment.metadata)
  const connection = readGoogleCalendarConnection(appointment.business.settings)
  if (!eventId || !connection) return { success: true, skipped: true }

  try {
    const refreshToken = decryptGoogleCalendarToken(
      connection.encryptedRefreshToken,
      connection.tokenIv
    )
    const accessToken = await refreshGoogleAccessToken(refreshToken)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendarId || 'primary')}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw new Error(await parseGoogleError(response))
    }

    const syncedAt = new Date().toISOString()
    await Promise.all([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          metadata: mergeEventMetadata(appointment.metadata, {
            eventId: null,
            syncedAt,
            error: null,
          }) as Prisma.InputJsonValue,
        },
      }),
      updateConnectionStatus(appointment.businessId, connection, {
        lastSyncedAt: syncedAt,
        lastError: null,
      }),
    ])
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Calendar removal failed'
    await Promise.allSettled([
      updateConnectionStatus(appointment.businessId, connection, { lastError: message }),
    ])
    return { success: false, error: message }
  }
}
