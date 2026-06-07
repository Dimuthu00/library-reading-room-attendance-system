import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create the server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SECURITY RULES:
  // If the user is trying to access the /admin area but is NOT logged in:
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login"; // Kick them back to the login page
    return NextResponse.redirect(url);
  }

  // If the user IS logged in but tries to go to the login page:
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin"; // Send them straight to the dashboard
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Tell Next.js which paths this guard should watch over
export const config = {
  matcher: [
    "/admin/:path*", // Protect all admin routes
    "/login",        // Watch the login page
  ],
};