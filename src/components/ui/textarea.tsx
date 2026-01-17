import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#1E293B] px-4 py-3 text-sm text-[#F8FAFC] transition-all duration-200 placeholder:text-[#64748B] focus:border-[#00F0FF] focus:outline-none focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
