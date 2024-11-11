import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function generateRandomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function middleware(request: NextRequest) {
  // Only redirect the root path
  if (request.nextUrl.pathname === '/') {
    const docId = generateRandomString()
    return NextResponse.redirect(new URL(`/d/${docId}`, request.url))
  }
}

export const config = {
  matcher: '/'
}