// Installed-app support for both pages: remembers the last page for the next launch,
// registers the service worker (sw.js), and shows a bar when a new version is ready.
(function () {
  'use strict';

  // index.html reads this key on launch and opens convert.html when it was the last page.
  try {
    localStorage.setItem('exch:page', /convert\.html$/.test(location.pathname) ? 'convert' : 'compare');
  } catch (e) { /* storage blocked */ }

  // Service workers run only on HTTPS or localhost, not on file://.
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  function showUpdateBar(worker) {
    if (document.getElementById('update-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'update-bar';
    bar.className = 'update-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>New version available</span><button type="button">Reload</button>';
    bar.querySelector('button').addEventListener('click', function () { worker.postMessage('SKIP_WAITING'); });
    document.body.appendChild(bar);
    document.body.classList.add('has-update-bar');
  }

  // A new worker that is installed while an old one controls the page is an update.
  function watch(worker) {
    worker.addEventListener('statechange', function () {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBar(worker);
    });
  }

  navigator.serviceWorker.register('sw.js').then(function (reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
    if (reg.installing) watch(reg.installing);
    reg.addEventListener('updatefound', function () { watch(reg.installing); });
  }).catch(function () { /* the app still works online */ });

  // The new worker took control after Reload: load the page again with the new files.
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading || !document.getElementById('update-bar')) return;
    reloading = true;
    location.reload();
  });
})();
