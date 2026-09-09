/* sw.js — 전세ONE 서비스워커. 오프라인 열람 지원(위기 상황 네트워크 없이도).
   전략: 동일 출처 GET은 cache-first + 런타임 캐시. 내비게이션 실패 시 index.html 폴백.
   외부(Pretendard CDN)는 네트워크 우선(캐시 오염 방지). */
const CACHE = 'jeonseone-v1';
const CORE = [
  './', './index.html', './manifest.json',
  './assets/css/tokens.css', './assets/css/base.css', './assets/css/components.css',
  './assets/js/util.js', './assets/js/data.js', './assets/js/store.js', './assets/js/risk.js',
  './data/_bundle.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 자원은 브라우저 기본 처리

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
