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
  // New background options
  backgroundType?: 'solid' | 'gradient' | 'pattern'
  backgroundGradient?: {
    type: 'linear' | 'radial'
    angle?: number // for linear
    colors: string[]
  }
  backgroundPattern?: {
    type: 'dots' | 'grid' | 'diagonal' | 'waves' | 'none'
    color?: string
    opacity?: number
    size?: 'small' | 'medium' | 'large'
  }
}

const ThemeContext = createContext<ThemeSettings>({})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  theme: ThemeSettings
  children: ReactNode
}

// Helper to generate gradient CSS
function generateGradientCSS(gradient: ThemeSettings['backgroundGradient']): string {
  if (!gradient || gradient.colors.length < 2) return ''

  const colorStops = gradient.colors.join(', ')

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${colorStops})`
  }

  const angle = gradient.angle ?? 180
  return `linear-gradient(${angle}deg, ${colorStops})`
}

// Helper to generate pattern CSS
function generatePatternCSS(
  pattern: ThemeSettings['backgroundPattern'],
  bgColor: string
): { background: string; backgroundSize?: string } {
  if (!pattern || pattern.type === 'none') {
    return { background: bgColor }
  }

  const patternColor = pattern.color || '#000000'
  const opacity = (pattern.opacity ?? 10) / 100
  const patternColorWithOpacity = `${patternColor}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`

  const sizeMap = {
    small: { dots: '20px 20px', grid: '20px 20px', diagonal: '10px 10px', waves: '40px 20px' },
    medium: { dots: '40px 40px', grid: '40px 40px', diagonal: '20px 20px', waves: '80px 40px' },
    large: { dots: '60px 60px', grid: '60px 60px', diagonal: '30px 30px', waves: '120px 60px' },
  }

  const size = sizeMap[pattern.size || 'medium'][pattern.type]

  switch (pattern.type) {
    case 'dots':
      return {
        background: `radial-gradient(circle, ${patternColorWithOpacity} 1px, transparent 1px), ${bgColor}`,
        backgroundSize: size,
      }
    case 'grid':
      return {
        background: `linear-gradient(${patternColorWithOpacity} 1px, transparent 1px), linear-gradient(90deg, ${patternColorWithOpacity} 1px, transparent 1px), ${bgColor}`,
        backgroundSize: size,
      }
    case 'diagonal':
      return {
        background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${patternColorWithOpacity} 10px, ${patternColorWithOpacity} 11px), ${bgColor}`,
        backgroundSize: size,
      }
    case 'waves':
      return {
        background: `radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, ${patternColorWithOpacity} 50%, ${patternColorWithOpacity} 51%, transparent 51%), ${bgColor}`,
        backgroundSize: size,
      }
    default:
      return { background: bgColor }
  }
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
  }, [theme])

  // Generate background styles
  const getBackgroundStyles = (): React.CSSProperties => {
    const bgColor = theme.backgroundColor || '#FFFFFF'

    switch (theme.backgroundType) {
      case 'gradient':
        if (theme.backgroundGradient) {
          return {
            background: generateGradientCSS(theme.backgroundGradient),
          }
        }
        return { backgroundColor: bgColor }

      case 'pattern':
        if (theme.backgroundPattern) {
          const patternStyles = generatePatternCSS(theme.backgroundPattern, bgColor)
          return {
            background: patternStyles.background,
            backgroundSize: patternStyles.backgroundSize,
          }
        }
        return { backgroundColor: bgColor }

      case 'solid':
      default:
        return { backgroundColor: bgColor }
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          ...getBackgroundStyles(),
          color: theme.textColor || '#111827',
          fontFamily: theme.fontFamily || 'Inter',
          minHeight: '100%',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
