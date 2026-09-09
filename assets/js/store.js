/* store.js — localStorage 계약 (§4). checklist/evidence, export/import 라운드트립. */
(function (w) {
  'use strict';
  var S = w.JEONSE.store;
  var U = w.JEONSE.util;

  var KEY_CHECK = 'jeonse.checklist.v1';
  var KEY_EVID = 'jeonse.evidence.v1';
  var VERSION = 1;

  function today() { return U.todayISO(); }

  function safeGet(key) {
    try { return w.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { w.localStorage.setItem(key, val); return true; }
    catch (e) { return false; }
  }

  function parse(raw, fallback) {
    if (!raw) return fallback;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : fallback; }
    catch (e) { return fallback; }
  }

  // ===== 체크리스트 =====
  S.getChecklist = function () {
    var o = parse(safeGet(KEY_CHECK), null);
    if (!o || typeof o.checked !== 'object' || o.checked === null) {
      return { version: VERSION, updated: today(), checked: {} };
    }
    return { version: o.version || VERSION, updated: o.updated || today(), checked: o.checked };
  };

  S.setChecked = function (itemId, bool) {
    if (!itemId) return;
    var c = S.getChecklist();
    if (bool) { c.checked[itemId] = true; }
    else { delete c.checked[itemId]; } // false 는 키 삭제 (계약)
    c.updated = today();
    c.version = VERSION;
    var ok = safeSet(KEY_CHECK, JSON.stringify(c));
    if (!ok) U.toast('저장 공간이 부족하거나 비공개 모드입니다. 체크가 저장되지 않았습니다.');
  };

  S.isChecked = function (itemId) {
    var c = S.getChecklist();
    return !!c.checked[itemId];
  };

  // ===== 증거함 =====
  S.getEvidence = function () {
    var o = parse(safeGet(KEY_EVID), null);
    if (!o || !Array.isArray(o.entries)) {
      return { version: VERSION, updated: today(), entries: [] };
    }
    return { version: o.version || VERSION, updated: o.updated || today(), entries: o.entries };
  };

  function persistEvidence(state) {
    state.updated = today();
    state.version = VERSION;
    var ok = safeSet(KEY_EVID, JSON.stringify(state));
    if (!ok) U.toast('저장 공간이 부족하거나 비공개 모드입니다. 기록이 저장되지 않았습니다.');
    return ok;
  }

  S.addEvidence = function (entry) {
    var state = S.getEvidence();
    var e = {
      id: entry && entry.id ? entry.id : ('ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      type: (entry && entry.type) || '기타',
      title: (entry && entry.title) || '',
      date: (entry && entry.date) || today(),
      memo: (entry && entry.memo) || '',
      createdAt: (entry && entry.createdAt) || Date.now()
    };
    state.entries.push(e);
    persistEvidence(state);
    return e;
  };

  S.removeEvidence = function (id) {
    var state = S.getEvidence();
    state.entries = state.entries.filter(function (e) { return e.id !== id; });
    persistEvidence(state);
  };

  // ===== 내보내기 / 불러오기 (라운드트립 §4.3) =====
  S.exportEvidence = function () {
    var state = S.getEvidence();
    var payload = {
      app: 'jeonse-one',
      kind: 'evidence',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        version: state.version || VERSION,
        updated: state.updated || today(),
        entries: state.entries || []
      }
    };
    return JSON.stringify(payload, null, 2);
  };

  // 검증 순서(계약): app → kind → version. 파괴 금지.
  S.importEvidence = function (jsonString) {
    var parsed;
    try { parsed = JSON.parse(jsonString); }
    catch (e) { return { ok: false, added: 0, error: '형식이 올바르지 않습니다.' }; }

    if (!parsed || typeof parsed !== 'object' || parsed.app !== 'jeonse-one') {
      return { ok: false, added: 0, error: '형식이 올바르지 않습니다.' };
    }
    if (parsed.kind !== 'evidence') {
      return { ok: false, added: 0, error: '형식이 올바르지 않습니다.' };
    }
    var v = parsed.version;
    if (typeof v !== 'number') {
      return { ok: false, added: 0, error: '형식이 올바르지 않습니다.' };
    }
    if (v > VERSION) {
      return { ok: false, added: 0, error: '이 파일은 더 최신 버전입니다. 앱을 업데이트하세요.' };
    }
    // v < VERSION → migrate() 자리 (현재 v1뿐이라 그대로 수용)
    var incoming = parsed.data && Array.isArray(parsed.data.entries) ? parsed.data.entries : null;
    if (!incoming) {
      return { ok: false, added: 0, error: '형식이 올바르지 않습니다.' };
    }

    var state = S.getEvidence();
    var existing = {};
    state.entries.forEach(function (e) { existing[e.id] = true; });

    var added = 0;
    incoming.forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      var id = e.id || ('ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
      if (existing[id]) return; // 중복 id skip (merge)
      state.entries.push({
        id: id,
        type: e.type || '기타',
        title: e.title || '',
        date: e.date || today(),
        memo: e.memo || '',
        createdAt: e.createdAt || Date.now()
      });
      existing[id] = true;
      added++;
    });

    var ok = persistEvidence(state);
    if (!ok) return { ok: false, added: 0, error: '저장에 실패했습니다. 저장 공간을 확인하세요.' };
    return { ok: true, added: added };
  };

  // ===== 다운로드 (Blob + a[download], 서버 전송 0) =====
  S.downloadText = function (filename, text) {
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = U.el('a', { href: url, download: filename, style: 'display:none' });
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      return true;
    } catch (e) {
      U.toast('다운로드에 실패했습니다.');
      return false;
    }
  };

  // 증거함 파일명 (계약): jeonse-one-evidence-YYYYMMDD.json
  S.evidenceFilename = function () {
    return 'jeonse-one-evidence-' + today().replace(/-/g, '') + '.json';
  };

})(window);
