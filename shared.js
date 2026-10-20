// Saved data and number formats shared by the Compare page (app.js) and the Convert page (convert.js).
// Both pages run on the same site, so they read the same localStorage.
(function (root) {
  'use strict';

  var COMPARE_KEY = 'exch:v1';
  var CONVERT_KEY = 'exch:convert:v1';

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; /* storage blocked or corrupt */ }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  // Quote 1 starts give-first (MYR 1000 = JPY ?). Quote 2 starts want-first, like a store board (JPY 1000 = MYR ?).
  function defaultCompare() {
    return {
      give: 'MYR',
      want: 'JPY',
      quotes: [
        { rows: [{ amount: '', side: 'give' }, { amount: '', side: 'want' }] },
        { rows: [{ amount: '', side: 'want' }, { amount: '', side: 'give' }] }
      ],
      exchangeAmount: ''
    };
  }

  function loadCompare() {
    var saved = read(COMPARE_KEY);
    if (saved && saved.quotes && saved.quotes.length === 2) {
      if (typeof saved.exchangeAmount !== 'string') saved.exchangeAmount = '';
      return saved;
    }
    return defaultCompare();
  }

  // source is null until the user picks one: 'quote0', 'quote1', 'rate' (Single Rate) or 'amounts' (Amount Pair).
  // The Single Rate starts as 1 Home = ? Foreign. The Amount Pair starts like a store board (JPY 1000 = MYR ?).
  function defaultConvert() {
    return {
      source: null,
      rate: { value: '', base: 'home' },
      amounts: { rows: [{ amount: '', side: 'foreign' }, { amount: '', side: 'home' }] }
    };
  }

  function loadConvert() {
    var saved = read(CONVERT_KEY);
    if (!saved || typeof saved !== 'object') return defaultConvert();
    // Data saved before the Amount Pair was renamed from "custom".
    if (saved.custom && !saved.amounts) saved.amounts = saved.custom;
    if (saved.source === 'custom') saved.source = 'amounts';
    delete saved.custom;
    // Data saved when the converter had its own currencies (now taken from the Compare page).
    delete saved.home;
    delete saved.foreign;

    var fresh = defaultConvert();
    if (!(saved.amounts && saved.amounts.rows && saved.amounts.rows.length === 2)) saved.amounts = fresh.amounts;
    if (!(saved.rate && typeof saved.rate.value === 'string')) saved.rate = fresh.rate;
    return saved;
  }

  function normalizeCode(value) { return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); }

  function fmtRate(n) { return n.toLocaleString(undefined, { maximumSignificantDigits: 6 }); }
  function fmtMoney(n) {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // A rate in the app's "code, then number" order: MYR 1 = JPY 38.721.
  function fmtRateLine(base, rate, other) { return base + ' 1 = ' + other + ' ' + fmtRate(rate); }

  root.Shared = {
    defaultCompare: defaultCompare,
    loadCompare: loadCompare,
    saveCompare: function (state) { write(COMPARE_KEY, state); },
    defaultConvert: defaultConvert,
    loadConvert: loadConvert,
    saveConvert: function (state) { write(CONVERT_KEY, state); },
    normalizeCode: normalizeCode,
    fmtRate: fmtRate,
    fmtMoney: fmtMoney,
    fmtRateLine: fmtRateLine
  };
})(this);
