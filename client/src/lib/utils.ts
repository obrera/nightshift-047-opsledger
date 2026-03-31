import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatCountdown(value: string) {
  const ms = new Date(value).getTime() - Date.now();
  const absolute = Math.abs(ms);
  const hours = Math.floor(absolute / 3_600_000);
  const minutes = Math.floor((absolute % 3_600_000) / 60_000);
  const prefix = ms < 0 ? "-" : "";
  return `${prefix}${hours}h ${minutes}m`;
}

export function riskTone(score: number) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
