import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// 👇 Gagamitin na natin ang environment variable para pareho sila ng Backend!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_2026';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('clinic_session')?.value;
  const { pathname } = req.nextUrl;

  // 👇 FIX: Dinagdag natin ang '/register' dito para hindi na siya harangin!
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Redirect to login if no session
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // I-encode ang secret na galing sa itaas
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Siguraduhing uppercase ang role para sa checking
    const role = (payload.role as string)?.toUpperCase(); 

    // RBAC Frontend Route Protection
    if (pathname.startsWith('/nurse') && role !== 'NURSE') {
      return NextResponse.json({ error: '403 Access Denied: Authorized for Nurses only' }, { status: 403 });
    }
    if (pathname.startsWith('/head-teacher') && role !== 'HEAD_TEACHER') {
      return NextResponse.json({ error: '403 Access Denied: Authorized for Head Teachers only' }, { status: 403 });
    }
    if (pathname.startsWith('/student') && role !== 'STUDENT') {
      return NextResponse.json({ error: '403 Access Denied: Authorized for Students only' }, { status: 403 });
    }

    // Pass User info in headers for API backend resource-level security
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.id as string);
    requestHeaders.set('x-user-role', role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware Verification Error:", error);
    // Session Expiration or Invalid Token
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('clinic_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};