import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/lib/test-utils'
import { SectionList } from '@/components/presence/editor/SectionList'
import { PresenceEditorLayout } from '@/components/presence/editor/PresenceEditorLayout'
import { ImageUpload } from '@/components/ui/image-upload'
import { BookingWidget } from '@/components/booking'
import type { PageSection } from '@/types/page-sections'

jest.mock('@/components/presence/editor/SectionEditorPanel', () => ({
  SectionEditorPanel: () => <div>Section editor</div>,
}))

jest.mock('@/components/presence/editor/PresencePreview', () => ({
  PresencePreview: () => <div data-testid="presence-preview">Mobile page preview</div>,
}))

const sections: PageSection[] = [
  {
    id: 'hero',
    type: 'HERO',
    order: 0,
    isVisible: true,
    data: { title: 'Welcome' },
  },
  {
    id: 'about',
    type: 'ABOUT',
    order: 1,
    isVisible: true,
    data: { title: 'About', content: 'Our story' },
  },
]

describe('mobile core-flow affordances', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('lets touch users reorder sections without drag or hover', async () => {
    const user = userEvent.setup()
    const onSectionReorder = jest.fn()

    render(
      <SectionList
        sections={sections}
        selectedSectionId={null}
        onSectionSelect={jest.fn()}
        onSectionUpdate={jest.fn()}
        onSectionDelete={jest.fn()}
        onSectionReorder={onSectionReorder}
        onSectionAdd={jest.fn()}
        businessId="business-1"
      />
    )

    expect(screen.getByRole('button', { name: 'Move hero section up' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move hero section down' }))

    expect(onSectionReorder).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'about', order: 0 }),
      expect.objectContaining({ id: 'hero', order: 1 }),
    ])
  })

  it('switches the page editor between edit and mobile preview panes', async () => {
    const user = userEvent.setup()

    render(
      <PresenceEditorLayout
        sections={sections}
        onSave={jest.fn(async () => ({ success: true }))}
        onPublish={jest.fn(async () => ({ success: true }))}
        businessId="business-1"
        businessSlug="studio"
      />
    )

    const previewContainer = screen.getByTestId('presence-preview').parentElement
    expect(previewContainer).toHaveClass('hidden')

    await user.click(screen.getByRole('button', { name: /^Preview$/ }))

    expect(previewContainer).toHaveClass('block')
    expect(screen.getByRole('button', { name: /^Preview$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('keeps uploaded-image actions visible and touch sized without hover', () => {
    render(
      <ImageUpload
        businessId="business-1"
        purpose="business-cover"
        value="https://example.com/cover.jpg"
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    const changeButton = screen.getByRole('button', { name: 'Change' })
    const removeButton = screen.getByRole('button', { name: 'Remove' })

    expect(changeButton).toHaveClass('min-h-11')
    expect(removeButton).toHaveClass('min-h-11')
    expect(changeButton.parentElement).toHaveClass('opacity-100')
  })

  it('renders mobile-sized booking progress and navigation controls', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { services: [], categories: [] },
        }),
      } as Response
    }) as typeof fetch

    render(
      <BookingWidget
        businessId="business-1"
        businessHandle="studio"
        businessName="Studio"
        businessTimezone="Europe/London"
      />
    )

    expect(screen.getByRole('button', { name: '1' })).toHaveClass('h-11', 'w-11')
    expect(screen.getByRole('button', { name: /continue/i })).toHaveClass('min-h-11')
    await waitFor(() => expect(screen.getByText(/no services available/i)).toBeInTheDocument())
  })
})
