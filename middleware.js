import { NextResponse } from 'next/server';

// Performance-optimized middleware with response time tracking
export function middleware(request) {
  const startTime = performance.now();
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except auth-related)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow login page and root page
  if (pathname === '/login' || pathname === '/') {
    const response = NextResponse.next();
    addPerformanceHeaders(response, startTime);
    return response;
  }

  // For all other routes, let client-side auth handle it for better performance
  // This prevents server-side redirects which can be slower
  const response = NextResponse.next();
  addPerformanceHeaders(response, startTime);
  return response;
}

function addPerformanceHeaders(response, startTime) {
  const endTime = performance.now();
  const responseTime = Math.round(endTime - startTime);
  
  // Add performance and security headers
  response.headers.set('X-Response-Time', `${responseTime}ms`);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  // Compression hint
  response.headers.set('Vary', 'Accept-Encoding');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};