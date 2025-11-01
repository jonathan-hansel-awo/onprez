import { Resend } from 'resend'
import { env } from '@/lib/config/env'

// Lazy initialization - only create Resend instance when needed
let resendInstance: Resend | null = null

function getResendInstance(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(env.RESEND_API_KEY)
  }
  return resendInstance
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
    const resend = getResendInstance()
    const from = options.from || `${env.FROM_NAME} <${env.FROM_EMAIL}>`

    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })

    // Handle Resend API error response
    if (result && result.error) {
      console.error('Email send error:', result.error)
      return {
        success: false,
        error: result.error.message || 'Email send failed',
      }
    }

    // Handle successful response
    if (result && result.data) {
      return {
        success: true,
        messageId: result.data.id,
      }
    }

    // Fallback for unexpected response format
    return {
      success: false,
      error: 'Unexpected response format from email service',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Email send exception:', error)
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
/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  businessName: string
): Promise<EmailResult> {
  try {
    const resend = getResendInstance()
    const { data, error } = await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password - OnPrez',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #1a202c; margin-top: 0;">Reset Your Password</h1>
              
              <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                Hello from <strong>${businessName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                We received a request to reset the password for your OnPrez account. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 14px 40px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">
                ${resetUrl}
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>
            </div>

            <div style="text-align: center; color: #6c757d; font-size: 14px;">
              <p>This email was sent to ${email}</p>
              <p>
                If you have questions, contact us at 
                <a href="mailto:${env.SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none;">
                  ${env.SUPPORT_EMAIL}
                </a>
              </p>
              <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} OnPrez. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Password reset email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
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
 * Send new device login alert
 */
export async function sendNewDeviceAlert(
  email: string,
  loginInfo: {
    deviceInfo: string
    ipAddress: string
    timestamp: Date
    location: string
  }
): Promise<EmailResult> {
  const { deviceInfo, ipAddress, timestamp, location } = loginInfo

  try {
    const resend = getResendInstance()
    const { data, error } = await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: email,
      subject: 'New Device Login Alert - OnPrez',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Device Login Alert</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="margin: 0 0 10px 0; color: #856404;">⚠️ New Device Login</h2>
                <p style="margin: 0; color: #856404;">We detected a login to your OnPrez account from a new device.</p>
              </div>

              <h3 style="margin-top: 0;">Login Details:</h3>
              <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: 600;">Device</td>
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${deviceInfo}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: 600;">IP Address</td>
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${ipAddress}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: 600;">Location</td>
                  <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${location}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: 600;">Time</td>
                  <td style="padding: 12px;">${timestamp.toLocaleString()}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #004085;">Was this you?</h3>
                <p style="margin-bottom: 15px; color: #004085;">
                  <strong>If this was you:</strong> No action needed. You're all set!
                </p>
                <p style="margin-bottom: 0; color: #004085;">
                  <strong>If this wasn't you:</strong> Please secure your account immediately by changing your password.
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${env.APP_URL}/settings/security" 
                   style="display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: 600;">
                  Secure My Account
                </a>
              </div>
            </div>

            <div style="text-align: center; color: #6c757d; font-size: 14px;">
              <p>This is an automated security alert from OnPrez.</p>
              <p>If you have questions, contact us at ${env.SUPPORT_EMAIL}</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send new device alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('New device alert error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
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
