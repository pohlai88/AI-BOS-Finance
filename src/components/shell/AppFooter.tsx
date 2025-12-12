import { Github, Twitter, Linkedin } from 'lucide-react'
import { NexusIcon } from '@/components/nexus/NexusIcon'

export function AppFooter() {
  return (
    <footer className="border-t border-[#1F1F1F] bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LEFT: Brand + Tagline */}
        <div className="flex items-center gap-4">
          <NexusIcon size="sm" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
            NexusCanon
          </span>
        </div>

        {/* RIGHT: Legal Links (horizontal) */}
        <nav className="flex items-center gap-6">
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/terms">Terms of Service</FooterLink>
          <FooterLink href="/security">Security</FooterLink>
          <FooterLink href="/compliance">Compliance</FooterLink>
        </nav>
      </div>
    </footer>
  )
}

// --- FOOTER LINK COMPONENT ---

interface FooterLinkProps {
  href: string
  children: React.ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <a
      href={href}
      className="font-mono text-[11px] text-[#666] transition-colors hover:text-[#28E7A2]"
    >
      {children}
    </a>
  )
}
