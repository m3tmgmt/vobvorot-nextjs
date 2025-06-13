import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #FF6B9D 0%, #00F5FF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
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