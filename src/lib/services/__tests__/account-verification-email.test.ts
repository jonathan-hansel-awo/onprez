import { renderAccountVerificationEmail } from '@/lib/services/account-verification-email'

describe('account verification email', () => {
  it('explains verification, preserves the presence address, and states that publishing is manual', () => {
    const content = renderAccountVerificationEmail({
      email: 'louise@example.com',
      verificationUrl: 'https://onprez.com/verify-email?token=verification-token',
      businessName: 'Louise Beauty & Wellness',
      presenceUrl: 'https://onprez.com/louisebeauty',
    })

    expect(content.subject).toBe('Verify your email address - OnPrez')
    expect(content.text).toContain('https://onprez.com/louisebeauty')
    expect(content.text).toContain('click Publish')
    expect(content.text).toContain('private draft until you publish it')
    expect(content.html).toContain('Your presence page address')
    expect(content.html).toContain('https://onprez.com/louisebeauty')
    expect(content.html).toContain('<strong>Publish</strong>')
    expect(content.html).toContain('private draft until you publish it')
  })

  it('still explains the draft and publish step when no presence address is available', () => {
    const content = renderAccountVerificationEmail({
      email: 'owner@example.com',
      verificationUrl: 'https://onprez.com/verify-email?token=verification-token',
    })

    expect(content.text).toContain('finish your presence page')
    expect(content.html).toContain('finish your presence page')
    expect(content.text).toContain('private draft until you publish it')
  })
})
