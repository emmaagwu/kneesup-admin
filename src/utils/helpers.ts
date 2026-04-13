// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

// export function formatDate(date: string): string {
//   return new Intl.DateTimeFormat('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   }).format(new Date(date));
// }

// export function formatDateTime(date: string): string {
//   return new Intl.DateTimeFormat('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   }).format(new Date(date));
// }

// export function timeAgo(date: string): string {
//   const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
//   if (seconds < 60) return 'just now';
//   const minutes = Math.floor(seconds / 60);
//   if (minutes < 60) return `${minutes}m ago`;
//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours}h ago`;
//   const days = Math.floor(hours / 24);
//   return `${days}d ago`;
// }

// ─── Class merging ────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Initials ────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}


export function formatDate(date: string): string {
  try {
    const parsed = new Date(date);
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(parsed);
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string): string {
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return 'Invalid date/time';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsed);
  } catch (error) {
    return 'Invalid date/time';
  }
}

export function timeAgo(date: string): string {
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return 'Invalid date';
    }
    const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (error) {
    return 'Invalid date';
  }
}
