#!/usr/bin/env node

/**
 * Generate MP3 audio for all lessons and writings using ElevenLabs TTS API.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs --lessons-only
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs --writings-only
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs --slug=what-is-bitcoin-actually
 *
 * Options:
 *   --voice=VOICE_ID     ElevenLabs voice ID (default: Rachel - 21m00Tcm4TlvDq8ikWAM)
 *   --model=MODEL_ID     ElevenLabs model (default: eleven_multilingual_v2)
 *   --lessons-only       Only generate lesson audio
 *   --writings-only      Only generate writing audio
 *   --slug=SLUG          Generate audio for a single piece of content
 *   --dry-run            Show what would be generated without calling the API
 *   --force              Regenerate even if MP3 already exists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const args = process.argv.slice(2);

const getFlag = (name) => args.includes(`--${name}`);
const getOption = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const VOICE_ID = getOption('voice') || '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = getOption('model') || 'eleven_multilingual_v2';
const DRY_RUN = getFlag('dry-run');
const FORCE = getFlag('force');
const LESSONS_ONLY = getFlag('lessons-only');
const WRITINGS_ONLY = getFlag('writings-only');
const SINGLE_SLUG = getOption('slug');

if (!API_KEY && !DRY_RUN) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required');
  console.error('Usage: ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs');
  process.exit(1);
}

function extractTextFromJsx(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  let text = content
    // Remove import statements
    .replace(/^import\s+.*$/gm, '')
    // Remove export/function declarations
    .replace(/export\s+default\s+function\s+\w+\([^)]*\)\s*\{/g, '')
    .replace(/return\s*\(\s*<LessonLayout[^>]*>/g, '')
    .replace(/<\/LessonLayout>\s*\);\s*\}\s*$/g, '')
    // Remove JSX component tags but keep text content
    .replace(/<div\s+className="key-concept">/g, '\n')
    .replace(/<div\s+className="highlight-box">/g, '\n')
    .replace(/<div\s+className="illustration">[^<]*<[^>]*>[^<]*<[^>]*>[^<]*<\/div>/g, '')
    .replace(/<div\s+className="lesson-summary">/g, '\n\nLesson Summary.\n')
    .replace(/<[^>]*className="[^"]*label[^"]*"[^>]*>/g, '')
    .replace(/<[^>]*className="[^"]*title[^"]*"[^>]*>/g, '')
    // Convert headings to spoken pauses
    .replace(/<h2>/g, '\n\n')
    .replace(/<\/h2>/g, '.\n\n')
    .replace(/<h3>/g, '\n\n')
    .replace(/<\/h3>/g, '.\n\n')
    .replace(/<h4>/g, '\n')
    .replace(/<\/h4>/g, '.\n')
    // Convert paragraphs
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '\n\n')
    // Convert list items
    .replace(/<li>/g, '')
    .replace(/<\/li>/g, '.\n')
    .replace(/<\/?[uo]l>/g, '\n')
    // Remove remaining HTML tags
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/<\/?[^>]+>/g, '')
    // Clean up HTML entities
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();

  return text;
}

function extractTextFromMdx(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Remove frontmatter
  let text = content.replace(/^---[\s\S]*?---\n*/m, '');

  // Remove import statements
  text = text.replace(/^import\s+.*$/gm, '');

  // Remove JSX components
  text = text.replace(/<[A-Z][^>]*\/>/g, '');
  text = text.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');

  // Convert markdown headings to spoken pauses
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '\n\n$1.\n\n');

  // Remove markdown formatting
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/`(.+?)`/g, '$1');
  text = text.replace(/\[(.+?)\]\(.*?\)/g, '$1');
  text = text.replace(/^[-*]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/---/g, '');

  // Clean up
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

function getLessons() {
  const lessonsDir = path.join(ROOT, 'app/learn/boarding-pass');
  const entries = fs.readdirSync(lessonsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name !== 'page.tsx')
    .filter(e => fs.existsSync(path.join(lessonsDir, e.name, 'page.tsx')))
    .map(e => ({
      slug: e.name,
      type: 'lesson',
      filePath: path.join(lessonsDir, e.name, 'page.tsx'),
      outputPath: path.join(ROOT, 'public/audio/lessons', `${e.name}.mp3`),
    }));
}

function getWritings() {
  const writingsDir = path.join(ROOT, 'content/writings');
  if (!fs.existsSync(writingsDir)) return [];
  const entries = fs.readdirSync(writingsDir).filter(f => f.endsWith('.mdx'));
  return entries
    .filter(f => f !== 'example-post.mdx')
    .map(f => ({
      slug: f.replace('.mdx', ''),
      type: 'writing',
      filePath: path.join(writingsDir, f),
      outputPath: path.join(ROOT, 'public/audio/writings', `${f.replace('.mdx', '')}.mp3`),
    }));
}

async function generateAudio(text, outputPath) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

async function main() {
  let items = [];

  if (!WRITINGS_ONLY) items.push(...getLessons());
  if (!LESSONS_ONLY) items.push(...getWritings());

  if (SINGLE_SLUG) {
    items = items.filter(i => i.slug === SINGLE_SLUG);
    if (items.length === 0) {
      console.error(`No content found for slug: ${SINGLE_SLUG}`);
      process.exit(1);
    }
  }

  console.log(`\nContrabxnd Audio Generator`);
  console.log(`========================`);
  console.log(`Voice: ${VOICE_ID}`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Items: ${items.length}`);
  console.log('');

  let totalChars = 0;
  let generated = 0;
  let skipped = 0;

  for (const item of items) {
    const exists = fs.existsSync(item.outputPath);
    if (exists && !FORCE) {
      console.log(`  SKIP  ${item.type}/${item.slug} (already exists)`);
      skipped++;
      continue;
    }

    const text = item.type === 'lesson'
      ? extractTextFromJsx(item.filePath)
      : extractTextFromMdx(item.filePath);

    const chars = text.length;
    totalChars += chars;

    if (DRY_RUN) {
      console.log(`  WOULD ${item.type}/${item.slug} (${chars.toLocaleString()} chars)`);
      continue;
    }

    process.stdout.write(`  GEN   ${item.type}/${item.slug} (${chars.toLocaleString()} chars)...`);

    try {
      const bytes = await generateAudio(text, item.outputPath);
      console.log(` ${(bytes / 1024).toFixed(0)} KB`);
      generated++;
      // Rate limit: ~2 requests/sec on Creator tier
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  console.log('');
  console.log(`Done. Generated: ${generated}, Skipped: ${skipped}`);
  console.log(`Total characters: ${totalChars.toLocaleString()}`);
  if (DRY_RUN) console.log(`(Dry run — no API calls made)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
