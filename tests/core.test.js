// Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const mod = { exports: {} };
vm.runInNewContext(src, { module: mod, Date, JSON, Math });
const C = mod.exports;

test('wordCount', () => {
  assert.strictEqual(C.wordCount(''), 0);
  assert.strictEqual(C.wordCount("Today I didn't go to work."), 6);
});
test('todayStr pads', () => {
  assert.strictEqual(C.todayStr(new Date(2026, 0, 5)), '2026-01-05');
});
test('streak counts consecutive days ending today', () => {
  assert.strictEqual(C.calcStreak(['2026-10-27', '2026-10-26', '2026-10-25', '2026-10-22'], '2026-10-27'), 3);
});
test('streak still counts if today not written yet', () => {
  assert.strictEqual(C.calcStreak(['2026-10-26', '2026-10-25'], '2026-10-27'), 2);
});
test('streak breaks after a gap of 2+ days', () => {
  assert.strictEqual(C.calcStreak(['2026-10-24'], '2026-10-27'), 0);
  assert.strictEqual(C.calcStreak([], '2026-10-27'), 0);
});
test('streak across month boundary', () => {
  assert.strictEqual(C.calcStreak(['2026-11-01', '2026-10-31', '2026-10-30'], '2026-11-01'), 3);
});
test('stats: changes per 100 words, last 7 vs earlier', () => {
  const mk = (d, words, n) => ({ id: d, date: d, original: Array(words).fill('word').join(' '), changes: Array(n).fill({}) });
  const es = [];
  for (let i = 1; i <= 9; i++) es.push(mk('2026-10-' + String(i).padStart(2, '0'), 100, i <= 2 ? 10 : 2));
  const s = C.calcStats(es, '2026-10-09');
  assert.strictEqual(s.total, 9);
  assert.strictEqual(s.streak, 9);
  assert.strictEqual(s.words, 900);
  assert.strictEqual(s.last7, 2);       // days 3..9 have 2 per 100
  assert.strictEqual(s.earlier, 10);    // days 1..2 have 10 per 100
});
test('stats empty', () => {
  const s = C.calcStats([], '2026-10-27');
  assert.strictEqual(s.total, 0); assert.strictEqual(s.last7, null); assert.strictEqual(s.earlier, null);
});
test('buildRequest uses deepseek-chat json mode', () => {
  const r = C.buildRequest('I go home.');
  assert.strictEqual(r.model, 'deepseek-chat');
  assert.strictEqual(r.temperature, 0.3);
  assert.strictEqual(JSON.stringify(r.response_format), '{"type":"json_object"}');
  assert.strictEqual(r.messages[1].content, 'I go home.');
  assert.match(r.messages[0].content, /JSON/);
});
test('parseResult handles valid, fenced and partial JSON', () => {
  const a = C.parseResult('{"corrected":"I went home.","changes":[{"original":"I go home","natural":"I went home","why":"past tense"}]}', 'x');
  assert.strictEqual(a.corrected, 'I went home.');
  assert.strictEqual(a.changes[0].alternative, '');
  const b = C.parseResult('```json\n{"changes":[]}\n```', 'orig');
  assert.strictEqual(b.corrected, 'orig');
  const many = JSON.stringify({ corrected: 'y', changes: Array(12).fill({ original: 'a', natural: 'b', why: 'c' }) });
  assert.strictEqual(C.parseResult(many, 'x').changes.length, 8);
  assert.throws(() => C.parseResult('not json', 'x'));
});
test('errorMessage covers 401/402/network', () => {
  assert.match(C.errorMessage(401), /401/);
  assert.match(C.errorMessage(402), /balance/i);
  assert.match(C.errorMessage(0), /Network/);
  assert.match(C.errorMessage(503), /busy/);
});
test('mergeEntry: new, overwrite, append', () => {
  const e1 = { id: 'a', date: '2026-10-27', original: 'One.', corrected: 'One!', changes: [{}], savedAt: '1' };
  let list = C.mergeEntry([], e1, 'overwrite');
  assert.strictEqual(list.length, 1);
  const e2 = { id: 'b', date: '2026-10-27', original: 'Two.', corrected: '', changes: [{}, {}], savedAt: '2' };
  const ow = C.mergeEntry(list, Object.assign({}, e2), 'overwrite');
  assert.strictEqual(ow.length, 1); assert.strictEqual(ow[0].original, 'Two.'); assert.strictEqual(ow[0].id, 'a');
  const ap = C.mergeEntry(list, Object.assign({}, e2), 'append');
  assert.strictEqual(ap[0].original, 'One.\n\nTwo.');
  assert.strictEqual(ap[0].corrected, 'One!\n\nTwo.');
  assert.strictEqual(ap[0].changes.length, 3);
});
test('validateImport accepts export file, drops junk, never needs key', () => {
  const out = C.validateImport({ app: 'english-log', entries: [{ id: 'x', date: '2026-10-01', original: 'Hi' }, { date: 'bad', original: 'no' }, null] });
  assert.strictEqual(out.length, 1); assert.strictEqual(out[0].changes.length, 0);
  assert.throws(() => C.validateImport({ foo: 1 }));
});
test('no API key embedded in the page', () => {
  assert.doesNotMatch(html, /sk-[A-Za-z0-9]{16,}/);
});
