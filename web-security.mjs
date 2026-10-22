import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';

const assetDirectories = new Set(['css', 'js', 'img', 'images', 'media', 'data', 'docs', 'datasheets', 'assets', 'fonts', 'videos']);
const htmlDirectories = new Set(['es', 'landing_en', 'partials']);
const assetExtensions = new Set(['.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.mp4', '.webm', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.txt', '.xml']);

export function publicFile(root, requested) {
  if (typeof requested !== 'string' || !requested.startsWith('/') || /[\\\0%]/.test(requested)) return null;
  const parts = requested.split('/').filter(Boolean);
  if (!parts.length || parts.some(part => part.startsWith('.'))) return null;
  const extension = extname(parts.at(-1)).toLowerCase();
  const allowed = parts.length === 1
    ? extension === '.html' || ['robots.txt', 'llm.txt', 'llms.txt', 'sitemap.xml', 'favicon.ico'].includes(parts[0])
    : assetDirectories.has(parts[0]) && assetExtensions.has(extension) || htmlDirectories.has(parts[0]) && extension === '.html';
  if (!allowed) return null;
  const base = realpathSync(root);
  const file = resolve(base, ...parts);
  if (!file.startsWith(base + sep)) return null;
  try {
    const actual = realpathSync(file);
    return actual.startsWith(base + sep) ? actual : null;
  } catch { return null; }
}

export function securityHeadersFor(root) {
  const hashes = new Set();
  const collect = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isFile() && entry.name.endsWith('.html')) {
        for (const match of readFileSync(path, 'utf8').matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
          hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
        }
      } else if (directory === root && entry.isDirectory() && htmlDirectories.has(entry.name)) collect(path);
    }
  };
  collect(root);
  return res => {
    const policy = ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'", "script-src 'self' " + [...hashes].join(' '), "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self' data:", "connect-src 'self'", "media-src 'self' blob:", "frame-src 'self' https://www.speednetfo.com https://speednetfo.com", "form-action 'self' https://wa.me mailto:"];
    if (process.env.NODE_ENV === 'production') policy.push('upgrade-insecure-requests');
    res.setHeader('Content-Security-Policy', policy.join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  };
}
