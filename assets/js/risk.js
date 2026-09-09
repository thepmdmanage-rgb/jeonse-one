/* risk.js — F2 위험도 순수함수 (§5). 계산·판정·방어. 테스트 대상. */
(function (w) {
  'use strict';
  var R = w.JEONSE.risk;

  /**
   * evaluate(input, config) → result
   * input  = { deposit:number, price:number, prior:number }  (원)
   * config = { safeMax, warnMax }  (data.riskConfig().thresholds)
   * result = { ok, ratio, level, label, message, error? }
   */
  R.evaluate = function (input, config) {
    input = input || {};
    config = config || {};
    var safeMax = typeof config.safeMax === 'number' ? config.safeMax : 0.70;
    var warnMax = typeof config.warnMax === 'number' ? config.warnMax : 0.80;

    var deposit = toNum(input.deposit);
    var price = toNum(input.price);
    var prior = input.prior === '' || input.prior == null ? 0 : toNum(input.prior); // 선택 입력 → 0

    // 빈값/NaN (입력 전) → 에러 아님, 계산 대기
    if (deposit === null || price === null) {
      return { ok: false, ratio: null, level: null, label: null, message: '', error: '' };
    }
    if (prior === null) {
      // prior 가 숫자가 아닌 무효값이면 0 취급 대신 안내
      return { ok: false, ratio: null, level: null, label: null, message: '', error: '선순위채권은 숫자만 입력하세요.' };
    }

    // 방어 규칙 (계약 §5.3)
    if (price <= 0) {
      return { ok: false, ratio: null, level: null, label: null, message: '', error: '주택가액을 1원 이상 입력하세요.' };
    }
    if (deposit < 0 || prior < 0) {
      return { ok: false, ratio: null, level: null, label: null, message: '', error: '음수는 입력할 수 없습니다.' };
    }

    var ratio = (deposit + prior) / price; // 상한 클램프 없음

    var level, label, message;
    if (ratio <= safeMax) {
      level = 'safe'; label = '안전';
      message = '선순위채권과 보증금의 합이 주택가액의 ' + pct(safeMax) + '% 이하입니다. 상대적으로 안전한 편이지만, 권리관계와 시세는 계속 확인하세요.';
    } else if (ratio <= warnMax) {
      level = 'warn'; label = '주의';
      message = '보증금 회수 여력이 넉넉하지 않습니다. 반환보증 가입, 특약, 임대인 세금 상태를 반드시 점검하세요.';
    } else {
      level = 'danger'; label = '위험';
      message = '선순위채권과 보증금의 합이 주택가액의 ' + pct(warnMax) + '%를 넘습니다. 사고 시 보증금 회수가 어려울 수 있어 계약을 재검토하세요.';
    }

    return {
      ok: true,
      ratio: ratio,
      level: level,
      label: label,
      message: message
    };
  };

  // 비율 → 표시용 퍼센트 문자열 (소수 1자리, 불필요한 .0 제거)
  R.formatRatioPct = function (ratio) {
    if (ratio == null || !isFinite(ratio)) return '-';
    var v = ratio * 100;
    var s = v.toFixed(1);
    return s.replace(/\.0$/, '');
  };

  function pct(x) {
    return String(Math.round(x * 1000) / 10).replace(/\.0$/, '');
  }

  // 문자열/숫자 → number. 빈문자/undefined/null → null. NaN → null.
  function toNum(v) {
    if (v === '' || v == null) return null;
    var n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '').trim());
    if (!isFinite(n)) return null;
    return n;
  }

})(window);
