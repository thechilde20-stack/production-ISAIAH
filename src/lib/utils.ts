import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractYoutubeId = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(shorts\/))\??v?=?([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[8].length === 11) {
    return match[8];
  }
  // If it's already an 11-char ID, return it
  if (trimmed.length === 11) return trimmed;
  return trimmed;
};
