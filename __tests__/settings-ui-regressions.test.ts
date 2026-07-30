import fs from 'fs'
import path from 'path'

describe('settings UI regressions', () => {
  const accountSidebar = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'account', 'AccountSidebar.tsx'),
    'utf8'
  )
  const accountLayout = fs.readFileSync(
    path.join(process.cwd(), 'src', 'app', 'account', 'layout.tsx'),
    'utf8'
  )
  const appSettingsPage = fs.readFileSync(
    path.join(process.cwd(), 'src', 'app', 'dashboard', 'settings', 'app', 'page.tsx'),
    'utf8'
  )
  const appSettingsStyles = fs.readFileSync(
    path.join(
      process.cwd(),
      'src',
      'app',
      'dashboard',
      'settings',
      'app',
      'app-settings.module.css'
    ),
    'utf8'
  )

  it('keeps account navigation limited to account-specific security tools', () => {
    expect(accountSidebar).toContain("name: 'Security'")
    expect(accountSidebar).toContain("name: 'Sessions'")
    expect(accountSidebar).toContain("name: 'Activity'")
    expect(accountSidebar).not.toContain("name: 'Profile'")
    expect(accountSidebar).not.toContain("name: 'Billing'")
    expect(accountSidebar).not.toContain("name: 'Notifications'")
    expect(accountSidebar).not.toContain("badge: 'Soon'")
  })

  it('stacks the account heading and email on narrow screens', () => {
    expect(accountLayout).toContain(
      'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
    )
    expect(accountLayout).toContain('break-all text-sm text-gray-600 sm:text-right')
  })

  it('anchors push notification switch thumbs inside their tracks', () => {
    expect(appSettingsPage).toContain("import styles from './app-settings.module.css'")
    expect(appSettingsPage).toContain('<div className={styles.bookingAlerts}>')
    expect(appSettingsStyles).toContain(":global(button[role='switch'] > span)")
    expect(appSettingsStyles).toContain('left: 0;')
  })
})
