import type { ReactNode } from 'react'
import { PresencePublicationStatus } from '@/components/presence/PresencePublicationStatus'

export default function PresenceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PresencePublicationStatus />
      {children}
    </div>
  )
}
