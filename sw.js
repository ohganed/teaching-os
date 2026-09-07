const CACHE_NAME = 'teaching-os-v0.32.2-physics-vector-1';
const APP_SHELL = [
  './manifest.webmanifest',
  './icon.svg',
  './hotfix-v0321.js',
  './physics-vector-tools-v0322.js'
];

function injectTools(html) {
  const hotfixTag = '<script src="./hotfix-v0321.js"></script>';
  const physicsTag = '<script src="./physics-vector-tools-v0322.js"></script>';

  if (!html.includes('hotfix-v0321.js')) {
    const firstScript = html.indexOf('<script>');
    if (firstScript >= 0) {
      html = html.slice(0, firstScript) + hotfixTag + '\n' + html.slice(firstScript);
    } else {
      html = html.replace('</head>', hotfixTag + '\n</head>');
    }
  }

  if (!html.includes('physics-vector-tools-v0322.js')) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', physicsTag + '\n</body>');
    } else {
      html += '\n' + physicsTag;
    }
  }
  return html;
}

async function patchedNavigationResponse(request) {
  try {
    const network = await fetch(request, { cache: 'no-store' });
    const html = injectTools(await network.text());
    const headers = new Headers(network.headers);
    headers.delete('content-length');
    headers.set('content-type', 'text/html; charset=utf-8');
    const patched = new Response(html, {
      status: network.status,
      statusText: network.statusText,
      headers
    });
    const cache = await caches.open(CACHE_NAME);
    await cache.put('./index.html', patched.clone());
    return patched;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith('teaching-os-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try { await client.navigate(client.url); } catch (e) {}
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(patchedNavigationResponse(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
