'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FeaturePreviewMockup } from './feature-preview-mockup'
import { ColorPickerPanel } from './panels/color-picker-panel'
import { FontSelectorPanel } from './panels/font-selector-panel'
import { LayoutOptionsPanel } from './panels/layout-options-panel'
import { Palette, Type, LayoutGrid, Sparkles } from 'lucide-react'

export function FeatureCustomizable() {
  const [currentStep, setCurrentStep] = useState(0)
  const [colorScheme, setColorScheme] = useState('blue')
  const [fontStyle, setFontStyle] = useState('modern')
  const [layout, setLayout] = useState('default')
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Section toggles state
  const [sections, setSections] = useState({
    header: true,
    services: true,
    gallery: true,
    testimonials: true,
  })

  // Auto-play sequence
  useEffect(() => {
    if (!isAutoPlaying) return

    const sequence = [
      { duration: 2000 },
      { duration: 1500, action: () => setColorScheme('purple') },
      { duration: 1500, action: () => setFontStyle('classic') },
      { duration: 1500, action: () => setLayout('stacked') },
      { duration: 1500, action: () => setColorScheme('green') },
      { duration: 1500, action: () => setFontStyle('modern') },
      { duration: 1500, action: () => setLayout('default') },
      { duration: 1500, action: () => setColorScheme('pink') },
      { duration: 2000 },
      { duration: 3000 },
    ]

    const timer = setTimeout(() => {
      const step = sequence[currentStep]
      if (step.action) step.action()

      if (currentStep < sequence.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        setCurrentStep(0)
        setColorScheme('blue')
        setFontStyle('modern')
        setLayout('default')
      }
    }, sequence[currentStep]?.duration || 2000)

    return () => clearTimeout(timer)
  }, [currentStep, isAutoPlaying])

  const showPanels = currentStep >= 0 && currentStep < 8
  const showFinale = currentStep === 9

  // Toggle section handler
  const toggleSection = (sectionKey: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
    setIsAutoPlaying(false)
  }

  return (
    <section className="py-32 bg-gradient-to-b from-white via-gray-50 to-white" id="features">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Fully Customizable</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your handle, your brand. Make it truly yours with our intuitive customization tools.
          </p>
        </motion.div>

        {/* Main Demo Area */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop Layout - 2 Columns with adjusted widths */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Column - Control Panels (narrower - 4 columns) */}
            <div className="col-span-4 space-y-5">
              {/* <AnimatePresence> */}
              {showPanels && (
                <>
                  {/* Color Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <motion.div
                      className={`bg-white rounded-xl shadow-lg border-2 p-5 transition-all ${
                        currentStep === 1 || currentStep === 4 || currentStep === 7
                          ? 'border-onprez-blue ring-4 ring-onprez-blue/20'
                          : 'border-gray-200'
                      }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-onprez-blue to-onprez-purple rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Brand Colors</h4>
                          <p className="text-xs text-gray-500">Choose palette</p>
                        </div>
                      </div>
                      <ColorPickerPanel
                        selectedColor={colorScheme}
                        onColorChange={color => {
                          setColorScheme(color)
                          setIsAutoPlaying(false)
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Font Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                  >
                    <motion.div
                      className={`bg-white rounded-xl shadow-lg border-2 p-5 transition-all ${
                        currentStep === 2 || currentStep === 5
                          ? 'border-onprez-blue ring-4 ring-onprez-blue/20'
                          : 'border-gray-200'
                      }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-onprez-purple to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Type className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Typography</h4>
                          <p className="text-xs text-gray-500">Select fonts</p>
                        </div>
                      </div>
                      <FontSelectorPanel
                        selectedFont={fontStyle}
                        onFontChange={font => {
                          setFontStyle(font)
                          setIsAutoPlaying(false)
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Layout Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                  >
                    <motion.div
                      className={`bg-white rounded-xl shadow-lg border-2 p-5 transition-all ${
                        currentStep === 3 || currentStep === 6
                          ? 'border-onprez-blue ring-4 ring-onprez-blue/20'
                          : 'border-gray-200'
                      }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-onprez-green to-emerald-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Layout Style</h4>
                          <p className="text-xs text-gray-500">Arrange content</p>
                        </div>
                      </div>
                      <LayoutOptionsPanel
                        selectedLayout={layout}
                        onLayoutChange={newLayout => {
                          setLayout(newLayout)
                          setIsAutoPlaying(false)
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Sections Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
                  >
                    <motion.div
                      className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5"
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Page Sections</h4>
                          <p className="text-xs text-gray-500">Toggle visibility</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Header', icon: '🎨', key: 'header' as const },
                          { name: 'Services', icon: '💼', key: 'services' as const },
                          { name: 'Gallery', icon: '🖼️', key: 'gallery' as const },
                          { name: 'Testimonials', icon: '⭐', key: 'testimonials' as const },
                        ].map(section => (
                          <div key={section.key} className="flex items-center justify-between py-2">
                            <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
                              <span className="text-lg">{section.icon}</span>
                              <span>{section.name}</span>
                            </span>
                            <button
                              onClick={() => toggleSection(section.key)}
                              className={`w-11 h-6 rounded-full relative transition-all shadow-inner ${
                                sections[section.key] ? 'bg-onprez-blue' : 'bg-gray-300'
                              }`}
                            >
                              <motion.div
                                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{
                                  x: sections[section.key] ? 22 : 2,
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
              {/* </AnimatePresence> */}
            </div>

            {/* Right Column - Mockup (wider - 8 columns) */}
            <div className="col-span-8 flex items-center justify-center">
              <motion.div
                className="relative w-full max-w-lg"
                // animate={showFinale ? { rotateY: [0, 360] } : {}}
                transition={showFinale ? { duration: 3, ease: 'easeInOut' } : {}}
                style={{ perspective: 1000 }}
                onHoverStart={() => setIsAutoPlaying(false)}
                onHoverEnd={() => setIsAutoPlaying(true)}
              >
                <FeaturePreviewMockup
                  colorScheme={colorScheme}
                  fontStyle={fontStyle}
                  layout={layout}
                  sections={sections}
                />

                {/* Glow effect around mockup */}
                <motion.div
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-onprez-blue/30 to-onprez-purple/30 rounded-2xl blur-3xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Decorative elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-onprez-purple/20 to-pink-500/20 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-onprez-blue/20 to-onprez-green/20 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Mobile/Tablet Layout - Stacked */}
          <div className="lg:hidden space-y-8">
            {/* Mockup */}
            <motion.div
              className="relative max-w-md mx-auto"
              animate={showFinale ? { rotateY: [0, 360] } : {}}
              transition={showFinale ? { duration: 3, ease: 'easeInOut' } : {}}
              style={{ perspective: 1000 }}
              onHoverStart={() => setIsAutoPlaying(false)}
              onHoverEnd={() => setIsAutoPlaying(true)}
            >
              <FeaturePreviewMockup
                colorScheme={colorScheme}
                fontStyle={fontStyle}
                layout={layout}
                sections={sections}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 -z-10 bg-gradient-to-br from-onprez-blue/20 to-onprez-purple/20 rounded-2xl blur-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Control Panels */}
            <div className="space-y-4 max-w-md mx-auto">
              {/* Color Panel */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-onprez-blue to-onprez-purple rounded-xl flex items-center justify-center shadow-lg">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Brand Colors</h4>
                    <p className="text-xs text-gray-500">Choose your palette</p>
                  </div>
                </div>
                <ColorPickerPanel
                  selectedColor={colorScheme}
                  onColorChange={color => {
                    setColorScheme(color)
                    setIsAutoPlaying(false)
                  }}
                />
              </div>

              {/* Font Panel */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-onprez-purple to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Type className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Typography</h4>
                    <p className="text-xs text-gray-500">Select your fonts</p>
                  </div>
                </div>
                <FontSelectorPanel
                  selectedFont={fontStyle}
                  onFontChange={font => {
                    setFontStyle(font)
                    setIsAutoPlaying(false)
                  }}
                />
              </div>

              {/* Layout Panel */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-onprez-green to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <LayoutGrid className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Layout Style</h4>
                    <p className="text-xs text-gray-500">Arrange your content</p>
                  </div>
                </div>
                <LayoutOptionsPanel
                  selectedLayout={layout}
                  onLayoutChange={newLayout => {
                    setLayout(newLayout)
                    setIsAutoPlaying(false)
                  }}
                />
              </div>

              {/* Sections Panel */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Page Sections</h4>
                    <p className="text-xs text-gray-500">Toggle visibility</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Header', icon: '🎨', key: 'header' as const },
                    { name: 'Services', icon: '💼', key: 'services' as const },
                    { name: 'Gallery', icon: '🖼️', key: 'gallery' as const },
                    { name: 'Testimonials', icon: '⭐', key: 'testimonials' as const },
                  ].map(section => (
                    <div key={section.key} className="flex items-center justify-between py-2">
                      <span className="text-gray-700 flex items-center gap-2 font-medium">
                        <span className="text-xl">{section.icon}</span>
                        <span>{section.name}</span>
                      </span>
                      <button
                        onClick={() => toggleSection(section.key)}
                        className={`w-11 h-6 rounded-full relative transition-all shadow-inner ${
                          sections[section.key] ? 'bg-onprez-blue' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{
                            x: sections[section.key] ? 22 : 2,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-2">
            <strong>Customize everything:</strong> Colors, fonts, layouts, sections, and more
          </p>
          <p className="text-sm text-gray-500">
            Real-time preview • No code required • Save presets
          </p>
        </motion.div>
      </div>
    </section>
  )
}
