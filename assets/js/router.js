/* router.js — 해시 라우터 (§2). parse/navigate/start. pushState 미사용. */
(function (w) {
  'use strict';
  var Rt = w.JEONSE.router;
  var U = w.JEONSE.util;

  // 라우트 테이블 (계약 §2.2). 순서 중요: 더 구체적 패턴 먼저.
  var ROUTES = [
    { re: /^\/$/, path: '/', view: 'home' },
    { re: /^\/stage\/([^/?]+)$/, path: '/stage/:id', view: 'stage', keys: ['id'] },
    { re: /^\/calc$/, path: '/calc', view: 'calc' },
    { re: /^\/evidence$/, path: '/evidence', view: 'evidence' },
    { re: /^\/resources$/, path: '/resources', view: 'resources' },
    { re: /^\/region$/, path: '/region', view: 'region' },
    { re: /^\/reject$/, path: '/reject', view: 'reject' },
    { re: /^\/template\/([^/?]+)$/, path: '/template/:id', view: 'template', keys: ['id'] },
    { re: /^\/about$/, path: '/about', view: 'about' }
  ];

  // parse(hash) → { path, params, query, view, raw }
  Rt.parse = function (hash) {
    var h = String(hash || '');
    if (h.charAt(0) === '#') h = h.slice(1);
    if (h === '' || h === '/') h = '/';

    var qIndex = h.indexOf('?');
    var pathPart = qIndex >= 0 ? h.slice(0, qIndex) : h;
    var queryPart = qIndex >= 0 ? h.slice(qIndex + 1) : '';

    if (pathPart.charAt(0) !== '/') pathPart = '/' + pathPart;
    // 끝 슬래시 정규화 (루트 제외)
    if (pathPart.length > 1 && pathPart.charAt(pathPart.length - 1) === '/') {
      pathPart = pathPart.slice(0, -1);
    }

    var query = {};
    if (queryPart) {
      queryPart.split('&').forEach(function (pair) {
        if (!pair) return;
        var idx = pair.indexOf('=');
        var k = idx >= 0 ? pair.slice(0, idx) : pair;
        var v = idx >= 0 ? pair.slice(idx + 1) : '';
        try { k = decodeURIComponent(k); v = decodeURIComponent(v); } catch (e) {}
        if (k) query[k] = v;
      });
    }

    for (var i = 0; i < ROUTES.length; i++) {
      var r = ROUTES[i];
      var m = r.re.exec(pathPart);
      if (m) {
        var params = {};
        (r.keys || []).forEach(function (key, ki) {
          var val = m[ki + 1];
          try { val = decodeURIComponent(val); } catch (e) {}
          params[key] = val;
        });
        return { path: r.path, params: params, query: query, view: r.view, raw: h };
      }
    }
    // 미매칭 → home 폴백 (리다이렉트 아님, 렌더만)
    return { path: '/', params: {}, query: query, view: 'home', raw: h, unmatched: true };
  };

  Rt.navigate = function (hashString) {
    var h = String(hashString || '#/');
    if (h.charAt(0) !== '#') h = '#' + (h.charAt(0) === '/' ? h : '/' + h);
    if (w.location.hash === h) {
      // 동일 해시 → hashchange 안 뜨므로 강제 렌더
      Rt.render();
    } else {
      w.location.hash = h;
    }
  };

  // 현재 해시 렌더
  Rt.current = null;
  Rt.render = function () {
    var ctx = Rt.parse(w.location.hash);
    Rt.current = ctx;
    var view = w.JEONSE.views[ctx.view] || w.JEONSE.views.home;
    var mount = U.byId('app');
    var header = U.byId('app-header-title');
    var backBtn = U.byId('btn-back');

    U.clear(mount);
    mount.classList.remove('view-enter');
    // reflow 로 애니메이션 재시작
    void mount.offsetWidth;

    var out;
    try {
      out = view.render(ctx);
    } catch (e) {
      try { console.error('[JEONSE] view render error:', e); } catch (er) {}
      out = U.el('div', { class: 'empty' }, [
        U.el('div', { class: 'empty__icon' }, '⚠️'),
        U.el('div', {}, '화면을 그리는 중 문제가 발생했습니다.')
      ]);
    }
    U.append(mount, out);
    mount.classList.add('view-enter');

    // 헤더 타이틀
    if (header) {
      if (ctx.view === 'home') {
        header.innerHTML = '<span class="brand-wm">전세<b>ONE</b></span><span class="brand-tag">안전한 전세, 든든한 내일</span>';
        header.classList.add('is-home');
      } else {
        header.textContent = (typeof view.title === 'function' ? view.title(ctx) : view.title) || '전세ONE';
        header.classList.remove('is-home');
      }
    }
    // 뒤로가기 버튼: 홈에서는 숨김
    if (backBtn) {
      backBtn.classList.toggle('hidden', ctx.view === 'home');
    }

    // 접근성: 스크롤 top + 포커스 이동
    try { w.scrollTo(0, 0); } catch (e) {}
    mount.setAttribute('tabindex', '-1');
    try { mount.focus({ preventScroll: true }); } catch (e) { mount.focus(); }
  };

  Rt.start = function () {
    w.addEventListener('hashchange', Rt.render);
    // 딥링크: 최초 로드 시 현재 hash 그대로 렌더 (home 강제 이동 금지)
    if (!w.location.hash) {
      // 해시 없으면 그냥 home 렌더 (주소는 안 바꿔도 됨)
      Rt.render();
    } else {
      Rt.render();
    }
  };

})(window);
