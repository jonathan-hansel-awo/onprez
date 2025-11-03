import { useEffect, useRef } from 'react'

export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create live region for screen readers
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    document.body.appendChild(announcer)
    announcerRef.current = announcer

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = (message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message
    }
  }

  return announce
}
