import { act, fireEvent, render, renderHook, screen, waitFor } from '@/lib/test-utils'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { ImageUpload } from '@/components/ui/image-upload'
import { useCreateBooking } from '@/lib/hooks/useCreateBooking'

describe('standard async feedback states', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('announces success and exposes a recovery action for errors', () => {
    const retry = jest.fn()
    const { rerender } = render(
      <ActionFeedback
        status="success"
        title="Changes saved"
        message="Your public page is up to date."
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Changes saved')

    rerender(
      <ActionFeedback
        status="error"
        title="Changes not saved"
        message="Your edits are still here."
        actionLabel="Try again"
        onAction={retry}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Your edits are still here.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate image uploads and confirms completion', async () => {
    let resolveUpload: ((value: Response) => void) | undefined
    const uploadResponse = new Promise<Response>(resolve => {
      resolveUpload = resolve
    })
    const fetchMock = jest.fn(() => uploadResponse)
    global.fetch = fetchMock as typeof fetch
    const onChange = jest.fn()

    const { container } = render(
      <ImageUpload businessId="business-1" purpose="gallery" onChange={onChange} />
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const image = new File(['image'], 'studio.webp', { type: 'image/webp' })

    fireEvent.change(input, { target: { files: [image] } })
    fireEvent.change(input, { target: { files: [image] } })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveUpload?.({
      ok: true,
      json: async () => ({ success: true, data: { url: 'https://example.com/studio.webp' } }),
    } as Response)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://example.com/studio.webp'))
    expect(screen.getByRole('status')).toHaveTextContent('Image uploaded')
    expect(screen.getByText(/save your changes to publish it/i)).toBeInTheDocument()
  })

  it('allows only one in-flight booking request', async () => {
    Object.defineProperty(global.crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn(() => 'booking-idempotency-key'),
    })
    let resolveBooking: ((value: Response) => void) | undefined
    const bookingResponse = new Promise<Response>(resolve => {
      resolveBooking = resolve
    })
    const fetchMock = jest.fn(() => bookingResponse)
    global.fetch = fetchMock as typeof fetch
    const { result } = renderHook(() => useCreateBooking())
    const payload = {
      businessId: 'business-1',
      serviceId: 'service-1',
      date: '2026-07-24',
      startTime: '10:00',
      endTime: '11:00',
      customerName: 'Ada Okoro',
      customerEmail: 'ada@example.com',
    }

    let firstRequest: ReturnType<typeof result.current.createBooking>
    let duplicateRequest: ReturnType<typeof result.current.createBooking>
    act(() => {
      firstRequest = result.current.createBooking(payload)
      duplicateRequest = result.current.createBooking(payload)
    })

    await expect(duplicateRequest!).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Idempotency-Key': 'booking-idempotency-key' }),
      })
    )

    resolveBooking?.({
      ok: true,
      json: async () => ({
        data: {
          id: 'booking-1',
          confirmationNumber: 'OP-123',
          status: 'PENDING',
        },
      }),
    } as Response)

    await act(async () => {
      await expect(firstRequest!).resolves.toEqual(
        expect.objectContaining({ confirmationNumber: 'OP-123' })
      )
    })
  })
})
