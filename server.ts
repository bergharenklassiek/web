import { AngularAppEngine, createRequestHandler } from '@angular/ssr'
import { getAllowedHosts, getContext, getTrustProxyHeaders } from '@netlify/angular-runtime/app-engine.js'
import { createCalendarResponse, isCalendarPath } from './src/app/core/calendar/calendar-response'
import { withSecurityHeaders } from './src/app/core/config/security-headers'
import { createSitemapResponse } from './src/app/core/seo/sitemap'

// Netlify-compatible request handler, as documented by @netlify/angular-runtime.
// getAllowedHosts() lists the site's own domains (production, deploy previews, branch deploys) from Netlify's
// environment, because @angular/ssr refuses to render for hosts that aren't allowed.
const angularAppEngine = new AngularAppEngine({
  allowedHosts: getAllowedHosts(),
  trustProxyHeaders: getTrustProxyHeaders(),
})

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  return withSecurityHeaders(await handleRequest(request))
}

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  if (pathname === '/sitemap.xml') {
    return createSitemapResponse()
  }
  if (isCalendarPath(pathname)) {
    return createCalendarResponse(pathname)
  }

  const context = getContext()

  const result = await angularAppEngine.handle(request, context)
  return result || new Response('Not found', { status: 404 })
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
