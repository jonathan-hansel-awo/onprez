// Animation configuration and constants

export const animationConfig = {
  // Scroll animation triggers
  scrollTrigger: {
    threshold: 0.3, // 30% of element visible
    rootMargin: '0px',
  },

  // Parallax speeds
  parallax: {
    slow: 0.3,
    normal: 0.5,
    fast: 0.8,
    faster: 1.2,
  },

  // Stagger delays
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },

  // Standard durations
  duration: {
    instant: 0,
    fast: 0.3,
    normal: 0.6,
    slow: 0.9,
  },

  // Performance settings
  performance: {
    // Reduce animations on mobile
    reducedMotionOnMobile: true,

    // Maximum concurrent animations
    maxConcurrentAnimations: 4,

    // Use GPU acceleration
    useGPU: true,
  },

  // Feature flags
  features: {
    parallax: true,
    textReveal: true,
    hoverEffects: true,
    complexAnimations: true,
  },
}

// Get animation config based on device
export function getResponsiveConfig(isMobile: boolean) {
  if (isMobile && animationConfig.performance.reducedMotionOnMobile) {
    return {
      ...animationConfig,
      duration: {
        ...animationConfig.duration,
        normal: 0.4, // Faster on mobile
        slow: 0.6,
      },
      stagger: {
        ...animationConfig.stagger,
        normal: 0.08, // Less stagger on mobile
      },
      features: {
        ...animationConfig.features,
        parallax: false, // Disable parallax on mobile
        complexAnimations: false,
      },
    }
  }

  return animationConfig
}
