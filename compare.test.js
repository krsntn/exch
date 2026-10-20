const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseAmount, toEffectiveRate, compareQuotes, totalsFor, amountPairRate, singleRate, flipSingleRate, homeCost
} = require('./compare.js');

const quote = (a, b) => ({ rows: [a, b] });
const give = (amount) => ({ amount, side: 'give' });
const want = (amount) => ({ amount, side: 'want' });

test('parseAmount accepts commas, spaces and decimals', () => {
  assert.equal(parseAmount('38,721'), 38721);
  assert.equal(parseAmount(' 1 000.50 '), 1000.5);
  assert.equal(parseAmount('.5'), 0.5);
  assert.equal(parseAmount('25.'), 25);
  assert.ok(Number.isNaN(parseAmount('')));
  assert.ok(Number.isNaN(parseAmount('abc')));
  assert.ok(Number.isNaN(parseAmount('1.2.3')));
  assert.ok(Number.isNaN(parseAmount('-5')));
});

test('Effective Rate is the same whichever direction the Quote is written in', () => {
  const giveFirst = toEffectiveRate(quote(give('1000'), want('38721')));
  const wantFirst = toEffectiveRate(quote(want('38721'), give('1000')));
  assert.equal(giveFirst.rate, 38.721);
  assert.equal(wantFirst.rate, 38.721);
});

test('store board written as JPY 1000 = MYR 25.83 turns into JPY per MYR', () => {
  const store = toEffectiveRate(quote(want('1000'), give('25.83')));
  assert.ok(Math.abs(store.rate - 38.71467) < 1e-5);
});

test('user example: Wise MYR 1000 -> JPY 38721 beats store JPY 1000 = MYR 25.83', () => {
  const result = compareQuotes(
    quote(give('1000'), want('38721')),
    quote(want('1000'), give('25.83'))
  );
  assert.equal(result.status, 'better');
  assert.equal(result.winner, 0);
  assert.equal(result.sampleAmount, 1000);
  assert.ok(Math.abs(result.difference - 6.33) < 0.01);
  assert.ok(Math.abs(result.percent - 0.0164) < 0.0001);
});

test('reversed Direction picks the other Quote', () => {
  // Giving JPY to get MYR: the store's MYR 25.83 per JPY 1000 beats Wise's ~25.826.
  const result = compareQuotes(
    quote(want('1000'), give('38721')),
    quote(give('1000'), want('25.83'))
  );
  assert.equal(result.status, 'better');
  assert.equal(result.winner, 1);
  assert.equal(result.sampleAmount, 38721);
});

test('equal rates written differently count as same', () => {
  const result = compareQuotes(
    quote(give('1000'), want('38000')),
    quote(want('3800'), give('100'))
  );
  assert.equal(result.status, 'same');
});

test('incomplete or invalid Quotes report an error per card', () => {
  const result = compareQuotes(
    quote(give('1000'), want('')),
    quote(give('1000'), give('25'))
  );
  assert.equal(result.status, 'incomplete');
  assert.equal(result.errors[0], 'Enter both amounts.');
  assert.equal(result.errors[1], 'Use each currency once.');

  const zero = compareQuotes(quote(give('0'), want('5')), quote(give('1'), want('5')));
  assert.equal(zero.errors[0], 'Amounts must be more than 0.');
  assert.equal(zero.errors[1], null);
});

test('user example: MYR 6000 Exchange Amount gives JPY 37.96 more with Wise', () => {
  const result = compareQuotes(
    quote(give('1000'), want('38721')),
    quote(want('1000'), give('25.83'))
  );
  const t = totalsFor(result.rates, '6,000');
  assert.equal(t.amount, 6000);
  assert.ok(Math.abs(t.totals[0] - 232326) < 1e-6);
  assert.ok(Math.abs(t.totals[1] - 232288.04) < 0.01);
  assert.ok(Math.abs(t.difference - 37.96) < 0.01);
});

test('Exchange Amount that is empty, zero or not a number gives no totals', () => {
  assert.equal(totalsFor([1, 2], ''), null);
  assert.equal(totalsFor([1, 2], '0'), null);
  assert.equal(totalsFor([1, 2], 'abc'), null);
});

test('Amount Pair written as a store board: JPY 1000 = MYR 25.83', () => {
  const r = amountPairRate({ rows: [{ amount: '1000', side: 'foreign' }, { amount: '25.83', side: 'home' }] });
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.rate - 38.71467) < 1e-5);
  const bad = amountPairRate({ rows: [{ amount: '1000', side: 'foreign' }, { amount: '', side: 'home' }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.error, 'Enter both amounts.');
});

test('Home Cost: JPY 1,500 at 1 MYR = 38.721 JPY is about MYR 38.74', () => {
  assert.ok(Math.abs(homeCost('1,500', 38.721) - 38.738) < 0.001);
  assert.equal(homeCost('', 38.721), null);
  assert.equal(homeCost('0', 38.721), null);
  assert.equal(homeCost('abc', 38.721), null);
});

test('Single Rate: 1 MYR = 38.72 JPY and 1 JPY = 0.0258 MYR both give Foreign per Home', () => {
  assert.deepEqual(singleRate({ value: '38.72', base: 'home' }), { ok: true, rate: 38.72 });
  const r = singleRate({ value: '0.025826', base: 'foreign' });
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.rate - 38.7207) < 1e-4);
});

test('Single Rate that is empty, zero or not a number is not valid', () => {
  assert.deepEqual(singleRate({ value: '', base: 'home' }), { ok: false, error: 'Enter the rate.' });
  assert.deepEqual(singleRate({ value: '0', base: 'home' }), { ok: false, error: 'Rate must be more than 0.' });
  assert.deepEqual(singleRate({ value: 'abc', base: 'home' }), { ok: false, error: 'Enter the rate.' });
});

test('flipping a Single Rate keeps its meaning: 1 MYR = 38.72 JPY becomes 1 JPY = 0.0258264 MYR', () => {
  const once = flipSingleRate({ value: '38.72', base: 'home' });
  assert.deepEqual(once, { value: '0.0258264', base: 'foreign', from: '38.72' });
  // A rate that is not valid keeps its text; only the base changes.
  assert.deepEqual(flipSingleRate({ value: '', base: 'home' }), { value: '', base: 'foreign' });
});

test('flipping a Single Rate twice without an edit gives back the exact text', () => {
  for (const text of ['38.72', '7', '0.0258', '1,234.5']) {
    const twice = flipSingleRate(flipSingleRate({ value: text, base: 'home' }));
    assert.equal(twice.value, text);
    assert.equal(twice.base, 'home');
  }
});
