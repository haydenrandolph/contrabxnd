import { test, expect, type Page } from '@playwright/test';

const merchants = [
  { id: 'coffee', name: 'Satoshi Coffee', category: 'Food & Drink', location: { lat: 28.8, lon: -82.6, country: 'US' } },
  { id: 'books', name: 'Bitcoin Books', category: 'Retail', location: { lat: 28.82, lon: -82.62, country: 'US' } },
  { id: 'injection', name: '<img src=x onerror="window.injected=true">', category: 'Retail', location: { lat: 28.81, lon: -82.61, country: 'US' }, website: 'javascript:alert(1)' },
  { id: 'online', name: 'Online Bitcoin Store', category: 'E-commerce' },
].map(b => ({ paymentMethods: ['both'], source: 'btcmap', verified: true, ...b }));

async function fixtures(page: Page) {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/network') return route.fulfill({ json: { businesses: merchants, count: merchants.length } });
    if (path === '/api/price') return route.fulfill({ json: { price: 100_000, change24h: 1 } });
    if (path === '/api/chart') return route.fulfill({ json: { candles: [] } });
    if (path === '/api/node/mempool/recent' || path === '/api/node/v1/blocks') return route.fulfill({ json: [] });
    return route.fulfill({ status: 503, json: { error: 'Fixture: provider unavailable' } });
  });
  // A deterministic tile avoids provider traffic and makes these UI tests offline-safe.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64'),
  }));
}

test('merchant map, safe popups, typography, search, and modal lifecycle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await fixtures(page);
  await page.goto('/network');
  await expect(page.locator('.merchant-map canvas')).toBeVisible();
  await expect(page.locator('.business-card')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Jost');
  expect(await page.locator('.page-label').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Space Mono');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByLabel('Search merchants').fill('<img');
  await expect(page.locator('.business-card')).toHaveCount(1);
  await page.locator('.business-card').click();
  const popup = page.locator('.merchant-popup').filter({ hasText: '<img' });
  await expect(popup).toBeVisible();
  await expect(popup.locator('img, script, a')).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, 'injected'))).toBeUndefined();
  await page.getByRole('button', { name: 'Join the Network', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Join the Network' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Join the Network' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('visible search trigger opens a named keyboard-dismissable dialog', async ({ page }) => {
  await fixtures(page);
  await page.goto('/docs');
  await page.getByRole('button', { name: 'Search lessons and writings', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Search lessons and writings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Search lessons and writings' })).not.toBeVisible();
});

test('server-rendered docs remain visible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    const response = await page.goto(`${baseURL}/docs`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(response?.headers()['x-frame-options']).toBe('DENY');
  } finally { await context.close(); }
});

test('signed-in account links remain separate usable rows in both themes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const viewport = page.viewportSize();
  // Complete the mocked sign-in at desktop width, then test the project's viewport.
  await page.setViewportSize({ width: 1280, height: 900 });
  await fixtures(page);
  const user = {
    id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated',
    email: 'menu-fixture@example.test', email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: {}, user_metadata: { display_name: 'Hank' }, created_at: '2026-01-01T00:00:00Z',
  };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: user.aud, role: user.role, exp: expires })}.fixture`;
  await page.route('**/auth/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/user')) return route.fulfill({ json: user });
    if (path.endsWith('/logout')) return route.fulfill({ status: 204 });
    return route.fulfill({ json: {
      access_token: token, token_type: 'bearer', expires_in: 3600,
      expires_at: expires, refresh_token: 'fixture-refresh-token', user,
    } });
  });
  await page.route('**/rest/v1/**', route => route.fulfill({ json: { id: user.id, display_name: 'Hank' } }));
  // Do not send a synthetic session through server-side prefetch authentication.
  await page.route('**/account?*', route => route.abort());
  await page.goto('/docs');
  await page.getByRole('button', { name: 'Sign In', exact: true }).first().click();
  const signIn = page.getByRole('dialog', { name: 'Sign In', exact: true });
  await signIn.getByLabel('Email', { exact: true }).fill(user.email);
  await signIn.getByLabel('Password', { exact: true }).fill('fixture-password');
  await signIn.getByRole('button', { name: 'Sign In', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Account menu for Hank' });
  await expect(trigger).toBeVisible();
  if (viewport) await page.setViewportSize(viewport);

  for (const theme of ['dark', 'light']) {
    const root = page.locator('html');
    if ((await root.getAttribute('class'))?.includes('light-mode') !== (theme === 'light')) {
      await page.getByRole('button', { name: `Switch to ${theme} theme`, exact: true }).first().click();
    }
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dropdown = page.locator('.user-menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.getByRole('link')).toHaveText(['My Account', 'Course Progress', 'Price Alerts']);
    const boxes = await dropdown.locator('.user-menu-item').evaluateAll(items => items.map(item => {
      const box = item.getBoundingClientRect();
      const style = getComputedStyle(item);
      return { x: box.x, y: box.y, bottom: box.bottom, right: box.right, width: box.width,
        height: box.height, display: style.display, padding: parseFloat(style.paddingLeft), font: style.fontFamily };
    }));
    expect(boxes).toHaveLength(4);
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].display).toBe('block');
      expect(Math.round(boxes[i].height)).toBeGreaterThanOrEqual(44);
      expect(boxes[i].padding).toBeGreaterThanOrEqual(16);
      expect(boxes[i].font).toContain('Space Mono');
      expect(boxes[i].x).toBeGreaterThanOrEqual(0);
      expect(boxes[i].right).toBeLessThanOrEqual(page.viewportSize()!.width);
      if (i) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 0.1);
    }
    await page.keyboard.press('Tab');
    await expect(dropdown.getByRole('link', { name: 'My Account', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dropdown).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await page.mouse.click(8, 350);
  await expect(page.locator('.user-menu-dropdown')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('terminal stops reconnecting and polling after client navigation', async ({ page, isMobile }) => {
  const errors: string[] = [];
  let leftTerminal = false;
  let leakedPolls = 0;
  let leakedSockets = 0;
  page.on('pageerror', e => errors.push(e.message));
  await fixtures(page);
  await page.routeWebSocket('**', ws => {
    if (leftTerminal) leakedSockets++;
    ws.onMessage(() => {});
  });
  page.on('request', request => {
    if (leftTerminal && new URL(request.url()).pathname === '/api/node/mempool/recent') leakedPolls++;
  });
  await page.goto('/');
  await expect(page.locator('.site-nav')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Merchants', exact: true }).filter({ visible: true }).click();
  await page.waitForURL('**/network');
  leftTerminal = true;
  await page.waitForTimeout(4_000); // Longer than the old three-second reconnect timer.
  expect(leakedPolls).toBe(0);
  expect(leakedSockets).toBe(0);
  expect(errors).toEqual([]);
});
