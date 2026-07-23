import { sendEmail, sendVerificationEmail, type EmailResult } from '@/lib/services/email'

export interface AccountVerificationEmailInput {
  email: string
  verificationUrl: string
  businessName?: string
  presenceUrl?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function renderAccountVerificationEmail(input: AccountVerificationEmailInput) {
  const greeting = input.businessName ? `Hi ${input.businessName},` : 'Hi,'
  const presenceText = input.presenceUrl
    ? `\n\nYour presence page address is reserved at ${input.presenceUrl}. After verifying, sign in to finish your page and click Publish when you are ready. Your page will remain a private draft until you publish it.`
    : '\n\nAfter verifying, sign in to finish your presence page and click Publish when you are ready. Your page will remain a private draft until you publish it.'
  const presenceHtml = input.presenceUrl
    ? `
      <div style="margin: 30px 0 0; padding: 20px; border-radius: 8px; background-color: #eff6ff; border: 1px solid #bfdbfe;">
        <p style="margin: 0 0 8px; color: #1e3a8a; font-size: 14px; font-weight: 600;">Your presence page address</p>
        <p style="margin: 0 0 12px; color: #1d4ed8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; word-break: break-all;">${escapeHtml(input.presenceUrl)}</p>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">After verifying, sign in to finish your page and click <strong>Publish</strong> when you are ready. Your page will remain a private draft until you publish it.</p>
      </div>`
    : `
      <div style="margin: 30px 0 0; padding: 20px; border-radius: 8px; background-color: #eff6ff; border: 1px solid #bfdbfe;">
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">After verifying, sign in to finish your presence page and click <strong>Publish</strong> when you are ready. Your page will remain a private draft until you publish it.</p>
      </div>`

  return {
    subject: 'Verify your email address - OnPrez',
    text: `${greeting}\n\nThanks for signing up for OnPrez. Verify your email address using the link below:\n\n${input.verificationUrl}\n\nThis link will expire in 24 hours.${presenceText}\n\nIf you did not create an account with OnPrez, you can safely ignore this email.\n\nBest regards,\nThe OnPrez Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Verify your email address</h2>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">${escapeHtml(greeting)}</p>
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Thanks for signing up for OnPrez. Click the button below to activate your account:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(input.verificationUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              ${presenceHtml}
              <p style="margin: 30px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">This verification link will expire in 24 hours. If you did not create an account with OnPrez, you can safely ignore this email.</p>
              <p style="margin: 20px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">If the button does not work, copy and paste this link into your browser:<br><a href="${escapeHtml(input.verificationUrl)}" style="color: #2563eb; word-break: break-all;">${escapeHtml(input.verificationUrl)}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">Best regards,<br>The OnPrez Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }
}

export async function sendAccountVerificationEmail(
  input: AccountVerificationEmailInput
): Promise<EmailResult> {
  const content = renderAccountVerificationEmail(input)

  // Keep compatibility with consumers that mock the original verification sender
  // without exposing the lower-level generic sender.
  if (typeof sendEmail !== 'function') {
    return sendVerificationEmail(input.email, input.verificationUrl, input.businessName)
  }

  return sendEmail({
    to: input.email,
    ...content,
  })
}
