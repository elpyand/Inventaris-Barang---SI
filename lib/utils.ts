import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterUsersWithFines(users: { fine_balance?: number | null }[]) {
  return users.filter(u => (u.fine_balance ?? 0) > 0);
}
