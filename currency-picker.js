// Turns each .currency-input into a combobox: a dropdown of all currencies that also accepts typing (3 letters).
// Typing filters by code first, then by name. Choosing a currency fires an 'input' event, like typing does.
(function () {
  'use strict';

  // Common travel currencies. Any other 3-letter code can still be typed.
  var CODES = (
    'AED AUD BND CAD CHF CNY EUR GBP HKD IDR INR JPY KRW MYR NZD PHP SAR SGD THB TWD USD VND'
  ).split(' ');

  // Names come from the browser (Intl), so there is no name list to maintain.
  var nameOf = (function () {
    try {
      var names = new Intl.DisplayNames(['en'], { type: 'currency' });
      return function (code) { var n = names.of(code); return n && n !== code ? n : ''; };
    } catch (e) {
      return function () { return ''; };
    }
  })();

  var CURRENCIES = CODES.map(function (code) { return { code: code, name: nameOf(code) }; });

  function normalize(text) { return text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); }

  // Codes that start with the text come first, then currencies whose name contains it.
  function matches(text) {
    if (!text) return CURRENCIES;
    var lower = text.toLowerCase();
    var byCode = [];
    var byName = [];
    CURRENCIES.forEach(function (c) {
      if (c.code.indexOf(text) === 0) byCode.push(c);
      else if (c.name.toLowerCase().indexOf(lower) !== -1) byName.push(c);
    });
    return byCode.concat(byName);
  }

  var nextId = 0;

  function enhance(input) {
    var listId = 'currency-list-' + (++nextId);

    var wrap = document.createElement('div');
    wrap.className = 'picker';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'picker-toggle';
    toggle.tabIndex = -1;
    toggle.setAttribute('aria-label', 'Show all currencies');
    toggle.textContent = '▾';
    wrap.appendChild(toggle);

    var list = document.createElement('ul');
    list.className = 'picker-list';
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    wrap.appendChild(list);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');

    var items = [];
    var active = -1;
    var choosing = false;
    var previous = ''; // The code before this focus, kept so it can come back if the user picks nothing.

    function setActive(i) {
      var options = list.querySelectorAll('[role="option"]');
      if (active >= 0 && options[active]) options[active].setAttribute('aria-selected', 'false');
      active = i;
      if (active >= 0 && options[active]) {
        options[active].setAttribute('aria-selected', 'true');
        options[active].scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', options[active].id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    // showAll: true when the list opens from a tap or the arrow, so every currency shows.
    function open(showAll) {
      var text = showAll ? '' : normalize(input.value);
      items = matches(text);
      // A full code that matches nothing becomes its own item, so it can be tapped like any other.
      if (text.length === 3 && !items.length) items = [{ code: text, name: 'Use this code' }];
      list.innerHTML = '';
      active = -1;

      if (!items.length) {
        var empty = document.createElement('li');
        empty.className = 'picker-empty';
        empty.textContent = 'No currency found';
        list.appendChild(empty);
      }
      items.forEach(function (c, i) {
        var li = document.createElement('li');
        li.id = listId + '-' + i;
        li.className = 'picker-option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        var code = document.createElement('span');
        code.className = 'picker-code';
        code.textContent = c.code;
        var name = document.createElement('span');
        name.className = 'picker-name';
        name.textContent = c.name;
        li.appendChild(code);
        li.appendChild(name);
        li.addEventListener('click', function () { choose(c.code); });
        list.appendChild(li);
      });

      // A field in the right half opens its list to the left, so the list stays on screen.
      list.classList.toggle('align-right', wrap.getBoundingClientRect().left > window.innerWidth / 2);
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');

      var current = normalize(input.value) || previous;
      var match = -1;
      items.forEach(function (c, i) { if (match < 0 && c.code === current) match = i; });
      setActive(match >= 0 ? match : text && items.length ? 0 : -1);
    }

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function choose(code) {
      input.value = code;
      choosing = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      choosing = false;
      close();
      input.blur(); // Done with this field; on a phone this also hides the keyboard.
    }

    // The field empties on focus, so typing never hits the 3-letter limit; the old code shows as the placeholder.
    // (Selecting the text instead does not work: the tap that focuses the field moves the cursor and drops the selection.)
    input.addEventListener('focus', function () {
      previous = input.value;
      input.placeholder = previous;
      input.value = '';
      open(true);
    });
    input.addEventListener('input', function () {
      if (!choosing) open(false);
    });
    // Leaving the field without a full code puts the old code back.
    function restore() {
      if (normalize(input.value).length < 3 && input.value !== previous) {
        var typed = input.value !== '';
        input.value = previous;
        // Tell the page only when it saw the partial text.
        if (typed) input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    input.addEventListener('blur', function () {
      restore();
      input.placeholder = '';
      close();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.hidden) { open(true); return; }
        if (!items.length) return;
        var step = e.key === 'ArrowDown' ? 1 : -1;
        setActive(Math.max(0, Math.min(items.length - 1, active + step)));
      } else if (e.key === 'Enter' && !list.hidden && active >= 0) {
        e.preventDefault();
        choose(items[active].code);
      } else if (e.key === 'Escape') {
        input.blur(); // The blur handler puts the old code back.
      }
    });

    // Keep focus in the input when the user taps the list or the arrow, so blur does not close the list first.
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    // The field sits inside a <label>, which would pass the click on to the input and focus it again.
    list.addEventListener('click', function (e) { e.preventDefault(); });
    toggle.addEventListener('mousedown', function (e) { e.preventDefault(); });
    toggle.addEventListener('click', function () {
      if (list.hidden) { input.focus(); open(true); } else input.blur(); // The blur handler closes the list and restores the code.
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.currency-input'), enhance);
})();
