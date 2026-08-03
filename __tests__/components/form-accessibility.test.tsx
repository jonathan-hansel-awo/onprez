import { fireEvent, render, screen } from '@/lib/test-utils'
import { FormError, Input, Select, TextArea } from '@/components/form'

describe('shared form accessibility', () => {
  it('connects generated control ids to their validation messages', () => {
    render(
      <>
        <Input label="Email address" error="Email is required" />
        <Select
          label="Business category"
          error="Choose a category"
          options={[{ value: '', label: 'Choose one' }]}
        />
        <TextArea label="Description" error="Description is required" />
      </>
    )

    for (const name of ['Email address', 'Business category', 'Description']) {
      const control = screen.getByRole(name === 'Business category' ? 'combobox' : 'textbox', {
        name,
      })
      const messageId = control.getAttribute('aria-describedby')

      expect(control).toHaveAttribute('aria-invalid', 'true')
      expect(messageId).toBeTruthy()
      expect(document.getElementById(messageId!)).toHaveAttribute('role', 'alert')
    }
  })

  it('preserves supplied descriptions while adding helper text semantics', () => {
    render(
      <>
        <span id="privacy-note">Never shared publicly.</span>
        <Input
          label="Contact email"
          helperText="Used for booking notices."
          aria-describedby="privacy-note"
        />
        <TextArea label="Biography" helperText="Keep this concise." />
      </>
    )

    const email = screen.getByRole('textbox', { name: 'Contact email' })
    const emailDescriptions = email.getAttribute('aria-describedby')?.split(' ') || []
    expect(emailDescriptions).toContain('privacy-note')
    expect(emailDescriptions).toHaveLength(2)
    expect(document.getElementById(emailDescriptions[1])).toHaveTextContent(
      'Used for booking notices.'
    )

    const biography = screen.getByRole('textbox', { name: 'Biography' })
    expect(document.getElementById(biography.getAttribute('aria-describedby')!)).toHaveTextContent(
      'Keep this concise.'
    )
  })

  it('announces a form summary and keeps dismissal keyboard-operable', () => {
    const onDismiss = jest.fn()

    render(
      <FormError
        title="Please check the form"
        errors={['Email is required', 'Password is required']}
        dismissible
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
    const dismiss = screen.getByRole('button', { name: 'Dismiss error' })
    expect(dismiss).toHaveAttribute('type', 'button')
    fireEvent.click(dismiss)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
