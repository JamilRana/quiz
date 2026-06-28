import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (path === '/admin' && token) {
      // Already logged in and visiting login page — redirect to dashboard
      return Response.redirect(new URL('/admin/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/(.*)'],
}
