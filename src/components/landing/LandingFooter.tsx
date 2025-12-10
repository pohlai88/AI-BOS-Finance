import { NexusIcon } from '../nexus/NexusIcon';
import { Github, Linkedin, Twitter } from 'lucide-react';

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
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/nexuscanon', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/nexuscanon', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/nexuscanon', label: 'LinkedIn' },
];

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12">
          {/* Brand Column - Spans 2 columns on desktop */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <NexusIcon size="md" animated={false} />
              <div>
                <h2 className="text-sm font-medium text-white tracking-tight">NexusCanon</h2>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Forensic Architecture
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Crystallize your financial truth. Immutable ledger control for enterprise audit and compliance.
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
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
              Product
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.product.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
              Resources
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.resources.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
              Company
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">
              Legal
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {currentYear} NexusCanon. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
            <span className="hidden md:inline text-zinc-700">•</span>
            <span className="hidden md:inline font-mono">v2.4.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
