export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailMetadata {
  templateName: string
  recipient: string
  sentAt: Date
  messageId?: string
}

export type EmailTemplateType =
  | 'verification'
  | 'password-reset'
  | 'password-changed'
  | 'new-device-login'
  | 'account-locked'
  | 'welcome'
  | 'booking-confirmation'
