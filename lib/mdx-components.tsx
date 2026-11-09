import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, style, ...props }) => (
      <h1 {...props} style={{ fontFamily: 'var(--cb-font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.2, color: 'var(--cb-text)', marginBottom: '2rem', marginTop: '3rem', ...style }}>
        {children}
      </h1>
    ),
    h2: ({ children, style, ...props }) => (
      <h2 {...props} style={{ fontFamily: 'var(--cb-font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300, letterSpacing: '0.03em', lineHeight: 1.25, color: 'var(--cb-text)', marginBottom: '1.5rem', marginTop: '3rem', ...style }}>
        {children}
      </h2>
    ),
    h3: ({ children, style, ...props }) => (
      <h3 {...props} style={{ fontFamily: 'var(--cb-font-display)', fontSize: 'clamp(1.25rem, 2vw, 2rem)', fontWeight: 400, lineHeight: 1.3, color: 'var(--cb-text)', marginBottom: '1rem', marginTop: '2rem', ...style }}>
        {children}
      </h3>
    ),
    p: ({ children, style, ...props }) => (
      <p {...props} style={{ fontFamily: 'var(--cb-font-sans)', fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.8, color: 'var(--cb-text)', marginBottom: '2rem', ...style }}>
        {children}
      </p>
    ),
    a: ({ href, children, style, target, rel, ...props }) => (
      <a
        {...props}
        href={href}
        style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--cb-accent)', textUnderlineOffset: '0.2em', ...style }}
        target={target ?? (href?.startsWith('http') ? '_blank' : undefined)}
        rel={rel ?? (href?.startsWith('http') ? 'noopener noreferrer' : undefined)}
      >
        {children}
      </a>
    ),
    ul: ({ children, style, ...props }) => (
      <ul {...props} style={{ fontFamily: 'var(--cb-font-sans)', fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.8, color: 'var(--cb-text)', marginBottom: '2rem', marginLeft: '1.5rem', listStyleType: 'disc', ...style }}>
        {children}
      </ul>
    ),
    ol: ({ children, style, ...props }) => (
      <ol {...props} style={{ fontFamily: 'var(--cb-font-sans)', fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', lineHeight: 1.8, color: 'var(--cb-text)', marginBottom: '2rem', marginLeft: '1.5rem', listStyleType: 'decimal', ...style }}>
        {children}
      </ol>
    ),
    li: ({ children, style, ...props }) => (
      <li {...props} style={{ marginBottom: '0.75rem', ...style }}>
        {children}
      </li>
    ),
    blockquote: ({ children, style, ...props }) => (
      <blockquote {...props} style={{ borderLeft: '3px solid var(--cb-accent)', paddingLeft: '1.5rem', margin: '3rem 0', fontFamily: 'var(--cb-font-sans)', fontSize: 'clamp(1.15rem, 2vw, 1.5rem)', lineHeight: 1.8, color: 'var(--cb-text-muted)', ...style }}>
        {children}
      </blockquote>
    ),
    img: ({ style, width, height, ...props }) => (
      <Image
        {...props}
        alt={props.alt || ''}
        width={width === undefined ? 1200 : Number(width)}
        height={height === undefined ? 600 : Number(height)}
        style={{ borderRadius: '2px', margin: '3rem 0', width: '100%', height: 'auto', ...style }}
      />
    ),
    hr: ({ style, ...props }) => (
      <hr {...props} style={{ borderTop: '1px solid var(--cb-border)', borderBottom: 'none', margin: '3rem 0', ...style }} />
    ),
    code: ({ children, style, className, ...props }) => (
      <code {...props} className={`cb-mdx-code${className ? ` ${className}` : ''}`} style={style}>
        {children}
      </code>
    ),
    pre: ({ children, style, ...props }) => (
      <pre {...props} style={{ fontFamily: 'var(--cb-font-mono)', fontSize: '0.9rem', lineHeight: 1.7, background: 'var(--cb-surface)', padding: '1.5rem', borderRadius: '2px', margin: '2rem 0', overflowX: 'auto', color: 'var(--cb-text)', border: '1px solid var(--cb-border)', ...style }}>
        {children}
      </pre>
    ),
    ...components,
  };
}
