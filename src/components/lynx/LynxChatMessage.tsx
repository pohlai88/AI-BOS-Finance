import React from 'react';
import { motion } from 'motion/react';
import { Database, BookOpen, Search, AlertTriangle, Shield, ArrowRight, Link as LinkIcon, Lock, Users, Server } from 'lucide-react';
import { LynxMessage } from '../../data/mockLynxData';
import { LynxIcon } from '../icons/LynxIcon';

interface LynxChatMessageProps {
  message: LynxMessage;
}

export function LynxChatMessage({ message }: LynxChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-8">
        <div className="max-w-2xl bg-[#1F1F1F] text-white px-6 py-4 border-l-2 border-[#333]">
          <p className="text-sm font-light leading-relaxed font-mono">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant Response (Structured)
  const data = message.structuredResponse;
  if (!data) return null;

  return (
    <div className="flex justify-start mb-12">
      <div className="flex gap-4 max-w-4xl w-full">
        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 bg-[#000] border border-[#28E7A2] flex items-center justify-center">
          <LynxIcon size={20} className="text-[#28E7A2]" />
        </div>

        {/* Structured Content Card */}
        <div className="flex-1 bg-[#050505] border border-[#28E7A2] relative overflow-hidden group">
          
          {/* Decorative Corner & Vector Line */}
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#28E7A2]" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#28E7A2] to-transparent opacity-20" />

          {/* 1. Direct Answer */}
          <div className="p-6 border-b border-[#1F1F1F] bg-[#0A0A0A] relative">
             <div className="absolute top-0 right-0 bg-[#28E7A2] text-black text-[9px] font-bold px-2 py-0.5 font-mono">
               VECTOR_LOCK_ACTIVE
             </div>
            <h4 className="text-[10px] font-mono text-[#28E7A2] uppercase tracking-widest mb-2 flex items-center gap-2">
              <LynxIcon size={12} className="text-[#28E7A2]" />
              Forensic Conclusion
            </h4>
            <p className="text-lg text-white font-light leading-relaxed">
              {data.directAnswer}
            </p>
          </div>

          {/* 1.5 Silo Diagnostics (The "Why") - VISUALIZATION UPGRADE */}
          {data.siloDiagnosis && (
            <div className="border-b border-[#1F1F1F] bg-[#050505] relative overflow-hidden h-56">
               
               {/* 1. Header (Minimal) */}
               <div className="absolute top-4 left-6 z-20 flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-[10px] font-mono text-red-500 uppercase tracking-[0.2em] bg-red-500/10 px-2 py-0.5 rounded">
                     TOPOLOGY_SCAN // {data.siloDiagnosis.nature}
                  </span>
               </div>

               {/* 2. The Visualization (Canvas) */}
               <div className="absolute inset-0 flex items-center justify-center">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                  />

                  <svg viewBox="0 0 600 160" className="w-full h-full max-w-3xl px-8 select-none">
                     <defs>
                        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                           <path d="M0,0 L0,6 L6,3 z" fill="#333" />
                        </marker>
                        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#28E7A2" stopOpacity="0" />
                           <stop offset="50%" stopColor="#28E7A2" />
                           <stop offset="100%" stopColor="#28E7A2" stopOpacity="0" />
                        </linearGradient>
                     </defs>

                     {/* --- LEFT: TRUTH (OPEX) --- */}
                     <g transform="translate(100, 80)">
                        {/* Pulse Ring */}
                        <motion.circle cx="0" cy="0" r="20" stroke="#28E7A2" strokeWidth="1" fill="none" opacity="0.2"
                           animate={{ r: [20, 30], opacity: [0.2, 0] }}
                           transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Node Circle */}
                        <circle cx="0" cy="0" r="16" fill="#0A0A0A" stroke="#28E7A2" strokeWidth="1.5" />
                        <Database x="-8" y="-8" width="16" height="16" className="text-[#28E7A2]" />
                        <text y="32" textAnchor="middle" className="fill-[#444] text-[9px] font-mono tracking-wider">SOURCE: LEDGER</text>
                     </g>

                     {/* --- RIGHT: SILO (CAPEX) --- */}
                     <g transform="translate(500, 80)">
                        {/* Glitch Effect on Box */}
                        <motion.path 
                           d="M0 -20 L18 -10 L18 10 L0 20 L-18 10 L-18 -10 Z" 
                           fill="#1a0505" stroke="#EF4444" strokeWidth="2"
                           animate={{ strokeWidth: [2, 1, 3, 2], opacity: [1, 0.8, 1] }}
                           transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                        />
                        <Lock x="-8" y="-8" width="16" height="16" className="text-red-500" />
                        <text y="32" textAnchor="middle" className="fill-[#444] text-[9px] font-mono tracking-wider">DEST: SILO_07</text>
                     </g>

                     {/* --- MIDDLE: THE WALL (INTERCEPTION) --- */}
                     <g transform="translate(300, 80)">
                        {/* The Wall */}
                        <motion.line 
                           x1="0" y1="-30" x2="0" y2="30" 
                           stroke="#EF4444" 
                           strokeWidth="2" 
                           strokeDasharray="4 4"
                        />
                        {/* User Override Icon */}
                        <rect x="-14" y="-14" width="28" height="28" rx="4" fill="#000" stroke="#EF4444" />
                        <Users x="-7" y="-7" width="14" height="14" className="text-red-500" />
                        
                        <text y="-40" textAnchor="middle" className="fill-red-500 text-[8px] font-mono tracking-widest uppercase">
                           MANUAL_INTERCEPT
                        </text>
                     </g>

                     {/* --- CONNECTORS --- */}
                     <line x1="120" y1="80" x2="280" y2="80" stroke="#222" strokeWidth="1" strokeDasharray="4 4" />
                     <line x1="320" y1="80" x2="480" y2="80" stroke="#222" strokeWidth="1" strokeDasharray="4 4" />

                     {/* --- ANIMATION: DATA PACKET --- */}
                     {/* Packet 1: Green Flow (Valid) */}
                     <motion.circle 
                        r="3" fill="#28E7A2"
                        initial={{ cx: 120, cy: 80, opacity: 1 }}
                        animate={{ cx: 280, cy: 80, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     />
                     
                     {/* Packet 2: Red Flow (Blocked/Hidden) */}
                     <motion.circle 
                        r="3" fill="#EF4444"
                        initial={{ cx: 320, cy: 80, opacity: 0 }}
                        animate={{ cx: 480, cy: 80, opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.75, repeat: Infinity, ease: "linear" }}
                     />
                  </svg>

                  {/* Floating Context Card (Bottom Right) */}
                  <div className="absolute bottom-4 right-6 max-w-[240px] bg-black/90 backdrop-blur border border-red-500/30 p-3 shadow-2xl">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-[#666] font-mono uppercase">Vector Analysis</span>
                        <span className="text-[9px] text-red-500 font-mono">{data.siloDiagnosis.confidence} MATCH</span>
                     </div>
                     <p className="text-xs text-[#EEE] font-light leading-relaxed border-l border-red-500 pl-2">
                       "{data.siloDiagnosis.description}"
                     </p>
                  </div>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* 2. Canon Basis */}
            <div className="p-6 border-b md:border-b-0 border-r border-[#1F1F1F]">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#666]" />
                <span className="text-xs font-mono text-[#888] uppercase tracking-wider">{data.canonBasis.title}</span>
              </div>
              <ul className="space-y-2 mb-4">
                {data.canonBasis.items.map(item => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="text-[#28E7A2] font-mono text-[10px] mt-0.5">►</span>
                    <div>
                      <span className="text-xs font-mono text-[#EEE] block">{item.id}</span>
                      <span className="text-[10px] text-[#666] block">{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#555] italic leading-relaxed pl-4 border-l border-[#333]">
                "{data.canonBasis.summary}"
              </p>
            </div>

            {/* 3. Standards & Policy */}
            <div className="p-6 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#666]" />
                <span className="text-xs font-mono text-[#888] uppercase tracking-wider">Standards Applied</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-[#555] font-mono uppercase block mb-1">Primary Standard</span>
                  <span className="text-xs text-white border-b border-[#333] pb-0.5">{data.standards.primary}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#555] font-mono uppercase block mb-1">Supporting Frameworks</span>
                  <div className="flex flex-wrap gap-2">
                    {data.standards.supporting.map((s, i) => (
                      <span key={i} className="text-[10px] text-[#888] bg-[#111] px-1.5 py-0.5 border border-[#222]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#555] font-mono uppercase block mb-1">Internal Policy</span>
                  <span className="text-xs text-[#AAA]">{data.standards.internal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Evidence Summary */}
          <div className="p-6 border-t border-[#1F1F1F] bg-[#080808]">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-[#666]" />
              <span className="text-xs font-mono text-[#888] uppercase tracking-wider">Forensic Evidence (FY2025 YTD)</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {data.evidence.stats.map((stat, i) => (
                <div key={i} className="bg-[#000] border border-[#222] p-3">
                  <div className="text-[9px] text-[#555] font-mono uppercase mb-1">{stat.label}</div>
                  <div className="text-lg font-mono" style={{ color: stat.color || '#FFF' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Risk & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[#1F1F1F]">
            
            <div className="p-6 border-r border-[#1F1F1F] bg-[#0F0505]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-mono text-red-500 uppercase tracking-wider">Risk Interpretation</span>
              </div>
              <div className="flex gap-2 mb-3">
                {data.risk.types.map((type, i) => (
                  <span key={i} className="text-[9px] text-red-400 border border-red-900/30 bg-red-900/10 px-1.5 py-0.5">
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#888] leading-relaxed">
                {data.risk.impact}
              </p>
            </div>

            <div className="p-6 bg-[#050F0A]">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#28E7A2]" />
                <span className="text-xs font-mono text-[#28E7A2] uppercase tracking-wider">Recommended Action</span>
              </div>
              <ul className="space-y-2">
                {data.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#CCC]">
                    <ArrowRight className="w-3 h-3 text-[#28E7A2] mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. Links */}
          <div className="p-3 bg-[#000] border-t border-[#1F1F1F] flex items-center justify-end gap-3">
             {data.links.map((link, i) => (
               <button key={i} className="flex items-center gap-2 text-[10px] font-mono text-[#666] hover:text-[#28E7A2] transition-colors border border-transparent hover:border-[#222] px-2 py-1">
                 <LinkIcon className="w-3 h-3" />
                 {link.label}
               </button>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
