const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/modules/students/utils/readStudentDocument.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const parsedModule = { exports: {} };
vm.runInNewContext(compiled, { exports: parsedModule.exports, require });
const { normalizePdfText, buildVisualLines, collectFieldValues, splitPersonName } = parsedModule.exports;

test('normalizes legacy TH Sarabun vowels and thanthakhat', () => {
  assert.equal(normalizePdfText('สหรัตน\uF70E'), 'สหรัตน์');
  assert.equal(normalizePdfText('น\u0E4D\u0E49าหนัก'), 'น้ำหนัก');
});

test('reorders Thai marks split across PDF text items before matching labels', () => {
  const lines = buildVisualLines([
    { str: 'ความสูง (ซม.) : 122 น', transform: [1, 0, 0, 1, 0, 20], width: 100 },
    { str: '\u0E4D\u0E49าหนัก (กก.) : 37', transform: [1, 0, 0, 1, 100, 20], width: 100 },
  ]);
  const fields = collectFieldValues(lines);
  assert.equal(fields.get('height_cm')?.[0], '122');
  assert.equal(fields.get('weight_kg')?.[0], '37');
});

test('splits student and adult names without changing prefixes', () => {
  assert.deepEqual({ ...splitPersonName('ด.ญ.สหรัตน์ รักษาศิล') }, {
    prefix: 'เด็กหญิง', first_name: 'สหรัตน์', last_name: 'รักษาศิล',
  });
  assert.deepEqual({ ...splitPersonName('นางจันทรารัตน์ ป้อมกะสันต์') }, {
    prefix: 'นาง', first_name: 'จันทรารัตน์', last_name: 'ป้อมกะสันต์',
  });
  assert.deepEqual({ ...splitPersonName('น.ส.อ้อย รอดล้น') }, {
    prefix: 'นางสาว', first_name: 'อ้อย', last_name: 'รอดล้น',
  });
});
