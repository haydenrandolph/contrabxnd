import type { MDXComponents } from 'mdx/types';
import { useMDXComponents as useCustomMDXComponents } from '@/lib/mdx-components';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return useCustomMDXComponents(components);
}
