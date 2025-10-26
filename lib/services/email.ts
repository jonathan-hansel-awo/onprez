import { Resend } from 'resend'

let resend: Resend

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    if (!resend) {
      throw new Error('Resend client not initialized - missing API key')
    }

    const response = await resend.emails.send({
      from: options.from || `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string
): Promise<EmailResult> {
  const html = renderVerificationEmail(verificationUrl, name)
  const text = `Hi${name ? ` ${name}` : ''},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with OnPrez, you can safely ignore this email.\n\nBest regards,\nThe OnPrez Team`

  return sendEmail({
    to: email,
    subject: 'Verify your email address - OnPrez',
    html,
    text,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  name?: string
): Promise<EmailResult> {
  const html = renderPasswordResetEmail(resetUrl, name)
  const text = `Hi${name ? ` ${name}` : ''},\n\nYou recently requested to reset your password for your OnPrez account. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nBest regards,\nThe OnPrez Team`

  return sendEmail({
    to: email,
    subject: 'Reset your password - OnPrez',
    html,
    text,
  })
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string,
  ipAddress?: string,
  timestamp?: Date
): Promise<EmailResult> {
  const html = renderPasswordChangedEmail(name, ipAddress, timestamp)
  const text = `Hi${name ? ` ${name}` : ''},\n\nYour OnPrez account password was successfully changed.\n\nIf you made this change, you can safely ignore this email.\n\nIf you didn't change your password, please contact us immediately at support@onprez.com.\n\nBest regards,\nThe OnPrez Team`

  return sendEmail({
    to: email,
    subject: 'Your password has been changed - OnPrez',
    html,
    text,
  })
}

/**
 * Send new device login alert
 */
export async function sendNewDeviceLoginEmail(
  email: string,
  name?: string,
  deviceInfo?: string,
  ipAddress?: string,
  location?: string,
  timestamp?: Date
): Promise<EmailResult> {
  const html = renderNewDeviceLoginEmail(name, deviceInfo, ipAddress, location, timestamp)
  const text = `Hi${name ? ` ${name}` : ''},\n\nWe detected a new login to your OnPrez account:\n\nDevice: ${deviceInfo || 'Unknown'}\nIP Address: ${ipAddress || 'Unknown'}\nLocation: ${location || 'Unknown'}\nTime: ${timestamp?.toLocaleString() || 'Just now'}\n\nIf this was you, you can safely ignore this email.\n\nIf you don't recognize this activity, please secure your account immediately by changing your password.\n\nBest regards,\nThe OnPrez Team`

  return sendEmail({
    to: email,
    subject: 'New device login detected - OnPrez',
    html,
    text,
  })
}

/**
 * Send account locked notification
 */
export async function sendAccountLockedEmail(
  email: string,
  name?: string,
  reason?: string,
  unlockTime?: Date
): Promise<EmailResult> {
  const html = renderAccountLockedEmail(name, reason, unlockTime)
  const text = `Hi${name ? ` ${name}` : ''},\n\nYour OnPrez account has been temporarily locked due to multiple failed login attempts.\n\n${unlockTime ? `Your account will be automatically unlocked at ${unlockTime.toLocaleString()}.` : 'Please contact support to unlock your account.'}\n\nIf you didn't attempt to log in, please contact us immediately at support@onprez.com.\n\nBest regards,\nThe OnPrez Team`

  return sendEmail({
    to: email,
    subject: 'Your account has been locked - OnPrez',
    html,
    text,
  })
}

/**
 * Render verification email HTML
 */
function renderVerificationEmail(verificationUrl: string, name?: string): string {
  return `
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Verify your email address</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Thanks for signing up for OnPrez! Please verify your email address by clicking the button below:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">
                This link will expire in 24 hours. If you didn't create an account with OnPrez, you can safely ignore this email.
              </p>
              
              <p style="margin: 20px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">
                Best regards,<br>The OnPrez Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Render password reset email HTML
 */
function renderPasswordResetEmail(resetUrl: string, name?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Reset your password</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                You recently requested to reset your password for your OnPrez account. Click the button below to reset it:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
              
              <p style="margin: 20px 0 0; color: #737373; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">
                Best regards,<br>The OnPrez Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Render password changed email HTML
 */
function renderPasswordChangedEmail(name?: string, ipAddress?: string, timestamp?: Date): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Password changed successfully</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your OnPrez account password was successfully changed.
              </p>
              
              ${
                ipAddress || timestamp
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #737373; font-size: 14px;"><strong>Details:</strong></p>
                    ${ipAddress ? `<p style="margin: 0 0 5px; color: #737373; font-size: 14px;">IP Address: ${ipAddress}</p>` : ''}
                    ${timestamp ? `<p style="margin: 0; color: #737373; font-size: 14px;">Time: ${timestamp.toLocaleString()}</p>` : ''}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
              
              <p style="margin: 20px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                If you made this change, you can safely ignore this email.
              </p>
              
              <p style="margin: 20px 0 0; color: #dc2626; font-size: 16px; line-height: 1.5;">
                <strong>If you didn't change your password</strong>, please contact us immediately at support@onprez.com.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">
                Best regards,<br>The OnPrez Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Render new device login email HTML
 */
function renderNewDeviceLoginEmail(
  name?: string,
  deviceInfo?: string,
  ipAddress?: string,
  location?: string,
  timestamp?: Date
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New device login</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">New device login detected</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                We detected a new login to your OnPrez account:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    ${deviceInfo ? `<p style="margin: 0 0 10px; color: #737373; font-size: 14px;"><strong>Device:</strong> ${deviceInfo}</p>` : ''}
                    ${ipAddress ? `<p style="margin: 0 0 10px; color: #737373; font-size: 14px;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
                    ${location ? `<p style="margin: 0 0 10px; color: #737373; font-size: 14px;"><strong>Location:</strong> ${location}</p>` : ''}
                    ${timestamp ? `<p style="margin: 0; color: #737373; font-size: 14px;"><strong>Time:</strong> ${timestamp.toLocaleString()}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                If this was you, you can safely ignore this email.
              </p>
              
              <p style="margin: 20px 0 0; color: #dc2626; font-size: 16px; line-height: 1.5;">
                <strong>If you don't recognize this activity</strong>, please secure your account immediately by changing your password.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">
                Best regards,<br>The OnPrez Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Render account locked email HTML
 */
function renderAccountLockedEmail(name?: string, reason?: string, unlockTime?: Date): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account locked</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">OnPrez</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #dc2626; font-size: 20px; font-weight: 600;">Your account has been locked</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your OnPrez account has been temporarily locked ${reason ? `due to ${reason}` : 'for security reasons'}.
              </p>
              
              ${
                unlockTime
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #991b1b; font-size: 16px; line-height: 1.5;">
                      <strong>Unlock Time:</strong> ${unlockTime.toLocaleString()}
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : `
              <p style="margin: 20px 0; color: #dc2626; font-size: 16px; line-height: 1.5;">
                Please contact support at support@onprez.com to unlock your account.
              </p>
              `
              }
              
              <p style="margin: 20px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                If you didn't attempt to log in, please contact us immediately at support@onprez.com.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 14px;">
                Best regards,<br>The OnPrez Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
