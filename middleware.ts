import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // No redirects - let the home page load normally
  return NextResponse.next()
}

export const config = {
  matcher: []
}