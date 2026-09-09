/* home.js — F1 상황 라우터 (5택 랜딩) */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var Rt = w.JEONSE.router;

  V.home = {
    title: '전세ONE',
    render: function () {
      U.setCTA(null);

      var frag = document.createDocumentFragment();

      // 히어로
      frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:24px' }, [
        U.el('div', { class: 'eyebrow' }, '전세사기 원스톱 대응'),
        U.el('h1', { class: 't-display' }, '지금 어느 단계인가요?'),
        U.el('p', { class: 't-body t-ink2' }, '내 상황을 고르면 지금 해야 할 것만 보여드려요. 계약 전 예방부터 사고·부결 대응까지.')
      ]));

      // 데이터 로드 실패 배너
      if (D.loadError) {
        frag.appendChild(dataBanner());
        frag.appendChild(U.el('div', { style: 'height:16px' }));
      }

      // 5택
      var stages = D.stages();
      var list = U.el('div', { class: 'list-gap', role: 'list' });
      if (!stages.length) {
        list.appendChild(U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '📄'),
          U.el('div', {}, '단계 정보를 불러오지 못했습니다.')
        ]));
      } else {
        stages.forEach(function (s, i) {
          list.appendChild(U.el('button', {
            class: 'pick', role: 'listitem',
            'aria-label': s.title + '. ' + (s.subtitle || ''),
            on: { click: function () { Rt.navigate('#/stage/' + s.id); } }
          }, [
            U.el('span', { class: 'pick__num', 'aria-hidden': 'true' }, String(i + 1)),
            U.el('span', { class: 'pick__body' }, [
              U.el('span', { class: 'pick__title' }, s.title),
              U.el('span', { class: 'pick__sub' }, s.subtitle || '')
            ]),
            U.el('span', { class: 'pick__chev', 'aria-hidden': 'true' })
          ]));
        });
      }
      frag.appendChild(list);

      // 바로가기 도구
      frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:28px' }, '바로 쓰는 도구'));
      var tools = U.el('div', { class: 'list-gap' }, [
        quickTool('📊', '보증금 위험도 계산기', '보증금·집값으로 안전/주의/위험 확인', '#/calc'),
        quickTool('🗂️', '증거함', '계약·문자·이체내역을 이 기기에 기록', '#/evidence'),
        quickTool('🧭', '자원 지도', '상황·지역별 지원 창구 찾기', '#/resources'),
        quickTool('📝', '서류 템플릿', '내용증명 등 서류 만들어 다운로드', '#/template/content-certification')
      ]);
      frag.appendChild(tools);

      // 면책 축약
      frag.appendChild(U.el('div', { class: 'disclaimer-line', style: 'margin-top:24px' }, [
        '전세ONE은, 1인가구협회가 1인가구 및 혼자서 전월세 계약하시는 분들을 위해 만든 법률자문이 아닌 참고용 정보입니다. 개별 사안은 공식 창구에서 확인하세요. ',
        U.el('a', { href: '#/about' }, '자세히 보기'),
        ' · ',
        U.el('a', { href: 'privacy.html' }, '개인정보·이용안내')
      ]));

      return frag;
    }
  };

  function quickTool(icon, title, sub, hash) {
    return U.el('button', {
      class: 'pick', on: { click: function () { w.JEONSE.router.navigate(hash); } }
    }, [
      U.el('span', { class: 'pick__num', 'aria-hidden': 'true', style: 'background:var(--surface-2);color:var(--ink-2)' }, icon),
      U.el('span', { class: 'pick__body' }, [
        U.el('span', { class: 'pick__title' }, title),
        U.el('span', { class: 'pick__sub' }, sub)
      ]),
      U.el('span', { class: 'pick__chev', 'aria-hidden': 'true' })
    ]);
  }

  function dataBanner() {
    return U.el('div', { class: 'banner banner--warn' }, [
      U.el('span', { class: 'banner__icon', 'aria-hidden': 'true' }, '⚠️'),
      U.el('div', {}, [
        U.el('div', { class: 't-bold' }, '데이터를 불러오지 못했습니다'),
        U.el('div', { style: 'margin-top:4px' }, '로컬 파일(file://)에서 바로 열면 데이터가 차단됩니다. 정적 서버로 열거나(예: python -m http.server) data/_bundle.js 를 생성하세요. README를 참고하세요.')
      ])
    ]);
  }

  w.JEONSE.views._dataBanner = dataBanner; // 다른 뷰에서 재사용

})(window);
