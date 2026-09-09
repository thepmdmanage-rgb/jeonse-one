/* data.js — 데이터 로더(전역-or-fetch) + 접근자 헬퍼 (계약 §3.8) */
(function (w) {
  'use strict';
  var D = w.JEONSE.data;

  // 내부 저장소
  var _store = {
    meta: null,
    stages: [],
    riskConfig: null,
    resources: [],
    regions: [],
    reject: [],
    templates: []
  };
  // 파일 단위 확인일(updated) 보존소. 절차형 데이터(stages·reject 등)는
  // 항목별이 아니라 파일 단위로 갱신되므로 파일 최상위 updated 를 따로 잡아둔다.
  var _updated = {};

  D.loadError = false;
  D.loaded = false;

  // 파일명 → 스토어 키 매핑
  var FILES = [
    { key: 'meta', file: 'meta.json', pick: function (j) { return j; } },
    { key: 'stages', file: 'stages.json', pick: function (j) { return j.items || []; } },
    { key: 'riskConfig', file: 'risk-config.json', pick: function (j) { return j; } },
    { key: 'resources', file: 'resources.json', pick: function (j) { return j.items || []; } },
    { key: 'regions', file: 'regions.json', pick: function (j) { return j.items || []; } },
    { key: 'reject', file: 'reject-track.json', pick: function (j) { return j.items || []; } },
    { key: 'templates', file: 'templates.json', pick: function (j) { return j.items || []; } }
  ];

  // 전역 번들 → 파일명 키 매핑 (file:// 폴백)
  // window.__JEONSE_DATA__ = { "meta.json": {...}, "stages.json": {...}, ... }
  function fromBundle() {
    var b = w.__JEONSE_DATA__;
    if (!b || typeof b !== 'object') return false;
    try {
      FILES.forEach(function (f) {
        var raw = b[f.file];
        if (raw == null) throw new Error('bundle missing ' + f.file);
        _store[f.key] = f.pick(raw);
        if (raw && typeof raw.updated === 'string') _updated[f.key] = raw.updated;
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function fetchAll() {
    return Promise.all(FILES.map(function (f) {
      return fetch('data/' + f.file, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error(f.file + ' ' + r.status);
          return r.json();
        })
        .then(function (j) {
          _store[f.key] = f.pick(j);
          if (j && typeof j.updated === 'string') _updated[f.key] = j.updated;
        });
    }));
  }

  // load(): 실패해도 reject 안 함(앱 생존).
  // - file:// : fetch 가 막히므로 번들 전역만 사용.
  // - http(s) : JSON 이 정본 → fetch 우선, 실패 시 번들 폴백.
  function ok() { D.loaded = true; D.loadError = false; }
  function fail(err) {
    D.loaded = true; D.loadError = true;
    try { console.warn('[JEONSE] 데이터 로드 실패:', err && err.message); } catch (e) {}
  }

  D.load = function () {
    var isFile = (w.location.protocol === 'file:');
    if (isFile) {
      if (fromBundle()) { ok(); } else { fail(new Error('file:// 에서 _bundle.js 없음')); }
      return Promise.resolve();
    }
    return fetchAll()
      .then(function () { ok(); })
      .catch(function (err) {
        // http 이지만 fetch 실패(예: JSON 누락) → 번들 폴백 시도
        if (fromBundle()) { ok(); }
        else { fail(err); }
      });
  };

  // ===== 접근자 (계약 §3.8) =====
  Object.defineProperty(D, 'meta', {
    get: function () { return _store.meta || { officialLinks: [], disclaimer: '', storageNotice: '', updated: '' }; }
  });

  D.link = function (id) {
    var links = (_store.meta && _store.meta.officialLinks) || [];
    for (var i = 0; i < links.length; i++) { if (links[i].id === id) return links[i]; }
    return null;
  };

  // 파일 단위 확인일 접근자. key = FILES 의 스토어 키(예: 'stages','reject').
  D.fileUpdated = function (key) { return _updated[key] || ''; };

  D.stages = function () { return _store.stages || []; };
  D.stage = function (id) {
    var s = _store.stages || [];
    for (var i = 0; i < s.length; i++) { if (s[i].id === id) return s[i]; }
    return null;
  };

  D.riskConfig = function () {
    return _store.riskConfig || { thresholds: { safeMax: 0.70, warnMax: 0.80 }, rationale: '', note: '' };
  };

  D.resources = function () { return _store.resources || []; };
  D.regions = function () { return _store.regions || []; };

  // regions items 에서 시도 목록 distinct 추출 (별도 코드표 없음 — 드리프트 방지)
  D.sidoList = function () {
    var seen = {}, out = [];
    (_store.regions || []).forEach(function (r) {
      if (r.sido && !seen[r.sido]) {
        seen[r.sido] = true;
        out.push({ code: r.sido, name: r.sidoName || r.sido });
      }
    });
    return out;
  };

  // 특정 시도의 시군구 목록. 빈 sigungu("")=전지역 항목은 제외.
  D.sigunguList = function (sido) {
    var seen = {}, out = [];
    (_store.regions || []).forEach(function (r) {
      if (r.sido === sido && r.sigungu && !seen[r.sigungu]) {
        seen[r.sigungu] = true;
        out.push({ code: r.sigungu, name: r.sigunguName || r.sigungu });
      }
    });
    return out;
  };

  // order 오름차순 정렬 완료본
  D.rejectSteps = function () {
    return (_store.reject || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  };

  D.templates = function () { return _store.templates || []; };
  D.template = function (id) {
    var t = _store.templates || [];
    for (var i = 0; i < t.length; i++) { if (t[i].id === id) return t[i]; }
    return null;
  };

})(window);
