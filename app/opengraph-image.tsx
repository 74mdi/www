import { ImageResponse } from 'next/og'
import path from 'path'
import { readFileSync } from 'fs'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const interMedium = readFileSync(
  path.join(process.cwd(), 'app', '_fonts', 'Inter-Medium.ttf'),
)

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px',
        background: 'linear-gradient(135deg, #ffffff 0%, #eef1f5 100%)',
        color: '#0f172a',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '38px',
          right: '48px',
          width: '112px',
          height: '112px',
          borderRadius: '9999px',
          background: '#111111',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: 30,
            letterSpacing: 0.4,
            color: '#475569',
          }}
        >
          personal website
        </span>
        <h1
          style={{
            marginTop: '20px',
            marginBottom: 0,
            fontSize: 98,
            lineHeight: 1,
            letterSpacing: -2.2,
            color: '#020617',
          }}
        >
          7amdi
        </h1>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '82%',
        }}
      >
        <span
          style={{
            fontSize: 44,
            lineHeight: 1.22,
            color: '#0f172a',
          }}
        >
          salam ana 7amdi
        </span>
        <span
          style={{
            fontSize: 27,
            color: '#475569',
          }}
        >
          thoughts, projects, and siftli
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interMedium,
          style: 'normal',
          weight: 500,
        },
      ],
    },
  )
}
