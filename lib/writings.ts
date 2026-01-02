import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Writing {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  content: string;
  substackUrl?: string;
  type?: string;
  readTime?: string;
}

const writingsDirectory = path.join(process.cwd(), 'content/writings');

export function getAllWritings(): Writing[] {
  // Check if directory exists
  if (!fs.existsSync(writingsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(writingsDirectory);
  const writings = fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(writingsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Calculate read time (rough estimate: 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);

      return {
        slug,
        title: data.title,
        subtitle: data.subtitle,
        date: data.date,
        content,
        substackUrl: data.substackUrl,
        type: data.type || 'Essay',
        readTime: `${readTime} min read`,
      };
    });

  // Sort by date, newest first
  return writings.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getWritingBySlug(slug: string): Writing | null {
  try {
    const fullPath = path.join(writingsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Calculate read time
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return {
      slug,
      title: data.title,
      subtitle: data.subtitle,
      date: data.date,
      content,
      substackUrl: data.substackUrl,
      type: data.type || 'Essay',
      readTime: `${readTime} min read`,
    };
  } catch (error) {
    return null;
  }
}

export function getAllWritingSlugs(): string[] {
  if (!fs.existsSync(writingsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(writingsDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => fileName.replace(/\.mdx$/, ''));
}

export function getRelatedWritings(currentSlug: string, limit: number = 3): Writing[] {
  const allWritings = getAllWritings();
  return allWritings
    .filter(writing => writing.slug !== currentSlug)
    .slice(0, limit);
}
