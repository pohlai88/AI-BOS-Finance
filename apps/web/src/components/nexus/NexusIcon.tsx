import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface NexusIconProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { wrapper: 'w-6 h-6', svg: 24 },
  md: { wrapper: 'w-7 h-7', svg: 28 },
  lg: { wrapper: 'w-10 h-10', svg: 40 },
} as const;

/**
 * NexusIcon - The Official NexusCanon Logo
 *
 * A crystal diamond with rotating ring (orbiting halo) and pulsing center.
 * This is the SINGLE SOURCE OF TRUTH for the brand icon.
 *
 * @example
 * <NexusIcon size="md" animated />
 */
export const NexusIcon = ({ size = 'md', animated = true, className }: NexusIconProps) => {
  const { wrapper, svg } = sizeMap[size];

  return (
    <div className={cn(wrapper, 'relative flex-shrink-0', className)}>
      <svg width={svg} height={svg} viewBox="0 0 40 40" fill="none">
        
        {/* OUTER RING - Orbiting around the diamond */}
        {animated ? (
          <g style={{ transformOrigin: 'center', transformBox: 'fill-box' }}>
            <motion.circle
              cx="20"
              cy="20"
              r="16"
              stroke="rgba(40, 231, 162, 0.3)"
              strokeWidth="1"
              strokeDasharray="2 2"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 15, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
              style={{ transformOrigin: '20px 20px' }}
            />
          </g>
        ) : (
          <circle 
            cx="20" 
            cy="20" 
            r="16" 
            stroke="rgba(40, 231, 162, 0.3)" 
            strokeWidth="1" 
            strokeDasharray="2 2"
            fill="none"
          />
        )}

        {/* Inner Crystal (Diamond) - Static */}
        {animated ? (
          <motion.path
            d="M20 8 L28 20 L20 32 L12 20 Z"
            stroke="rgba(40, 231, 162, 0.6)"
            strokeWidth="1.5"
            fill="rgba(40, 231, 162, 0.05)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        ) : (
          <path
            d="M20 8 L28 20 L20 32 L12 20 Z"
            stroke="rgba(40, 231, 162, 0.6)"
            strokeWidth="1.5"
            fill="rgba(40, 231, 162, 0.05)"
          />
        )}

        {/* Center Line */}
        {animated ? (
          <motion.line
            x1="20"
            y1="8"
            x2="20"
            y2="32"
            stroke="rgba(40, 231, 162, 0.8)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />
        ) : (
          <line x1="20" y1="8" x2="20" y2="32" stroke="rgba(40, 231, 162, 0.8)" strokeWidth="1" />
        )}

        {/* Pulse Center */}
        {animated ? (
          <motion.circle
            cx="20"
            cy="20"
            r="3"
            fill="rgba(40, 231, 162, 0.6)"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '20px 20px' }}
          />
        ) : (
          <circle cx="20" cy="20" r="3" fill="rgba(40, 231, 162, 0.6)" />
        )}
      </svg>
    </div>
  );
};
