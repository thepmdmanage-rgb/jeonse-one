#!/usr/bin/env node
/*
 * build-bundle.mjs — data/*.json 을 하나의 window.__JEONSE_DATA__ 전역으로 합쳐
 * data/_bundle.js 를 생성한다. file:// 더블클릭 폴백용.
 *
 * 사용법:  node tools/build-bundle.mjs
 * 의존성 0. 배포 산출물에는 _bundle.js 만 포함(이 스크립트는 개발용).
 *
 * JSON 을 수정했다면 이 스크립트를 다시 실행해 _bundle.js 를 갱신하세요.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

const FILES = [
  'meta.json',
  'stages.json',
  'risk-config.json',
  'resources.json',
  'regions.json',
  'reject-track.json',
  'templates.json'
];

const bundle = {};
for (const f of FILES) {
  const raw = readFileSync(join(dataDir, f), 'utf8');
  // 파싱 검증(문법 오류 조기 발견)
  bundle[f] = JSON.parse(raw);
}

const out =
  '/* 자동 생성 파일 — 직접 수정하지 마세요. `node tools/build-bundle.mjs` 로 재생성합니다. */\n' +
  '/* data/*.json 의 합본. file:// 로 열 때 fetch 폴백으로 사용됩니다. */\n' +
  'window.__JEONSE_DATA__ = ' + JSON.stringify(bundle) + ';\n';

writeFileSync(join(dataDir, '_bundle.js'), out, 'utf8');
console.log('[build-bundle] data/_bundle.js 생성 완료 (' + FILES.length + '개 파일).');
