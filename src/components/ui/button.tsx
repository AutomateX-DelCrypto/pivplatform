import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E17] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#00F0FF] text-[#0A0E17] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:-translate-y-0.5",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        outline:
          "border border-[#00F0FF] bg-transparent text-[#00F0FF] hover:bg-[rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
        secondary:
          "bg-[#1E293B] text-[#94A3B8] border border-[rgba(0,240,255,0.1)] hover:text-[#00F0FF] hover:border-[rgba(0,240,255,0.3)] hover:bg-[#273548]",
        ghost:
          "text-[#94A3B8] hover:text-[#00F0FF] hover:bg-[rgba(0,240,255,0.1)]",
        link:
          "text-[#00F0FF] underline-offset-4 hover:underline",
        success:
          "bg-[#10B981] text-white hover:bg-[#059669] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-[10px] px-4 text-xs",
        lg: "h-12 rounded-[14px] px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
