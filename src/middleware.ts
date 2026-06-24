import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  // Public routes - no auth needed
  const publicRoutes = ['/', '/login', '/register', '/pricing', '/features', '/s/']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/s/'))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected routes
  if (!token) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/tools') || pathname.startsWith('/url-shortener') || pathname.startsWith('/analytics') || pathname.startsWith('/settings') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = payload as { role: string }

    // Admin routes
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect logged-in users from auth pages
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch {
    // Invalid token - clear and redirect
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
