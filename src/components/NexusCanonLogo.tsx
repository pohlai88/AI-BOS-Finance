import { cn } from '@/lib/utils';

interface NexusCanonLogoProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { wrapper: 'w-6 h-6', svg: 24 },
  md: { wrapper: 'w-8 h-8', svg: 32 },
  lg: { wrapper: 'w-12 h-12', svg: 48 },
} as const;

export const NexusCanonLogo = ({
  variant = 'icon',
  size = 'md',
  className,
}: NexusCanonLogoProps) => {
  const { wrapper, svg } = sizeMap[size];

  return (
    <div className={cn(wrapper, 'relative flex-shrink-0', className)}>
      {/* Forensic geometric logo - a stylized "N" with circuit-like elements */}
      <svg
        width={svg}
        height={svg}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer frame */}
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          stroke="currentColor"
          strokeWidth="1"
          className="text-nexus-structure"
        />
        {/* Inner N shape */}
        <path
          d="M8 24V8L16 18L24 8V24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          className="text-nexus-green"
        />
        {/* Circuit nodes */}
        <circle cx="8" cy="8" r="2" fill="currentColor" className="text-nexus-green" />
        <circle cx="24" cy="8" r="2" fill="currentColor" className="text-nexus-green" />
        <circle cx="16" cy="18" r="2" fill="currentColor" className="text-nexus-signal" />
      </svg>
      {variant === 'full' && (
        <span className="ml-2 font-mono text-sm tracking-tight text-white">NEXUSCANON</span>
      )}
    </div>
  );
};
