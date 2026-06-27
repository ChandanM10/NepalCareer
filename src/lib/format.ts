/**
 * Helper to serialize Prisma models to API-friendly shapes (parse JSON fields).
 */
export function parseJsonArray<T = any>(value: string | null | undefined): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseJsonObject<T = Record<string, any>>(value: string | null | undefined): T {
  if (!value) return {} as T
  try {
    return JSON.parse(value) as T
  } catch {
    return {} as T
  }
}

export function formatSalary(min?: number | null, max?: number | null, currency = "USD"): string {
  if (!min && !max) return "Competitive"
  const fmt = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
    return `$${n}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return "Competitive"
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function initials(name?: string | null): string {
  if (!name) return "?"
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
}

/** Color hash for avatar backgrounds based on string */
export function colorFromString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const hue = h % 360
  return `hsl(${hue} 65% 55%)`
}

export function companyInitialsLogo(name: string, size = 48): string {
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
  const bg = colorFromString(name)
  // Use SVG so we can render gradients
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${bg}"/><text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="${size * 0.4}" fill="white">${initials}</text></svg>`)}`
}
