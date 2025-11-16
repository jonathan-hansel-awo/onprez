'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'

interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
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
  // Apply theme to CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement

    // Colors
    root.style.setProperty('--theme-primary', theme.primaryColor || '#3B82F6')
    root.style.setProperty('--theme-secondary', theme.secondaryColor || '#8B5CF6')
    root.style.setProperty('--theme-accent', theme.accentColor || '#10B981')
    root.style.setProperty('--theme-bg', theme.backgroundColor || '#FFFFFF')
    root.style.setProperty('--theme-text', theme.textColor || '#111827')

    // Typography
    root.style.setProperty('--theme-font-body', theme.fontFamily || 'Inter')
    root.style.setProperty('--theme-font-heading', theme.headingFont || 'Inter')

    // Border radius based on button style
    const borderRadius =
      theme.buttonStyle === 'square' ? '0px' : theme.buttonStyle === 'pill' ? '9999px' : '0.5rem'
    root.style.setProperty('--theme-radius', borderRadius)

    // Spacing
    const spacing =
      theme.spacing === 'compact' ? '3rem' : theme.spacing === 'relaxed' ? '6rem' : '4rem'
    root.style.setProperty('--theme-spacing', spacing)
  }, [theme]) // This effect runs whenever theme changes

  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          backgroundColor: theme.backgroundColor || '#FFFFFF',
          color: theme.textColor || '#111827',
          fontFamily: theme.fontFamily || 'Inter',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
