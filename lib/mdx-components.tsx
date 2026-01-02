import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-['Cormorant_Garamond'] text-[2.5rem] md:text-[3rem] font-normal leading-[1.2] text-[#e8e4dc] mb-8 mt-12">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.5rem] font-normal leading-[1.2] text-[#e8e4dc] mb-6 mt-12">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-['Cormorant_Garamond'] text-[1.5rem] md:text-[2rem] font-normal leading-[1.2] text-[#e8e4dc] mb-4 mt-8">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="font-['Cormorant_Garamond'] text-[1.125rem] md:text-[1.25rem] leading-[1.9] text-[#e8e4dc] mb-8">
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[#F7931A] hover:underline transition-all duration-200"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="font-['Cormorant_Garamond'] text-[1.125rem] md:text-[1.25rem] leading-[1.9] text-[#e8e4dc] mb-8 ml-6 list-disc space-y-3">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="font-['Cormorant_Garamond'] text-[1.125rem] md:text-[1.25rem] leading-[1.9] text-[#e8e4dc] mb-8 ml-6 list-decimal space-y-3">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#F7931A] pl-8 my-12 italic font-['Cormorant_Garamond'] text-[1.25rem] md:text-[1.5rem] leading-[1.8] text-[#8a8a8a]">
        {children}
      </blockquote>
    ),
    img: (props) => (
      <Image
        {...props}
        alt={props.alt || ''}
        width={1200}
        height={600}
        className="rounded-sm my-12 w-full h-auto"
      />
    ),
    hr: () => (
      <hr className="border-t border-[#3a3a3a] my-12" />
    ),
    code: ({ children }) => (
      <code className="font-['Space_Mono'] text-[0.9rem] bg-[#1a1a1a] px-2 py-1 rounded text-[#F7931A]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="font-['Space_Mono'] text-[0.9rem] bg-[#1a1a1a] p-6 rounded my-8 overflow-x-auto text-[#e8e4dc]">
        {children}
      </pre>
    ),
    ...components,
  };
}
