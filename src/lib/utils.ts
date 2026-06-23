
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const ms = (milliseconds % 1000).toString().padStart(3, '0').slice(0, 2);
  return `${minutes}:${seconds}.${ms}`;
}

/**
 * Formats a swim time string. If the string represents seconds >= 60 (and doesn't already contain a colon),
 * it converts it to the MM:SS.ms format.
 */
export function formatSwimTime(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  
  // If it already contains a colon, assume it's already formatted
  if (timeStr.includes(':')) return timeStr;

  const totalSeconds = parseFloat(timeStr);
  if (isNaN(totalSeconds) || totalSeconds < 60) return timeStr;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const decimalPart = timeStr.includes('.') ? timeStr.split('.')[1] : null;
  const wholeSeconds = Math.floor(seconds);
  const paddedSeconds = wholeSeconds < 10 ? `0${wholeSeconds}` : `${wholeSeconds}`;
  
  return `${minutes}:${paddedSeconds}${decimalPart ? '.' + decimalPart : ''}`;
}

/**
 * Converts a swim time string (e.g., "52.10" or "1:05.23") to milliseconds.
 */
export function swimTimeToMs(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const parts = timeStr.split(':');
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    minutes = parseFloat(parts[0]);
    seconds = parseFloat(parts[1]);
  } else if (parts.length === 1) {
    seconds = parseFloat(parts[0]);
  }

  if (isNaN(minutes)) minutes = 0;
  if (isNaN(seconds)) seconds = 0;

  return (minutes * 60 + seconds) * 1000;
}

/**
 * Standard swimming conversion factors
 * Meters to Yards: Time * 0.902
 * Yards to Meters: Time * 1.108
 */
export function convertTime(ms: number, from: 'meters' | 'yards', to: 'meters' | 'yards'): number {
  if (from === to) return ms;
  if (from === 'meters' && to === 'yards') {
    return ms * 0.902;
  }
  if (from === 'yards' && to === 'meters') {
    return ms * 1.108;
  }
  return ms;
}

export function convertSwimTimeStr(timeStr: string, from: 'meters' | 'yards', to: 'meters' | 'yards'): string {
  if (from === to) return timeStr;
  const ms = swimTimeToMs(timeStr);
  const convertedMs = convertTime(ms, from, to);
  return formatTime(convertedMs);
}
