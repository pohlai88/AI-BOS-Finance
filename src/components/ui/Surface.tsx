import { cn } from "@/lib/utils"

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  // 'base' is your standard white card
  // 'flat' is for grey backgrounds
  variant?: 'base' | 'flat' | 'ghost'
  children: React.ReactNode
}

export const Surface = ({ 
  variant = 'base', 
  className, 
  children, 
  ...props 
}: SurfaceProps) => {
  
  // These are your "Locked" designs. 
  // If you change the shadow here, it changes EVERYWHERE.
  const variants = {
    base: "bg-white border border-slate-200 shadow-sm", 
    flat: "bg-slate-50 border border-transparent",
    ghost: "bg-transparent border-transparent",
  }

  return (
    <div 
      className={cn(
        "rounded-2xl transition-all", // The shape is now locked
        variants[variant], 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}
