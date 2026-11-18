const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const apiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const productsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'products.js'), 'utf8');
const checkoutSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'checkout.js'), 'utf8');

function apiBaseFor(hostname) {
  const sandbox = {
    window: { location: { hostname } },
    document: { addEventListener() {} },
  };
  return vm.runInNewContext(`${apiSource}\nAPI_BASE;`, sandbox);
}

function productApiBaseFor(hostname) {
  const start = productsSource.indexOf('function getShopEaseApiBase(');
  assert.notEqual(start, -1, 'products.js should define the shared API base resolver');
  const end = productsSource.indexOf('\n}', start) + 2;
  assert.ok(end > start, 'the API base resolver should be a complete function');
  const resolver = productsSource.slice(start, end);
  return vm.runInNewContext(
    `${resolver}\ngetShopEaseApiBase(${JSON.stringify(hostname)});`,
    { window: { location: { hostname } } },
  );
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

test('the live catalog uses the PythonAnywhere backend on GitHub Pages', () => {
  assert.equal(
    productApiBaseFor('siddartha-jamandla.github.io'),
    'https://siddarthashopease.pythonanywhere.com',
  );
  assert.match(
    productsSource,
    /fetch\(getShopEaseApiBase\(\) \+ "\/api\/products\?per_page=100"/,
  );
});

test('checkout address and order requests use the shared API base resolver', () => {
  assert.equal((checkoutSource.match(/getShopEaseApiBase\(\)/g) || []).length, 2);
});
