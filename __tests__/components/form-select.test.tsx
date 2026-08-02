import { fireEvent, render, screen } from '@/lib/test-utils'
import { Select } from '@/components/form'

describe('Select', () => {
  it('associates its visible label with the native select control', () => {
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
})
