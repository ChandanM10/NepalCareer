import { cn } from "@/lib/utils"

/**
 * NepalCareer Logo — a stylized mountain (Himalaya) inside a rounded square,
 * with a subtle career/growth arrow. Represents Nepal + Career.
 *
 * Colors use CSS variables so it adapts to light/dark mode.
 */
export function NepalCareerLogo({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mountain peaks (Himalaya) */}
        <path
          d="M4 26L12 12L16 18L20 10L28 26H4Z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        {/* Snow cap on the tallest peak */}
        <path
          d="M18.5 13.5L20 10L21.5 13.5L20 15L18.5 13.5Z"
          fill="currentColor"
          fillOpacity="0.6"
        />
        {/* Sun/circle behind mountains (represents career rising) */}
        <circle
          cx="24"
          cy="8"
          r="3"
          fill="currentColor"
          fillOpacity="0.4"
        />
      </svg>
    </div>
  )
}

/**
 * NepalCareer Logo — text variant (full wordmark with icon)
 */
export function NepalCareerWordmark({
  size = 36,
  className,
  showSubtitle = true,
}: {
  size?: number
  className?: string
  showSubtitle?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <NepalCareerLogo size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight">NepalCareer</span>
        {showSubtitle && (
          <span className="text-[10px] text-muted-foreground">Nepal IT Jobs &amp; Careers</span>
        )}
      </span>
    </span>
  )
}
