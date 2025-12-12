import { useState } from 'react'
import { motion } from 'motion/react'
import { Activity, Database, Zap, Shield } from 'lucide-react'

interface RegistryItem {
  id: string
  name: string
  type: string
  refreshRate: 'realtime' | 'hourly' | 'daily' | 'static'
  status: 'active' | 'syncing' | 'idle'
  icon: React.ReactNode
}

const registryData: RegistryItem[] = [
  {
    id: '1',
    name: 'Customer_Master',
    type: 'Dimension',
    refreshRate: 'hourly',
    status: 'active',
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: '2',
    name: 'Transaction_Stream',
    type: 'Fact',
    refreshRate: 'realtime',
    status: 'syncing',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: '3',
    name: 'GL_Balances',
    type: 'Ledger',
    refreshRate: 'daily',
    status: 'active',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: '4',
    name: 'AR_Aging_Report',
    type: 'Report',
    refreshRate: 'daily',
    status: 'idle',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: '5',
    name: 'Revenue_Recognition',
    type: 'Calculation',
    refreshRate: 'hourly',
    status: 'active',
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: '6',
    name: 'Audit_Trail',
    type: 'Log',
    refreshRate: 'realtime',
    status: 'syncing',
    icon: <Shield className="h-5 w-5" />,
  },
]

const getPulseSpeed = (refreshRate: RegistryItem['refreshRate']) => {
  switch (refreshRate) {
    case 'realtime':
      return 1
    case 'hourly':
      return 2
    case 'daily':
      return 4
    case 'static':
      return 0
  }
}

export const RegistryGrid = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {registryData.map((item, index) => (
        <RegistryCard
          key={item.id}
          item={item}
          index={index}
          isHovered={hoveredId === item.id}
          onHover={() => setHoveredId(item.id)}
          onLeave={() => setHoveredId(null)}
        />
      ))}
    </div>
  )
}

const RegistryCard = ({
  item,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  item: RegistryItem
  index: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) => {
  const pulseSpeed = getPulseSpeed(item.refreshRate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="group relative"
    >
      {/* The Bento Cell */}
      <div className="relative h-64 overflow-hidden rounded-2xl border border-white/5 bg-[#0A0A0A] transition-all duration-500 group-hover:border-white/10">
        {/* Noise Texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />

        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Radial Gradient Spotlight (follows cursor concept) */}
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.1), transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 ${item.status === 'syncing' ? 'bg-green-500/10' : 'bg-white/5'} `}
            >
              {item.icon}
            </div>

            {/* Heartbeat Pulse */}
            {pulseSpeed > 0 && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: pulseSpeed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="h-3 w-3 rounded-full bg-green-500"
              />
            )}
          </div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="mb-2 font-medium transition-colors group-hover:text-green-400">
              {item.name}
            </h3>
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              {item.type}
            </p>
          </div>

          {/* Footer Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-gray-600">
                Refresh
              </span>
              <span className="font-mono text-gray-400">
                {item.refreshRate}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-gray-600">
                Status
              </span>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={item.status === 'syncing' ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className={`h-2 w-2 rounded-full ${
                    item.status === 'active'
                      ? 'bg-green-500'
                      : item.status === 'syncing'
                        ? 'bg-yellow-500'
                        : 'bg-gray-600'
                  }`}
                />
                <span
                  className={`font-mono capitalize ${
                    item.status === 'active'
                      ? 'text-green-400'
                      : item.status === 'syncing'
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphic Border Glow on Hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(168, 85, 247, 0.1))',
            padding: '1px',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </div>

      {/* Lineage Preview on Hover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
        className="pointer-events-none absolute -bottom-12 left-0 right-0 text-center"
      >
        <span className="font-mono text-xs uppercase tracking-wider text-gray-600">
          Click to trace lineage
        </span>
      </motion.div>
    </motion.div>
  )
}
