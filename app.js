// Page code: reads the form, calls Compare.compareQuotes, shows the result, and saves state on this device.
(function () {
  'use strict';

  var STORAGE_KEY = 'exch:v1';

  // Quote 1 starts give-first (MYR 1000 = JPY ?). Quote 2 starts want-first, like a store board (JPY 1000 = MYR ?).
  function defaultState() {
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

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.quotes && saved.quotes.length === 2) {
        if (typeof saved.exchangeAmount !== 'string') saved.exchangeAmount = '';
        return saved;
      }
    } catch (e) { /* storage blocked or corrupt: use defaults */ }
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  var state = load();

  var giveInput = document.getElementById('give-currency');
  var wantInput = document.getElementById('want-currency');
  var directionError = document.getElementById('direction-error');
  var resultEl = document.getElementById('result');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var exchangeInput = document.getElementById('exchange-amount');
  var exchangeCurrency = document.getElementById('exchange-currency');
  var exchangeError = document.getElementById('exchange-error');
  var totalEl = document.getElementById('total-result');

  function code(side) { return side === 'give' ? state.give : state.want; }
  function quoteName(i) { return 'Quote ' + (i + 1); }

  function fmtRate(n) { return n.toLocaleString(undefined, { maximumSignificantDigits: 6 }); }
  function fmtMoney(n) {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPercent(p) { return p < 0.01 ? '<0.01%' : p.toFixed(2) + '%'; }

  // Writes state into the inputs. Called on start and after Swap or Clear, not on each keystroke.
  function fillInputs() {
    giveInput.value = state.give;
    wantInput.value = state.want;
    exchangeInput.value = state.exchangeAmount;
    cards.forEach(function (card, i) {
      var q = state.quotes[i];
      card.querySelectorAll('.row').forEach(function (rowEl, r) {
        rowEl.querySelector('.amount').value = q.rows[r].amount;
      });
    });
  }

  function render() {
    var directionOk = state.give.length > 0 && state.want.length > 0 && state.give !== state.want;
    directionError.hidden = directionOk;
    directionError.textContent = directionOk ? '' : 'Enter two different currencies.';

    cards.forEach(function (card, i) {
      state.quotes[i].rows.forEach(function (row, r) {
        card.querySelectorAll('.side')[r].textContent = code(row.side) || '—';
      });
    });

    var result = Compare.compareQuotes(state.quotes[0], state.quotes[1]);

    cards.forEach(function (card, i) {
      var rateEl = card.querySelector('.rate');
      var errorEl = card.querySelector('.error');
      var error = result.status === 'incomplete' ? result.errors[i] : null;
      var hasInput = state.quotes[i].rows.some(function (r) { return r.amount.trim() !== ''; });

      var own = Compare.toEffectiveRate(state.quotes[i]);
      rateEl.textContent = directionOk && own.ok
        ? '1 ' + state.give + ' = ' + fmtRate(own.rate) + ' ' + state.want
        : '';
      // Show a card's error only after the user starts typing in that card.
      errorEl.hidden = !(error && hasInput);
      errorEl.textContent = error && hasInput ? error : '';
      card.classList.toggle('winner', directionOk && result.status === 'better' && result.winner === i);
    });

    renderTotal(directionOk ? result : null);

    resultEl.innerHTML = '';
    if (!directionOk || result.status === 'incomplete') return;

    var verdict = document.createElement('p');
    var detail = document.createElement('p');
    verdict.className = 'verdict';
    detail.className = 'detail';

    if (result.status === 'same') {
      verdict.textContent = 'Same rate';
      detail.textContent = 'Both quotes give 1 ' + state.give + ' = ' + fmtRate(result.rates[0]) + ' ' + state.want + '.';
    } else {
      var winner = quoteName(result.winner);
      verdict.classList.add('win');
      verdict.textContent = winner + ' is better';
      detail.textContent = 'For ' + state.give + ' ' + fmtMoney(result.sampleAmount) + ', ' + winner +
        ' gives ' + state.want + ' ' + fmtMoney(result.difference) + ' more (' + fmtPercent(result.percent) + ').';
    }
    resultEl.appendChild(verdict);
    resultEl.appendChild(detail);
  }

  // Shows what each Quote gives for the Exchange Amount, and the Difference between them.
  function renderTotal(result) {
    exchangeCurrency.textContent = state.give || '—';
    totalEl.innerHTML = '';

    var hasInput = state.exchangeAmount.trim() !== '';
    var amount = Compare.parseAmount(state.exchangeAmount);
    var amountOk = !isNaN(amount) && amount > 0;
    exchangeError.hidden = !hasInput || amountOk;
    exchangeError.textContent = exchangeError.hidden ? '' : 'Amount must be more than 0.';

    if (!result || result.status === 'incomplete') return;
    var t = Compare.totalsFor(result.rates, state.exchangeAmount);
    if (!t) return;

    var list = document.createElement('ul');
    list.className = 'totals';
    t.totals.forEach(function (total, i) {
      var li = document.createElement('li');
      var label = document.createElement('span');
      var value = document.createElement('span');
      label.textContent = quoteName(i);
      value.textContent = state.want + ' ' + fmtMoney(total);
      li.appendChild(label);
      li.appendChild(value);
      if (result.status === 'better' && result.winner === i) li.classList.add('win');
      list.appendChild(li);
    });
    totalEl.appendChild(list);

    var diff = document.createElement('p');
    diff.className = 'total-diff';
    diff.textContent = result.status === 'same'
      ? 'Both quotes give the same amount.'
      : quoteName(result.winner) + ' gives ' + state.want + ' ' + fmtMoney(t.difference) + ' more.';
    totalEl.appendChild(diff);
  }

  function update() { save(); render(); }

  function normalizeCode(value) { return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); }

  giveInput.addEventListener('input', function () {
    giveInput.value = state.give = normalizeCode(giveInput.value);
    update();
  });
  wantInput.addEventListener('input', function () {
    wantInput.value = state.want = normalizeCode(wantInput.value);
    update();
  });

  // Swap changes the Direction. Each amount keeps its currency, so its side flips.
  document.getElementById('swap').addEventListener('click', function () {
    var give = state.give;
    state.give = state.want;
    state.want = give;
    state.quotes.forEach(function (q) {
      q.rows.forEach(function (row) { row.side = row.side === 'give' ? 'want' : 'give'; });
    });
    fillInputs();
    update();
  });

  cards.forEach(function (card, i) {
    card.querySelectorAll('.row').forEach(function (rowEl, r) {
      rowEl.querySelector('.amount').addEventListener('input', function (e) {
        state.quotes[i].rows[r].amount = e.target.value;
        update();
      });
      // A Quote always has one amount per currency, so tapping either currency flips both rows.
      rowEl.querySelector('.side').addEventListener('click', function () {
        state.quotes[i].rows.forEach(function (row) { row.side = row.side === 'give' ? 'want' : 'give'; });
        update();
      });
    });
  });

  exchangeInput.addEventListener('input', function () {
    state.exchangeAmount = exchangeInput.value;
    update();
  });

  document.getElementById('clear').addEventListener('click', function () {
    state = defaultState();
    fillInputs();
    update();
  });

  fillInputs();
  render();
})();
