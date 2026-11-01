import { TONE_BG, TONE_TEXT, TONE_TINT, type Tone } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

interface StatusBadgeProps {
  tone: Tone
  label: string
}

export default function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded px-2 text-caption font-semibold whitespace-nowrap',
        TONE_TINT[tone],
        TONE_TEXT[tone],
      )}
    >
      <span className={cn('size-1.5 rounded-full', TONE_BG[tone])} />

      {label}
    </span>
  )
}
