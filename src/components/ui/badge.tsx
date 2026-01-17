import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] text-[#00F0FF]",
        secondary:
          "border-[rgba(148,163,184,0.3)] bg-[rgba(148,163,184,0.1)] text-[#94A3B8]",
        destructive:
          "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444]",
        success:
          "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)] text-[#10B981]",
        warning:
          "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] text-[#F59E0B]",
        outline:
          "border-[rgba(0,240,255,0.2)] bg-transparent text-[#94A3B8]",
        glow:
          "border-[#00F0FF] bg-[rgba(0,240,255,0.15)] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
