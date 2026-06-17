import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--cb-text)', marginBottom: '2rem', marginTop: '3rem' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--cb-text)', marginBottom: '1.5rem', marginTop: '3rem' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.25rem, 2vw, 2rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--cb-text)', marginBottom: '1rem', marginTop: '2rem' }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.9, color: 'var(--cb-text)', marginBottom: '2rem' }}>
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        style={{ color: '#F7931A', textDecoration: 'none', transition: 'opacity 0.15s ease' }}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.9, color: 'var(--cb-text)', marginBottom: '2rem', marginLeft: '1.5rem', listStyleType: 'disc' }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.9, color: 'var(--cb-text)', marginBottom: '2rem', marginLeft: '1.5rem', listStyleType: 'decimal' }}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{ marginBottom: '0.75rem' }}>
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{ borderLeft: '4px solid #F7931A', paddingLeft: '2rem', margin: '3rem 0', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.15rem, 2vw, 1.5rem)', lineHeight: 1.8, color: 'var(--cb-text-muted)' }}>
        {children}
      </blockquote>
    ),
    img: (props) => (
      <Image
        {...props}
        alt={props.alt || ''}
        width={1200}
        height={600}
        style={{ borderRadius: '2px', margin: '3rem 0', width: '100%', height: 'auto' }}
      />
    ),
    hr: () => (
      <hr style={{ borderTop: '1px solid var(--cb-border)', borderBottom: 'none', margin: '3rem 0' }} />
    ),
    code: ({ children }) => (
      <code style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.9rem', background: 'var(--cb-surface)', padding: '0.15rem 0.4rem', borderRadius: '2px', color: '#F7931A', border: '1px solid var(--cb-border)' }}>
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.9rem', background: 'var(--cb-surface)', padding: '1.5rem', borderRadius: '2px', margin: '2rem 0', overflowX: 'auto', color: 'var(--cb-text)', border: '1px solid var(--cb-border)' }}>
        {children}
      </pre>
    ),
    ...components,
  };
}
