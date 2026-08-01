/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('P2-019 image delivery contract', () => {
  it('authorises the tenant before looking up a content-addressed Cloudinary asset', () => {
    const source = read('src/app/api/upload/image/route.ts')
    const authorization = source.indexOf('await requireBusinessRole')
    const fingerprint = source.indexOf('await fingerprintImageUpload')
    const lookup = source.indexOf('await findStoredImage(publicId)')
    const optimisation = source.indexOf('await sanitizeImageUpload')
    const upload = source.indexOf('await uploadToCloudinary')

    expect(authorization).toBeGreaterThan(-1)
    expect(fingerprint).toBeGreaterThan(authorization)
    expect(lookup).toBeGreaterThan(fingerprint)
    expect(optimisation).toBeGreaterThan(lookup)
    expect(upload).toBeGreaterThan(optimisation)
  })

  it('uses a deterministic non-overwriting public ID and reports reuse to callers', () => {
    const source = read('src/app/api/upload/image/route.ts')

    expect(source).toContain('public_id: fingerprint')
    expect(source).toContain('overwrite: false')
    expect(source).toContain('unique_filename: false')
    expect(source).toContain('reused,')
    expect(source).toContain('OnPrez reused it instead of uploading a duplicate')
  })

  it('surfaces duplicate reuse in both user and assisted-admin upload experiences', () => {
    const dashboardUploader = read('src/components/ui/image-upload.tsx')
    const adminWorkspace = read('src/components/admin/AdminBusinessWorkspace.tsx')

    expect(dashboardUploader).toContain("title={confirmation.reused ? 'Existing image reused'")
    expect(dashboardUploader).toContain('data.data?.reused === true')
    expect(adminWorkspace).toContain('result.data.reused === true')
  })

  it('uses responsive image sizing for uploaded-image previews', () => {
    const uploader = read('src/components/ui/image-upload.tsx')

    expect(uploader).toContain('sizes="(max-width: 768px) 100vw, 640px"')
    expect(uploader).not.toContain('unoptimized')
  })
})
