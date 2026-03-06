import { ImageResponse } from '@vercel/og'
import path from 'path'
import { readFileSync } from 'fs'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const interMedium = readFileSync(
  path.join(process.cwd(), 'app', '_fonts', 'Inter-Medium.ttf'),
)

const SITE_NAME = 'qaiik'

type SimpleOgOptions = {
  title: string
  description: string
}

export function createSimpleOgImage({
  title,
  description,
}: SimpleOgOptions): ImageResponse {
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
        {title}
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
        {description}
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
      ...OG_SIZE,
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
