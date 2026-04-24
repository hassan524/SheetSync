import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a full name.
 * Example: "John Doe" => "JD"
 */

export function getInitials(name: string): string {
  if (!name) return "U"; // Unknown
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Return human-readable "time ago" string.
 * Example: "2026-03-10T12:00:00Z" => "2 days ago"
 */
export function timeAgo(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const i in intervals) {
    const interval = Math.floor(seconds / intervals[i]);
    if (interval >= 1) {
      return interval === 1 ? `1 ${i} ago` : `${interval} ${i}s ago`;
    }
  }

  return "Just now";
}