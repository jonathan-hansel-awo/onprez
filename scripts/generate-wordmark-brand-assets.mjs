import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BACKGROUND = '#F7F7FF'

async function resizedWordmark(source, width) {
  return sharp(source).trim().resize({ width }).png().toBuffer()
}

async function createRoundedIcon({ source, size, wordmarkWidth, radius, opaque = false }) {
  const wordmark = await resizedWordmark(source, wordmarkWidth)
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: opaque ? BACKGROUND : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })

  const layers = []
  if (!opaque) {
    layers.push({
      input: Buffer.from(
        `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${BACKGROUND}"/></svg>`
      ),
    })
  }
  layers.push({ input: wordmark, gravity: 'center' })

  return canvas.composite(layers).png().toBuffer()
}

function createIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const directory = Buffer.alloc(images.length * 16)
  let offset = header.length + directory.length

  images.forEach(({ size, data }, index) => {
    const entry = index * 16
    directory.writeUInt8(size >= 256 ? 0 : size, entry)
    directory.writeUInt8(size >= 256 ? 0 : size, entry + 1)
    directory.writeUInt8(0, entry + 2)
    directory.writeUInt8(0, entry + 3)
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(data.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })

  return Buffer.concat([header, directory, ...images.map(image => image.data)])
}

async function main() {
  const publicDirectory = path.join(process.cwd(), 'public')
  const appDirectory = path.join(process.cwd(), 'src', 'app')
  const source = await fs.readFile(path.join(publicDirectory, 'onprez-wordmark.svg'))

  const icon192 = await createRoundedIcon({
    source,
    size: 192,
    wordmarkWidth: 160,
    radius: 40,
  })
  const icon512 = await createRoundedIcon({
    source,
    size: 512,
    wordmarkWidth: 430,
    radius: 108,
  })
  const maskable512 = await createRoundedIcon({
    source,
    size: 512,
    wordmarkWidth: 360,
    radius: 0,
    opaque: true,
  })
  const appleTouchIcon = await createRoundedIcon({
    source,
    size: 180,
    wordmarkWidth: 150,
    radius: 0,
    opaque: true,
  })

  await Promise.all([
    fs.writeFile(path.join(publicDirectory, 'icon-192.png'), icon192),
    fs.writeFile(path.join(publicDirectory, 'icon-512.png'), icon512),
    fs.writeFile(path.join(publicDirectory, 'icon-maskable-512.png'), maskable512),
    fs.writeFile(path.join(publicDirectory, 'apple-touch-icon.png'), appleTouchIcon),
  ])

  const icoImages = await Promise.all(
    [16, 32, 48, 64].map(async size => ({
      size,
      data: await sharp(icon512).resize(size, size).png().toBuffer(),
    }))
  )
  await fs.writeFile(path.join(appDirectory, 'favicon.ico'), createIco(icoImages))
}

await main()
