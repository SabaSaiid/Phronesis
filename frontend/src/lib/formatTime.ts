/**
 * Formats a Unix timestamp (in milliseconds) into a concise relative time string.
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats a Unix timestamp into a full human-readable date + time string
 * for use in hover tooltips and preview popovers.
 */
export function formatExactDateTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface DateGroupedItems<T extends { timestamp: number }> {
  today: T[];
  yesterday: T[];
  pastWeek: T[];
  older: T[];
}

/**
 * Groups timestamped items into chronological buckets:
 * Today, Yesterday, Previous 7 Days, Older.
 */
export function groupByDate<T extends { timestamp: number }>(
  items: T[]
): DateGroupedItems<T> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfPastWeek = startOfToday - 6 * 86_400_000;

  const groups: DateGroupedItems<T> = {
    today: [],
    yesterday: [],
    pastWeek: [],
    older: [],
  };

  for (const item of items) {
    if (item.timestamp >= startOfToday) {
      groups.today.push(item);
    } else if (item.timestamp >= startOfYesterday) {
      groups.yesterday.push(item);
    } else if (item.timestamp >= startOfPastWeek) {
      groups.pastWeek.push(item);
    } else {
      groups.older.push(item);
    }
  }

  return groups;
}
