/**
 * MDX Components Configuration
 * 
 * Global MDX components for all Canon pages.
 * 
 * Maintenance: Add shared components here, affects all MDX files.
 * Location: mdx-components.tsx (at project root, required by @next/mdx)
 */

import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

/**
 * Slugify helper for heading IDs
 */
function slugify(text: string | React.ReactNode): string {
  const str = typeof text === 'string' ? text : String(text);
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Global MDX components for all Canon pages.
 * 
 * These components are used automatically in all MDX files.
 * To override for a specific page, pass components prop to MDX import.
 */
const components: MDXComponents = {
  // Headings with anchor links and consistent styling
  h1: ({ children, ...props }) => {
    const id = slugify(children);
    return (
      <h1
        id={id}
        className="text-3xl font-bold mt-8 mb-4 text-nexus-signal scroll-mt-20"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    const id = slugify(children);
    return (
      <h2
        id={id}
        className="text-2xl font-semibold mt-6 mb-3 text-nexus-signal scroll-mt-20"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const id = slugify(children);
    return (
      <h3
        id={id}
        className="text-xl font-semibold mt-4 mb-2 text-nexus-signal scroll-mt-20"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => (
    <h4
      className="text-lg font-medium mt-3 mb-2 text-nexus-signal"
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="mb-4 text-nexus-signal/90 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Links - Canon links vs external links
  a: ({ href, children, ...props }) => {
    // Canon internal links
    if (href?.startsWith('/canon/')) {
      return (
        <Link
          href={href}
          className="text-nexus-green hover:text-nexus-green/80 underline underline-offset-2 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    }
    
    // External links
    if (href?.startsWith('http')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nexus-green hover:text-nexus-green/80 underline underline-offset-2 transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    }
    
    // Regular links
    return (
      <a
        href={href}
        className="text-nexus-green hover:text-nexus-green/80 underline underline-offset-2 transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-nexus-signal/90" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-nexus-signal/90" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Code blocks
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-nexus-surface text-nexus-green font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    }
    // Code block (handled by syntax highlighter if configured)
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded-lg bg-nexus-surface p-4 border border-nexus-border/50"
      {...props}
    >
      {children}
    </pre>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-nexus-green/50 pl-4 italic text-nexus-signal/80"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontal rules
  hr: ({ ...props }) => (
    <hr className="my-8 border-nexus-border/50" {...props} />
  ),

  // Tables
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table
        className="min-w-full border-collapse border border-nexus-border/50"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-nexus-surface" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-nexus-border/50" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-nexus-surface/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left font-semibold text-nexus-signal border-b border-nexus-border/50"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-4 py-2 text-nexus-signal/90 border-b border-nexus-border/30"
      {...props}
    >
      {children}
    </td>
  ),

  // Images (if using Next.js Image)
  // img: (props) => {
  //   // Use Next.js Image component if needed
  //   return <img {...props} />;
  // },
} satisfies MDXComponents;

/**
 * Required export for @next/mdx
 */
export function useMDXComponents(): MDXComponents {
  return components;
}
