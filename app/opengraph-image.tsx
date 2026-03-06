import { ImageResponse } from 'next/og'
import path from 'path'
import { readFileSync } from 'fs'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const interMedium = readFileSync(
  path.join(process.cwd(), 'app', '_fonts', 'Inter-Medium.ttf'),
)

const SITE_NAME = 'qaiik'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '66px 74px',
        background: '#ffffff',
        color: '#111111',
        fontFamily: 'Inter',
      }}
    >
      <h1
        style={{
          margin: 0,
          maxWidth: '82%',
          fontSize: 96,
          lineHeight: 1.05,
          letterSpacing: -1.2,
          fontFamily: 'serif',
        }}
      >
        7amdi
      </h1>

      <p
        style={{
          maxWidth: '82%',
          margin: 0,
          fontSize: 40,
          lineHeight: 1.22,
          color: '#2f2f2f',
          fontFamily: 'Inter',
        }}
      >
        salam ana 7amdi
      </p>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 20,
        }}
      >
        <span
          style={{
            fontSize: 28,
            lineHeight: 1,
            color: '#5a5a5a',
            letterSpacing: 0.2,
          }}
        >
          {SITE_NAME}
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
