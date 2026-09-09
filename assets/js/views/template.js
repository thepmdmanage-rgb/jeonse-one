/* template.js — F7 서류 템플릿 (fields 폼 → fillTemplate → downloadText/인쇄) */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var S = w.JEONSE.store;
  var Rt = w.JEONSE.router;

  // fillTemplate(body, values) → string. {{key}} 치환. (계약 §3.7)
  // 미입력 값은 빈 문자열로 치환(생성 차단은 required 검증에서 처리).
  function fillTemplate(body, values) {
    values = values || {};
    return String(body || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_, key) {
      var v = values[key];
      return (v == null || v === '') ? '' : String(v);
    });
  }
  V.template = { title: '서류 템플릿', fillTemplate: fillTemplate };

  V.template.render = function (ctx) {
    var id = ctx.params.id;
    var tpl = D.template(id);

    if (!tpl) {
      U.setCTA([U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/'); } } }, '처음으로')]);
      // 사용 가능한 템플릿 목록 안내
      var list = D.templates();
      var frag0 = document.createDocumentFragment();
      frag0.appendChild(U.el('h1', { class: 't-h1', style: 'margin-bottom:12px' }, '서류 템플릿'));
      if (list.length) {
        var lw = U.el('div', { class: 'list-gap' });
        list.forEach(function (t) {
          lw.appendChild(U.el('button', { class: 'pick', on: { click: function () { Rt.navigate('#/template/' + t.id); } } }, [
            U.el('span', { class: 'pick__num', 'aria-hidden': 'true' }, '📝'),
            U.el('span', { class: 'pick__body' }, [
              U.el('span', { class: 'pick__title' }, t.title),
              U.el('span', { class: 'pick__sub' }, t.desc || '')
            ]),
            U.el('span', { class: 'pick__chev', 'aria-hidden': 'true' })
          ]));
        });
        frag0.appendChild(lw);
      } else {
        frag0.appendChild(U.el('div', { class: 'empty' }, '템플릿을 불러오지 못했습니다.'));
      }
      return frag0;
    }

    var frag = document.createDocumentFragment();
    frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
      U.el('h1', { class: 't-h1' }, tpl.title),
      tpl.desc ? U.el('p', { class: 't-sm t-ink2' }, tpl.desc) : null
    ]));

    // 다른 템플릿 전환
    var others = D.templates().filter(function (t) { return t.id !== tpl.id; });
    if (others.length) {
      var chips = U.el('div', { class: 'row-wrap', style: 'margin-bottom:16px' });
      chips.appendChild(U.el('span', { class: 'chip chip--active' }, tpl.title));
      others.forEach(function (t) {
        chips.appendChild(U.el('button', { class: 'chip', on: { click: function () { Rt.navigate('#/template/' + t.id); } } }, t.title));
      });
      frag.appendChild(chips);
    }

    // 폼
    var inputs = {}; // key → input el
    var formCard = U.el('div', { class: 'card stack' });
    (tpl.fields || []).forEach(function (f) {
      var input;
      if (f.type === 'number') {
        input = U.el('input', { class: 'input', id: 'tf-' + f.key, type: 'text', inputmode: 'numeric', autocomplete: 'off' });
        input.addEventListener('input', function () {
          var v = input.value.replace(/[^0-9]/g, '');
          input.value = v ? Number(v).toLocaleString('ko-KR') : '';
        });
      } else if (f.type === 'date') {
        input = U.el('input', { class: 'input', id: 'tf-' + f.key, type: 'date' });
      } else {
        input = U.el('input', { class: 'input', id: 'tf-' + f.key, type: 'text', maxlength: '200', autocomplete: 'off' });
      }
      inputs[f.key] = { el: input, field: f };
      formCard.appendChild(U.el('label', { class: 'field', for: 'tf-' + f.key }, [
        U.el('span', { class: 'field__label' }, [f.label, f.required ? U.el('span', { class: 'field__req' }, '*') : null]),
        input
      ]));
    });
    var err = U.el('div', { class: 'field__error', role: 'alert' }); err.style.display = 'none';
    formCard.appendChild(err);
    frag.appendChild(formCard);

    // 미리보기 영역
    frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:24px' }, '미리보기'));
    var preview = U.el('pre', {
      class: 'card print-body',
      style: 'white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:14px;line-height:1.7;margin:0'
    }, '입력하면 여기에 서류 내용이 표시됩니다.');
    frag.appendChild(preview);

    // 값 수집 + required 검증
    function collectValues() {
      var vals = {};
      Object.keys(inputs).forEach(function (k) {
        var raw = inputs[k].el.value;
        if (inputs[k].field.type === 'number') raw = raw.replace(/,/g, '');
        vals[k] = raw.trim();
      });
      return vals;
    }
    function missingRequired(vals) {
      var miss = [];
      (tpl.fields || []).forEach(function (f) {
        if (f.required && (!vals[f.key] || vals[f.key] === '')) miss.push(f.label);
      });
      return miss;
    }

    function updatePreview() {
      var vals = collectValues();
      // 미리보기는 항상 갱신(빈칸은 빈 문자열). textContent 로 안전 삽입.
      preview.textContent = fillTemplate(tpl.body, vals);
    }
    Object.keys(inputs).forEach(function (k) { inputs[k].el.addEventListener('input', updatePreview); });
    updatePreview();

    function guardAndBuild() {
      var vals = collectValues();
      var miss = missingRequired(vals);
      if (miss.length) {
        err.textContent = '필수 항목을 입력하세요: ' + miss.join(', ');
        err.style.display = 'block';
        return null;
      }
      err.style.display = 'none';
      return fillTemplate(tpl.body, vals);
    }

    // 출력 버튼(계약: output ∈ txt|md|print)
    var outputs = tpl.output || ['txt'];
    var actionBtns = [];
    if (outputs.indexOf('txt') >= 0) {
      actionBtns.push(U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () {
        var text = guardAndBuild();
        if (text == null) return;
        S.downloadText(fileName(tpl, 'txt'), text);
        U.toast('txt 파일을 저장했습니다.');
      } } }, '.txt 저장'));
    }
    if (outputs.indexOf('md') >= 0) {
      actionBtns.push(U.el('button', { class: 'btn btn--ghost btn--cta', on: { click: function () {
        var text = guardAndBuild();
        if (text == null) return;
        S.downloadText(fileName(tpl, 'md'), text);
        U.toast('md 파일을 저장했습니다.');
      } } }, '.md 저장'));
    }
    if (outputs.indexOf('print') >= 0) {
      actionBtns.push(U.el('button', { class: 'btn btn--ghost', style: 'flex:0 0 auto', on: { click: function () {
        var text = guardAndBuild();
        if (text == null) return;
        preview.textContent = text;
        try { w.print(); } catch (e) { U.toast('인쇄를 열 수 없습니다.'); }
      } } }, '인쇄'));
    }

    // 면책
    frag.appendChild(U.el('div', { class: 'disclaimer-line', style: 'margin-top:16px' },
      '본 서식은 예시이며 법률자문이 아닙니다. 실제 발송 전 전문가·공식 창구의 확인을 권장합니다.'));

    U.setCTA(actionBtns.length ? actionBtns : [U.el('button', { class: 'btn btn--primary btn--cta', on: { click: function () { Rt.navigate('#/'); } } }, '처음으로')]);

    return frag;
  };

  function fileName(tpl, ext) {
    return 'jeonse-one-' + tpl.id + '-' + U.todayISO().replace(/-/g, '') + '.' + ext;
  }

})(window);
