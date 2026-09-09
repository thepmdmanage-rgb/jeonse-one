/* stage.js — 단계 뷰 (체크리스트 + 관련 도구 링크). F1→각 단계. */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var S = w.JEONSE.store;
  var Rt = w.JEONSE.router;

  var TOOL_META = {
    calc: { label: '위험도 계산기', hash: '#/calc', icon: '📊' },
    evidence: { label: '증거함', hash: '#/evidence', icon: '🗂️' },
    resources: { label: '자원 지도', hash: '#/resources', icon: '🧭' },
    region: { label: '지역 지원', hash: '#/region', icon: '📍' },
    reject: { label: '부결 대응 트랙', hash: '#/reject', icon: '🔁' },
    template: { label: '서류 템플릿', hash: '#/template/content-certification', icon: '📝' }
  };

  V.stage = {
    title: function (ctx) {
      var s = D.stage(ctx.params.id);
      return s ? s.title : '단계';
    },
    render: function (ctx) {
      var id = ctx.params.id;
      var s = D.stage(id);
      if (!s) {
        U.setCTA([U.el('button', { class: 'btn btn--primary btn--cta', on: { click: goHome } }, '처음으로')]);
        return U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '🔍'),
          U.el('div', {}, '해당 단계를 찾을 수 없습니다.')
        ]);
      }

      var frag = document.createDocumentFragment();

      // 헤더 요약
      frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:20px' }, [
        U.el('div', { class: 'eyebrow' }, s.subtitle || ''),
        U.el('h1', { class: 't-h1' }, s.title),
        U.el('p', { class: 't-body t-ink2' }, s.summary || '')
      ]));

      // 체크리스트
      frag.appendChild(U.el('div', { class: 'section-title' }, '지금 확인·조치할 것'));
      frag.appendChild(U.el('p', { class: 't-sm t-ink2', style: 'margin:-8px 0 12px' },
        '빨간 테두리 항목은 지금 하지 않으면 나중에 만들기 어려운 것들이에요. 체크는 이 기기에 저장됩니다.'));

      var listWrap = U.el('div', { class: 'list-gap' });
      (s.checklist || []).forEach(function (item) {
        listWrap.appendChild(checkRow(item));
      });
      frag.appendChild(listWrap);

      // 관련 도구
      var tools = (s.tools || []).map(function (t) { return TOOL_META[t]; }).filter(Boolean);
      if (tools.length) {
        frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:28px' }, '이 단계에 필요한 도구'));
        var tl = U.el('div', { class: 'list-gap' });
        tools.forEach(function (t) {
          tl.appendChild(U.el('button', {
            class: 'pick', on: { click: function () { Rt.navigate(t.hash); } }
          }, [
            U.el('span', { class: 'pick__num', 'aria-hidden': 'true', style: 'background:var(--surface-2);color:var(--ink-2)' }, t.icon),
            U.el('span', { class: 'pick__body' }, [U.el('span', { class: 'pick__title' }, t.label)]),
            U.el('span', { class: 'pick__chev', 'aria-hidden': 'true' })
          ]));
        });
        frag.appendChild(tl);
      }

      // 확인일
      frag.appendChild(U.el('div', { style: 'margin-top:20px' }, U.confirmedNote(pickUpdated())));

      // 하단 CTA: 관련 지원 보기 (situation 딥링크)
      U.setCTA([
        U.el('button', { class: 'btn btn--ghost', style: 'flex:0 0 auto',
          on: { click: goHome } }, '처음'),
        U.el('button', { class: 'btn btn--primary btn--cta',
          on: { click: function () { Rt.navigate('#/resources?situation=' + id); } } },
          '이 상황의 지원 보기')
      ]);

      return frag;
    }
  };

  function checkRow(item) {
    var checked = S.isChecked(item.id);
    var box = U.el('span', { class: 'check__box', 'aria-hidden': 'true' }, '✓');
    var labelEls = [
      U.el('div', { class: 'row-wrap', style: 'align-items:center' }, [
        U.el('span', { class: 'check__label' }, item.label),
        item.critical ? U.el('span', { class: 'badge badge--critical' }, '중요') : null
      ])
    ];
    if (item.why) labelEls.push(U.el('div', { class: 'check__why' }, item.why));
    if (item.linkId) {
      var lk = D.link(item.linkId);
      if (lk) labelEls.push(U.el('div', { style: 'margin-top:8px' }, U.extLink(lk.url, lk.label)));
    }

    var row = U.el('div', {
      class: 'check' + (item.critical ? ' check--critical' : '') + (checked ? ' is-checked' : ''),
      role: 'checkbox',
      'aria-checked': checked ? 'true' : 'false',
      tabindex: '0'
    }, [box, U.el('div', { class: 'check__body' }, labelEls)]);

    function toggle() {
      var now = !row.classList.contains('is-checked');
      row.classList.toggle('is-checked', now);
      row.setAttribute('aria-checked', now ? 'true' : 'false');
      S.setChecked(item.id, now);
    }
    // 링크 클릭은 토글에서 제외
    row.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      toggle();
    });
    row.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });
    return row;
  }

  function pickUpdated() {
    // 절차형 데이터는 파일 단위 확인일을 쓴다(항목별 updated 없음).
    return D.fileUpdated('stages') || '2026-09-04';
  }

  function goHome() { Rt.navigate('#/'); }

})(window);
