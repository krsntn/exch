// Convert page: shows the Home Cost of a Price, using a rate from a Compare page Quote or a Custom Rate.
// Home Currency is the Compare page Give Currency; Foreign Currency is its Want Currency.
(function () {
  'use strict';

  var state = Shared.loadConvert();
  var price = ''; // Not saved: each item starts empty.

  var priceInput = document.getElementById('price');
  var priceCurrency = document.getElementById('price-currency');
  var priceError = document.getElementById('price-error');
  var homeCostEl = document.getElementById('home-cost');
  var rateLine = document.getElementById('rate-line');
  var sourceError = document.getElementById('source-error');
  var sourceButtons = Array.prototype.slice.call(document.querySelectorAll('[data-source]'));
  var customEl = document.getElementById('custom');
  var customRows = Array.prototype.slice.call(customEl.querySelectorAll('.row'));

  function sourceName(source) { return source === 'custom' ? 'Custom' : 'Quote ' + (Number(source.slice(-1)) + 1); }

  function showError(el, message) {
    el.hidden = !message;
    el.textContent = message || '';
  }

  // Until the user picks a Rate Source, use the Better Quote from the Compare page, or Custom when it has none.
  function defaultSource(compare, quoteRates) {
    var result = Compare.compareQuotes(compare.quotes[0], compare.quotes[1]);
    var winner = result.status === 'better' ? result.winner : result.status === 'same' ? 0 : -1;
    return winner >= 0 && quoteRates[winner].ok ? 'quote' + winner : 'custom';
  }

  // Returns { rate } or { error } for the chosen Rate Source.
  function chosenRate(source, quoteRates) {
    if (source === 'custom') {
      var custom = Compare.customRate(state.custom);
      if (custom.ok) return { rate: custom.rate };
      var typed = state.custom.rows.some(function (r) { return r.amount.trim() !== ''; });
      return { error: typed ? custom.error : 'Enter your rate below.' };
    }
    var i = Number(source.slice(-1));
    var q = quoteRates[i];
    return q.ok ? { rate: q.rate } : { error: sourceName(source) + ' is not complete on the Compare page.' };
  }

  function render() {
    // Read the Compare page data on each render, so a changed Direction or Quote is used at once.
    var compare = Shared.loadCompare();
    var home = compare.give;
    var foreign = compare.want;
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

    customEl.hidden = source !== 'custom';
    customRows.forEach(function (rowEl, r) {
      var side = state.custom.rows[r].side;
      rowEl.querySelector('.side').textContent = (side === 'home' ? home : foreign) || '—';
    });

    var chosen = currenciesOk
      ? chosenRate(source, quoteRates)
      : { error: 'Set two different currencies on the Compare page.' };
    showError(sourceError, chosen.error);
    rateLine.textContent = chosen.rate
      ? '1 ' + home + ' = ' + Shared.fmtRate(chosen.rate) + ' ' + foreign + ' (' + sourceName(source) + ')'
      : '';

    var cost = chosen.rate ? Compare.homeCost(price, chosen.rate) : null;
    var priceBad = price.trim() !== '' && !(Compare.parseAmount(price) > 0); // NaN > 0 is false
    showError(priceError, priceBad ? 'Price must be more than 0.' : null);
    homeCostEl.textContent = home + ' ' + (cost === null ? '—' : Shared.fmtMoney(cost));
    homeCostEl.classList.toggle('empty', cost === null);
  }

  function update() { Shared.saveConvert(state); render(); }

  customRows.forEach(function (rowEl, r) {
    rowEl.querySelector('.amount').value = state.custom.rows[r].amount;
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

  customRows.forEach(function (rowEl, r) {
    rowEl.querySelector('.amount').addEventListener('input', function (e) {
      state.custom.rows[r].amount = e.target.value;
      update();
    });
    // A Custom Rate always has one amount per currency, so tapping either currency flips both rows.
    rowEl.querySelector('.side').addEventListener('click', function () {
      state.custom.rows.forEach(function (row) { row.side = row.side === 'home' ? 'foreign' : 'home'; });
      update();
    });
  });

  // Pick up Compare page changes made in another tab, or when the page comes back from the browser cache.
  window.addEventListener('storage', render);
  window.addEventListener('pageshow', render);

  render();
})();
