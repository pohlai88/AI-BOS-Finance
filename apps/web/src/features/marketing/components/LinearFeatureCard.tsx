/**
 * LinearFeatureCard - Feature Card Component
 * 
 * Design Philosophy:
 * - Clean card with subtle hover effects
 * - Consistent border and background colors
 * - Primary color accent on hover
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface LinearFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "bg-surface-card border border-border-subtle",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300",
        className
      )}
    >
      {/* Content */}
      <div className="p-6 z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-base font-medium text-white tracking-tight">
            {title}
          </h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Visual Slot */}
      <div className="mt-auto relative w-full h-40 overflow-hidden">
        {/* Top Fade */}
        <div
          className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, var(--color-surface-card), transparent)',
          }}
        />

        <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.02]">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

