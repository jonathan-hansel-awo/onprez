import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 616 176">
  <defs>
    <linearGradient id="onprez-gradient" x1="20" y1="28" x2="596" y2="148" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <path d="M119 34.3A62 62 0 1 0 141.7 57" fill="none" stroke="url(#onprez-gradient)" stroke-width="23.2" stroke-linecap="round"/>
  <text x="172" y="126" fill="url(#onprez-gradient)" font-family="Inter, Arial, sans-serif" font-size="108" font-weight="750" letter-spacing="-5">nPrez</text>
</svg>`

const WORDMARK_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(WORDMARK_SVG)}`
const SUPPORTED_SIZES = new Set([180, 192, 512])

export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get('size') || 192)
  const maskable = request.nextUrl.searchParams.get('maskable') === '1'

  if (!SUPPORTED_SIZES.has(size) || (maskable && size !== 512)) {
    return new Response('Unsupported icon size', { status: 400 })
  }

  const wordmarkWidth = size === 180 ? 150 : size === 192 ? 160 : maskable ? 360 : 430
  const wordmarkHeight = Math.round((wordmarkWidth * 176) / 616)
  const rounded = size !== 180 && !maskable

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F7FF',
          borderRadius: rounded ? Math.round(size * 0.21) : 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WORDMARK_DATA_URI} alt="" width={wordmarkWidth} height={wordmarkHeight} />
      </div>
    </div>,
    {
      width: size,
      height: size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  )
}
