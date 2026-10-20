// Comparison math for two Quotes. No page code here, so it runs in the browser and in Node tests.
// Terms (Quote, Direction, Effective Rate, Difference, Sample Amount) are defined in CONTEXT.md.
(function (root) {
  'use strict';

  // Relative tolerance below which two Effective Rates count as the same.
  var SAME_RATE_TOLERANCE = 1e-9;

  // Turns user text such as "38,721" or " 1 000.50 " into a number. Returns NaN when not a number.
  function parseAmount(text) {
    if (typeof text === 'number') return text;
    if (typeof text !== 'string') return NaN;
    var cleaned = text.replace(/[,\s]/g, '');
    if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return NaN;
    return Number(cleaned);
  }

  // A Quote is { rows: [{ amount, side }, { amount, side }] } where side is 'give' or 'want'.
  // Returns { ok: true, rate, giveAmount } or { ok: false, error }.
  function toEffectiveRate(quote) {
    var rows = quote && quote.rows;
    if (!rows || rows.length !== 2) return { ok: false, error: 'A quote needs two amounts.' };

    var give = rows.filter(function (r) { return r.side === 'give'; });
    var want = rows.filter(function (r) { return r.side === 'want'; });
    if (give.length !== 1 || want.length !== 1) {
      return { ok: false, error: 'Use each currency once.' };
    }

    var giveAmount = parseAmount(give[0].amount);
    var wantAmount = parseAmount(want[0].amount);
    if (isNaN(giveAmount) || isNaN(wantAmount)) return { ok: false, error: 'Enter both amounts.' };
    if (giveAmount <= 0 || wantAmount <= 0) return { ok: false, error: 'Amounts must be more than 0.' };

    return { ok: true, rate: wantAmount / giveAmount, giveAmount: giveAmount };
  }

  // Compares two Quotes for the same Direction.
  // Returns one of:
  //   { status: 'incomplete', errors: [error|null, error|null] }
  //   { status: 'same', rates, sampleAmount }
  //   { status: 'better', winner: 0|1, rates, sampleAmount, difference, percent }
  function compareQuotes(first, second) {
    var a = toEffectiveRate(first);
    var b = toEffectiveRate(second);
    if (!a.ok || !b.ok) {
      return { status: 'incomplete', errors: [a.ok ? null : a.error, b.ok ? null : b.error] };
    }

    var rates = [a.rate, b.rate];
    var sampleAmount = a.giveAmount;
    var high = Math.max(a.rate, b.rate);
    var low = Math.min(a.rate, b.rate);

    if ((high - low) / high <= SAME_RATE_TOLERANCE) {
      return { status: 'same', rates: rates, sampleAmount: sampleAmount };
    }

    return {
      status: 'better',
      winner: a.rate > b.rate ? 0 : 1,
      rates: rates,
      sampleAmount: sampleAmount,
      difference: sampleAmount * (high - low),
      percent: ((high - low) / low) * 100
    };
  }

  // Applies both Effective Rates to the Exchange Amount (in Give Currency).
  // Returns { amount, totals: [Want amount for Quote 1, for Quote 2], difference } or null when the amount is not valid.
  function totalsFor(rates, amountText) {
    var amount = parseAmount(amountText);
    if (isNaN(amount) || amount <= 0) return null;
    var totals = [amount * rates[0], amount * rates[1]];
    return { amount: amount, totals: totals, difference: Math.abs(totals[0] - totals[1]) };
  }

  var api = {
    parseAmount: parseAmount,
    toEffectiveRate: toEffectiveRate,
    compareQuotes: compareQuotes,
    totalsFor: totalsFor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Compare = api;
})(this);
