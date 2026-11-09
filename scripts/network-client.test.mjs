import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const tick = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// Execute the real components with separate render/commit phases to cover responses
// arriving before passive cleanup, without requiring a server or React test renderer.
function hooks() {
  const slots = [];
  const pending = new Map();
  let cursor = 0;
  let dirty = false;
  const runtime = {
    holdQuery: false,
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
        return [slots[index].value, update => {
          const value = typeof update === 'function' ? update(slots[index].value) : update;
          if (!Object.is(value, slots[index].value)) dirty = true;
          slots[index].value = value;
        }];
      },
      useRef(initial) {
        const index = cursor++;
        slots[index] ??= { current: initial };
        return slots[index];
      },
      useMemo(calculate, deps) {
        const index = cursor++;
        if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
          slots[index] = { deps, value: calculate() };
        }
        return slots[index].value;
      },
      useCallback(callback, deps) { return runtime.react.useMemo(() => callback, deps); },
      useDeferredValue(value) {
        const index = cursor++;
        slots[index] ??= { value };
        if (!runtime.holdQuery) slots[index].value = value;
        return slots[index].value;
      },
      useEffectEvent(callback) {
        const index = cursor++;
        slots[index] ??= { invoke: (...args) => slots[index].callback(...args) };
        slots[index].callback = callback;
        return slots[index].invoke;
      },
      useEffect(effect, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          slots[index] = { deps, effect, cleanup: previous?.cleanup };
          pending.set(index, () => {
            slots[index].cleanup?.();
            slots[index].cleanup = effect();
          });
        }
      },
    },
    render(component, props) {
      let tree;
      let attempts = 0;
      do {
        assert.ok(attempts++ < 10, 'render-phase updates must converge');
        cursor = 0;
        dirty = false;
        tree = component(props);
      } while (dirty);
      return tree;
    },
    commit() {
      const effects = [...pending.values()];
      pending.clear();
      effects.forEach(effect => effect());
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    replayEffects() {
      slots.forEach(slot => slot?.cleanup?.());
      slots.forEach(slot => { if (slot?.effect) slot.cleanup = slot.effect(); });
    },
  };
  return runtime;
}

function load(file, mocks, bindings = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(bindings), code)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded, loaded.exports, ...Object.values(bindings),
  );
  return loaded.exports.default;
}

function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const merchant = (id, overrides = {}) => ({
  id, name: `Merchant ${id}`, category: 'Retail', paymentMethods: ['both'],
  source: 'btcmap', verified: true, location: { lat: 20, lon: Number(id) || 0, country: 'US' }, ...overrides,
});
const text = tree => Array.isArray(tree) ? tree.map(text).join('') :
  typeof tree === 'string' || typeof tree === 'number' ? String(tree) : text(tree?.props?.children ?? []);

function pageHarness({ geolocation = true } = {}) {
  const runtime = hooks();
  const requests = [];
  const timers = new Map();
  let locate;
  let unavailable;
  const MapComponent = () => null;
  const Page = load('app/network/page.tsx', {
    react: runtime.react,
    'next/dynamic': () => MapComponent,
    '@/contexts/ThemeContext': { useTheme: () => ({ isLightMode: false }) },
    '@/components/SiteNav': () => null,
    '@/components/SiteFooter': () => null,
    '@/components/network/JoinNetworkModal': () => null,
    '@/lib/network/types': { BUSINESS_CATEGORIES: ['Retail', 'Services'] },
  }, {
    navigator: geolocation ? { geolocation: { getCurrentPosition(success, failure) { locate = success; unavailable = failure; } } } : {},
    fetch(url, { signal }) {
      const request = { ...deferred(), url, signal };
      requests.push(request);
      return request.promise;
    },
    setTimeout(callback) { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    document: { getElementById: () => null },
  });
  let tree;
  const renderComponent = runtime.render;
  const render = () => { tree = renderComponent(Page); return tree; };
  const find = predicate => nodes(tree, predicate)[0];
  const control = label => find(node => node.props?.['aria-label'] === label);
  const button = label => find(node => node.type === 'button' && text(node).trim() === label);
  const map = () => find(node => node.type === MapComponent)?.props;
  const cards = () => nodes(tree, node => node.props?.className?.split(' ').includes('business-card'));
  const change = (label, value) => control(label).props.onChange({ target: { value } });
  const reply = async (index, businesses, ok = true) => {
    requests[index].resolve({ ok, json: async () => ({ businesses }) });
    await tick();
  };
  render(); runtime.commit();
  return Object.assign(runtime, { render, requests, timers, control, button, map, cards, change, reply,
    locate: () => locate({ coords: { latitude: 20, longitude: 0 } }), failLocation: () => unavailable() });
}

test('request snapshots derive loading immediately and reject stale responses before and after cleanup', async () => {
  const h = pageHarness();
  assert.equal(h.map(), undefined);
  h.locate(); h.render();
  await h.reply(0, [merchant('stale-before-cleanup')]);
  h.render();
  assert.equal(h.map(), undefined);
  h.commit();
  assert.equal(h.requests[0].signal.aborted, true);
  assert.match(h.requests[1].url, /radius=500/);
  await h.reply(1, [merchant('1')]); h.render(); h.commit();
  assert.equal(h.cards().length, 1);
  h.change('Nearby search radius', '100'); h.render();
  assert.equal(h.cards().length, 0, 'list must show loading before the next effect runs');
  assert.equal(h.map().businesses[0].id, '1', 'retain the previous map during loading');
  h.commit();
  h.change('Nearby search radius', '50'); h.render(); h.commit();
  await h.reply(3, [merchant('3')]); h.render(); h.commit();
  await h.reply(2, [merchant('stale-after-cleanup')]); h.render();
  assert.equal(h.map().businesses[0].id, '3');
  h.change('Nearby search radius', '250'); h.render(); h.commit();
  await h.reply(4, [], false); h.render();
  assert.ok(h.button('Retry'));
  h.button('Retry').props.onClick(); h.render();
  assert.equal(h.button('Retry'), undefined);
  h.commit();
  await h.reply(5, [merchant('5')]); h.render();
  assert.equal(h.map().businesses[0].id, '5');
  h.unmount();
});

test('deferred filtering is memoized and pagination resets without an effect chain', async () => {
  const h = pageHarness();
  h.failLocation();
  const businesses = Array.from({ length: 230 }, (_, i) => merchant(String(i), { category: i < 210 ? 'Retail' : 'Services' }));
  await h.reply(0, businesses); h.render(); h.commit();
  assert.equal(h.cards().length, 100);
  h.button('Show more (130 remaining)').props.onClick(); h.render();
  assert.equal(h.cards().length, 200);
  const original = h.map().businesses;
  h.holdQuery = true;
  h.change('Search merchants', ' Merchant 22 '); h.render();
  assert.equal(h.control('Search merchants').props.value, ' Merchant 22 ');
  assert.equal(h.map().businesses, original);
  assert.equal(h.cards().length, 200);
  h.holdQuery = false; h.render();
  assert.equal(h.map().businesses.length, 11);
  h.change('Search merchants', ''); h.render();
  assert.equal(h.cards().length, 100, 'returning to an earlier filter must not restore its old page limit');
  h.change('Merchant category', 'Retail'); h.render();
  assert.equal(h.map().businesses.length, 210);
  h.button('Show more (110 remaining)').props.onClick(); h.render();
  assert.equal(h.cards().length, 200);
  h.map().onBoundsChange({}, businesses.slice(0, 205).map(b => b.id)); h.render();
  assert.equal(h.cards().length, 200, 'viewport callbacks must not reset pagination');
  const filtered = h.map().businesses;
  h.button('Join the Network').props.onClick(); h.render();
  assert.equal(h.map().businesses, filtered);
  h.unmount();
});

test('geolocation unavailable and late callbacks are cleaned up', async () => {
  const unsupported = pageHarness({ geolocation: false });
  assert.equal(unsupported.timers.size, 1);
  [...unsupported.timers.values()][0](); unsupported.render();
  assert.ok(nodes(unsupported.render(), node => node.props?.className === 'location-status error').length);
  unsupported.unmount();
  assert.equal(unsupported.timers.size, 0);
  const h = pageHarness();
  h.unmount();
  h.locate(); h.failLocation();
  await h.reply(0, [merchant('late')]); h.render();
  assert.equal(h.map(), undefined);
  assert.equal(h.requests.length, 1);
});

test('sorting preserves selection without refetching and selection cannot leak across requests', async () => {
  const h = pageHarness();
  h.locate(); h.render(); h.commit();
  await h.reply(1, [merchant('2'), merchant('1')]); h.render(); h.commit();
  h.map().onSelectBusiness(h.map().businesses[0]); h.render();
  const selectedId = h.map().selectedBusiness.id;
  h.button('By distance').props.onClick(); h.render(); h.commit();
  assert.equal(h.map().selectedBusiness.id, selectedId);
  assert.equal(h.requests.length, 2);
  h.change('Nearby search radius', '100'); h.render();
  assert.equal(h.map().selectedBusiness, null);
  h.commit();
  await h.reply(2, [merchant('2'), merchant('1')]); h.render();
  assert.equal(h.map().selectedBusiness, null);
  h.unmount();
});

function mapHarness() {
  const runtime = hooks();
  const frames = new Map();
  const maps = [];
  const markers = [];
  let frameId = 0;
  let disconnected = 0;
  class Path {}
  class Marker extends Path {
    constructor(point, style) {
      super(); this.point = point; this.style = style; this.events = {}; this.open = false;
      this.popupUpdates = 0; this.moves = 0; markers.push(this);
    }
    addTo(map) { this.map = map; map.layers.add(this); return this; }
    bindPopup(content) { this.popup = content; return this; }
    bindTooltip() { return this; }
    on(event, callback) { this.events[event] = callback; return this; }
    getLatLng() { return { lat: this.point[0], lng: this.point[1] }; }
    setLatLng(point) { this.point = point; this.moves++; return this; }
    isPopupOpen() { return this.open; }
    setPopupContent(content) { this.content = content; this.popupUpdates++; }
    setStyle(style) { this.style = { ...this.style, ...style }; }
    bringToFront() {}
    closePopup() { this.open = false; }
    openPopup() { this.open = true; }
    remove() { this.map.layers.delete(this); this.open = false; }
  }
  const L = {
    Path,
    map() {
      const map = { layers: new Set(), fits: 0, views: 0, zoom: 2,
        on() {}, invalidateSize() {},
        getBounds: () => ({ contains: () => true, getNorth: () => 90, getSouth: () => -90, getEast: () => 180, getWest: () => -180 }),
        fitBounds() { this.fits++; },
        setView(_point, zoom) { this.views++; this.zoom = zoom; },
        getZoom() { return this.zoom; },
        eachLayer(callback) { [...this.layers].forEach(callback); },
        removeLayer(layer) { layer.remove(); },
        remove() { assert.equal(this.layers.size, 0, 'canvas paths must be removed before the renderer'); this.removed = true; },
      };
      maps.push(map); return map;
    },
    control: { zoom: () => ({ addTo() {} }) },
    tileLayer: () => ({ addTo() { return this; }, on() {} }),
    circleMarker: (point, style) => new Marker(point, style),
    latLngBounds: () => ({ points: [], extend(point) { this.points.push(point); }, isValid() { return this.points.length > 0; } }),
  };
  const Component = load('components/network/NetworkMap.tsx', {
    react: runtime.react, leaflet: L, 'leaflet/dist/leaflet.css': {},
  }, {
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} disconnect() { disconnected++; } },
    document: { createElement: () => ({ children: [], append(...children) { this.children.push(...children); } }) },
  });
  const selections = [];
  let props = { businesses: [], selectedBusiness: null, onSelectBusiness: business => selections.push(business),
    onBoundsChange() {}, userLocation: null, isLightMode: false };
  const render = (updates = {}) => {
    props = { ...props, ...updates };
    const tree = runtime.render(Component, props);
    nodes(tree, node => node.props?.className === 'merchant-map-canvas')[0].props.ref.current = {};
    runtime.commit();
  };
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); };
  render(); flush();
  return { ...runtime, render, flush, maps, markers, selections, frames, disconnected: () => disconnected };
}

test('markers reconcile by ID; sorting preserves selection, popup, and viewport', () => {
  const h = mapHarness();
  const a = merchant('1'); const b = merchant('2');
  h.render({ businesses: [a, b] }); h.flush();
  const map = h.maps[0]; const [aMarker, bMarker] = h.markers;
  assert.equal(map.fits, 1);
  h.render({ selectedBusiness: a });
  assert.equal(aMarker.style.radius, 9);
  assert.equal(aMarker.open, true);
  assert.equal(map.views, 1);
  const updatedA = { ...a, distance: 20 };
  h.render({ businesses: [b, updatedA], selectedBusiness: updatedA }); h.flush();
  assert.equal(h.markers.length, 2);
  assert.equal(aMarker.style.radius, 9);
  assert.equal(aMarker.open, true);
  assert.equal(aMarker.popupUpdates, 0, 'distance-only sorting must not reopen or auto-pan the popup');
  assert.equal(map.fits, 1);
  assert.equal(map.views, 1);
  aMarker.events.click();
  assert.equal(h.selections.at(-1), updatedA, 'click callbacks must use current merchant data');
  h.render({ businesses: [updatedA] }); h.flush();
  assert.equal(map.layers.has(bMarker), false);
  assert.equal(h.markers.length, 2);
  assert.equal(map.fits, 2);
  const moved = { ...updatedA, location: { ...a.location, lat: 21 } };
  h.render({ businesses: [moved], selectedBusiness: moved }); h.flush();
  assert.equal(aMarker.moves, 1);
  assert.equal(map.fits, 3);
  h.render({ businesses: [moved, merchant('invalid', { location: { lat: NaN, lon: 0 } })] }); h.flush();
  assert.equal(map.fits, 3, 'non-geographic membership must not refit the map');
  h.render({ businesses: [] }); h.flush();
  h.render({ businesses: [moved] }); h.flush();
  const restored = h.markers.at(-1);
  assert.equal(restored.style.radius, 9);
  assert.equal(restored.open, true);
  assert.equal(map.views, 1, 'restoring the same selection must not issue another setView');
  h.render({ userLocation: { lat: 20, lon: 0 } });
  h.unmount();
  assert.equal(map.removed, true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.disconnected(), 1);
});

test('cancelled fits do not lose geographic changes and Strict Mode remount restores selection', () => {
  const h = mapHarness();
  const a = merchant('1'); const b = merchant('2');
  h.render({ businesses: [a, b], selectedBusiness: a });
  h.render({ businesses: [b, a] });
  h.flush();
  assert.equal(h.maps[0].fits, 1);
  h.replayEffects(); h.flush();
  assert.equal(h.maps[0].removed, true);
  assert.equal(h.maps[1].fits, 1);
  assert.equal(h.markers.at(-1).style.radius, 9);
  assert.equal(h.markers.at(-1).open, true);
  h.unmount();
});
