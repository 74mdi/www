import { NextRequest, NextResponse } from 'next/server'

function constantTimeEqual(left: string, right: string): boolean {
  let difference = left.length ^ right.length
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

export function proxy(request: NextRequest) {
  const expectedKey = process.env.MH_ACCESS_KEY?.trim()
  const authorization = request.headers.get('authorization') ?? ''
  let password = ''

  if (authorization.startsWith('Basic ')) {
    try {
      const credentials = atob(authorization.slice(6))
      password = credentials.slice(credentials.indexOf(':') + 1)
    } catch {
      password = ''
    }
  }

  if (expectedKey && constantTimeEqual(password, expectedKey)) {
    return NextResponse.next()
  }

  return new NextResponse(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Listening history", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}

export const config = { matcher: ['/mh', '/mh/:path*'] }
