/* app.js — 부트스트랩 (마지막 로드). 데이터 로드 → 라우터 시작. 테마·면책·뒤로가기. */
(function (w) {
  'use strict';
  var J = w.JEONSE;
  var U = J.util;
  var D = J.data;
  var Rt = J.router;

  // ===== about 뷰 (셸 정적) =====
  J.views.about = {
    title: '안내 · 면책',
    render: function () {
      U.setCTA([U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/'); } } }, '처음으로')]);
      var meta = D.meta;
      var frag = document.createDocumentFragment();
      frag.appendChild(U.el('h1', { class: 't-h1', style: 'margin-bottom:16px' }, '안내 · 면책 · 개인정보'));

      frag.appendChild(section('면책 고지', meta.disclaimer || '본 사이트는 참고용 정보 제공 도구이며 법률자문이 아닙니다.'));
      frag.appendChild(section('개인정보 처리', meta.storageNotice || '입력한 내용은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다.'));

      // 공식 출처
      var links = (meta.officialLinks || []);
      var linkList = U.el('div', { class: 'list-gap' });
      links.forEach(function (l) {
        linkList.appendChild(U.el('div', { class: 'card card--pad-sm' }, [
          U.el('div', { class: 't-bold' }, l.label),
          U.el('div', { style: 'margin-top:4px' }, U.extLink(l.url, l.url))
        ]));
      });
      frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:24px' }, '공식 출처 · 창구'));
      frag.appendChild(linkList);

      frag.appendChild(U.el('div', { class: 'confirmed-note', style: 'margin-top:20px' },
        '데이터 확인일 ' + U.formatDate(meta.updated) + ' · 제도 내용은 수시로 바뀌므로 공식 링크에서 최신 내용을 확인하세요.'));
      return frag;
    }
  };

  function section(title, body) {
    return U.el('div', { class: 'card', style: 'margin-bottom:12px' }, [
      U.el('div', { class: 't-h3', style: 'margin-bottom:8px' }, title),
      U.el('p', { class: 't-sm t-ink2' }, body)
    ]);
  }

  // ===== 테마 =====
  var THEME_KEY = 'jeonse.theme';
  function getStoredTheme() { try { return w.localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function setStoredTheme(v) { try { w.localStorage.setItem(THEME_KEY, v); } catch (e) {} }

  function applyTheme(theme) {
    // theme: 'light' | 'dark' | null(시스템)
    var root = document.documentElement;
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    updateThemeBtn();
  }
  function currentEffectiveTheme() {
    var root = document.documentElement;
    var attr = root.getAttribute('data-theme');
    if (attr) return attr;
    return (w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function updateThemeBtn() {
    var btn = U.byId('btn-theme');
    if (!btn) return;
    var eff = currentEffectiveTheme();
    btn.textContent = eff === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', eff === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }
  function toggleTheme() {
    var eff = currentEffectiveTheme();
    var next = eff === 'dark' ? 'light' : 'dark';
    setStoredTheme(next);
    applyTheme(next);
  }

  // ===== 최초 진입 면책 고지 (1회, 닫기 가능) =====
  var DISC_KEY = 'jeonse.disclaimer.seen';
  function maybeShowDisclaimer() {
    var seen;
    try { seen = w.localStorage.getItem(DISC_KEY); } catch (e) { seen = null; }
    if (seen) return;
    var overlay = U.el('div', { class: 'sheet-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': '면책 고지' });
    function close() {
      try { w.localStorage.setItem(DISC_KEY, '1'); } catch (e) {}
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    var msg = (D.meta && D.meta.disclaimer) || '본 사이트는 참고용 정보이며 법률자문이 아닙니다. 개별 사안은 공식 창구에서 확인하세요.';
    var sheet = U.el('div', { class: 'sheet stack' }, [
      U.el('div', { class: 't-h2' }, '시작하기 전에'),
      U.el('div', { class: 't-sm t-ink2' }, msg),
      U.el('button', { class: 'btn btn--primary btn--block', style: 'margin-top:8px', on: { click: close } }, '확인했어요')
    ]);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  // ===== 부트 =====
  function boot() {
    // 테마 초기화
    var stored = getStoredTheme();
    applyTheme(stored === 'light' || stored === 'dark' ? stored : null);
    // 시스템 테마 변경 반영(수동 설정 없을 때)
    if (w.matchMedia) {
      try {
        w.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
          if (!getStoredTheme()) updateThemeBtn();
        });
      } catch (e) {}
    }

    // 버튼 핸들러
    var themeBtn = U.byId('btn-theme');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    var backBtn = U.byId('btn-back');
    if (backBtn) backBtn.addEventListener('click', function () {
      if (w.history.length > 1) w.history.back();
      else Rt.navigate('#/');
    });
    var brand = U.byId('brand-home');
    if (brand) brand.addEventListener('click', function (e) { e.preventDefault(); Rt.navigate('#/'); });

    // 데이터 로드 후 라우터 시작
    D.load().then(function () {
      Rt.start();
      maybeShowDisclaimer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
