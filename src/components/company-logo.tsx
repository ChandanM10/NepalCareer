"use client"
import Image from "next/image"
import { companyInitialsLogo, colorFromString } from "@/lib/format"

export function CompanyLogo({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={`rounded-lg object-cover ${className || ""}`}
        unoptimized
      />
    )
  }
  // Use SVG initials
  return (
    <img
      src={companyInitialsLogo(name, size * 2)}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-lg ${className || ""}`}
      style={{ background: colorFromString(name) }}
    />
  )
}
