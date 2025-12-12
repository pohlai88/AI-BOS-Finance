import { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface LinearFeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  className?: string
  children?: ReactNode // The bottom visual slot
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
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0B0D0E]',
        'transition-all duration-500 hover:border-white/10 hover:bg-[#121417]',
        className
      )}
    >
      {/* Top Content */}
      <div className="z-10 p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="text-nexus-green group-hover:bg-nexus-green/10 rounded-lg border border-white/5 bg-white/5 p-2 transition-colors group-hover:text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-medium tracking-tight text-white">
            {title}
          </h3>
        </div>

        <p className="text-nexus-noise max-w-[90%] text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom Visual Slot (The "Linear Image" area) */}
      <div className="relative mt-auto h-48 w-full overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        {/* Subtle Fade from content to image */}
        <div className="absolute left-0 right-0 top-0 z-10 h-12 bg-gradient-to-b from-[#0B0D0E] to-transparent transition-colors duration-500 group-hover:from-[#121417]" />

        <div className="h-full w-full transform transition-transform duration-700 group-hover:scale-105">
          {children}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  )
}
