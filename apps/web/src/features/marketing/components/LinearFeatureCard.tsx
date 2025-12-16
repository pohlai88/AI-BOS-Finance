import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface LinearFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode; // The bottom visual slot
}

export const LinearFeatureCard = ({
  icon: Icon,
  title,
  description,
  className,
  children,
}: LinearFeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0B0D0E]",
        "hover:border-white/10 hover:bg-[#121417] transition-all duration-500",
        className
      )}
    >
      {/* Top Content */}
      <div className="p-8 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-primary group-hover:text-white group-hover:bg-primary/10 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-white tracking-tight">
            {title}
          </h3>
        </div>
        
        <p className="text-sm text-text-secondary leading-relaxed max-w-[90%]">
          {description}
        </p>
      </div>

      {/* Bottom Visual Slot (The "Linear Image" area) */}
      <div className="mt-auto relative w-full h-48 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        {/* Subtle Fade from content to image */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0B0D0E] to-transparent z-10 group-hover:from-[#121417] transition-colors duration-500" />
        
        <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-105">
           {children}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]" />
    </motion.div>
  );
};

