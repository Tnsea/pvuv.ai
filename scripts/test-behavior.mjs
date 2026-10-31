import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../sdk/src/f.ts', import.meta.url), 'utf8');
const part = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const code = (await transform(part('  let pmN = 0;', '  // form funnel events:')
  + part('  function attachBehavior(', '  // -------------------------------------------------------------------------\n  // periodic reporting')
  + part('  // outbound_click (§4.1)', '  // SPA route tracking (§4.1)')
  + '\nglobalThis.collect = () => { const ev = {}; attachBehavior(ev); return JSON.stringify(ev); };', { loader: 'ts' })).code;
function browser() {
  const docListeners = {}, winListeners = {}, queued = [], timers = [];
  const context = {
    win: { addEventListener: (name, fn) => (winListeners[name] ??= []).push(fn) },
    doc: { documentElement: {}, addEventListener: (name, fn) => (docListeners[name] ??= []).push(fn) },
    nav: { maxTouchPoints: 0 }, mobileUA: false,
    loc: { href: 'https://example.com/chart', hostname: 'example.com' }, currentUrl: 'https://example.com/chart',
    tracking: true, maybePulseNow() {}, MutationObserver: class { observe() {} },
    setTimeout: fn => timers.push(fn), URL, Error, Date,
    accumulateDwell() {}, unreportedDwell: 0, maxScroll: 0, vitalsPayload() {}, x: {},
    baseEvent: event => ({ event }), queue: queued, flush() {}, track: (...args) => queued.push(args),
  };
  vm.runInNewContext(code, context);
  return {
    click(target, trusted) { for (const fn of docListeners.click) fn({ target, isTrusted: trusted, timeStamp: 1000, clientX: 20, clientY: 20 }); },
    error(event) { for (const fn of winListeners.error) fn(event); },
    collect: () => JSON.parse(context.collect()), queued, timers,
  };
}
const button = { id: '', tagName: 'BUTTON', classList: ['cf-icon-btn'], innerText: '',
  getAttribute: name => name === 'aria-label' ? 'Close the AI draft' : null,
  closest(selector) { return selector.startsWith('a[href],') ? this : null; } };

test('guided demo clicks produce no counts, rage/dead probes or pointer evidence; real input still counts', () => {
  const b = browser();
  for (let i = 0; i < 10; i++) b.click(button, false);
  assert.deepEqual(b.collect(), {}); assert.equal(b.timers.length, 0);
  b.click(button, true);
  const ev = b.collect();
  assert.equal(ev.p.ck[0].n, 1);
  assert.match(ev.p.ck[0].s, /Close the AI draft/);
});
test('synthetic outbound/declarative clicks are ignored and real outbound navigation is retained', () => {
  const b = browser();
  const link = { ...button, href: 'https://external.example/path', closest: () => null };
  link.closest = selector => selector === 'a[href]' ? link : null;
  b.click(link, false); assert.equal(b.queued.length, 0);
  b.click(link, true); assert.equal(b.queued[0].event, 'outbound_click');
});
test('resource failures identify the file without query, fragment or URL credentials', () => {
  const b = browser();
  b.error({ target: { tagName: 'SCRIPT', src: 'https://user:password@cdn.example/app.js?token=secret#private' } });
  b.error({ target: { tagName: 'LINK', href: '/theme.css?token=secret' } });
  const ev = b.collect();
  assert.equal(ev.er, 2);
  assert.deepEqual(ev.p.err.map(e => e.url), ['https://cdn.example/app.js', 'https://example.com/theme.css']);
  assert.ok(ev.p.err.every(e => e.type === 'resource'));
  assert.doesNotMatch(JSON.stringify(ev), /secret|password|private/);
});
test('runtime errors retain source location and deduplicate per source', () => {
  const b = browser();
  const error = { message: 'Example error', filename: '/app.js?v=2', lineno: 8, colno: 4 };
  b.error(error); b.error(error); b.error({ ...error, filename: '/other.js' });
  const ev = b.collect();
  assert.equal(ev.er, 3); assert.equal(ev.p.err.length, 2);
  assert.deepEqual(ev.p.err[0], { m: 'Example error', n: 2, type: 'js', url: 'https://example.com/app.js', line: 8, column: 4 });
});
test('large error samples and a full click buffer stay within the ingestion property limit', () => {
  const b = browser();
  for (let i = 0; i < 5; i++) b.error({ message: '"'.repeat(200) + i, filename: `/${'a'.repeat(195)}${i}.js`, lineno: i + 1, colno: 2 });
  for (let i = 0; i < 15; i++) b.click({ ...button, id: '"'.repeat(55) + i }, true);
  const ev = b.collect();
  assert.equal(ev.er, 5); assert.ok(ev.p.err.length > 0);
  assert.ok(JSON.stringify(ev.p).length <= 4096);
});

const html = await readFile(new URL('../workers/console/public/visitor.html', import.meta.url), 'utf8');
const uiCode = html.slice(html.indexOf('function foldSession('), html.indexOf('function eventLine('));
test('journey errors are expandable, include new URLs and safely display historical messages', () => {
  const ctx = { esc: s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]),
    t: s => s, te: s => s, parseProps: s => s ? JSON.parse(s) : null, pathHit: () => false, hms: () => '12:00', dur: () => '1s', refHost: () => '', badge: () => '' };
  vm.runInNewContext(uiCode + `\nglobalThis.render = (events) => pageLine(foldSession(events)[0], false);`, ctx);
  const page = { event: 'pageview', path: '/' };
  const pulse = (errors) => ({ event: 'page_pulse', path: '/', err_count: 1, props: JSON.stringify({ err: errors }) });
  const rendered = ctx.render([page, pulse([{ m: '<img src=x onerror=alert(1)>', n: 1, url: 'https://cdn.example/app.js', line: 8 }])]);
  assert.match(rendered, /<details class="error-details"><summary>/);
  assert.match(rendered, /https:\/\/cdn.example\/app.js:8/);
  assert.doesNotMatch(rendered, /<img src=x/);
  assert.match(ctx.render([page, pulse([{ m: 'resource load failed: script', n: 1 }])]), /resource load failed: script/);
  assert.match(ctx.render([page, pulse([])]), /No error details were recorded/);
});
