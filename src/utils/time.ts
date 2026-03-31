/**
 * Format timestamp into a human-readable relative time string.
 * - Within same day: "n小时前" (n hours ago)
 * - Within 7 days: "n天前" (n days ago)
 * - Beyond 7 days: Shows detailed format (with/without year based on current year)
 */
export function formatRelativeTime(
  timestamp: string | null | undefined,
): string {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Within same day - show hours ago
  if (diffDays === 0 && diffHours >= 0) {
    if (diffHours === 0) {
      if (diffMinutes === 0) {
        return `${diffSeconds}秒前`;
      } else {
        return `${diffMinutes}分钟前`;
      }
    } else {
      return `${diffHours}小时前`;
    }
  }

  // Within 7 days - show days ago
  if (diffDays > 0 && diffDays <= 7) {
    return `${diffDays}天前`;
  }
  // Beyond 7 days - show detailed format
  return formatDetailedTime(date);
}

/**
 * Format a date into detailed format.
 * - If same year: "MM-DD HH:mm:ss" (e.g., "03-30 14:30:45")
 * - Different year: "YYYY-MM-DD HH:mm:ss" (e.g., "2025-03-30 14:30:45")
 */
export function formatDetailedTime(
  timestamp: string | Date | null | undefined,
): string {
  if (!timestamp) {
    return "-";
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  const pad = (num: number) => String(num).padStart(2, "0");

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  if (dateYear === currentYear) {
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const year = dateYear;
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get a display-friendly format of the time.
 * Returns relative time if recent, detailed time if further in past.
 */
export function formatTimeDisplay(timestamp: string | null | undefined): {
  relative: string;
  detailed: string;
} {
  return {
    relative: formatRelativeTime(timestamp),
    detailed: formatDetailedTime(timestamp),
  };
}
