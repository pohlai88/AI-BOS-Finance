import React from 'react'
import { motion } from 'motion/react'
import {
  Database,
  BookOpen,
  Search,
  AlertTriangle,
  Shield,
  ArrowRight,
  Link as LinkIcon,
  Lock,
  Users,
  Server,
} from 'lucide-react'
import { LynxMessage } from '../../data/mockLynxData'
import { LynxIcon } from '../icons/LynxIcon'

interface LynxChatMessageProps {
  message: LynxMessage
}

export function LynxChatMessage({ message }: LynxChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="mb-8 flex justify-end">
        <div className="max-w-2xl border-l-2 border-[#333] bg-[#1F1F1F] px-6 py-4 text-white">
          <p className="font-mono text-sm font-light leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  // Assistant Response (Structured)
  const data = message.structuredResponse
  if (!data) return null

  return (
    <div className="mb-12 flex justify-start">
      <div className="flex w-full max-w-4xl gap-4">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#28E7A2] bg-[#000]">
          <LynxIcon size={20} className="text-[#28E7A2]" />
        </div>

        {/* Structured Content Card */}
        <div className="group relative flex-1 overflow-hidden border border-[#28E7A2] bg-[#050505]">
          {/* Decorative Corner & Vector Line */}
          <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-[#28E7A2]" />
          <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-[#28E7A2] to-transparent opacity-20" />

          {/* 1. Direct Answer */}
          <div className="relative border-b border-[#1F1F1F] bg-[#0A0A0A] p-6">
            <div className="absolute right-0 top-0 bg-[#28E7A2] px-2 py-0.5 font-mono text-[9px] font-bold text-black">
              VECTOR_LOCK_ACTIVE
            </div>
            <h4 className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#28E7A2]">
              <LynxIcon size={12} className="text-[#28E7A2]" />
              Forensic Conclusion
            </h4>
            <p className="text-lg font-light leading-relaxed text-white">
              {data.directAnswer}
            </p>
          </div>

          {/* 1.5 Silo Diagnostics (The "Why") - VISUALIZATION UPGRADE */}
          {data.siloDiagnosis && (
            <div className="relative h-56 overflow-hidden border-b border-[#1F1F1F] bg-[#050505]">
              {/* 1. Header (Minimal) */}
              <div className="absolute left-6 top-4 z-20 flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-red-500">
                  TOPOLOGY_SCAN // {data.siloDiagnosis.nature}
                </span>
              </div>

              {/* 2. The Visualization (Canvas) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Grid Background */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                <svg
                  viewBox="0 0 600 160"
                  className="h-full w-full max-w-3xl select-none px-8"
                >
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="#333" />
                    </marker>
                    <linearGradient
                      id="flowGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#28E7A2" stopOpacity="0" />
                      <stop offset="50%" stopColor="#28E7A2" />
                      <stop offset="100%" stopColor="#28E7A2" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* --- LEFT: TRUTH (OPEX) --- */}
                  <g transform="translate(100, 80)">
                    {/* Pulse Ring */}
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="20"
                      stroke="#28E7A2"
                      strokeWidth="1"
                      fill="none"
                      opacity="0.2"
                      animate={{ r: [20, 30], opacity: [0.2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Node Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="16"
                      fill="#0A0A0A"
                      stroke="#28E7A2"
                      strokeWidth="1.5"
                    />
                    <Database
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      className="text-[#28E7A2]"
                    />
                    <text
                      y="32"
                      textAnchor="middle"
                      className="fill-[#444] font-mono text-[9px] tracking-wider"
                    >
                      SOURCE: LEDGER
                    </text>
                  </g>

                  {/* --- RIGHT: SILO (CAPEX) --- */}
                  <g transform="translate(500, 80)">
                    {/* Glitch Effect on Box */}
                    <motion.path
                      d="M0 -20 L18 -10 L18 10 L0 20 L-18 10 L-18 -10 Z"
                      fill="#1a0505"
                      stroke="#EF4444"
                      strokeWidth="2"
                      animate={{
                        strokeWidth: [2, 1, 3, 2],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        duration: 0.2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                    />
                    <Lock
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      className="text-red-500"
                    />
                    <text
                      y="32"
                      textAnchor="middle"
                      className="fill-[#444] font-mono text-[9px] tracking-wider"
                    >
                      DEST: SILO_07
                    </text>
                  </g>

                  {/* --- MIDDLE: THE WALL (INTERCEPTION) --- */}
                  <g transform="translate(300, 80)">
                    {/* The Wall */}
                    <motion.line
                      x1="0"
                      y1="-30"
                      x2="0"
                      y2="30"
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* User Override Icon */}
                    <rect
                      x="-14"
                      y="-14"
                      width="28"
                      height="28"
                      rx="4"
                      fill="#000"
                      stroke="#EF4444"
                    />
                    <Users
                      x="-7"
                      y="-7"
                      width="14"
                      height="14"
                      className="text-red-500"
                    />

                    <text
                      y="-40"
                      textAnchor="middle"
                      className="fill-red-500 font-mono text-[8px] uppercase tracking-widest"
                    >
                      MANUAL_INTERCEPT
                    </text>
                  </g>

                  {/* --- CONNECTORS --- */}
                  <line
                    x1="120"
                    y1="80"
                    x2="280"
                    y2="80"
                    stroke="#222"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="320"
                    y1="80"
                    x2="480"
                    y2="80"
                    stroke="#222"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* --- ANIMATION: DATA PACKET --- */}
                  {/* Packet 1: Green Flow (Valid) */}
                  <motion.circle
                    r="3"
                    fill="#28E7A2"
                    initial={{ cx: 120, cy: 80, opacity: 1 }}
                    animate={{ cx: 280, cy: 80, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  {/* Packet 2: Red Flow (Blocked/Hidden) */}
                  <motion.circle
                    r="3"
                    fill="#EF4444"
                    initial={{ cx: 320, cy: 80, opacity: 0 }}
                    animate={{ cx: 480, cy: 80, opacity: 1 }}
                    transition={{
                      duration: 1.5,
                      delay: 0.75,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </svg>

                {/* Floating Context Card (Bottom Right) */}
                <div className="absolute bottom-4 right-6 max-w-[240px] border border-red-500/30 bg-black/90 p-3 shadow-2xl backdrop-blur">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase text-[#666]">
                      Vector Analysis
                    </span>
                    <span className="font-mono text-[9px] text-red-500">
                      {data.siloDiagnosis.confidence} MATCH
                    </span>
                  </div>
                  <p className="border-l border-red-500 pl-2 text-xs font-light leading-relaxed text-[#EEE]">
                    "{data.siloDiagnosis.description}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* 2. Canon Basis */}
            <div className="border-b border-r border-[#1F1F1F] p-6 md:border-b-0">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-[#666]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#888]">
                  {data.canonBasis.title}
                </span>
              </div>
              <ul className="mb-4 space-y-2">
                {data.canonBasis.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono text-[10px] text-[#28E7A2]">
                      ►
                    </span>
                    <div>
                      <span className="block font-mono text-xs text-[#EEE]">
                        {item.id}
                      </span>
                      <span className="block text-[10px] text-[#666]">
                        {item.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="border-l border-[#333] pl-4 text-xs italic leading-relaxed text-[#555]">
                "{data.canonBasis.summary}"
              </p>
            </div>

            {/* 3. Standards & Policy */}
            <div className="border-b border-[#1F1F1F] p-6">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#666]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#888]">
                  Standards Applied
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-[#555]">
                    Primary Standard
                  </span>
                  <span className="border-b border-[#333] pb-0.5 text-xs text-white">
                    {data.standards.primary}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-[#555]">
                    Supporting Frameworks
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.standards.supporting.map((s, i) => (
                      <span
                        key={i}
                        className="border border-[#222] bg-[#111] px-1.5 py-0.5 text-[10px] text-[#888]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1 block font-mono text-[10px] uppercase text-[#555]">
                    Internal Policy
                  </span>
                  <span className="text-xs text-[#AAA]">
                    {data.standards.internal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Evidence Summary */}
          <div className="border-t border-[#1F1F1F] bg-[#080808] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#888]">
                Forensic Evidence (FY2025 YTD)
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-4">
              {data.evidence.stats.map((stat, i) => (
                <div key={i} className="border border-[#222] bg-[#000] p-3">
                  <div className="mb-1 font-mono text-[9px] uppercase text-[#555]">
                    {stat.label}
                  </div>
                  <div
                    className="font-mono text-lg"
                    style={{ color: stat.color || '#FFF' }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Risk & Next Steps */}
          <div className="grid grid-cols-1 border-t border-[#1F1F1F] md:grid-cols-2">
            <div className="border-r border-[#1F1F1F] bg-[#0F0505] p-6">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-mono text-xs uppercase tracking-wider text-red-500">
                  Risk Interpretation
                </span>
              </div>
              <div className="mb-3 flex gap-2">
                {data.risk.types.map((type, i) => (
                  <span
                    key={i}
                    className="border border-red-900/30 bg-red-900/10 px-1.5 py-0.5 text-[9px] text-red-400"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-[#888]">
                {data.risk.impact}
              </p>
            </div>

            <div className="bg-[#050F0A] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#28E7A2]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#28E7A2]">
                  Recommended Action
                </span>
              </div>
              <ul className="space-y-2">
                {data.nextSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#CCC]"
                  >
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-[#28E7A2]" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. Links */}
          <div className="flex items-center justify-end gap-3 border-t border-[#1F1F1F] bg-[#000] p-3">
            {data.links.map((link, i) => (
              <button
                key={i}
                className="flex items-center gap-2 border border-transparent px-2 py-1 font-mono text-[10px] text-[#666] transition-colors hover:border-[#222] hover:text-[#28E7A2]"
              >
                <LinkIcon className="h-3 w-3" />
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
