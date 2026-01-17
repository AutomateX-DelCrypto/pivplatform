import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#1E293B] px-4 py-2 text-sm text-[#F8FAFC] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#64748B] focus:border-[#00F0FF] focus:outline-none focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
