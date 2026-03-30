import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '-'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '-'
  const parts = email.split('@')
  if (parts.length !== 2) return email
  return `${parts[0].slice(0, 2)}***@${parts[1]}`
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  if (phone.length <= 8) return phone
  return `${phone.slice(0, 6)}****${phone.slice(-2)}`
}

export function maskAddress(address: string | null | undefined): string {
  if (!address) return '-'
  if (address.length <= 12) return address
  return `${address.slice(0, 12)}***`
}
