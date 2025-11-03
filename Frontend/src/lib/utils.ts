import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize image URLs returned by the API.
 * - If the URL is already absolute (http/https/data/blob), return as is
 * - If it starts with `/` or is a relative path, prefix with the API origin
 * - Falls back to current window.location.origin when env parsing fails
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return ''
  const trimmed = String(url).trim()
  
  // Firebase Storage URLs are already correct - just check if absolute
  // Both .firebasestorage.app and .appspot.com are valid
  
  // If already absolute (http/https/data/blob), return as-is
  if (/^(data:|blob:|https?:\/\/)/i.test(trimmed)) return trimmed

  // Compute API origin from VITE_API_URL (e.g., http://localhost:5000/api -> http://localhost:5000)
  let origin = ''
  try {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || ''
    origin = apiUrl ? new URL(apiUrl).origin : ''
  } catch {
    origin = ''
  }

  if (!origin && typeof window !== 'undefined') {
    origin = window.location.origin
  }

  if (!origin) return trimmed // last-resort: return as-is

  if (trimmed.startsWith('/')) return origin + trimmed

  // relative like "uploads/xyz.jpg" or "images/abc.png"
  return origin + '/' + trimmed.replace(/^\.\//, '')
}
