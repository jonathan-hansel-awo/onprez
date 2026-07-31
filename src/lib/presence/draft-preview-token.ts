import { randomUUID } from 'crypto'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import { env } from '@/lib/config/env'

export const DRAFT_PREVIEW_EXPIRES_IN_SECONDS = 24 * 60 * 60

const DRAFT_PREVIEW_TYPE = 'presence-draft-preview'
const DRAFT_PREVIEW_AUDIENCE = 'onprez:presence-draft-preview'

interface DraftPreviewClaims extends JwtPayload {
  type: typeof DRAFT_PREVIEW_TYPE
  pageId: string
  businessId: string
  pageVersion: number
  exp: number
}

export interface PresenceDraftPreviewToken {
  token: string
  expiresAt: Date
}

export interface VerifiedPresenceDraftPreviewToken {
  pageId: string
  businessId: string
  pageVersion: number
  expiresAt: Date
}

export class DraftPreviewTokenError extends Error {
  constructor(
    message: string,
    public code: 'EXPIRED' | 'INVALID' | 'GENERATION_FAILED'
  ) {
    super(message)
    this.name = 'DraftPreviewTokenError'
  }
}

function isDraftPreviewClaims(payload: string | JwtPayload): payload is DraftPreviewClaims {
  return (
    typeof payload !== 'string' &&
    payload.type === DRAFT_PREVIEW_TYPE &&
    typeof payload.pageId === 'string' &&
    payload.pageId.length > 0 &&
    typeof payload.businessId === 'string' &&
    payload.businessId.length > 0 &&
    Number.isInteger(payload.pageVersion) &&
    payload.pageVersion > 0 &&
    typeof payload.exp === 'number'
  )
}

export function isPresenceDraftPreviewVersionCurrent(
  tokenPageVersion: number,
  currentPageVersion: number
) {
  return tokenPageVersion === currentPageVersion
}

export function createPresenceDraftPreviewToken(input: {
  pageId: string
  businessId: string
  pageVersion: number
  expiresInSeconds?: number
}): PresenceDraftPreviewToken {
  try {
    const expiresIn = input.expiresInSeconds ?? DRAFT_PREVIEW_EXPIRES_IN_SECONDS
    const signOptions: SignOptions = {
      algorithm: 'HS256',
      audience: DRAFT_PREVIEW_AUDIENCE,
      expiresIn,
      issuer: env.NEXT_PUBLIC_APP_NAME,
      jwtid: randomUUID(),
    }

    const token = jwt.sign(
      {
        type: DRAFT_PREVIEW_TYPE,
        pageId: input.pageId,
        businessId: input.businessId,
        pageVersion: input.pageVersion,
      },
      env.JWT_SECRET,
      signOptions
    )
    const decoded = jwt.decode(token)

    if (!decoded || !isDraftPreviewClaims(decoded)) {
      throw new DraftPreviewTokenError(
        'The draft preview token could not be decoded after generation.',
        'GENERATION_FAILED'
      )
    }

    return {
      token,
      expiresAt: new Date(decoded.exp * 1000),
    }
  } catch (error) {
    if (error instanceof DraftPreviewTokenError) throw error

    throw new DraftPreviewTokenError(
      `The draft preview token could not be generated: ${error instanceof Error ? error.message : 'unknown error'}`,
      'GENERATION_FAILED'
    )
  }
}

export function verifyPresenceDraftPreviewToken(token: string): VerifiedPresenceDraftPreviewToken {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: DRAFT_PREVIEW_AUDIENCE,
      issuer: env.NEXT_PUBLIC_APP_NAME,
    })

    if (!isDraftPreviewClaims(decoded)) {
      throw new DraftPreviewTokenError('The draft preview token payload is invalid.', 'INVALID')
    }

    return {
      pageId: decoded.pageId,
      businessId: decoded.businessId,
      pageVersion: decoded.pageVersion,
      expiresAt: new Date(decoded.exp * 1000),
    }
  } catch (error) {
    if (error instanceof DraftPreviewTokenError) throw error

    if (error instanceof jwt.TokenExpiredError) {
      throw new DraftPreviewTokenError('This draft preview link has expired.', 'EXPIRED')
    }

    throw new DraftPreviewTokenError('This draft preview link is invalid.', 'INVALID')
  }
}
