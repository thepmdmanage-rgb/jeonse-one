/* evidence.js — F3 증거함 (타임라인 + 추가/삭제 + JSON 내보내기/불러오기) */
(function (w) {
  'use strict';
  var V = w.JEONSE.views;
  var U = w.JEONSE.util;
  var D = w.JEONSE.data;
  var S = w.JEONSE.store;
  var Rt = w.JEONSE.router;

  var TYPES = ['계약일', '특약', '문자', '납세증명', '기타'];

  V.evidence = {
    title: '증거함',
    render: function () {
      var frag = document.createDocumentFragment();

      frag.appendChild(U.el('div', { class: 'stack', style: 'margin-bottom:16px' }, [
        U.el('h1', { class: 't-h1' }, '증거함'),
        U.el('p', { class: 't-body t-ink2' }, '계약일·특약·문자·이체내역 등을 시간순으로 기록해 두세요. 피해자 신청·소송에 필요합니다.')
      ]));

      // 개인정보 고지 (계약 §8)
      frag.appendChild(U.el('div', { class: 'banner banner--info', style: 'margin-bottom:16px' }, [
        U.el('span', { class: 'banner__icon', 'aria-hidden': 'true' }, '🔒'),
        U.el('div', {}, D.meta.storageNotice || '이 기기의 브라우저에만 저장됩니다.')
      ]));

      // 타임라인 영역 (다시 그림)
      var listWrap = U.el('div');
      function renderList() {
        U.clear(listWrap);
        var state = S.getEvidence();
        var entries = (state.entries || []).slice().sort(function (a, b) {
          // 날짜 desc, 같으면 createdAt desc
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        if (!entries.length) {
          listWrap.appendChild(U.el('div', { class: 'empty' }, [
            U.el('div', { class: 'empty__icon' }, '🗂️'),
            U.el('div', {}, '아직 기록이 없어요. 아래에서 첫 기록을 추가해 보세요.')
          ]));
          return;
        }
        var tl = U.el('div', { class: 'timeline' });
        entries.forEach(function (e) {
          tl.appendChild(entryNode(e, renderList));
        });
        listWrap.appendChild(tl);
      }
      renderList();

      // 입력 폼
      var form = buildForm(renderList);

      frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:8px' }, '기록 추가'));
      frag.appendChild(form);
      frag.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:28px' }, '내 기록'));
      frag.appendChild(listWrap);

      // 하단 CTA: 내보내기 / 불러오기
      U.setCTA([
        U.el('button', { class: 'btn btn--ghost btn--cta', on: { click: onImport(renderList) } }, '불러오기'),
        U.el('button', { class: 'btn btn--primary btn--cta', on: { click: onExport } }, '내보내기')
      ]);

      return frag;
    }
  };

  function buildForm(onAdded) {
    var typeSel = U.el('select', { class: 'select', id: 'ev-type' },
      TYPES.map(function (t) { return U.el('option', { value: t }, t); }));
    var titleIn = U.el('input', { class: 'input', id: 'ev-title', type: 'text', maxlength: '120', placeholder: '예: 임대인과 반환 관련 문자' });
    var dateIn = U.el('input', { class: 'input', id: 'ev-date', type: 'date', value: U.todayISO() });
    var memoIn = U.el('textarea', { class: 'textarea', id: 'ev-memo', maxlength: '2000', placeholder: '내용·상대방·맥락을 적어두세요 (선택)' });
    var err = U.el('div', { class: 'field__error', role: 'alert' }); err.style.display = 'none';

    var addBtn = U.el('button', { class: 'btn btn--primary btn--block', on: { click: function () {
      var title = titleIn.value.trim();
      if (!title) {
        err.textContent = '제목을 입력하세요.'; err.style.display = 'block'; titleIn.focus(); return;
      }
      err.style.display = 'none';
      S.addEvidence({
        type: typeSel.value,
        title: title,
        date: dateIn.value || U.todayISO(),
        memo: memoIn.value.trim()
      });
      titleIn.value = ''; memoIn.value = '';
      U.toast('기록을 추가했습니다.');
      if (onAdded) onAdded();
    } } }, '추가하기');

    return U.el('div', { class: 'card stack' }, [
      U.el('label', { class: 'field', for: 'ev-type' }, [U.el('span', { class: 'field__label' }, '종류'), typeSel]),
      U.el('label', { class: 'field', for: 'ev-title' }, [U.el('span', { class: 'field__label' }, ['제목', U.el('span', { class: 'field__req' }, '*')]), titleIn]),
      U.el('label', { class: 'field', for: 'ev-date' }, [U.el('span', { class: 'field__label' }, '날짜'), dateIn]),
      U.el('label', { class: 'field', for: 'ev-memo' }, [U.el('span', { class: 'field__label' }, '메모'), memoIn]),
      err,
      addBtn
    ]);
  }

  // entryNode — 사용자 데이터는 textContent 로만 삽입 (escapeHtml 자동)
  function entryNode(e, onChanged) {
    var delBtn = U.el('button', { class: 'btn btn--danger btn--sm', 'aria-label': '기록 삭제',
      on: { click: function () {
        U.confirmSheet({
          title: '이 기록을 삭제할까요?',
          message: '삭제하면 되돌릴 수 없습니다.',
          confirmText: '삭제', danger: true,
          onConfirm: function () { S.removeEvidence(e.id); U.toast('삭제했습니다.'); if (onChanged) onChanged(); }
        });
      } } }, '삭제');

    return U.el('div', { class: 'timeline__item' }, [
      U.el('span', { class: 'timeline__dot', 'aria-hidden': 'true' }),
      U.el('div', { class: 'spread' }, [
        U.el('div', { class: 'grow' }, [
          U.el('div', { class: 'row-wrap', style: 'align-items:center' }, [
            U.el('span', { class: 'badge badge--cat' }, e.type || '기타'),
            U.el('span', { class: 'timeline__date' }, U.formatDate(e.date))
          ]),
          U.el('div', { class: 'timeline__title' }, e.title || '(제목 없음)'),
          e.memo ? U.el('div', { class: 'timeline__memo' }, e.memo) : null
        ]),
        delBtn
      ])
    ]);
  }

  function onExport() {
    var state = w.JEONSE.store.getEvidence();
    if (!state.entries || !state.entries.length) {
      U.toast('내보낼 기록이 없습니다.');
      return;
    }
    var text = w.JEONSE.store.exportEvidence();
    w.JEONSE.store.downloadText(w.JEONSE.store.evidenceFilename(), text);
    U.toast('내보내기 파일을 저장했습니다.');
  }

  function onImport(onDone) {
    return function () {
      var fileInput = U.el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var res = w.JEONSE.store.importEvidence(String(reader.result || ''));
          if (res.ok) {
            U.toast(res.added > 0 ? (res.added + '건을 불러왔습니다.') : '새로 추가된 기록이 없습니다(중복).');
            if (onDone) onDone();
          } else {
            U.toast(res.error || '불러오기에 실패했습니다.');
          }
        };
        reader.onerror = function () { U.toast('파일을 읽지 못했습니다.'); };
        reader.readAsText(file);
      });
      document.body.appendChild(fileInput);
      fileInput.click();
      setTimeout(function () { if (fileInput.parentNode) fileInput.parentNode.removeChild(fileInput); }, 1000);
    };
  }

})(window);
