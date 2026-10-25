import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const relativeFormatter = new Intl.RelativeTimeFormat("zh-CN", {
  numeric: "auto",
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
});

const countFormatter = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function parseApiDate(value: string) {
  const hasZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatRelativeTime(value: string) {
  const seconds = Math.round((parseApiDate(value).getTime() - Date.now()) / 1000);
  const distance = Math.abs(seconds);

  if (distance < 60) return "刚刚";
  if (distance < 3600) return relativeFormatter.format(Math.round(seconds / 60), "minute");
  if (distance < 86400) return relativeFormatter.format(Math.round(seconds / 3600), "hour");
  if (distance < 86400 * 30) return relativeFormatter.format(Math.round(seconds / 86400), "day");
  return dateFormatter.format(parseApiDate(value));
}

export function formatDate(value: string) {
  return dateFormatter.format(parseApiDate(value));
}

export function formatCount(value: number) {
  return countFormatter.format(value);
}
