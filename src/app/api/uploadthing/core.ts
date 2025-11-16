import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getCurrentUser } from '@/lib/auth/get-user'

const f = createUploadthing()

export const ourFileRouter = {
  // Image uploader for presence pages
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser()

      if (!user) throw new Error('Unauthorized')

      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId)
      console.log('File URL:', file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Gallery uploader - allows multiple images
  galleryUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      const user = await getCurrentUser()

      if (!user) throw new Error('Unauthorized')

      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Gallery upload complete for userId:', metadata.userId)
      console.log('File URL:', file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
