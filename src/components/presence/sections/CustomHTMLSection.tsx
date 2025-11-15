'use client'

import { CustomHTMLSection as CustomHTMLSectionType } from '@/types/page-sections'

interface CustomHTMLSectionProps {
  section: CustomHTMLSectionType
}

export function CustomHTMLSection({ section }: CustomHTMLSectionProps) {
  const { html, css } = section.data

  return (
    <section className="py-16 md:py-24">
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}
