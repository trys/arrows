/*
This is a modified version of Ethan Marcotte's service worker (https://ethanmarcotte.com/theworkerofservices.js),
which is in turn a modified version of Jeremy Keith's service worker (https://adactio.com/serviceworker.js),
with a few additional edits borrowed from Filament Group's. (https://www.filamentgroup.com/sw.js)
*/
(function() {
const version = 'v2';
const cacheName = ':arrows:';

const staticCacheName = version + cacheName + 'static';
const pagesCacheName = cacheName + 'pages';

const staticAssets = ['/', 'style.css'];

function updateStaticCache() {
	// These items must be cached for the Service Worker to complete installation
	return caches.open(staticCacheName).then(cache => {
	return cache.addAll(
		staticAssets.map(url => new Request(url, { credentials: 'include' }))
	);
	});
}

function stashInCache(cacheName, request, response) {
	caches.open(cacheName).then(cache => cache.put(request, response));
}

// Remove caches whose name is no longer valid
function clearOldCaches() {
	return caches.keys().then(keys => {
	return Promise.all(
		keys
		.filter(key => key.indexOf(version) !== 0)
		.map(key => caches.delete(key))
	);
	});
}

self.addEventListener('install', event => {
	event.waitUntil(updateStaticCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
	event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
	const request = event.request;
	const url = new URL(request.url);

	const allowedUrls = [
		'https://arrows.trysmudford.com',
		'http://localhost:3212'
	];

	if (!allowedUrls.find(x => url.href.startsWith(x))) return;
	if (request.method !== 'GET') return;
	if (url.href.indexOf('?') !== -1) return;

	if (request.headers.get('Accept').includes('text/html')) {
	event.respondWith(
		fetch(request)
		.then(response => {
			let copy = response.clone();
			if (
			staticAssets.includes(url.pathname) ||
			staticAssets.includes(url.pathname + '/')
			) {
			stashInCache(staticCacheName, request, copy);
			} else {
			stashInCache(pagesCacheName, request, copy);
			}
			return response;
		})
		.catch(() => {
			// CACHE or FALLBACK
			return caches
			.match(request)
			.then(response => response || caches.match('/'));
		})
	);
	return;
	}

	event.respondWith(
	fetch(request)
		.then(response => response)
		.catch(() => {
		return caches
			.match(request)
			.then(response => response)
			.catch(console.error);
		})
	);
});
})();
