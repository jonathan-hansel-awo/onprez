import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

process.stdout.write(
  [
    'Add these values to your local environment and deployment environment:',
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`,
    `VAPID_PRIVATE_KEY=${keys.privateKey}`,
    'VAPID_SUBJECT=mailto:support@onprez.com',
    '',
    'Keep VAPID_PRIVATE_KEY secret and reuse this key pair across deployments.',
    '',
  ].join('\n')
)
