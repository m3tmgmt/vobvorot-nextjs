import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Force cache bust
export const revalidate = 0

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #333333 50%, #2d2d2d 75%, #000000 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: 'white',
          textShadow: '0 4px 12px rgba(0,0,0,0.8)',
          borderRadius: '32px',
        }}
      >
        V
      </div>
    ),
    {
      ...size,
    }
  )
}