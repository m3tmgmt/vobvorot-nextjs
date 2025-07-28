import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Force cache bust with timestamp
export const revalidate = 0

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #000000 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          borderRadius: '6px',
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