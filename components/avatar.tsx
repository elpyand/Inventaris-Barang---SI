'use client'

import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt = 'Avatar', initials, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const sizeClass = sizeClasses[size]

  // If src exists, show image
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }

  // If initials, show initials in circle
  if (initials) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold ${className}`}
      >
        {initials.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  // Default: show user icon
  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 ${className}`}
    >
      <User className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} />
    </div>
  )
}
