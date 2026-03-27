import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind CSS classes safely.
 * Combines clsx for conditional classes and tailwind-merge to handle overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets or creates a unique device ID stored in localStorage.
 * This helps deduplicate FCM tokens by device instead of just accumulating them.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let deviceId = localStorage.getItem('go_planning_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
    localStorage.setItem('go_planning_device_id', deviceId);
  }
  return deviceId;
}
