import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { securityHeaders, withSecurityHeaders } from './security-headers';

describe('security headers', () => {
  it('should be the same for static files, in netlify.toml', () => {
    const toml = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');

    Object.entries(securityHeaders).forEach(([name, value]) => {
      expect(toml).toContain(`${name} = "${value}"`);
    });
  });

  it('should allow the services the site uses, and nothing else from outside', () => {
    const policy = securityHeaders['Content-Security-Policy'];

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain('https://www.youtube-nocookie.com');
    expect(policy).toContain('https://api.storyblok.com');
    expect(policy).toContain('https://script.google.com');
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it('should add the headers and keep the rest of the response', async () => {
    const response = withSecurityHeaders(new Response('Niet gevonden', { status: 404, headers: { 'Content-Type': 'text/plain', 'Netlify-CDN-Cache-Control': 'public' } }));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Niet gevonden');
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(response.headers.get('Netlify-CDN-Cache-Control')).toBe('public');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toBe(securityHeaders['Content-Security-Policy']);
  });
});
