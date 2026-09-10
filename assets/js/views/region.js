/* region.js — F6 지역 지원 조회 (시도→시군구 셀렉트, 필터) */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var Rt = w.JEONSE.router;

  // 필터 순수함수 (계약 §3.5)
  function filterRegions(items, opts) {
    opts = opts || {};
    var sido = opts.sido;
    var sigungu = opts.sigungu;
    return (items || []).filter(function (it) {
      if (!sido) return true;
      if (it.sido !== sido) return false;
      // 시군구 미선택 → 해당 시도 전체. 선택 → 빈("")=전지역 항목 또는 일치.
      if (!sigungu) return true;
      return it.sigungu === '' || it.sigungu === sigungu;
    });
  }

  V.region = { title: '지역 지원 조회', filterRegions: filterRegions };

  V.region.render = function (ctx) {
    U.setCTA([U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/'); } } }, '처음으로')]);

    var q = ctx.query || {};
    var state = { sido: q.sido || '', sigungu: q.sigungu || '' };

    var frag = document.createDocumentFragment();
    frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
      U.el('h1', { class: 't-h1' }, '지역 지원 조회'),
      U.el('p', { class: 't-body t-ink2' }, '시·도를 고르면 전세피해 상담 창구와 지자체 주거 지원을 볼 수 있어요.')
    ]));

    // 예시 데이터 안내
    frag.appendChild(U.el('div', { class: 'banner banner--warn', style: 'margin-bottom:16px' }, [
      U.el('span', { class: 'banner__icon', 'aria-hidden': 'true' }, '⚠️'),
      U.el('div', {}, '전세피해 상담 창구는 공식 정보입니다. ⚠️ 표시가 붙은 지자체 지원(이사비·월세 등)은 예시이니, 시행 여부·금액·요건은 각 지자체 공식 안내에서 확인하세요.')
    ]));

    var sidoSel = U.el('select', { class: 'select', 'aria-label': '시도 선택' }, [
      U.el('option', { value: '' }, '시·도 선택')
    ].concat(D.sidoList().map(function (s) { return U.el('option', { value: s.code }, s.name); })));

    var sigunguSel = U.el('select', { class: 'select', 'aria-label': '시군구 선택' });

    var results = U.el('div', { class: 'list-gap', 'aria-live': 'polite' });

    function fillSigungu() {
      U.clear(sigunguSel);
      sigunguSel.appendChild(U.el('option', { value: '' }, '전체 구·군'));
      if (state.sido) {
        D.sigunguList(state.sido).forEach(function (g) {
          sigunguSel.appendChild(U.el('option', { value: g.code }, g.name));
        });
      }
      sigunguSel.value = state.sigungu;
      sigunguSel.disabled = !state.sido;
    }

    function renderResults() {
      U.clear(results);
      if (!state.sido) {
        results.appendChild(U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '📍'),
          U.el('div', {}, '시·도를 먼저 선택하세요.')
        ]));
        return;
      }
      var items = filterRegions(D.regions(), { sido: state.sido, sigungu: state.sigungu });
      if (!items.length) {
        results.appendChild(U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '🔍'),
          U.el('div', {}, '해당 지역의 등록된 예시 지원이 없습니다.')
        ]));
        return;
      }
      items.forEach(function (it) { results.appendChild(regionCard(it)); });
    }

    function sync() {
      var qs = [];
      if (state.sido) qs.push('sido=' + encodeURIComponent(state.sido));
      if (state.sigungu) qs.push('sigungu=' + encodeURIComponent(state.sigungu));
      var newHash = '#/region' + (qs.length ? '?' + qs.join('&') : '');
      if (w.location.hash !== newHash) history.replaceState(null, '', newHash);
      renderResults();
    }

    sidoSel.value = state.sido;
    sidoSel.addEventListener('change', function () {
      state.sido = sidoSel.value; state.sigungu = '';
      fillSigungu(); sync();
    });
    sigunguSel.addEventListener('change', function () {
      state.sigungu = sigunguSel.value; sync();
    });

    fillSigungu();

    frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [sidoSel, sigunguSel]));
    frag.appendChild(results);
    renderResults();

    return frag;
  };

  function regionCard(it) {
    var rows = [];
    if (it.target) rows.push(kv('대상', it.target));
    if (it.benefit) rows.push(kv('내용', it.benefit));
    if (it.howto) rows.push(kv('신청', it.howto));

    return U.el('div', { class: 'card' }, [
      U.el('div', { class: 'res-meta' }, [
        U.el('span', { class: 'badge badge--cat' }, (it.sidoName || '') + (it.sigunguName && it.sigunguName !== '전 지역' ? ' ' + it.sigunguName : '')),
        it.verified === false ? U.verifyBadge() : null,
        U.el('span', { class: 'badge badge--date' }, U.formatDate(it.updated))
      ]),
      U.el('div', { class: 'card__title', style: 'margin-top:8px' }, it.title || ''),
      U.el('div', { class: 'stack', style: 'margin-top:8px' }, rows),
      it.url ? U.el('div', { style: 'margin-top:10px' }, U.extLink(it.url, '지자체 안내 바로가기')) : null
    ]);
  }

  function kv(k, v) {
    return U.el('div', { class: 't-sm' }, [
      U.el('span', { class: 't-bold' }, k + ' '),
      U.el('span', { class: 't-ink2' }, v)
    ]);
  }

})(window);
