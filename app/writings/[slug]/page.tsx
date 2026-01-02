import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import {
  getWritingBySlug,
  getAllWritingSlugs,
  getRelatedWritings
} from '@/lib/writings';
import { useMDXComponents } from '@/lib/mdx-components';
import ArticleLayout from '@/components/ArticleLayout';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllWritingSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getWritingBySlug(slug);

  if (!article) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${article.title} | Contraband`,
    description: article.subtitle,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getWritingBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedWritings(slug, 3).map(related => ({
    slug: related.slug,
    type: related.type || 'Essay',
    title: related.title,
    readTime: related.readTime || '5 min read'
  }));
  const components = useMDXComponents({});

  return (
    <ArticleLayout
      article={{
        type: article.type || 'Essay',
        title: article.title,
        subtitle: article.subtitle,
        date: article.date,
        readTime: article.readTime || '5 min read',
        substackUrl: article.substackUrl
      }}
      slug={slug}
      relatedArticles={relatedArticles}
    >
      <MDXRemote
        source={article.content}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
          },
        }}
      />
    </ArticleLayout>
  );
}
