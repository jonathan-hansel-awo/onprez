import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = [
  'src/app/dashboard/settings/features/page.tsx',
  'src/app/dashboard/settings/notifications/page.tsx',
  'src/lib/services/booking-notifications.ts',
  'src/lib/services/inquiry-notifications.ts',
]

execFileSync('node_modules/.bin/prettier', ['--write', ...files], { stdio: 'inherit' })

for (const file of files) {
  console.log(`FORMATTED_FILE_BEGIN:${file}`)
  console.log(readFileSync(file).toString('base64'))
  console.log(`FORMATTED_FILE_END:${file}`)
}

process.exit(1)
