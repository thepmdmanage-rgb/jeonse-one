/* resources.js — F4 자원 지도 (상황·지역 필터). F1 딥링크 ?situation= 수신. */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var Rt = w.JEONSE.router;

  var SITUATIONS = [
    { id: 'pre', label: '계약 전' },
    { id: 'during', label: '계약 중' },
    { id: 'incident', label: '사고 발생' },
    { id: 'apply', label: '피해자 신청' },
    { id: 'rejected', label: '부결' }
  ];

  V.resources = { title: '자원 지도' };

  // 필터 순수함수 (계약 §3.4)
  function filterResources(items, opts) {
    opts = opts || {};
    var situation = opts.situation;
    var region = opts.region;
    return (items || []).filter(function (it) {
      var tags = it.situationTags || [];
      var rtags = it.regionTags || [];
      var sOk = !situation || tags.indexOf(situation) >= 0;
      var rOk = !region || rtags.indexOf('all') >= 0 || rtags.indexOf(region) >= 0;
      return sOk && rOk;
    });
  }
  V.resources.filterResources = filterResources; // 노출(테스트)

  V.resources.render = function (ctx) {
    U.setCTA([U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/'); } } }, '처음으로')]);

    var q = ctx.query || {};
    var state = {
      situation: q.situation || '',
      region: q.region || ''
    };
    // 유효성: situation 이 enum 밖이면 무시
    if (state.situation && !SITUATIONS.some(function (s) { return s.id === state.situation; })) state.situation = '';

    var frag = document.createDocumentFragment();
    frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
      U.el('h1', { class: 't-h1' }, '자원 지도'),
      U.el('p', { class: 't-body t-ink2' }, '상황과 지역에 맞는 상담·금융·주거·법률 지원 창구를 모았어요.')
    ]));

    // 상황 필터 칩
    var situChips = U.el('div', { class: 'row-wrap', role: 'group', 'aria-label': '상황 필터' });
    var results = U.el('div', { class: 'list-gap', 'aria-live': 'polite' });

    function chip(label, active, onClick) {
      return U.el('button', { class: 'chip' + (active ? ' chip--active' : ''), 'aria-pressed': active ? 'true' : 'false', on: { click: onClick } }, label);
    }

    function rebuildChips() {
      U.clear(situChips);
      situChips.appendChild(chip('전체', !state.situation, function () { state.situation = ''; sync(); }));
      SITUATIONS.forEach(function (s) {
        situChips.appendChild(chip(s.label, state.situation === s.id, function () {
          state.situation = state.situation === s.id ? '' : s.id; sync();
        }));
      });
    }

    // 지역(시도) 필터
    var sidoSel = U.el('select', { class: 'select', 'aria-label': '지역(시도) 필터' }, [
      U.el('option', { value: '' }, '전체 지역')
    ].concat(D.sidoList().map(function (s) {
      return U.el('option', { value: s.code }, s.name);
    })));
    sidoSel.value = state.region;
    sidoSel.addEventListener('change', function () { state.region = sidoSel.value; sync(); });

    function renderResults() {
      U.clear(results);
      var items = filterResources(D.resources(), { situation: state.situation, region: state.region });
      if (!items.length) {
        results.appendChild(U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '🔍'),
          U.el('div', {}, '조건에 맞는 지원 창구가 없습니다. 필터를 넓혀 보세요.')
        ]));
        return;
      }
      items.forEach(function (it) { results.appendChild(resourceCard(it)); });
    }

    function sync() {
      rebuildChips();
      // 해시 갱신(딥링크 공유 가능) — 렌더 재실행 없이 부분 갱신
      var qs = [];
      if (state.situation) qs.push('situation=' + encodeURIComponent(state.situation));
      if (state.region) qs.push('region=' + encodeURIComponent(state.region));
      var newHash = '#/resources' + (qs.length ? '?' + qs.join('&') : '');
      if (w.location.hash !== newHash) {
        history.replaceState(null, '', newHash);
      }
      renderResults();
    }

    rebuildChips();

    frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
      situChips,
      sidoSel
    ]));
    frag.appendChild(results);
    renderResults();

    return frag;
  };

  function resourceCard(it) {
    var meta = U.el('div', { class: 'res-meta', style: 'margin-top:10px' }, [
      U.el('span', { class: 'badge badge--cat' }, it.category || ''),
      it.verified === false ? U.verifyBadge() : null,
      U.el('span', { class: 'badge badge--date' }, U.formatDate(it.updated))
    ]);

    var children = [
      U.el('div', { class: 'card__title' }, it.name || ''),
      it.org ? U.el('div', { class: 't-sm t-muted', style: 'margin-top:2px' }, it.org) : null,
      it.desc ? U.el('p', { class: 't-sm t-ink2', style: 'margin-top:8px' }, it.desc) : null,
      meta
    ];

    if (it.phone) {
      children.push(U.el('div', { style: 'margin-top:8px' }, [
        U.el('span', { class: 't-sm t-bold' }, '전화 '),
        U.el('a', { class: 't-sm', href: 'tel:' + String(it.phone).replace(/[^0-9+]/g, '') }, it.phone)
      ]));
    }
    if (it.url) {
      children.push(U.el('div', { style: 'margin-top:8px' }, U.extLink(it.url, '공식 안내 바로가기')));
    }

    return U.el('div', { class: 'card' }, children);
  }

})(window);
