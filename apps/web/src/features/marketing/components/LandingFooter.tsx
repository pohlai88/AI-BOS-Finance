/**
 * LandingFooter
 *
 * DESIGN PRINCIPLES:
 * - Consistent max-width (1140px)
 * - Semantic spacing tokens
 * - Typography scale: micro for labels, small for links
 * - Muted colors, subtle hierarchy
 */

import { APP_CONFIG } from '@/constants/app';
import { NexusIcon } from '@/components/icons/NexusIcon';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Resources: ['Documentation', 'API', 'Guides', 'Status'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Security'],
};

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle">
      <div className="max-w-[1140px] mx-auto px-layout-lg">
        {/* Main Grid */}
        <div className="py-layout-2xl grid grid-cols-6 gap-layout-2xl">
          {/* Brand — 2 columns */}
          <div className="col-span-2">
            <div className="flex items-center gap-layout-xs mb-layout-md">
              <NexusIcon size="sm" animated={false} />
              <span className="text-small font-medium text-white">NexusCanon</span>
            </div>
            <p className="text-small text-text-tertiary leading-relaxed max-w-[240px]">
              Forensic finance platform. Find compliance gaps before auditors do.
            </p>
          </div>

          {/* Link Columns — 1 column each */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-micro text-text-tertiary uppercase tracking-widest mb-layout-md">
                {category}
              </p>
              <nav className="flex flex-col gap-layout-sm">
                {links.map((link) => (
                  <a
                    key={link}
                    href={`/${link.toLowerCase()}`}
                    className="text-small text-text-secondary hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-layout-md border-t border-border-subtle flex items-center justify-between">
          <p className="text-micro text-text-tertiary">
            © {currentYear} NexusCanon. All rights reserved.
          </p>
          <div className="flex items-center gap-layout-md text-micro text-text-tertiary">
            <span className="flex items-center gap-layout-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              All systems operational
            </span>
            <span className="font-mono">{APP_CONFIG.versionDisplay}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
