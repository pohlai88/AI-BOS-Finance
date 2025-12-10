import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface NexusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}

export const NexusButton = ({ 
  children, 
  className, 
  variant = "primary", 
  icon,
  ...props 
}: NexusButtonProps) => {
  return (
    <button 
      className={cn(
        "group relative h-10 px-6 flex items-center gap-2 justify-center",
        "font-mono text-xs uppercase tracking-widest transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        
        // Primary: The "Green Flash"
        variant === "primary" && "bg-nexus-green text-nexus-void hover:bg-white",
        
        // Secondary: The "Wireframe"
        variant === "secondary" && "border border-nexus-structure text-nexus-noise hover:border-nexus-green hover:text-nexus-green",
        
        // Danger: The "Red Alert"
        variant === "danger" && "border border-red-900/50 text-red-500 bg-red-950/10 hover:bg-red-900/20",
        
        className
      )} 
      {...props}
    >
      {/* Icon Handling */}
      {icon && <span className="w-4 h-4">{icon}</span>}
      
      {children}
      
      {/* Hover Micro-Interaction (Corners) */}
      {variant === "secondary" && (
        <>
          <span className="absolute top-0 left-0 w-[1px] h-2 bg-nexus-green opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="absolute bottom-0 right-0 w-[1px] h-2 bg-nexus-green opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
    </button>
  );
};