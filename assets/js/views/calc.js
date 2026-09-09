/* calc.js — F2 보증금 위험도 계산기 */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var R = w.JEONSE.risk;
  var Rt = w.JEONSE.router;

  var ICONS = { safe: '✓', warn: '!', danger: '×' };

  V.calc = {
    title: '위험도 계산기',
    render: function () {
      U.setCTA(null);
      var cfg = D.riskConfig();
      var thresholds = cfg.thresholds || { safeMax: 0.70, warnMax: 0.80 };

      var frag = document.createDocumentFragment();

      frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:20px' }, [
        U.el('h1', { class: 't-h1' }, '보증금 위험도 계산기'),
        U.el('p', { class: 't-body t-ink2' }, '보증금과 집값(·선순위채권)을 넣으면 회수 위험을 신호등으로 알려드려요.')
      ]));

      // 실거래가 링크아웃
      var rtms = D.link('molit_rtms');
      frag.appendChild(U.el('div', { class: 'banner banner--info', style: 'margin-bottom:16px' }, [
        U.el('span', { class: 'banner__icon', 'aria-hidden': 'true' }, 'ℹ️'),
        U.el('div', {}, [
          U.el('div', {}, '실거래가는 자동 조회되지 않습니다. 직접 확인한 집값을 입력하세요.'),
          rtms ? U.el('div', { style: 'margin-top:6px' }, U.extLink(rtms.url, '실거래가 직접 확인하기')) : null
        ])
      ]));

      // 입력 폼
      var depositIn = numField('deposit', '전세보증금 (원)', true, '예: 200000000');
      var priceIn = numField('price', '주택가액(집값) (원)', true, '예: 250000000');
      var priorIn = numField('prior', '선순위채권 (원, 선택)', false, '근저당 등. 없으면 비워두세요');

      var errBox = U.el('div', { class: 'field__error', role: 'alert', 'aria-live': 'assertive' });
      errBox.style.display = 'none';

      var resultWrap = U.el('div', { 'aria-live': 'polite' });

      function recompute() {
        var res = R.evaluate({
          deposit: depositIn.input.value,
          price: priceIn.input.value,
          prior: priorIn.input.value
        }, thresholds);

        U.clear(resultWrap);
        if (res.error) {
          errBox.textContent = res.error;
          errBox.style.display = 'block';
          return;
        }
        errBox.style.display = 'none';
        errBox.textContent = '';
        if (!res.ok) return; // 입력 대기

        var pctStr = R.formatRatioPct(res.ratio);
        resultWrap.appendChild(U.el('div', { class: 'signal signal--' + res.level, style: 'margin-top:8px' }, [
          U.el('div', { class: 'signal__icon', 'aria-hidden': 'true' }, ICONS[res.level]),
          U.el('div', { class: 'signal__body' }, [
            U.el('div', { class: 'signal__label' }, res.label + ' · 비율 ' + pctStr + '%'),
            U.el('div', { class: 'signal__msg' }, res.message)
          ])
        ]));
        // 계산식
        resultWrap.appendChild(U.el('div', { class: 't-sm t-muted', style: 'margin-top:10px' },
          '(선순위채권 + 보증금) ÷ 주택가액 = ' + pctStr + '%'));
      }

      [depositIn, priceIn, priorIn].forEach(function (f) {
        f.input.addEventListener('input', recompute);
      });

      frag.appendChild(U.el('div', { class: 'card stack' }, [
        depositIn.wrap, priceIn.wrap, priorIn.wrap, errBox, resultWrap
      ]));

      // 기준 설명
      frag.appendChild(U.el('div', { class: 'card card--flat card--pad-sm', style: 'margin-top:16px' }, [
        U.el('div', { class: 't-sm t-bold', style: 'margin-bottom:6px' }, '판정 기준'),
        U.el('div', { class: 't-sm t-ink2' }, [
          '안전 ' + fmtPct(thresholds.safeMax) + '% 이하 · 주의 ~' + fmtPct(thresholds.warnMax) + '% · 위험 ' + fmtPct(thresholds.warnMax) + '% 초과',
          U.el('div', { style: 'margin-top:6px' }, cfg.rationale || '')
        ])
      ]));

      // 면책 1줄
      frag.appendChild(U.el('div', { class: 'disclaimer-line', style: 'margin-top:16px' },
        (cfg.note || '') + ' 이 결과는 참고용이며 법적 기준이 아닙니다.'));

      // CTA
      U.setCTA([
        U.el('button', { class: 'btn btn--ghost', style: 'flex:0 0 auto', on: { click: function () { Rt.navigate('#/'); } } }, '처음'),
        U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/resources'); } } }, '지원 창구 보기')
      ]);

      return frag;
    }
  };

  function numField(id, label, required, ph) {
    var input = U.el('input', {
      class: 'input', id: 'calc-' + id, type: 'text', inputmode: 'numeric',
      autocomplete: 'off', placeholder: ph || ''
    });
    // 숫자·콤마만 허용(부드럽게)
    input.addEventListener('input', function () {
      var v = input.value.replace(/[^0-9]/g, '');
      input.value = v ? Number(v).toLocaleString('ko-KR') : '';
    });
    var wrap = U.el('label', { class: 'field', for: 'calc-' + id }, [
      U.el('span', { class: 'field__label' }, [label, required ? U.el('span', { class: 'field__req' }, '*') : null]),
      input
    ]);
    return { wrap: wrap, input: input };
  }

  function fmtPct(x) { return String(Math.round(x * 1000) / 10).replace(/\.0$/, ''); }

})(window);
