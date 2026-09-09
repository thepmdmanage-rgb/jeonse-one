/* reject.js — F5 부결 대응 트랙 (order 스텝퍼) */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var Rt = w.JEONSE.router;

  V.reject = {
    title: '부결 대응 트랙',
    render: function () {
      U.setCTA([
        U.el('button', { class: 'btn btn--ghost', style: 'flex:0 0 auto', on: { click: function () { Rt.navigate('#/'); } } }, '처음'),
        U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/resources?situation=rejected'); } } }, '대체 지원 보기')
      ]);

      var frag = document.createDocumentFragment();
      frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
        U.el('h1', { class: 't-h1' }, '부결 대응 트랙'),
        U.el('p', { class: 't-body t-ink2' }, '피해자 결정이 부결되어도 끝이 아니에요. 아래 순서대로 다시 대응할 수 있습니다.')
      ]));

      var steps = D.rejectSteps();
      if (!steps.length) {
        frag.appendChild(U.el('div', { class: 'empty' }, [
          U.el('div', { class: 'empty__icon' }, '📄'),
          U.el('div', {}, '부결 대응 정보를 불러오지 못했습니다.')
        ]));
        return frag;
      }

      var stepper = U.el('div', { class: 'stepper' });
      steps.forEach(function (s) {
        var link = s.linkId ? D.link(s.linkId) : null;
        stepper.appendChild(U.el('div', { class: 'step' }, [
          U.el('span', { class: 'step__num', 'aria-hidden': 'true' }, String(s.order || '')),
          U.el('div', { class: 'row-wrap', style: 'align-items:center' }, [
            U.el('span', { class: 'step__title' }, s.title || ''),
            s.verified === false ? U.verifyBadge() : null
          ]),
          s.deadline ? U.el('div', { class: 'step__deadline' }, '⏱ ' + s.deadline) : null,
          s.desc ? U.el('div', { class: 'step__desc' }, s.desc) : null,
          s.howto ? U.el('div', { class: 'step__howto' }, s.howto) : null,
          link ? U.el('div', { style: 'margin-top:8px' }, U.extLink(link.url, link.label)) : null
        ]));
      });
      frag.appendChild(stepper);

      // 면책
      frag.appendChild(U.el('div', { class: 'disclaimer-line', style: 'margin-top:20px' },
        '기한·요건은 통지서와 공식 안내를 반드시 확인하세요. 본 내용은 법률자문이 아닙니다.'));

      return frag;
    }
  };

})(window);
