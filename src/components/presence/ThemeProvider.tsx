'use client'

import { createContext, useContext, ReactNode } from 'react'

interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  headingFont?: string
  buttonStyle?: 'rounded' | 'square' | 'pill'
  spacing?: 'compact' | 'normal' | 'relaxed'
}

const ThemeContext = createContext<ThemeSettings>({})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  theme: ThemeSettings
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          // @ts-expect-error CSS variables
          '--primary-color': theme.primaryColor || '#3B82F6',
          '--secondary-color': theme.secondaryColor || '#8B5CF6',
          '--font-body': theme.fontFamily || 'Inter',
          '--font-heading': theme.headingFont || 'Inter',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
