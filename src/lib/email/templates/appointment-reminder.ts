import { format } from 'date-fns'

interface ReminderEmailData {
  customerName: string
  businessName: string
  serviceName: string
  appointmentDate: Date
  appointmentTime: string
  duration: number
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  cancelUrl?: string
  rescheduleUrl?: string
  customMessage?: string
}

export function generateReminderEmailHtml(data: ReminderEmailData): string {
  const formattedDate = format(data.appointmentDate, 'EEEE, d MMMM yyyy')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <tr>
            <td>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                ⏰ Appointment Reminder
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.businessName}
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hi ${data.customerName},
              </p>
              
              <p style="color: #374151; font-size: 16px; margin: 0 0 25px 0;">
                This is a friendly reminder about your upcoming appointment.
              </p>
              
              <!-- Appointment Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Service</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Date</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Time</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${data.appointmentTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Duration</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${data.duration} minutes</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${
                data.customMessage
                  ? `
              <p style="color: #374151; font-size: 14px; margin: 0 0 25px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                ${data.customMessage}
              </p>
              `
                  : ''
              }
              
              <!-- Action Buttons -->
              ${
                data.rescheduleUrl || data.cancelUrl
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    ${
                      data.rescheduleUrl
                        ? `
                    <a href="${data.rescheduleUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
                      Reschedule
                    </a>
                    `
                        : ''
                    }
                    ${
                      data.cancelUrl
                        ? `
                    <a href="${data.cancelUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #6b7280; text-decoration: none; border-radius: 6px; font-weight: 500; border: 1px solid #e5e7eb;">
                      Cancel Appointment
                    </a>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
              
              <!-- Contact Info -->
              ${
                data.businessPhone || data.businessEmail || data.businessAddress
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                      Need to make changes? Contact us:
                    </p>
                    ${data.businessPhone ? `<p style="color: #374151; font-size: 14px; margin: 0;">📞 ${data.businessPhone}</p>` : ''}
                    ${data.businessEmail ? `<p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">✉️ ${data.businessEmail}</p>` : ''}
                    ${data.businessAddress ? `<p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">📍 ${data.businessAddress}</p>` : ''}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 20px; text-align: center;">
          <tr>
            <td>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This reminder was sent by ${data.businessName} via OnPrez
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function generateReminderEmailText(data: ReminderEmailData): string {
  const formattedDate = format(data.appointmentDate, 'EEEE, d MMMM yyyy')

  return `
APPOINTMENT REMINDER

Hi ${data.customerName},

This is a friendly reminder about your upcoming appointment at ${data.businessName}.

APPOINTMENT DETAILS
-------------------
Service: ${data.serviceName}
Date: ${formattedDate}
Time: ${data.appointmentTime}
Duration: ${data.duration} minutes

${data.customMessage ? `Note from ${data.businessName}:\n${data.customMessage}\n` : ''}

${data.businessPhone || data.businessEmail ? `CONTACT US\n----------\n${data.businessPhone ? `Phone: ${data.businessPhone}\n` : ''}${data.businessEmail ? `Email: ${data.businessEmail}\n` : ''}${data.businessAddress ? `Address: ${data.businessAddress}\n` : ''}` : ''}

We look forward to seeing you!

---
Sent via OnPrez
  `.trim()
}
