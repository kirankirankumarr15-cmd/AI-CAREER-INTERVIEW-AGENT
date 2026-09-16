import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
}

export function formatBadgeStatus(status: string) {
  switch (status) {
    case 'Verified':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Needs Review':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}
