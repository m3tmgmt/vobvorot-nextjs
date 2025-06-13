import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #FF6B9D 0%, #9D4EDD 50%, #00F5FF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          textShadow: '0 4px 8px rgba(0,0,0,0.4)',
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