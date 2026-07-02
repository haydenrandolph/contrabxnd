---
name: contrabxnd-lab
description: Build a new interactive "Live Lab" for a Boarding Pass lesson in Contrabxnd — a client widget that talks to the live Bitcoin network (or does client-side crypto) as part of the lesson. Use when adding hands-on interactivity to a lesson, or when the user says "add a lab", "make this lesson interactive", or references the labs system.
---

# Building a Contrabxnd Live Lab

A **Live Lab** is a small interactive widget embedded inside a Boarding Pass lesson. It either pulls live data from the sovereign Bitcoin node or runs client-side crypto, turning a static lesson into something the reader can poke at. Six ship today (see `lib/labs.ts`).

## The 3-step pattern

1. **Build** a component in `components/labs/<Name>Lab.tsx`, wrapped in `<Lab>`.
2. **Embed** it in the lesson page under `app/learn/boarding-pass/<slug>/page.tsx`.
3. **Register** the lesson slug in `LAB_SLUGS` in `lib/labs.ts`.

That's it — the header "Live Lab" badge and the sidebar "Lab" pill light up automatically for any registered slug.

## Non-negotiable rules

- **Never touch real funds.** Labs are read-only or client-side demos. Seed-phrase / key labs must generate throwaway values in the browser, never be fundable, and carry explicit "demo only — never fund this" framing. Never call any spending path.
- **Live data goes through `/api/node/<path>`** — the whitelisted, node-first/public-fallback proxy. Never hardcode `mempool.space` or the node hostname in a component.
- **One lab per lesson.** The `<Lab>` wrapper hardcodes `id={LAB_ANCHOR}` (`"live-lab"`) so the header badge can scroll to it. Two labs on one page = duplicate id.
- **Use `<style jsx global>`, not `<style jsx>`.** Scoped styled-jsx does NOT reach child sub-components and silently fails to style them. Everything in `components/labs/` uses global.
- **Style with FML CSS tokens only** (below) so labs work in light and dark automatically. No hardcoded hex except the shared orange `#F7931A` if a token isn't available in that scope.
- **Gate every push on `npm run build` exit code**, not a log grep. tsc must be clean too.

## The `<Lab>` wrapper

`components/labs/Lab.tsx`. API:

```tsx
<Lab title="Short title" note={<>Teaching takeaway with <strong>emphasis</strong>.</>}>
  {/* your widget */}
</Lab>
```

- `title` — appears next to the pulsing "Live Lab" badge in the panel header.
- `note` (optional ReactNode) — the teaching callout in an accent-tinted footer. This is where you tie the widget back to the lesson concept. Always include one.
- Provides a `.lab-btn` class (dark solid button) for actions inside the body.

## Available node endpoints (whitelist)

Only these paths are forwarded by `app/api/node/[...path]/route.ts`. Fetch as `/api/node/<path>`. To use a new upstream path, add its regex to the `ALLOW` list first.

| Path | Returns |
|---|---|
| `v1/blocks` , `v1/blocks/{height}` | recent blocks (array) |
| `blocks/tip/height` | current height (plain text int) |
| `mempool` , `mempool/recent` | mempool summary / recent txs |
| `v1/fees/recommended` | `{fastestFee, halfHourFee, hourFee, economyFee, minimumFee}` sat/vB |
| `v1/fees/mempool-blocks` | projected block fee bands |
| `v1/mining/hashrate/{3d\|1w\|1m…}` | hashrate history |
| `v1/difficulty-adjustment` | difficulty epoch progress |
| `address/{addr}` , `address/{addr}/txs[/chain\|mempool]` | address stats / tx list |
| `tx/{txid}` , `tx/{txid}/(status\|hex\|outspends)` | transaction detail |
| `block/{hash}` , `block/{hash}/txs[/{n}]` | block detail / its txs |
| `block-height/{n}` | block hash at height |

Always `fetch(..., { cache: 'no-store' })` and wrap in try/catch — the node can be briefly unreachable; degrade gracefully (show "couldn't reach the node right now"), never throw into render.

## FML CSS tokens

Use these vars (defined in `app/globals.css`; both themes covered):

`--cb-bg` · `--cb-surface` · `--cb-bg-surface` · `--cb-text` · `--cb-text-muted` · `--cb-text-dim` · `--cb-border` · `--cb-border-hover` · `--cb-accent` (orange — data/accents only) · `--cb-accent-subtle` · `--cb-radius` · `--cb-font-sans` / `--cb-font-display` / `--cb-font-mono`. The `pulse-dot` keyframe animation is global (used for live dots).

Design system rules (see the contrabxnd-design-system memory): mono font for data/labels, orange only on live values, 2px-ish radius, no shadows/glass/gradients.

## Starter template

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Lab from './Lab';

export default function MyLab() {
  const [data, setData] = useState<SomeType | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/node/<endpoint>', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch { /* ignore — degrade below */ }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000); // poll only if the data is live
    return () => clearInterval(i);
  }, [load]);

  return (
    <Lab
      title="What the reader sees"
      note={<>Tie the widget back to the lesson: why does this matter?</>}
    >
      <style jsx global>{`
        .ml-x { font-family: var(--cb-font-mono); color: var(--cb-text); }
        /* token-based styles only */
      `}</style>

      {data == null
        ? <div style={{ color: 'var(--cb-text-muted)', fontFamily: 'var(--cb-font-mono)', fontSize: 13 }}>Loading…</div>
        : <div className="ml-x">{/* render */}</div>}
    </Lab>
  );
}
```

## Embed + register

In the lesson page (a plain JSX body inside `<LessonLayout slug="...">`), import the component and drop `<MyLab />` right after the paragraph that sets up the concept:

```tsx
import MyLab from '@/components/labs/MyLab';
// ...
<p>…concept the lab illustrates…</p>
<MyLab />
```

Then add the slug to `LAB_SLUGS` in `lib/labs.ts`:

```ts
export const LAB_SLUGS: ReadonlySet<string> = new Set([
  // …existing…
  'the-lesson-slug',
]);
```

## Verify

```bash
npx tsc --noEmit        # must be clean
npm run build           # must exit 0 — gate the commit on THIS, not a grep
```

Then confirm on the lesson page: the header shows the "Live Lab" badge (scrolls to the widget), and the course sidebar shows the "Lab" pill on that lesson.

## Notes

- Client-side crypto labs (e.g. seed phrase) don't poll — skip the interval. `@scure/bip39` is available; import its wordlist from `@scure/bip39/wordlists/english.js` (the `.js` suffix is required by the package's exports map).
- Keep labs compact; they sit inside a reading column. Reference existing labs for scale: `LiveBlockLab`, `SupplyClockLab`, `FeeLab`, `AddressLookupLab`, `AddressTypeLab`, `SeedPhraseLab`.
```
