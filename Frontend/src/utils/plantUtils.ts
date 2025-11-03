export function formatLastWatered(lastWatered: string | null): string {
  if (!lastWatered) return '—';
  
  const now = new Date();
  const wateredDate = new Date(lastWatered);
  const diffInMs = now.getTime() - wateredDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1 week ago';
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return '1 month ago';
  return `${diffInMonths} months ago`;
}

export function getHealthStatusColor(health: string) {
  switch (health) {
    case 'Excellent':
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200'
      };
    case 'Good':
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200'
      };
    case 'Needs light':
      return {
        text: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
      };
    case 'Needs water':
      return {
        text: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200'
      };
    case 'Attention':
      return {
        text: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200'
      };
    default:
      return {
        text: 'text-gray-700',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
      };
  }
}

export function getGrowthRateColor(growthRate: number): string {
  return growthRate >= 0 ? 'text-fuchsia-600' : 'text-rose-600';
}
