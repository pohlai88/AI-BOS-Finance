import { NexusIcon } from '@/components/nexus/NexusIcon'
import { Github, Linkedin, Twitter } from 'lucide-react'
import { APP_CONFIG } from '@/constants/app'

const footerLinks = {
  product: [
    { label: 'Features', href: '#logic' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Roadmap', href: '/roadmap' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api' },
    { label: 'Guides', href: '/guides' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Security', href: '/security' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/nexuscanon', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/nexuscanon', label: 'GitHub' },
  {
    icon: Linkedin,
    href: 'https://linkedin.com/company/nexuscanon',
    label: 'LinkedIn',
  },
]

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6 md:gap-12">
          {/* Brand Column - Spans 2 columns on desktop */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <NexusIcon size="md" animated={false} />
              <div>
                <h2 className="text-sm font-medium tracking-tight text-white">
                  NexusCanon
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Forensic Architecture
                </p>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
              Crystallize your financial truth. Immutable ledger control for
              enterprise audit and compliance.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-zinc-500 transition-colors hover:text-white"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">
              Product
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.product.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">
              Resources
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.resources.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">
              Company
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white">
              Legal
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 py-6 md:flex-row">
          <p className="text-xs text-zinc-500">
            © {currentYear} NexusCanon. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
            <span className="hidden text-zinc-700 md:inline">•</span>
            <span className="hidden font-mono md:inline">
              {APP_CONFIG.versionDisplay}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
