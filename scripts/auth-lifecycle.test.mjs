import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const session = id => ({ user: { id, email: `${id}@example.test` } });

// Run real component bodies with explicit render/commit phases, including the
// window between an auth event and React's passive-effect cleanup.
function hooks() {
  const slots = [];
  let cursor = 0;
  let pending = [];
  return {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
        return [slots[index].value, value => {
          slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
        }];
      },
      useRef(initial) {
        const index = cursor++;
        slots[index] ??= { current: initial };
        return slots[index];
      },
      useEffect(effect, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          pending.push(() => {
            previous?.cleanup?.();
            slots[index] = { deps, cleanup: effect() };
          });
        }
      },
      useCallback: callback => callback,
    },
    render(component) { cursor = 0; return component({ children: null }); },
    commit() { const effects = pending; pending = []; effects.forEach(run => run()); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

function load(file, mocks, bindings = {}, extra = '') {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(bindings), code)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded, loaded.exports, ...Object.values(bindings),
  );
  return loaded.exports;
}

function authHarness() {
  const runtime = hooks();
  const initial = deferred();
  const logout = deferred();
  const profiles = [];
  const errors = [];
  let listener;
  let unsubscribed = false;
  const client = {
    auth: {
      onAuthStateChange(callback) {
        listener = callback;
        return { data: { subscription: { unsubscribe() { unsubscribed = true; } } } };
      },
      getSession: () => initial.promise,
      signOut: () => logout.promise,
    },
    from: () => ({ select: () => ({ eq: (_column, id) => ({ abortSignal: signal => ({
      maybeSingle() {
        const request = { ...deferred(), id, signal };
        profiles.push(request);
        return request.promise;
      },
    }) }) }) }),
  };
  const { AuthProvider } = load('contexts/AuthContext.tsx', {
    react: runtime.react,
    '@/lib/supabase/client': { createClient: () => client, isSupabaseConfigured: () => true },
  }, { console: { error: (...args) => errors.push(args) } });
  const render = () => runtime.render(AuthProvider).props.value;
  render();
  runtime.commit();
  return { ...runtime, render, initial, logout, profiles, errors, emit: (event, value) => listener(event, value), unsubscribed: () => unsubscribed };
}

test('auth events supersede a pending initial session read', async () => {
  const h = authHarness();
  assert.equal(h.emit('SIGNED_IN', session('new')), undefined, 'SDK callback must stay synchronous');
  h.initial.resolve({ data: { session: session('old') }, error: null });
  await tick();
  assert.equal(h.render().user.id, 'new');
  assert.equal(h.render().isLoading, false);
  h.unmount();
});

test('late profiles cannot cross an identity change, even before cleanup', async () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  h.render(); h.commit();
  h.emit('SIGNED_IN', session('b'));
  h.profiles[0].resolve({ data: { id: 'a' }, error: null });
  await tick();
  assert.equal(h.render().profile, null);
  h.commit();
  assert.equal(h.profiles[0].signal.aborted, true);
  h.profiles[1].resolve({ data: { id: 'b' }, error: null });
  await tick();
  assert.equal(h.render().profile.id, 'b');
  h.emit('SIGNED_OUT', null);
  assert.equal(h.render().profile, null);
  h.unmount();
});

test('token refresh does not invalidate an in-flight profile for the same user', async () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  h.render(); h.commit();
  h.emit('TOKEN_REFRESHED', session('a'));
  h.profiles[0].resolve({ data: { id: 'a' }, error: null });
  await tick();
  assert.equal(h.render().profile.id, 'a');
  h.unmount();
});

test('a passive profile effect cannot start for an already superseded identity', () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  h.render();
  h.emit('SIGNED_IN', session('b'));
  h.commit();
  assert.equal(h.profiles.length, 0);
  h.render(); h.commit();
  assert.equal(h.profiles[0].id, 'b');
  h.unmount();
});

test('a profile from before sign-out cannot return on a same-user sign-in', async () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  h.render(); h.commit();
  h.emit('SIGNED_OUT', null);
  h.emit('SIGNED_IN', session('a'));
  h.profiles[0].resolve({ data: { id: 'a', display_name: 'Old profile' }, error: null });
  await tick();
  assert.equal(h.render().profile, null);
  h.commit();
  assert.equal(h.profiles.length, 2, 'same-user re-entry must start a fresh profile read');
  h.profiles[1].resolve({ data: { id: 'a', display_name: 'New profile' }, error: null });
  await tick();
  assert.equal(h.render().profile.display_name, 'New profile');
  h.unmount();
});

test('sign-out before initialization prevents a late session from restoring auth', async () => {
  const h = authHarness();
  const signingOut = h.render().signOut();
  h.logout.resolve({ error: null });
  await signingOut;
  h.initial.resolve({ data: { session: session('old') }, error: null });
  await tick();
  assert.equal(h.render().user, null);
  h.unmount();
});

test('sign-out completion cannot erase a newer sign-in', async () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  const signingOut = h.render().signOut();
  h.emit('SIGNED_IN', session('b'));
  h.logout.resolve({ error: null });
  await signingOut;
  assert.equal(h.render().user.id, 'b');
  h.unmount();
});

test('sign-out errors preserve the authenticated identity', async () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  const signingOut = h.render().signOut();
  h.logout.resolve({ error: new Error('offline') });
  await signingOut;
  assert.equal(h.errors[0][1].message, 'offline');
  assert.equal(h.render().user.id, 'a');
  h.unmount();
});

test('unmount aborts profile reads and unsubscribes auth', () => {
  const h = authHarness();
  h.emit('SIGNED_IN', session('a'));
  h.render(); h.commit();
  h.unmount();
  assert.equal(h.profiles[0].signal.aborted, true);
  assert.equal(h.unsubscribed(), true);
});

test('theme server snapshot never reads storage; blocked storage still permits toggling', () => {
  const window = new EventTarget();
  let reads = 0;
  let light;
  const theme = load('contexts/ThemeContext.tsx', { react: { ...React, useCallback: callback => callback, useEffect() {},
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  } }, {
    window,
    localStorage: { getItem() { reads++; throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } },
    document: { documentElement: { classList: { toggle(_name, value) { light = value; } } } },
  }, '\nexports.snapshots = { getServerSnapshot, getSnapshot };');
  assert.equal(theme.snapshots.getServerSnapshot(), true);
  assert.equal(reads, 0);
  assert.equal(theme.snapshots.getSnapshot(), true);
  theme.ThemeProvider({ children: null }).props.value.toggleTheme();
  assert.equal(theme.snapshots.getSnapshot(), false);
  assert.equal(light, false);
  theme.ThemeProvider({ children: null }).props.value.toggleTheme();
  assert.equal(theme.snapshots.getSnapshot(), true);
});

test('theme hydration starts light even when persisted preference is dark', () => {
  const theme = load('contexts/ThemeContext.tsx', { react: React }, {
    localStorage: { getItem: () => 'dark' },
  }, '\nexports.snapshots = { getServerSnapshot, getSnapshot };');
  assert.equal(theme.snapshots.getServerSnapshot(), true);
  assert.equal(theme.snapshots.getSnapshot(), false);
});

function mcpHarness() {
  const runtime = hooks();
  const requests = [];
  const { McpContent } = load('app/infra/mcp/page.tsx', {
    react: runtime.react,
    '@/contexts/AuthContext': { useAuth: () => ({ user: session('a').user, isLoading: false, isConfigured: true }) },
    '@/components/infra/InfraShell': 'section',
  }, { fetch: (_url, options) => {
    const request = { ...deferred(), options };
    requests.push(request);
    return request.promise;
  } }, '\nexports.McpContent = McpContent;');
  const render = () => runtime.render(McpContent);
  const generate = () => elements(render()).find(node => node.type === 'button' && node.props.onClick?.name === 'generateKey');
  const respond = (index, data, ok = true) => requests[index].resolve({ ok, json: async () => data });
  render(); runtime.commit();
  return { ...runtime, render, requests, generate, respond };
}

test('MCP serializes mutations and waits for the refreshed key list', async () => {
  const h = mcpHarness();
  assert.equal(h.generate().props.disabled, true);
  h.respond(0, { keys: [] });
  await tick();
  const generate = h.generate();
  const mutation = generate.props.onClick();
  await generate.props.onClick();
  assert.equal(h.requests.length, 2, 'double-click must not send two POSTs');
  h.respond(1, { key: 'test-only-key' });
  await mutation;
  assert.equal(h.generate().props.disabled, true);
  h.commit();
  assert.equal(h.requests.length, 3);
  await h.generate().props.onClick();
  assert.equal(h.requests.length, 3, 'POST must wait for GET reconciliation');
  h.respond(2, { keys: [{ id: '1', key_prefix: 'test', revoked_at: null }] });
  await tick();
  assert.equal(h.generate().props.disabled, false);
  h.unmount();
});

test('MCP load failures keep mutations disabled and offer a retry', async () => {
  const h = mcpHarness();
  h.respond(0, { error: 'offline' }, false);
  await tick();
  assert.equal(h.generate().props.disabled, true);
  const retry = elements(h.render()).find(node => node.type === 'button' && node.props.children === 'Retry loading keys');
  assert.ok(retry);
  retry.props.onClick();
  h.render(); h.commit();
  h.respond(1, { keys: [] });
  await tick();
  assert.equal(h.generate().props.disabled, false);
  h.unmount();
});

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}

test('seed initial renders match without generating entropy; reveal generates only in the browser event', () => {
  let generated = 0;
  const runtime = hooks();
  const { default: SeedPhraseLab } = load('components/labs/SeedPhraseLab.tsx', {
    react: runtime.react,
    '@scure/bip39': { generateMnemonic: () => { generated++; return Array(12).fill('example').join(' '); } },
    '@scure/bip39/wordlists/english.js': { wordlist: [] },
    './Lab': 'section',
  });
  const server = runtime.render(SeedPhraseLab);
  const client = runtime.render(SeedPhraseLab);
  assert.equal(JSON.stringify(server), JSON.stringify(client));
  assert.equal(generated, 0);
  elements(client).find(node => node.type === 'button' && node.props.children === 'Reveal phrase').props.onClick();
  assert.equal(generated, 1);
  const revealed = elements(runtime.render(SeedPhraseLab)).find(node => node.props?.className === 'sp-grid');
  assert.equal(revealed.props['aria-hidden'], false);
});

test('the actual navigation search button opens search through the shared event', () => {
  const window = new EventTarget();
  const searchHooks = hooks();
  const search = load('components/SearchModal.tsx', {
    react: searchHooks.react,
    'next/navigation': { useRouter: () => ({ push() {} }) },
    '@/contexts/ThemeContext': { useTheme: () => ({ isLightMode: true }) },
  }, { window });
  assert.equal(searchHooks.render(search.default), null);
  searchHooks.commit();
  const navHooks = hooks();
  const nav = load('components/SiteNav.tsx', {
    react: { ...navHooks.react, useId: () => 'nav' },
    'next/image': 'img', 'next/link': 'a',
    '@/contexts/ThemeContext': { useTheme: () => ({ isLightMode: true, toggleTheme() {} }) },
    '@/components/auth': { UserMenu: 'span' },
    '@/components/StreakBadge': 'span',
    '@/components/SearchModal': search,
  }, { window });
  const button = elements(navHooks.render(nav.default)).find(node => node.type === 'button' && node.props['aria-label'] === 'Search lessons and writings');
  assert.ok(button);
  button.props.onClick();
  assert.notEqual(searchHooks.render(search.default), null);
  searchHooks.unmount();
});
