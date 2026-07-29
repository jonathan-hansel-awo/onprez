import { execFileSync } from 'node:child_process'

const files = [
  'src/app/dashboard/settings/features/page.tsx',
  'src/app/dashboard/settings/notifications/page.tsx',
  'src/lib/services/booking-notifications.ts',
  'src/lib/services/inquiry-notifications.ts',
]

execFileSync('node_modules/.bin/prettier', ['--write', ...files], { stdio: 'inherit' })

const diff = execFileSync('git', ['diff', '--', ...files], { encoding: 'utf8' })
console.log('FORMATTED_DIFF_BEGIN')
console.log(diff)
console.log('FORMATTED_DIFF_END')

process.exit(1)
