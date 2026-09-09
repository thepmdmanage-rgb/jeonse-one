/* util.js — JEONSE 네임스페이스 생성 + DOM/포맷 헬퍼 */
/* 로드 순서 1번. type="module" 금지. */
(function (w) {
  'use strict';

  // 전역 네임스페이스 (계약 §1.2)
  w.JEONSE = w.JEONSE || { data: {}, views: {}, router: {}, store: {}, risk: {}, util: {} };

  var U = w.JEONSE.util;

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  U.byId = function (id) { return document.getElementById(id); };

  /**
   * el(tag, attrs, children)
   * - attrs: { class, id, text, html(신뢰 텍스트만), href, on:{click:fn}, data-*, aria-* ... }
   *   text 는 textContent(안전). html 은 개발자가 만든 신뢰 마크업 전용(사용자 데이터 금지).
   * - children: node | string | array (string 은 textNode 로 안전 삽입)
   */
  U.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === 'class' || k === 'className') { node.className = v; }
      else if (k === 'text') { node.textContent = v; }
      else if (k === 'html') { node.innerHTML = v; } // 신뢰 마크업 전용
      else if (k === 'on' && typeof v === 'object') {
        Object.keys(v).forEach(function (evt) { node.addEventListener(evt, v[evt]); });
      } else if (k === 'dataset' && typeof v === 'object') {
        Object.keys(v).forEach(function (dk) { node.dataset[dk] = v[dk]; });
      } else { node.setAttribute(k, v); }
    });
    U.append(node, children);
    return node;
  };

  U.append = function (node, children) {
    if (children == null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') {
        node.appendChild(document.createTextNode(String(c)));
      } else {
        node.appendChild(c);
      }
    });
    return node;
  };

  U.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; };

  // 사용자/외부 데이터 → HTML 문자열로 넣어야 할 때 반드시 이걸 통과 (계약 §8)
  U.escapeHtml = function (s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // 금액 포맷 (원). 숫자 아닌 값은 원문 반환.
  U.formatKRW = function (n) {
    var num = Number(n);
    if (!isFinite(num)) return String(n == null ? '' : n);
    return num.toLocaleString('ko-KR');
  };

  // YYYY-MM-DD → YYYY.MM.DD
  U.formatDate = function (s) {
    if (!s) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    if (!m) return String(s);
    return m[1] + '.' + m[2] + '.' + m[3];
  };

  U.todayISO = function () {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  };

  // 확인일 문구 노드
  U.confirmedNote = function (updated) {
    return U.el('div', { class: 'confirmed-note' },
      '확인일 ' + U.formatDate(updated) + ' · 최신 정보는 공식 링크에서 확인하세요');
  };

  // "확인 필요" 배지 (verified:false)
  U.verifyBadge = function () {
    return U.el('span', { class: 'badge badge--verify', title: '자주 바뀌는 값입니다. 공식 링크에서 확인하세요.' }, '확인 필요');
  };

  // 외부 링크 (계약: target/rel 고정)
  U.extLink = function (url, label) {
    if (!url) return null;
    return U.el('a', {
      class: 'linkout',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer'
    }, label || url);
  };

  // 토스트 (aria-live)
  var toastTimer = null;
  U.toast = function (msg) {
    var wrap = U.byId('toast-wrap');
    if (!wrap) return;
    U.clear(wrap);
    var t = U.el('div', { class: 'toast', role: 'status' }, msg);
    wrap.appendChild(t);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { U.clear(wrap); }, 2600);
  };

  // 하단 고정 CTA 바 제어. nodes=null 이면 숨김.
  U.setCTA = function (nodes) {
    var bar = U.byId('cta-bar');
    var main = U.byId('app');
    if (!bar) return;
    U.clear(bar);
    if (nodes == null || (Array.isArray(nodes) && nodes.length === 0)) {
      bar.classList.add('hidden');
      if (main) main.classList.add('no-cta');
    } else {
      U.append(bar, nodes);
      bar.classList.remove('hidden');
      if (main) main.classList.remove('no-cta');
    }
  };

  // 확인 시트 (모달). onConfirm 콜백.
  U.confirmSheet = function (opts) {
    opts = opts || {};
    var overlay = U.el('div', { class: 'sheet-overlay', role: 'dialog', 'aria-modal': 'true' });
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    var confirmBtn = U.el('button', { class: 'btn ' + (opts.danger ? 'btn--danger' : 'btn--primary') + ' btn--block',
      on: { click: function () { close(); if (opts.onConfirm) opts.onConfirm(); } } }, opts.confirmText || '확인');
    var sheet = U.el('div', { class: 'sheet stack' }, [
      U.el('div', { class: 't-h2' }, opts.title || '확인'),
      opts.message ? U.el('div', { class: 't-sm t-ink2' }, opts.message) : null,
      U.el('div', { class: 'stack', style: 'margin-top:8px' }, [
        confirmBtn,
        U.el('button', { class: 'btn btn--ghost btn--block', on: { click: close } }, opts.cancelText || '취소')
      ])
    ]);
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    confirmBtn.focus();
    return close;
  };

})(window);
