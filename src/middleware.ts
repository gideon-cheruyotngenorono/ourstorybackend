import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'changeme-jwt-secret-in-production'
);

export async function middleware(req: NextRequest) {
  // Routes to protect. Everything starting with /api/ml-
  if (req.nextUrl.pathname.startsWith('/api/ml-')) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      
      // Pass the userId to the route header
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', payload.userId as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/ml-:path*'],
};
