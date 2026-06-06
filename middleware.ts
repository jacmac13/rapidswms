import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Must set on both request and response so the refreshed
          // session token is available to subsequent server code.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add logic between createServerClient and getUser().
  // A stale session is refreshed here; skipping getUser() breaks auth.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/pricing', '/login', '/signup', '/sitemap.xml', '/robots.txt'];
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/swms') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (!user && !isPublic) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    // Copy refreshed session cookies onto the redirect so they aren't lost.
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    );
    return redirectResponse;
  }
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/generate', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
