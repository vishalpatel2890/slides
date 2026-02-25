/**
 * Utility functions for the webview.
 *
 * Story Reference: 18-3 Task 8 - Create utility functions
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and resolves Tailwind CSS conflicts using tailwind-merge.
 *
 * Usage:
 * ```tsx
 * <div className={cn('px-4 py-2', isActive && 'bg-primary', className)} />
 * ```
 *
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
