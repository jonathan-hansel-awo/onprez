import { useState } from 'react'

export function useClipboard(timeout: number = 2000) {
  const [isCopied, setIsCopied] = useState(false)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), timeout)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return { isCopied, copy }
}
