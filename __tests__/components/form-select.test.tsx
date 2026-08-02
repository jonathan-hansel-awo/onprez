import { fireEvent, render, screen } from '@/lib/test-utils'
import { Input, Select, TextArea } from '@/components/form'

describe('form control labels', () => {
  it('associates a visible select label with the native control', () => {
    const onChange = jest.fn()

    render(
      <Select
        id="businessCategory"
        label="Business Category"
        options={[
          { value: 'SALON', label: 'Hair Salon' },
          { value: 'CONSULTING', label: 'Consulting' },
        ]}
        defaultValue="SALON"
        onChange={onChange}
      />
    )

    const select = screen.getByRole('combobox', { name: 'Business Category' })
    fireEvent.change(select, { target: { value: 'CONSULTING' } })

    expect(select).toHaveValue('CONSULTING')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('generates accessible input and textarea names when callers omit ids', () => {
    render(
      <>
        <Input label="Service Name" />
        <TextArea label="Description" />
      </>
    )

    expect(screen.getByRole('textbox', { name: 'Service Name' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument()
  })
})
