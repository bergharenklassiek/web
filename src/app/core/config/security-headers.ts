// For responses from the server handler (concert pages, 404 pages, the sitemap and calendar files). Static files get the
// same headers from netlify.toml, because they don't pass through the handler. A test keeps the two the same.
//
// 'unsafe-inline' for scripts is needed for the small inline scripts Angular adds to rendered pages (event replay and
// loading the stylesheet). Hashes would break the site without warning whenever Angular changes those scripts.
// When adding an external service, add it here too: the browser blocks anything that isn't listed.
export const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://a.storyblok.com https://a2.storyblok.com https://i.ytimg.com",
    "font-src 'self'",
    "connect-src 'self' https://api.storyblok.com https://script.google.com https://script.googleusercontent.com",
    'frame-src https://www.youtube-nocookie.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(securityHeaders).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
