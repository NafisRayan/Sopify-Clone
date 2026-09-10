// Generates muted, restrained SVG "product art" so the app works fully offline.
// Deterministic per-slug. Written to public/images/... and referenced by seed JSON.
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mulberry32 } from '../../src/lib/rng'

const OUT = join(fileURLToPath(import.meta.url), '..', '..', '..', 'public', 'images')

// Muted, Shopify-like backgrounds
const BACKGROUNDS = ['#f4f1ec', '#eef1f0', '#f0eef4', '#f3f0e8', '#eceff3', '#f2eeea']
const INKS: [string, string][] = [
  ['#3d4a3d', '#88a184'],
  ['#31404f', '#7f9bb3'],
  ['#4a3d3d', '#b08f8a'],
  ['#43405a', '#9a93c0'],
  ['#54503c', '#b3ab7e'],
  ['#4f4038', '#b59a83'],
]

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function art(slug: string): string {
  const rnd = mulberry32(hashCode(slug))
  const bg = BACKGROUNDS[Math.floor(rnd() * BACKGROUNDS.length)]!
  const [dark, light] = INKS[Math.floor(rnd() * INKS.length)]!
  const motif = Math.floor(rnd() * 6)
  const cx = 320
  const cy = 310
  let shape = ''
  switch (motif) {
    case 0: // overlapping circles
      shape = `<circle cx="${cx - 55}" cy="${cy}" r="120" fill="${dark}"/>
               <circle cx="${cx + 75}" cy="${cy + 30}" r="90" fill="${light}" opacity="0.85"/>`
      break
    case 1: // arch
      shape = `<path d="M ${cx - 130} ${cy + 120} L ${cx - 130} ${cy} A 130 130 0 0 1 ${cx + 130} ${cy} L ${cx + 130} ${cy + 120} Z" fill="${dark}"/>
               <circle cx="${cx}" cy="${cy - 60}" r="34" fill="${bg}"/>`
      break
    case 2: // rounded square + ring
      shape = `<rect x="${cx - 115}" y="${cy - 115}" width="230" height="230" rx="48" fill="${dark}"/>
               <circle cx="${cx}" cy="${cy}" r="66" fill="none" stroke="${light}" stroke-width="18"/>`
      break
    case 3: // triangle stack
      shape = `<path d="M ${cx} ${cy - 130} L ${cx + 120} ${cy + 100} L ${cx - 120} ${cy + 100} Z" fill="${dark}"/>
               <path d="M ${cx} ${cy - 40} L ${cx + 62} ${cy + 100} L ${cx - 62} ${cy + 100} Z" fill="${light}" opacity="0.9"/>`
      break
    case 4: // semicircles
      shape = `<path d="M ${cx - 140} ${cy + 40} A 140 140 0 0 1 ${cx + 140} ${cy + 40} Z" fill="${dark}"/>
               <circle cx="${cx - 60}" cy="${cy - 70}" r="46" fill="${light}"/>
               <circle cx="${cx + 70}" cy="${cy - 70}" r="46" fill="${dark}" opacity="0.35"/>`
      break
    default: // bottle-ish silhouette
      shape = `<rect x="${cx - 52}" y="${cy - 40}" width="104" height="170" rx="26" fill="${dark}"/>
               <rect x="${cx - 20}" y="${cy - 110}" width="40" height="80" rx="14" fill="${dark}"/>
               <rect x="${cx - 26}" y="${cy + 10}" width="52" height="60" rx="10" fill="${light}" opacity="0.9"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="${bg}"/>
  ${shape}
</svg>`
}

export function writeArt(): void {
  mkdirSync(join(OUT, 'products'), { recursive: true })
  mkdirSync(join(OUT, 'collections'), { recursive: true })
  mkdirSync(join(OUT, 'blog'), { recursive: true })
  mkdirSync(join(OUT, 'banners'), { recursive: true })
}

export function productImage(slug: string): string {
  const p = join(OUT, 'products', `${slug}.svg`)
  writeFileSync(p, art(slug))
  return `/images/products/${slug}.svg`
}

export function collectionImage(slug: string): string {
  const p = join(OUT, 'collections', `${slug}.svg`)
  writeFileSync(p, art(slug))
  return `/images/collections/${slug}.svg`
}

export function blogImage(slug: string): string {
  const p = join(OUT, 'blog', `${slug}.svg`)
  writeFileSync(p, art(slug))
  return `/images/blog/${slug}.svg`
}

export function bannerImage(name: string): string {
  const p = join(OUT, 'banners', `${name}.svg`)
  writeFileSync(p, art(name))
  return `/images/banners/${name}.svg`
}
