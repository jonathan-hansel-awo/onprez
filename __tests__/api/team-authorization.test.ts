/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { requireBusinessRole } from '@/lib/auth/business-access'

import { GET as teamMembersGET } from '@/app/api/team/members/route'

import {
  PATCH as teamMemberPATCH,
  DELETE as teamMemberDELETE,
} from '@/app/api/team/members/[id]/route'

import {
  GET as teamInvitationsGET,
  POST as teamInvitationsPOST,
} from '@/app/api/team/invitations/route'

import { DELETE as teamInvitationDELETE } from '@/app/api/team/invitations/[id]/route'

import {
  GET as invitationAcceptGET,
  POST as invitationAcceptPOST,
} from '@/app/api/team/invitations/accept/[token]/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
    businessMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    teamInvitation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveWritableBusinessContext: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => undefined),
  BusinessAuthError: class BusinessAuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message)
      this.name = 'BusinessAuthError'
    }
  },
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
  }
  businessMember: {
    findMany: jest.Mock
    findUnique: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
    create: jest.Mock
  }
  user: {
    findUnique: jest.Mock
  }
  teamInvitation: {
    findMany: jest.Mock
    findFirst: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return createRequest(path, {
    method,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  })
}

const authUser = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER',
  emailVerified: true,
  mfaEnabled: false,
}

const ownerContext = {
  userId: 'user-1',
  businessId: 'business-1',
  role: 'OWNER',
  isOwner: true,
  business: {
    id: 'business-1',
    name: 'Test Business',
    slug: 'test-business',
    ownerId: 'user-1',
  },
}

const adminContext = {
  ...ownerContext,
  userId: 'admin-1',
  role: 'ADMIN',
  isOwner: false,
}

describe('team API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedResolveWritableBusinessContext.mockResolvedValue(ownerContext)
    mockedRequireBusinessRole.mockResolvedValue(ownerContext)
  })

  describe('GET /api/team/members', () => {
    it('requires owner/admin business context and returns owner plus members', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        ownerId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })

      mockedPrisma.businessMember.findMany.mockResolvedValue([
        {
          id: 'member-1',
          businessId: 'business-1',
          userId: 'member-user-1',
          role: 'STAFF',
          joinedAt: new Date('2026-02-01T00:00:00.000Z'),
          user: {
            id: 'member-user-1',
            email: 'staff@example.com',
            createdAt: new Date('2026-01-15T00:00:00.000Z'),
          },
        },
      ])

      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })

      const response = await teamMembersGET(createRequest('/api/team/members'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.members).toHaveLength(2)

      expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith(
        'user-1',
        expect.any(NextRequest),
        ['ADMIN']
      )

      expect(mockedPrisma.businessMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: 'business-1' },
          select: expect.objectContaining({
            id: true,
            businessId: true,
            userId: true,
            role: true,
            joinedAt: true,
          }),
        })
      )
    })
  })

  describe('PATCH /api/team/members/[id]', () => {
    it('requires owner-only access before updating a member role', async () => {
      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
        businessId: 'business-1',
        userId: 'member-user-1',
        role: 'STAFF',
      })

      mockedPrisma.businessMember.update.mockResolvedValue({
        id: 'member-1',
        businessId: 'business-1',
        userId: 'member-user-1',
        role: 'ADMIN',
        joinedAt: new Date('2026-02-01T00:00:00.000Z'),
        user: {
          id: 'member-user-1',
          email: 'staff@example.com',
        },
      })

      const response = await teamMemberPATCH(
        jsonRequest('/api/team/members/member-1', { role: 'ADMIN' }, 'PATCH'),
        {
          params: Promise.resolve({ id: 'member-1' }),
        }
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [])

      expect(mockedPrisma.businessMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'member-1' },
          data: { role: 'ADMIN' },
        })
      )
    })

    it('prevents a member from changing their own role', async () => {
      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
        businessId: 'business-1',
        userId: 'user-1',
        role: 'ADMIN',
      })

      const response = await teamMemberPATCH(
        jsonRequest('/api/team/members/member-1', { role: 'STAFF' }, 'PATCH'),
        {
          params: Promise.resolve({ id: 'member-1' }),
        }
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.businessMember.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/team/members/[id]', () => {
    it('requires owner-only access and scopes member deletion to the business', async () => {
      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
        businessId: 'business-1',
        userId: 'member-user-1',
        role: 'STAFF',
      })

      mockedPrisma.businessMember.deleteMany.mockResolvedValue({ count: 1 })

      const response = await teamMemberDELETE(createRequest('/api/team/members/member-1'), {
        params: Promise.resolve({ id: 'member-1' }),
      })

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [])

      expect(mockedPrisma.businessMember.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
          businessId: 'business-1',
        },
      })
    })

    it('prevents a member from removing themselves', async () => {
      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
        businessId: 'business-1',
        userId: 'user-1',
        role: 'ADMIN',
      })

      const response = await teamMemberDELETE(createRequest('/api/team/members/member-1'), {
        params: Promise.resolve({ id: 'member-1' }),
      })

      expect(response.status).toBe(400)
      expect(mockedPrisma.businessMember.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/team/invitations', () => {
    it('requires owner/admin context and does not select raw invitation tokens', async () => {
      mockedPrisma.teamInvitation.findMany.mockResolvedValue([
        {
          id: 'invite-1',
          businessId: 'business-1',
          email: 'staff@example.com',
          role: 'STAFF',
          status: 'PENDING',
          invitedBy: 'user-1',
          expiresAt: new Date('2026-08-01T00:00:00.000Z'),
          acceptedAt: null,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          invitedByUser: {
            email: 'owner@example.com',
          },
        },
      ])

      const response = await teamInvitationsGET(createRequest('/api/team/invitations'))

      expect(response.status).toBe(200)

      expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith(
        'user-1',
        expect.any(NextRequest),
        ['ADMIN']
      )

      expect(mockedPrisma.teamInvitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
          select: expect.not.objectContaining({
            token: true,
          }),
        })
      )
    })
  })

  describe('POST /api/team/invitations', () => {
    it('allows owner/admin to invite staff and checks existing membership correctly', async () => {
      mockedResolveWritableBusinessContext.mockResolvedValue(adminContext)

      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        ownerId: 'owner-user-1',
      })

      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'invitee-user-1',
        email: 'staff@example.com',
      })

      mockedPrisma.businessMember.findUnique.mockResolvedValue(null)
      mockedPrisma.teamInvitation.findFirst.mockResolvedValue(null)

      mockedPrisma.teamInvitation.create.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date('2026-08-01T00:00:00.000Z'),
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      })

      const response = await teamInvitationsPOST(
        jsonRequest('/api/team/invitations', {
          email: 'Staff@Example.com',
          role: 'STAFF',
        })
      )

      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)

      expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith(
        'user-1',
        expect.any(NextRequest),
        ['ADMIN']
      )

      expect(mockedPrisma.businessMember.findUnique).toHaveBeenCalledWith({
        where: {
          businessId_userId: {
            businessId: 'business-1',
            userId: 'invitee-user-1',
          },
        },
        select: {
          id: true,
        },
      })

      expect(mockedPrisma.teamInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'business-1',
            email: 'staff@example.com',
            role: 'STAFF',
            invitedBy: 'user-1',
          }),
          select: expect.not.objectContaining({
            token: true,
          }),
        })
      )
    })

    it('blocks non-owner admins from inviting other admins', async () => {
      mockedResolveWritableBusinessContext.mockResolvedValue(adminContext)

      const response = await teamInvitationsPOST(
        jsonRequest('/api/team/invitations', {
          email: 'newadmin@example.com',
          role: 'ADMIN',
        })
      )

      expect(response.status).toBe(403)
      expect(mockedPrisma.teamInvitation.create).not.toHaveBeenCalled()
    })

    it('rejects inviting an existing business member', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        ownerId: 'owner-user-1',
      })

      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'invitee-user-1',
        email: 'staff@example.com',
      })

      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
      })

      const response = await teamInvitationsPOST(
        jsonRequest('/api/team/invitations', {
          email: 'staff@example.com',
          role: 'STAFF',
        })
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.teamInvitation.create).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/team/invitations/[id]', () => {
    it('allows owner/admin to cancel a pending staff invitation', async () => {
      mockedRequireBusinessRole.mockResolvedValue(adminContext)

      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        role: 'STAFF',
        status: 'PENDING',
      })

      mockedPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 1 })

      const response = await teamInvitationDELETE(createRequest('/api/team/invitations/invite-1'), {
        params: Promise.resolve({ id: 'invite-1' }),
      })

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', ['ADMIN'])

      expect(mockedPrisma.teamInvitation.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'invite-1',
          businessId: 'business-1',
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      })
    })

    it('blocks non-owner admins from cancelling admin invitations', async () => {
      mockedRequireBusinessRole.mockResolvedValue(adminContext)

      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        role: 'ADMIN',
        status: 'PENDING',
      })

      const response = await teamInvitationDELETE(createRequest('/api/team/invitations/invite-1'), {
        params: Promise.resolve({ id: 'invite-1' }),
      })

      expect(response.status).toBe(403)
      expect(mockedPrisma.teamInvitation.updateMany).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/team/invitations/accept/[token]', () => {
    it('allows public invitation preview by token with safe fields only', async () => {
      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        business: {
          name: 'Test Business',
        },
      })

      const response = await invitationAcceptGET(
        createRequest('/api/team/invitations/accept/token-12345678901234567890123456789012'),
        {
          params: Promise.resolve({ token: 'token-12345678901234567890123456789012' }),
        }
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toEqual({
        businessName: 'Test Business',
        role: 'STAFF',
        email: 'staff@example.com',
      })

      expect(mockedGetCurrentUser).not.toHaveBeenCalled()
    })

    it('marks expired invitations as expired during preview', async () => {
      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 60 * 1000),
        business: {
          name: 'Test Business',
        },
      })

      mockedPrisma.teamInvitation.update.mockResolvedValue({
        id: 'invite-1',
        status: 'EXPIRED',
      })

      const response = await invitationAcceptGET(
        createRequest('/api/team/invitations/accept/token-12345678901234567890123456789012'),
        {
          params: Promise.resolve({ token: 'token-12345678901234567890123456789012' }),
        }
      )

      expect(response.status).toBe(400)

      expect(mockedPrisma.teamInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: 'EXPIRED' },
      })
    })
  })

  describe('POST /api/team/invitations/accept/[token]', () => {
    it('requires logged-in user email to match invitation email case-insensitively', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...authUser,
        id: 'invitee-user-1',
        email: 'STAFF@example.com',
      })

      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        business: {
          name: 'Test Business',
          ownerId: 'owner-user-1',
        },
      })

      mockedPrisma.businessMember.findUnique.mockResolvedValue(null)

      mockedPrisma.businessMember.create.mockReturnValue({
        businessId: 'business-1',
        userId: 'invitee-user-1',
        role: 'STAFF',
      })

      mockedPrisma.teamInvitation.update.mockReturnValue({
        id: 'invite-1',
        status: 'ACCEPTED',
      })

      mockedPrisma.$transaction.mockResolvedValue([])

      const response = await invitationAcceptPOST(
        createRequest('/api/team/invitations/accept/token-12345678901234567890123456789012', {
          method: 'POST',
        }),
        {
          params: Promise.resolve({ token: 'token-12345678901234567890123456789012' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedPrisma.businessMember.findUnique).toHaveBeenCalledWith({
        where: {
          businessId_userId: {
            businessId: 'business-1',
            userId: 'invitee-user-1',
          },
        },
        select: {
          id: true,
        },
      })

      expect(mockedPrisma.businessMember.create).toHaveBeenCalledWith({
        data: {
          businessId: 'business-1',
          userId: 'invitee-user-1',
          role: 'STAFF',
        },
      })

      expect(mockedPrisma.teamInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: {
          status: 'ACCEPTED',
          acceptedAt: expect.any(Date),
        },
      })

      expect(mockedPrisma.$transaction).toHaveBeenCalled()
    })

    it('rejects accepting an invitation for a different email address', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...authUser,
        id: 'wrong-user',
        email: 'wrong@example.com',
      })

      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        business: {
          name: 'Test Business',
          ownerId: 'owner-user-1',
        },
      })

      const response = await invitationAcceptPOST(
        createRequest('/api/team/invitations/accept/token-12345678901234567890123456789012', {
          method: 'POST',
        }),
        {
          params: Promise.resolve({ token: 'token-12345678901234567890123456789012' }),
        }
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.businessMember.create).not.toHaveBeenCalled()
      expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('rejects accepting an invitation when the user is already a member', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...authUser,
        id: 'invitee-user-1',
        email: 'staff@example.com',
      })

      mockedPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        business: {
          name: 'Test Business',
          ownerId: 'owner-user-1',
        },
      })

      mockedPrisma.businessMember.findUnique.mockResolvedValue({
        id: 'member-1',
      })

      const response = await invitationAcceptPOST(
        createRequest('/api/team/invitations/accept/token-12345678901234567890123456789012', {
          method: 'POST',
        }),
        {
          params: Promise.resolve({ token: 'token-12345678901234567890123456789012' }),
        }
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.businessMember.create).not.toHaveBeenCalled()
      expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
    })
  })
})
