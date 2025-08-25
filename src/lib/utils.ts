import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {}
) {
  return new Intl.NumberFormat("en-US", {
    ...options,
  }).format(number);
}

export function formatCompactNumber(number: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options
  }).format(date);
}
