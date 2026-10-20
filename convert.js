// Convert page: shows the Home Cost of a Price, using a rate from a Compare page Quote, a Single Rate or an Amount Pair.
// Home Currency is the Compare page Give Currency; Foreign Currency is its Want Currency.
(function () {
  'use strict';

  var state = Shared.loadConvert();
  var price = ''; // Not saved: each item starts empty.

  var SOURCE_NAMES = { quote0: 'Quote 1', quote1: 'Quote 2', rate: 'Rate', amounts: 'Amounts' };

  var priceInput = document.getElementById('price');
  var priceCurrency = document.getElementById('price-currency');
  var priceError = document.getElementById('price-error');
  var homeCostEl = document.getElementById('home-cost');
  var rateLine = document.getElementById('rate-line');
  var sourceError = document.getElementById('source-error');
  var sourceButtons = Array.prototype.slice.call(document.querySelectorAll('[data-source]'));
  var rateEl = document.getElementById('rate');
  var rateBase = document.getElementById('rate-base');
  var rateValue = document.getElementById('rate-value');
  var rateOther = document.getElementById('rate-other');
  var amountsEl = document.getElementById('amounts');
  var amountRows = Array.prototype.slice.call(amountsEl.querySelectorAll('.row'));

  function showError(el, message) {
    el.hidden = !message;
    el.textContent = message || '';
  }

  // Until the user picks a Rate Source, use the Better Quote from the Compare page, or Rate when it has none.
  function defaultSource(compare, quoteRates) {
    var result = Compare.compareQuotes(compare.quotes[0], compare.quotes[1]);
    var winner = result.status === 'better' ? result.winner : result.status === 'same' ? 0 : -1;
    return winner >= 0 && quoteRates[winner].ok ? 'quote' + winner : 'rate';
  }

  // Returns { rate } or { error } for the chosen Rate Source. An empty typed source asks for input, not an error.
  function chosenRate(source, quoteRates) {
    var r;
    if (source === 'rate') {
      r = Compare.singleRate(state.rate);
      if (r.ok) return { rate: r.rate };
      return { error: state.rate.value.trim() ? r.error : 'Enter your rate below.' };
    }
    if (source === 'amounts') {
      r = Compare.amountPairRate(state.amounts);
      if (r.ok) return { rate: r.rate };
      var typed = state.amounts.rows.some(function (row) { return row.amount.trim() !== ''; });
      return { error: typed ? r.error : 'Enter your rate below.' };
    }
    r = quoteRates[Number(source.slice(-1))];
    return r.ok ? { rate: r.rate } : { error: SOURCE_NAMES[source] + ' is not complete on the Compare page.' };
  }

  function render() {
    // Read the Compare page data on each render, so a changed Direction or Quote is used at once.
    var compare = Shared.loadCompare();
    var home = compare.give;
    var foreign = compare.want;
    function code(side) { return (side === 'home' ? home : foreign) || '—'; }
    priceCurrency.textContent = foreign || '—';

    var currenciesOk = home.length > 0 && foreign.length > 0 && home !== foreign;
    // A Quote's Effective Rate is already Want (Foreign) per Give (Home).
    var quoteRates = [0, 1].map(function (i) { return Compare.toEffectiveRate(compare.quotes[i]); });
    var source = state.source || defaultSource(compare, quoteRates);

    sourceButtons.forEach(function (btn, i) {
      var selected = btn.dataset.source === source;
      btn.setAttribute('aria-pressed', String(selected));
      // A Quote that cannot give a rate is disabled, unless it is the chosen source (then its error shows).
      btn.disabled = i < 2 && !quoteRates[i].ok && !selected;
    });

    rateEl.hidden = source !== 'rate';
    rateBase.textContent = code(state.rate.base);
    rateOther.textContent = code(state.rate.base === 'home' ? 'foreign' : 'home');

    amountsEl.hidden = source !== 'amounts';
    amountRows.forEach(function (rowEl, r) {
      rowEl.querySelector('.side').textContent = code(state.amounts.rows[r].side);
    });

    var chosen = currenciesOk
      ? chosenRate(source, quoteRates)
      : { error: 'Set two different currencies on the Compare page.' };
    showError(sourceError, chosen.error);
    rateLine.textContent = chosen.rate
      ? Shared.fmtRateLine(home, chosen.rate, foreign) + ' (' + SOURCE_NAMES[source] + ')'
      : '';

    var cost = chosen.rate ? Compare.homeCost(price, chosen.rate) : null;
    var priceBad = price.trim() !== '' && !(Compare.parseAmount(price) > 0); // NaN > 0 is false
    showError(priceError, priceBad ? 'Price must be more than 0.' : null);
    homeCostEl.textContent = home + ' ' + (cost === null ? '—' : Shared.fmtMoney(cost));
    homeCostEl.classList.toggle('empty', cost === null);
  }

  function update() { Shared.saveConvert(state); render(); }

  rateValue.value = state.rate.value;
  amountRows.forEach(function (rowEl, r) {
    rowEl.querySelector('.amount').value = state.amounts.rows[r].amount;
  });

  priceInput.addEventListener('input', function () {
    price = priceInput.value;
    render();
  });

  sourceButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.source = btn.dataset.source;
      update();
    });
  });

  rateValue.addEventListener('input', function () {
    state.rate = { value: rateValue.value, base: state.rate.base }; // An edit drops the text kept by the last flip.
    update();
  });
  // Tapping the currency flips the Single Rate (1 MYR = 38.72 JPY <-> 1 JPY = 0.0258264 MYR).
  rateBase.addEventListener('click', function () {
    state.rate = Compare.flipSingleRate(state.rate);
    rateValue.value = state.rate.value;
    update();
  });

  amountRows.forEach(function (rowEl, r) {
    rowEl.querySelector('.amount').addEventListener('input', function (e) {
      state.amounts.rows[r].amount = e.target.value;
      update();
    });
    // An Amount Pair always has one amount per currency, so tapping either currency flips both rows.
    rowEl.querySelector('.side').addEventListener('click', function () {
      state.amounts.rows.forEach(function (row) { row.side = row.side === 'home' ? 'foreign' : 'home'; });
      update();
    });
  });

  // Pick up Compare page changes made in another tab, or when the page comes back from the browser cache.
  window.addEventListener('storage', render);
  window.addEventListener('pageshow', render);

  render();
})();
