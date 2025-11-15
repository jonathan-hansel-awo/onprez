'use client'

interface RichTextPreviewProps {
  content: string
}

export function RichTextPreview({ content }: RichTextPreviewProps) {
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
}
