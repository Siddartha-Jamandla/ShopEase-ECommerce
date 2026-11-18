const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const apiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

function apiBaseFor(hostname) {
  const sandbox = {
    window: { location: { hostname } },
    document: { addEventListener() {} },
  };
  return vm.runInNewContext(`${apiSource}\nAPI_BASE;`, sandbox);
}

test('GitHub Pages uses the ShopEase PythonAnywhere API', () => {
  assert.equal(
    apiBaseFor('siddartha-jamandla.github.io'),
    'https://siddarthashopease.pythonanywhere.com',
  );
});

test('local development continues to use localhost:8000', () => {
  assert.equal(apiBaseFor('localhost'), 'http://localhost:8000');
});

test('PythonAnywhere keeps same-origin API requests', () => {
  assert.equal(apiBaseFor('siddarthashopease.pythonanywhere.com'), '');
});
