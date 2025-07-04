import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/verify",
  "/protected/(.*)",
  "/api/generate-code",
  "/api/validate-code",
  "/api/validate-token",
  "/api/content/(.*)",
  "/api/track-page-view",
  "/api/test-email",
  "/api/smtp-config",
  "/test-email",
  "/analytics",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

const isAdminRoute = createRouteMatcher(["/dashboard/(.*)", "/api/admin/(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Protect admin routes
  if (isAdminRoute(req)) {
    await auth.protect()
  }

  // Don't protect public routes
  if (isPublicRoute(req)) {
    return
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
