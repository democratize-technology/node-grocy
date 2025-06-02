/**
 * Comprehensive tests for the Grocy API wrapper
 *
 * Run with: node --test index.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import Grocy from './index.mjs';

// Test setup
const BASE_URL = 'https://grocy.example.com';
const API_KEY = 'test-api-key';

// Test HTTP error handling with non-JSON response
test('HTTP error handling with non-JSON response', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Create a non-OK response with a content-type that is not application/json
  // This should trigger the specific error in line 86
  const nonJsonErrorResponse = {
    ok: false,
    status: 418, // I'm a teapot
    headers: {
      get: (header) => {
        if (header.toLowerCase() === 'content-type') {
          return 'text/plain'; // Not JSON
        }
        return null;
      },
    },
    text: async () => "I'm a teapot",
    json: async () => {
      throw new Error('Cannot parse as JSON');
    },
  };

  const errorFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(nonJsonErrorResponse)
  );

  // This should throw an error with the specific status code from lines 86-87
  await assert.rejects(() => client.request('/test-endpoint'), {
    message: 'Grocy API request failed: HTTP error! status: 418',
  });

  assert.strictEqual(errorFetchMock.mock.calls.length, 1);
});

// Test for forcing different branch executions
test('Force branch executions in request method', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test with special custom object that returns true for Object.keys check but throws on forEach
  const specialQueryParams = {
    [Symbol.toPrimitive]() {
      return true;
    }, // Make the object truthy
  };

  // Define custom behavior for Object.keys
  Object.defineProperty(specialQueryParams, 'toString', {
    value: () => '[object Object]',
    enumerable: false,
  });

  // Force Object.keys to return a non-empty array when called on our special object
  const originalObjectKeys = Object.keys;
  Object.keys = (obj) => {
    if (obj === specialQueryParams) {
      return ['test'];
    }
    return originalObjectKeys(obj);
  };

  try {
    // This should go through the first condition but throw in the forEach
    const mockResponse = createMockResponse(200, {});
    const fetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));

    // Use try/catch to handle the expected error in forEach
    try {
      await client.request('/test-endpoint', 'GET', null, specialQueryParams);
    } catch (e) {
      // Expected error, continue with test
    }

    // The fetch should still be called with the URL
    assert.strictEqual(fetchMock.mock.calls.length, 1);
  } finally {
    // Restore original method
    Object.keys = originalObjectKeys;
  }

  // Use a number since it won't be treated as an iterable like strings
  const mockResponse2 = createMockResponse(200, {});
  const fetchMock2 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse2));

  // This should skip the Object.keys check but go through the conditional
  await client.request('/test-endpoint', 'GET', null, 123);

  assert.strictEqual(fetchMock2.mock.calls.length, 1);
  const url2 = fetchMock2.mock.calls[0].arguments[0].toString();
  assert.strictEqual(url2, `${BASE_URL}/api/test-endpoint`);
});

// Test data handling in different HTTP methods
test('Data handling in different HTTP methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);
  const testData = { name: 'Test', value: 123 };

  // Test POST request with data
  const postMockResponse = createMockResponse(200, {});
  const postFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(postMockResponse));
  await client.request('/test-endpoint', 'POST', testData);
  assert.strictEqual(postFetchMock.mock.calls.length, 1);
  const [postUrl, postOptions] = postFetchMock.mock.calls[0].arguments;
  assert.strictEqual(postUrl.toString(), `${BASE_URL}/api/test-endpoint`);
  assert.strictEqual(postOptions.method, 'POST');
  assert.strictEqual(postOptions.body, JSON.stringify(testData));

  // Test PUT request with data
  const putMockResponse = createMockResponse(200, {});
  const putFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(putMockResponse));
  await client.request('/test-endpoint', 'PUT', testData);
  assert.strictEqual(putFetchMock.mock.calls.length, 1);
  const [putUrl, putOptions] = putFetchMock.mock.calls[0].arguments;
  assert.strictEqual(putUrl.toString(), `${BASE_URL}/api/test-endpoint`);
  assert.strictEqual(putOptions.method, 'PUT');
  assert.strictEqual(putOptions.body, JSON.stringify(testData));

  // Test DELETE request (no data)
  const deleteMockResponse = createMockResponse(200, {});
  const deleteFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(deleteMockResponse));
  await client.request('/test-endpoint', 'DELETE');
  assert.strictEqual(deleteFetchMock.mock.calls.length, 1);
  const [deleteUrl, deleteOptions] = deleteFetchMock.mock.calls[0].arguments;
  assert.strictEqual(deleteUrl.toString(), `${BASE_URL}/api/test-endpoint`);
  assert.strictEqual(deleteOptions.method, 'DELETE');
  assert.strictEqual(deleteOptions.body, undefined);

  // Test POST request without data
  const postNoDataMockResponse = createMockResponse(200, {});
  const postNoDataFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(postNoDataMockResponse)
  );
  await client.request('/test-endpoint', 'POST', null);
  assert.strictEqual(postNoDataFetchMock.mock.calls.length, 1);
  const [postNoDataUrl, postNoDataOptions] = postNoDataFetchMock.mock.calls[0].arguments;
  assert.strictEqual(postNoDataUrl.toString(), `${BASE_URL}/api/test-endpoint`);
  assert.strictEqual(postNoDataOptions.method, 'POST');
  assert.strictEqual(postNoDataOptions.body, undefined);
});

// Test edge cases in query parameters
test('Edge cases in request query parameters', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test with null queryParams
  const nullQueryMockResponse = createMockResponse(200, {});
  const nullQueryFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(nullQueryMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, null);
  assert.strictEqual(nullQueryFetchMock.mock.calls.length, 1);
  const nullQueryUrl = nullQueryFetchMock.mock.calls[0].arguments[0].toString();
  // Verify the URL doesn't have any query parameters
  assert.strictEqual(nullQueryUrl, `${BASE_URL}/api/test-endpoint`);

  // Test with empty queryParams
  const emptyQueryMockResponse = createMockResponse(200, {});
  const emptyQueryFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(emptyQueryMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, {});
  assert.strictEqual(emptyQueryFetchMock.mock.calls.length, 1);
  const emptyQueryUrl = emptyQueryFetchMock.mock.calls[0].arguments[0].toString();
  // Verify the URL doesn't have any query parameters
  assert.strictEqual(emptyQueryUrl, `${BASE_URL}/api/test-endpoint`);

  // Test query parameter with string value
  const stringParamMockResponse = createMockResponse(200, {});
  const stringParamFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(stringParamMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, { param: 'value' });
  assert.strictEqual(stringParamFetchMock.mock.calls.length, 1);
  const stringParamUrl = new URL(stringParamFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(stringParamUrl.searchParams.get('param'), 'value');

  // Test query parameter with number value (tests toString())
  const numberParamMockResponse = createMockResponse(200, {});
  const numberParamFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(numberParamMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, { param: 123 });
  assert.strictEqual(numberParamFetchMock.mock.calls.length, 1);
  const numberParamUrl = new URL(numberParamFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(numberParamUrl.searchParams.get('param'), '123');

  // Test with a non-enumerable property in queryParams (to test Object.keys behavior)
  const nonEnumerableParams = {};
  Object.defineProperty(nonEnumerableParams, 'hidden', {
    enumerable: false,
    value: 'secret',
  });
  const nonEnumParamsMockResponse = createMockResponse(200, {});
  const nonEnumParamsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(nonEnumParamsMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, nonEnumerableParams);
  assert.strictEqual(nonEnumParamsFetchMock.mock.calls.length, 1);
  const nonEnumParamsUrl = new URL(nonEnumParamsFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(nonEnumParamsUrl.searchParams.has('hidden'), false);
});

// Test the request method with different response types
test('Request method with different response types', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test JSON response
  const jsonMockResponse = createMockResponse(200, { key: 'value' });
  const jsonFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(jsonMockResponse));
  const jsonResult = await client.request('/test-endpoint');
  assert.deepStrictEqual(jsonResult, { key: 'value' });
  assert.strictEqual(jsonFetchMock.mock.calls.length, 1);

  // Test 204 No Content response
  const noContentMockResponse = createMockResponse(204);
  const noContentFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(noContentMockResponse)
  );
  const noContentResult = await client.request('/test-endpoint');
  assert.deepStrictEqual(noContentResult, { success: true });
  assert.strictEqual(noContentFetchMock.mock.calls.length, 1);

  // Test calendar response
  const calendarData = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
  const calendarMockResponse = createMockResponse(200, calendarData, 'text/calendar');
  const calendarFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(calendarMockResponse)
  );
  const calendarResult = await client.request('/test-endpoint');
  assert.deepStrictEqual(calendarResult, { calendar: calendarData });
  assert.strictEqual(calendarFetchMock.mock.calls.length, 1);

  // Test binary/other response types
  const binaryMockResponse = {
    ok: true,
    status: 200,
    headers: {
      get: (header) => {
        if (header.toLowerCase() === 'content-type') {
          return 'application/octet-stream';
        }
        return null;
      },
    },
    json: async () => {
      throw new Error('Cannot parse binary as JSON');
    },
    text: async () => 'Binary data',
  };
  const binaryFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(binaryMockResponse));
  const binaryResult = await client.request('/test-endpoint');
  assert.deepStrictEqual(binaryResult, { success: true, response: binaryMockResponse });
  assert.strictEqual(binaryFetchMock.mock.calls.length, 1);

  // Test error handling with HTTP error
  const errorMockResponse = createMockResponse(400, { error_message: 'Bad request' });
  const errorFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(errorMockResponse));
  await assert.rejects(() => client.request('/test-endpoint'), {
    message: 'Grocy API request failed: Bad request',
  });
  assert.strictEqual(errorFetchMock.mock.calls.length, 1);

  // Test error with no error_message
  const errorNoMessageMockResponse = createMockResponse(500, {});
  const errorNoMessageFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(errorNoMessageMockResponse)
  );
  await assert.rejects(() => client.request('/test-endpoint'), {
    message: 'Grocy API request failed: HTTP error! status: 500',
  });
  assert.strictEqual(errorNoMessageFetchMock.mock.calls.length, 1);

  // Test network error
  const networkErrorFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.reject(new Error('Network error'))
  );
  await assert.rejects(() => client.request('/test-endpoint'), {
    message: 'Grocy API request failed: Network error',
  });
  assert.strictEqual(networkErrorFetchMock.mock.calls.length, 1);
});

// Test query parameter handling
test('Query parameter handling', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test with array parameter
  const arrayParamsMockResponse = createMockResponse(200, {});
  const arrayParamsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(arrayParamsMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, { ids: [1, 2, 3] });
  assert.strictEqual(arrayParamsFetchMock.mock.calls.length, 1);
  const arrayParamsUrl = new URL(arrayParamsFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(arrayParamsUrl.searchParams.get('ids[]'), '1');
  assert.strictEqual(arrayParamsUrl.searchParams.getAll('ids[]').length, 3);
  assert.deepStrictEqual(arrayParamsUrl.searchParams.getAll('ids[]'), ['1', '2', '3']);

  // Test with null and undefined parameters
  const nullParamsMockResponse = createMockResponse(200, {});
  const nullParamsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(nullParamsMockResponse)
  );
  await client.request('/test-endpoint', 'GET', null, {
    valid: 'value',
    null_param: null,
    undefined_param: undefined,
  });
  assert.strictEqual(nullParamsFetchMock.mock.calls.length, 1);
  const nullParamsUrl = new URL(nullParamsFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(nullParamsUrl.searchParams.get('valid'), 'value');
  assert.strictEqual(nullParamsUrl.searchParams.has('null_param'), false);
  assert.strictEqual(nullParamsUrl.searchParams.has('undefined_param'), false);
});

// Helper to create mock responses
function createMockResponse(status, data, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (header) => {
        if (header.toLowerCase() === 'content-type') {
          return contentType;
        }
        return null;
      },
    },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

// Basic functionality tests
test('Constructor and API key management', async () => {
  // Test constructor with base URL
  const client1 = new Grocy(BASE_URL, API_KEY);
  assert.strictEqual(client1.baseUrl, `${BASE_URL}/api`);

  // Test constructor with /api already in URL
  const client2 = new Grocy(`${BASE_URL}/api`, API_KEY);
  assert.strictEqual(client2.baseUrl, `${BASE_URL}/api`);

  // Test setApiKey method
  const client3 = new Grocy(BASE_URL);
  assert.strictEqual(client3.apiKey, null);
  client3.setApiKey(API_KEY);
  assert.strictEqual(client3.apiKey, API_KEY);

  // Test request error when API key is missing
  const client4 = new Grocy(BASE_URL);
  await assert.rejects(() => client4.request('/test'), {
    message: 'API key is required. Use setApiKey() to set it.',
  });
});

// System endpoints tests
test('System endpoints', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getSystemInfo
  const systemInfoMockResponse = createMockResponse(200, { grocy_version: '3.3.0' });
  const systemInfoFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(systemInfoMockResponse)
  );
  await client.getSystemInfo();
  assert.strictEqual(systemInfoFetchMock.mock.calls.length, 1);
  const systemInfoUrl = systemInfoFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(systemInfoUrl, `${BASE_URL}/api/system/info`);

  // Test getDbChangedTime
  const dbChangedTimeMockResponse = createMockResponse(200, {
    changed_time: '2023-01-01 12:00:00',
  });
  const dbChangedTimeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(dbChangedTimeMockResponse)
  );
  await client.getDbChangedTime();
  assert.strictEqual(dbChangedTimeFetchMock.mock.calls.length, 1);
  const dbChangedTimeUrl = dbChangedTimeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(dbChangedTimeUrl, `${BASE_URL}/api/system/db-changed-time`);

  // Test getConfig
  const configMockResponse = createMockResponse(200, { config: {} });
  const configFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(configMockResponse));
  await client.getConfig();
  assert.strictEqual(configFetchMock.mock.calls.length, 1);
  const configUrl = configFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(configUrl, `${BASE_URL}/api/system/config`);

  // Test getTime without offset
  const timeNoOffsetMockResponse = createMockResponse(200, { timestamp: 1620000000 });
  const timeNoOffsetFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(timeNoOffsetMockResponse)
  );
  await client.getTime();
  assert.strictEqual(timeNoOffsetFetchMock.mock.calls.length, 1);
  const timeNoOffsetUrl = new URL(timeNoOffsetFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(timeNoOffsetUrl.pathname, `/api/system/time`);
  assert.strictEqual(timeNoOffsetUrl.searchParams.has('offset'), false);

  // Test getTime with offset
  const timeWithOffsetMockResponse = createMockResponse(200, { timestamp: 1620000060 });
  const timeWithOffsetFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(timeWithOffsetMockResponse)
  );
  await client.getTime(60);
  assert.strictEqual(timeWithOffsetFetchMock.mock.calls.length, 1);
  const timeWithOffsetUrl = new URL(timeWithOffsetFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(timeWithOffsetUrl.pathname, `/api/system/time`);
  assert.strictEqual(timeWithOffsetUrl.searchParams.get('offset'), '60');
});

// Stock management tests
test('Stock management methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);
  const productId = 456;

  // Test getStock
  const stockMockResponse = createMockResponse(200, []);
  const stockFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(stockMockResponse));
  await client.getStock();
  assert.strictEqual(stockFetchMock.mock.calls.length, 1);
  const stockUrl = stockFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(stockUrl, `${BASE_URL}/api/stock`);

  // Test getProductDetails
  const productDetailsMockResponse = createMockResponse(200, {});
  const productDetailsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(productDetailsMockResponse)
  );
  await client.getProductDetails(productId);
  assert.strictEqual(productDetailsFetchMock.mock.calls.length, 1);
  const productDetailsUrl = productDetailsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(productDetailsUrl, `${BASE_URL}/api/stock/products/${productId}`);

  // Test getProductByBarcode
  const barcode = '1234567890';
  const productByBarcodeMockResponse = createMockResponse(200, {});
  const productByBarcodeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(productByBarcodeMockResponse)
  );
  await client.getProductByBarcode(barcode);
  assert.strictEqual(productByBarcodeFetchMock.mock.calls.length, 1);
  const productByBarcodeUrl = productByBarcodeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(productByBarcodeUrl, `${BASE_URL}/api/stock/products/by-barcode/${barcode}`);

  // Test addProductToStockByBarcode
  const addByBarcodeData = { amount: 2, best_before_date: '2023-10-15' };
  const addByBarcodeMockResponse = createMockResponse(200, []);
  const addByBarcodeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(addByBarcodeMockResponse)
  );
  await client.addProductToStockByBarcode(barcode, addByBarcodeData);
  assert.strictEqual(addByBarcodeFetchMock.mock.calls.length, 1);
  const addByBarcodeUrl = addByBarcodeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(addByBarcodeUrl, `${BASE_URL}/api/stock/products/by-barcode/${barcode}/add`);

  // Test consumeProductByBarcode
  const consumeByBarcodeData = { amount: 1, transaction_type: 'consume' };
  const consumeByBarcodeMockResponse = createMockResponse(200, []);
  const consumeByBarcodeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(consumeByBarcodeMockResponse)
  );
  await client.consumeProductByBarcode(barcode, consumeByBarcodeData);
  assert.strictEqual(consumeByBarcodeFetchMock.mock.calls.length, 1);
  const consumeByBarcodeUrl = consumeByBarcodeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(
    consumeByBarcodeUrl,
    `${BASE_URL}/api/stock/products/by-barcode/${barcode}/consume`
  );

  // Test getStockEntry
  const entryId = 123;
  const entryMockResponse = createMockResponse(200, {});
  const entryFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(entryMockResponse));
  await client.getStockEntry(entryId);
  assert.strictEqual(entryFetchMock.mock.calls.length, 1);
  const entryUrl = entryFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(entryUrl, `${BASE_URL}/api/stock/entry/${entryId}`);

  // Test editStockEntry
  const editData = { amount: 5, best_before_date: '2023-12-31' };
  const editEntryMockResponse = createMockResponse(200, []);
  const editEntryFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(editEntryMockResponse)
  );
  await client.editStockEntry(entryId, editData);
  assert.strictEqual(editEntryFetchMock.mock.calls.length, 1);
  const [editUrl, editOptions] = editEntryFetchMock.mock.calls[0].arguments;
  assert.strictEqual(editUrl.toString(), `${BASE_URL}/api/stock/entry/${entryId}`);
  assert.strictEqual(editOptions.method, 'PUT');
  assert.strictEqual(editOptions.body, JSON.stringify(editData));

  // Test getVolatileStock
  const dueSoonDays = 7;
  const volatileMockResponse = createMockResponse(200, {
    due_products: [],
    overdue_products: [],
    expired_products: [],
    missing_products: [],
  });
  const volatileFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(volatileMockResponse)
  );
  await client.getVolatileStock(dueSoonDays);
  assert.strictEqual(volatileFetchMock.mock.calls.length, 1);
  const volatileUrl = new URL(volatileFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(volatileUrl.pathname, `/api/stock/volatile`);
  assert.strictEqual(volatileUrl.searchParams.get('due_soon_days'), dueSoonDays.toString());

  // Test addProductToStock
  const addData = { amount: 2, best_before_date: '2023-10-15' };
  const addMockResponse = createMockResponse(200, []);
  const addFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(addMockResponse));
  await client.addProductToStock(productId, addData);
  assert.strictEqual(addFetchMock.mock.calls.length, 1);
  const addUrl = addFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(addUrl, `${BASE_URL}/api/stock/products/${productId}/add`);

  // Test consumeProduct
  const consumeData = { amount: 1, transaction_type: 'consume' };
  const consumeMockResponse = createMockResponse(200, []);
  const consumeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(consumeMockResponse)
  );
  await client.consumeProduct(productId, consumeData);
  assert.strictEqual(consumeFetchMock.mock.calls.length, 1);
  const consumeUrl = consumeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(consumeUrl, `${BASE_URL}/api/stock/products/${productId}/consume`);

  // Test transferProduct
  const transferData = { amount: 1, location_id_from: 1, location_id_to: 2 };
  const transferMockResponse = createMockResponse(200, []);
  const transferFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(transferMockResponse)
  );
  await client.transferProduct(productId, transferData);
  assert.strictEqual(transferFetchMock.mock.calls.length, 1);
  const transferUrl = transferFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(transferUrl, `${BASE_URL}/api/stock/products/${productId}/transfer`);

  // Test inventoryProduct
  const inventoryData = { new_amount: 10 };
  const inventoryMockResponse = createMockResponse(200, []);
  const inventoryFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(inventoryMockResponse)
  );
  await client.inventoryProduct(productId, inventoryData);
  assert.strictEqual(inventoryFetchMock.mock.calls.length, 1);
  const inventoryUrl = inventoryFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(inventoryUrl, `${BASE_URL}/api/stock/products/${productId}/inventory`);

  // Test openProduct
  const openData = { amount: 1 };
  const openMockResponse = createMockResponse(200, []);
  const openFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(openMockResponse));
  await client.openProduct(productId, openData);
  assert.strictEqual(openFetchMock.mock.calls.length, 1);
  const openUrl = openFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(openUrl, `${BASE_URL}/api/stock/products/${productId}/open`);
});

// Shopping list tests
test('Shopping list methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test addMissingProductsToShoppingList
  const listData = { list_id: 1 };
  const missingMockResponse = createMockResponse(204);
  const missingFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(missingMockResponse)
  );
  await client.addMissingProductsToShoppingList(listData);
  assert.strictEqual(missingFetchMock.mock.calls.length, 1);
  const missingUrl = missingFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(missingUrl, `${BASE_URL}/api/stock/shoppinglist/add-missing-products`);

  // Test addOverdueProductsToShoppingList
  const overdueMockResponse = createMockResponse(204);
  const overdueFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(overdueMockResponse)
  );
  await client.addOverdueProductsToShoppingList(listData);
  assert.strictEqual(overdueFetchMock.mock.calls.length, 1);
  const overdueUrl = overdueFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(overdueUrl, `${BASE_URL}/api/stock/shoppinglist/add-overdue-products`);

  // Test addExpiredProductsToShoppingList
  const expiredMockResponse = createMockResponse(204);
  const expiredFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(expiredMockResponse)
  );
  await client.addExpiredProductsToShoppingList(listData);
  assert.strictEqual(expiredFetchMock.mock.calls.length, 1);
  const expiredUrl = expiredFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(expiredUrl, `${BASE_URL}/api/stock/shoppinglist/add-expired-products`);

  // Test clearShoppingList
  const clearData = { list_id: 2, done_only: true };
  const clearMockResponse = createMockResponse(204);
  const clearFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(clearMockResponse));
  await client.clearShoppingList(clearData);
  assert.strictEqual(clearFetchMock.mock.calls.length, 1);
  const clearUrl = clearFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(clearUrl, `${BASE_URL}/api/stock/shoppinglist/clear`);

  // Test addProductToShoppingList
  const addItemData = { product_id: 123, list_id: 1, product_amount: 3 };
  const addItemMockResponse = createMockResponse(204);
  const addItemFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(addItemMockResponse)
  );
  await client.addProductToShoppingList(addItemData);
  assert.strictEqual(addItemFetchMock.mock.calls.length, 1);
  const addItemUrl = addItemFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(addItemUrl, `${BASE_URL}/api/stock/shoppinglist/add-product`);

  // Test removeProductFromShoppingList
  const removeItemData = { product_id: 123, list_id: 1, product_amount: 1 };
  const removeItemMockResponse = createMockResponse(204);
  const removeItemFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(removeItemMockResponse)
  );
  await client.removeProductFromShoppingList(removeItemData);
  assert.strictEqual(removeItemFetchMock.mock.calls.length, 1);
  const removeItemUrl = removeItemFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(removeItemUrl, `${BASE_URL}/api/stock/shoppinglist/remove-product`);
});

// Generic entity interactions
test('Generic entity interactions', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getObjects
  const options = { query: ['name=Test'], order: 'name:asc', limit: 10, offset: 0 };
  const objectsMockResponse = createMockResponse(200, []);
  const objectsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(objectsMockResponse)
  );
  await client.getObjects('products', options);
  assert.strictEqual(objectsFetchMock.mock.calls.length, 1);
  const objectsUrl = new URL(objectsFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(objectsUrl.pathname, `/api/objects/products`);

  // Test addObject
  const newObject = { name: 'New Product', description: 'Test' };
  const addObjectMockResponse = createMockResponse(200, { created_object_id: 789 });
  const addObjectFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(addObjectMockResponse)
  );
  await client.addObject('products', newObject);
  assert.strictEqual(addObjectFetchMock.mock.calls.length, 1);
  const addObjectUrl = addObjectFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(addObjectUrl, `${BASE_URL}/api/objects/products`);

  // Test getObject
  const objectId = 123;
  const getObjectMockResponse = createMockResponse(200, {});
  const getObjectFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getObjectMockResponse)
  );
  await client.getObject('products', objectId);
  assert.strictEqual(getObjectFetchMock.mock.calls.length, 1);
  const getObjectUrl = getObjectFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getObjectUrl, `${BASE_URL}/api/objects/products/${objectId}`);

  // Test editObject
  const editObjectData = { name: 'Updated Product' };
  const editObjectMockResponse = createMockResponse(204);
  const editObjectFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(editObjectMockResponse)
  );
  await client.editObject('products', objectId, editObjectData);
  assert.strictEqual(editObjectFetchMock.mock.calls.length, 1);
  const editObjectUrl = editObjectFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(editObjectUrl, `${BASE_URL}/api/objects/products/${objectId}`);

  // Test deleteObject
  const deleteObjectMockResponse = createMockResponse(204);
  const deleteObjectFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(deleteObjectMockResponse)
  );
  await client.deleteObject('products', objectId);
  assert.strictEqual(deleteObjectFetchMock.mock.calls.length, 1);
  const deleteObjectUrl = deleteObjectFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(deleteObjectUrl, `${BASE_URL}/api/objects/products/${objectId}`);
});

// Chores endpoints tests
test('Chores methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getChores
  const options = { limit: 10, offset: 0 };
  const getChoresMockResponse = createMockResponse(200, []);
  const getChoresFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getChoresMockResponse)
  );
  await client.getChores(options);
  assert.strictEqual(getChoresFetchMock.mock.calls.length, 1);
  const getChoresUrl = new URL(getChoresFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(getChoresUrl.pathname, `/api/chores`);

  // Test getChoreDetails
  const choreId = 123;
  const getChoreDetailsMockResponse = createMockResponse(200, {});
  const getChoreDetailsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getChoreDetailsMockResponse)
  );
  await client.getChoreDetails(choreId);
  assert.strictEqual(getChoreDetailsFetchMock.mock.calls.length, 1);
  const getChoreDetailsUrl = getChoreDetailsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getChoreDetailsUrl, `${BASE_URL}/api/chores/${choreId}`);

  // Test executeChore
  const executeChoreData = { done_by: 1 };
  const executeChoreMockResponse = createMockResponse(200, {});
  const executeChoreFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(executeChoreMockResponse)
  );
  await client.executeChore(choreId, executeChoreData);
  assert.strictEqual(executeChoreFetchMock.mock.calls.length, 1);
  const executeChoreUrl = executeChoreFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(executeChoreUrl, `${BASE_URL}/api/chores/${choreId}/execute`);

  // Test executeChore with no data
  const executeChoreNoDataMockResponse = createMockResponse(200, {});
  const executeChoreNoDataFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(executeChoreNoDataMockResponse)
  );
  await client.executeChore(choreId);
  assert.strictEqual(executeChoreNoDataFetchMock.mock.calls.length, 1);
  const executeChoreNoDataUrl = executeChoreNoDataFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(executeChoreNoDataUrl, `${BASE_URL}/api/chores/${choreId}/execute`);
});

// Batteries endpoints tests
test('Batteries methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getBatteries
  const options = { limit: 10, offset: 0 };
  const getBatteriesMockResponse = createMockResponse(200, []);
  const getBatteriesFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getBatteriesMockResponse)
  );
  await client.getBatteries(options);
  assert.strictEqual(getBatteriesFetchMock.mock.calls.length, 1);
  const getBatteriesUrl = new URL(getBatteriesFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(getBatteriesUrl.pathname, `/api/batteries`);

  // Test getBatteryDetails
  const batteryId = 123;
  const getBatteryDetailsMockResponse = createMockResponse(200, {});
  const getBatteryDetailsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getBatteryDetailsMockResponse)
  );
  await client.getBatteryDetails(batteryId);
  assert.strictEqual(getBatteryDetailsFetchMock.mock.calls.length, 1);
  const getBatteryDetailsUrl = getBatteryDetailsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getBatteryDetailsUrl, `${BASE_URL}/api/batteries/${batteryId}`);

  // Test chargeBattery
  const chargeBatteryData = { tracked_time: '2023-01-01 12:00:00' };
  const chargeBatteryMockResponse = createMockResponse(200, {});
  const chargeBatteryFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(chargeBatteryMockResponse)
  );
  await client.chargeBattery(batteryId, chargeBatteryData);
  assert.strictEqual(chargeBatteryFetchMock.mock.calls.length, 1);
  const chargeBatteryUrl = chargeBatteryFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(chargeBatteryUrl, `${BASE_URL}/api/batteries/${batteryId}/charge`);

  // Test chargeBattery with no data
  const chargeBatteryNoDataMockResponse = createMockResponse(200, {});
  const chargeBatteryNoDataFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(chargeBatteryNoDataMockResponse)
  );
  await client.chargeBattery(batteryId);
  assert.strictEqual(chargeBatteryNoDataFetchMock.mock.calls.length, 1);
  const chargeBatteryNoDataUrl = chargeBatteryNoDataFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(chargeBatteryNoDataUrl, `${BASE_URL}/api/batteries/${batteryId}/charge`);
});

// Tasks endpoints tests
test('Tasks methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getTasks
  const options = { limit: 10, offset: 0 };
  const getTasksMockResponse = createMockResponse(200, []);
  const getTasksFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getTasksMockResponse)
  );
  await client.getTasks(options);
  assert.strictEqual(getTasksFetchMock.mock.calls.length, 1);
  const getTasksUrl = new URL(getTasksFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(getTasksUrl.pathname, `/api/tasks`);

  // Test completeTask
  const taskId = 123;
  const completeTaskData = { notes: 'Task completed' };
  const completeTaskMockResponse = createMockResponse(200, {});
  const completeTaskFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(completeTaskMockResponse)
  );
  await client.completeTask(taskId, completeTaskData);
  assert.strictEqual(completeTaskFetchMock.mock.calls.length, 1);
  const completeTaskUrl = completeTaskFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(completeTaskUrl, `${BASE_URL}/api/tasks/${taskId}/complete`);

  // Test completeTask with no data
  const completeTaskNoDataMockResponse = createMockResponse(200, {});
  const completeTaskNoDataFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(completeTaskNoDataMockResponse)
  );
  await client.completeTask(taskId);
  assert.strictEqual(completeTaskNoDataFetchMock.mock.calls.length, 1);
  const completeTaskNoDataUrl = completeTaskNoDataFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(completeTaskNoDataUrl, `${BASE_URL}/api/tasks/${taskId}/complete`);

  // Test undoTask
  const undoTaskMockResponse = createMockResponse(200, {});
  const undoTaskFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(undoTaskMockResponse)
  );
  await client.undoTask(taskId);
  assert.strictEqual(undoTaskFetchMock.mock.calls.length, 1);
  const undoTaskUrl = undoTaskFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(undoTaskUrl, `${BASE_URL}/api/tasks/${taskId}/undo`);
});

// Userfields tests
test('Userfields methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getUserfields
  const entity = 'products';
  const objectId = 123;
  const getUserfieldsMockResponse = createMockResponse(200, {});
  const getUserfieldsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getUserfieldsMockResponse)
  );
  await client.getUserfields(entity, objectId);
  assert.strictEqual(getUserfieldsFetchMock.mock.calls.length, 1);
  const getUserfieldsUrl = getUserfieldsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getUserfieldsUrl, `${BASE_URL}/api/userfields/${entity}/${objectId}`);

  // Test setUserfields
  const userfieldsData = { custom_field: 'value' };
  const setUserfieldsMockResponse = createMockResponse(204);
  const setUserfieldsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(setUserfieldsMockResponse)
  );
  await client.setUserfields(entity, objectId, userfieldsData);
  assert.strictEqual(setUserfieldsFetchMock.mock.calls.length, 1);
  const setUserfieldsUrl = setUserfieldsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(setUserfieldsUrl, `${BASE_URL}/api/userfields/${entity}/${objectId}`);
});

// File endpoints
test('File methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getFile
  const group = 'productpictures';
  const fileName = 'dGVzdC5qcGc='; // BASE64 encoded "test.jpg"
  const options = { force_serve_as: 'picture', best_fit_width: 300 };
  const getFileMockResponse = createMockResponse(
    200,
    new Uint8Array([1, 2, 3]),
    'application/octet-stream'
  );
  const getFileFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getFileMockResponse)
  );
  await client.getFile(group, fileName, options);
  assert.strictEqual(getFileFetchMock.mock.calls.length, 1);
  const getFileUrl = new URL(getFileFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(getFileUrl.pathname, `/api/files/${group}/${fileName}`);

  // Test uploadFile
  const fileData = new Uint8Array([1, 2, 3, 4]);
  const uploadFileMockResponse = createMockResponse(204);
  const uploadFileFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(uploadFileMockResponse)
  );
  await client.uploadFile(group, fileName, fileData);
  assert.strictEqual(uploadFileFetchMock.mock.calls.length, 1);
  const uploadFileUrl = uploadFileFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(uploadFileUrl, `${BASE_URL}/api/files/${group}/${fileName}`);

  // Test deleteFile
  const deleteFileMockResponse = createMockResponse(204);
  const deleteFileFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(deleteFileMockResponse)
  );
  await client.deleteFile(group, fileName);
  assert.strictEqual(deleteFileFetchMock.mock.calls.length, 1);
  const deleteFileUrl = deleteFileFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(deleteFileUrl, `${BASE_URL}/api/files/${group}/${fileName}`);
});

// User management tests
test('User management methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getUsers
  const options = { limit: 10, offset: 0 };
  const getUsersMockResponse = createMockResponse(200, []);
  const getUsersFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getUsersMockResponse)
  );
  await client.getUsers(options);
  assert.strictEqual(getUsersFetchMock.mock.calls.length, 1);
  const getUsersUrl = new URL(getUsersFetchMock.mock.calls[0].arguments[0]);
  assert.strictEqual(getUsersUrl.pathname, `/api/users`);

  // Test createUser
  const userData = { username: 'testuser', password: 'password' };
  const createUserMockResponse = createMockResponse(204);
  const createUserFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(createUserMockResponse)
  );
  await client.createUser(userData);
  assert.strictEqual(createUserFetchMock.mock.calls.length, 1);
  const createUserUrl = createUserFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(createUserUrl, `${BASE_URL}/api/users`);

  // Test editUser
  const userId = 123;
  const editUserData = { first_name: 'Test', last_name: 'User' };
  const editUserMockResponse = createMockResponse(204);
  const editUserFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(editUserMockResponse)
  );
  await client.editUser(userId, editUserData);
  assert.strictEqual(editUserFetchMock.mock.calls.length, 1);
  const editUserUrl = editUserFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(editUserUrl, `${BASE_URL}/api/users/${userId}`);

  // Test deleteUser
  const deleteUserMockResponse = createMockResponse(204);
  const deleteUserFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(deleteUserMockResponse)
  );
  await client.deleteUser(userId);
  assert.strictEqual(deleteUserFetchMock.mock.calls.length, 1);
  const deleteUserUrl = deleteUserFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(deleteUserUrl, `${BASE_URL}/api/users/${userId}`);
});

// Current user tests
test('Current user methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getCurrentUser
  const getCurrentUserMockResponse = createMockResponse(200, {});
  const getCurrentUserFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getCurrentUserMockResponse)
  );
  await client.getCurrentUser();
  assert.strictEqual(getCurrentUserFetchMock.mock.calls.length, 1);
  const getCurrentUserUrl = getCurrentUserFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getCurrentUserUrl, `${BASE_URL}/api/user`);

  // Test getUserSettings
  const getUserSettingsMockResponse = createMockResponse(200, {});
  const getUserSettingsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getUserSettingsMockResponse)
  );
  await client.getUserSettings();
  assert.strictEqual(getUserSettingsFetchMock.mock.calls.length, 1);
  const getUserSettingsUrl = getUserSettingsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getUserSettingsUrl, `${BASE_URL}/api/user/settings`);

  // Test getUserSetting
  const settingKey = 'theme';
  const getUserSettingMockResponse = createMockResponse(200, { value: 'dark' });
  const getUserSettingFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getUserSettingMockResponse)
  );
  await client.getUserSetting(settingKey);
  assert.strictEqual(getUserSettingFetchMock.mock.calls.length, 1);
  const getUserSettingUrl = getUserSettingFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getUserSettingUrl, `${BASE_URL}/api/user/settings/${settingKey}`);

  // Test setUserSetting
  const settingData = { value: 'light' };
  const setUserSettingMockResponse = createMockResponse(204);
  const setUserSettingFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(setUserSettingMockResponse)
  );
  await client.setUserSetting(settingKey, settingData);
  assert.strictEqual(setUserSettingFetchMock.mock.calls.length, 1);
  const setUserSettingUrl = setUserSettingFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(setUserSettingUrl, `${BASE_URL}/api/user/settings/${settingKey}`);
});

// Recipe endpoints
test('Recipe methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test addRecipeProductsToShoppingList
  const recipeId = 123;
  const recipeData = { excludedProductIds: [1, 2] };
  const addRecipeProductsMockResponse = createMockResponse(204);
  const addRecipeProductsFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(addRecipeProductsMockResponse)
  );
  await client.addRecipeProductsToShoppingList(recipeId, recipeData);
  assert.strictEqual(addRecipeProductsFetchMock.mock.calls.length, 1);
  const addRecipeProductsUrl = addRecipeProductsFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(
    addRecipeProductsUrl,
    `${BASE_URL}/api/recipes/${recipeId}/add-not-fulfilled-products-to-shoppinglist`
  );

  // Test getRecipeFulfillment
  const getRecipeFulfillmentMockResponse = createMockResponse(200, {});
  const getRecipeFulfillmentFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getRecipeFulfillmentMockResponse)
  );
  await client.getRecipeFulfillment(recipeId);
  assert.strictEqual(getRecipeFulfillmentFetchMock.mock.calls.length, 1);
  const getRecipeFulfillmentUrl =
    getRecipeFulfillmentFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getRecipeFulfillmentUrl, `${BASE_URL}/api/recipes/${recipeId}/fulfillment`);

  // Test consumeRecipe
  const consumeRecipeMockResponse = createMockResponse(204);
  const consumeRecipeFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(consumeRecipeMockResponse)
  );
  await client.consumeRecipe(recipeId);
  assert.strictEqual(consumeRecipeFetchMock.mock.calls.length, 1);
  const consumeRecipeUrl = consumeRecipeFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(consumeRecipeUrl, `${BASE_URL}/api/recipes/${recipeId}/consume`);

  // Test getAllRecipesFulfillment
  const options = { query: ['name=Test'], limit: 10 };
  const getAllRecipesFulfillmentMockResponse = createMockResponse(200, []);
  const getAllRecipesFulfillmentFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getAllRecipesFulfillmentMockResponse)
  );
  await client.getAllRecipesFulfillment(options);
  assert.strictEqual(getAllRecipesFulfillmentFetchMock.mock.calls.length, 1);
  const getAllRecipesFulfillmentUrl = new URL(
    getAllRecipesFulfillmentFetchMock.mock.calls[0].arguments[0]
  );
  assert.strictEqual(getAllRecipesFulfillmentUrl.pathname, `/api/recipes/fulfillment`);
});

// Test file upload with error
test('File upload with error handling', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);
  const group = 'productpictures';
  const fileName = 'dGVzdC5qcGc='; // BASE64 encoded "test.jpg"
  const fileData = new Uint8Array([1, 2, 3, 4]);

  // Test upload file with error
  const errorResponse = {
    ok: false,
    status: 500,
    json: async () => ({ error_message: 'Server error' }),
  };
  const uploadErrorFetchMock = t.mock.method(global, 'fetch', () => Promise.resolve(errorResponse));
  await assert.rejects(() => client.uploadFile(group, fileName, fileData), {
    message: 'Grocy API request failed: Server error',
  });
  assert.strictEqual(uploadErrorFetchMock.mock.calls.length, 1);

  // Test upload file with error without error_message
  const errorNoMessageResponse = {
    ok: false,
    status: 404,
    json: async () => ({}),
  };
  const uploadErrorNoMessageFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(errorNoMessageResponse)
  );
  await assert.rejects(() => client.uploadFile(group, fileName, fileData), {
    message: 'Grocy API request failed: HTTP error! status: 404',
  });
  assert.strictEqual(uploadErrorNoMessageFetchMock.mock.calls.length, 1);

  // Test upload file with network error
  const networkErrorFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.reject(new Error('Network error'))
  );
  await assert.rejects(() => client.uploadFile(group, fileName, fileData), {
    message: 'Grocy API request failed: Network error',
  });
  assert.strictEqual(networkErrorFetchMock.mock.calls.length, 1);
});

// Calendar endpoints
test('Calendar methods', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test getCalendar
  const getCalendarMockResponse = createMockResponse(
    200,
    'BEGIN:VCALENDAR\nEND:VCALENDAR',
    'text/calendar'
  );
  const getCalendarFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getCalendarMockResponse)
  );
  await client.getCalendar();
  assert.strictEqual(getCalendarFetchMock.mock.calls.length, 1);
  const getCalendarUrl = getCalendarFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getCalendarUrl, `${BASE_URL}/api/calendar/ical`);

  // Test getCalendarSharingLink
  const getCalendarSharingLinkMockResponse = createMockResponse(200, {
    url: 'https://example.com/share/123',
  });
  const getCalendarSharingLinkFetchMock = t.mock.method(global, 'fetch', () =>
    Promise.resolve(getCalendarSharingLinkMockResponse)
  );
  await client.getCalendarSharingLink();
  assert.strictEqual(getCalendarSharingLinkFetchMock.mock.calls.length, 1);
  const getCalendarSharingLinkUrl =
    getCalendarSharingLinkFetchMock.mock.calls[0].arguments[0].toString();
  assert.strictEqual(getCalendarSharingLinkUrl, `${BASE_URL}/api/calendar/ical/sharing-link`);
});

// Validation function tests
test('Validation functions', async (t) => {
  const client = new Grocy(BASE_URL, API_KEY);

  // Test constructor validation
  assert.throws(() => new Grocy(''), { message: 'Base URL is required and must be non-empty' });
  assert.throws(() => new Grocy(null), { message: 'Base URL is required and must be non-empty' });
  assert.throws(() => new Grocy(123), { message: 'Base URL must be a string' });
  // Empty string is allowed for API key in constructor (it's optional)
  const clientNoKey = new Grocy(BASE_URL, '');
  assert.strictEqual(clientNoKey.apiKey, null); // Empty string becomes null for optional strings
  assert.throws(() => new Grocy(BASE_URL, 123), { message: 'API key must be a string' });

  // Test setApiKey validation
  const testClient = new Grocy(BASE_URL, API_KEY);
  testClient.setApiKey(''); // Empty string is allowed
  assert.strictEqual(testClient.apiKey, null); // Empty string becomes null for optional strings
  assert.throws(() => testClient.setApiKey(123), { message: 'API key must be a string' });

  // Test ID validation
  await assert.rejects(() => client.getProductDetails('abc'), {
    message: 'Product ID must be a positive integer',
  });
  await assert.rejects(() => client.getProductDetails(0), {
    message: 'Product ID must be a positive integer',
  });
  await assert.rejects(() => client.getProductDetails(-1), {
    message: 'Product ID must be a positive integer',
  });
  await assert.rejects(() => client.getProductDetails(1.5), {
    message: 'Product ID must be a positive integer',
  });

  // Test string validation
  await assert.rejects(() => client.getProductByBarcode(''), {
    message: 'Barcode is required and must be non-empty',
  });
  await assert.rejects(() => client.getProductByBarcode(123), {
    message: 'Barcode must be a string',
  });
  await assert.rejects(() => client.getProductByBarcode('   '), {
    message: 'Barcode is required and must be non-empty',
  });

  // Test number validation
  await assert.rejects(() => client.addProductToStock(1, { amount: 'abc' }), {
    message: 'Amount must be a valid number',
  });
  await assert.rejects(() => client.addProductToStock(1, { amount: -1 }), {
    message: 'Amount must be at least 0.001',
  });
  await assert.rejects(() => client.getVolatileStock('abc'), {
    message: 'Due soon days must be a valid number',
  });
  await assert.rejects(() => client.getVolatileStock(-1), {
    message: 'Due soon days must be at least 0',
  });
  await assert.rejects(() => client.getVolatileStock(400), {
    message: 'Due soon days must be at most 365',
  });

  // Test date validation
  await assert.rejects(
    () =>
      client.addProductToStock(1, {
        amount: 1,
        best_before_date: 'invalid-date',
      }),
    {
      message: 'Best before date is not a valid date',
    }
  );

  // Test boolean validation
  await assert.rejects(
    () =>
      client.consumeProduct(1, {
        amount: 1,
        spoiled: 'yes',
      }),
    {
      message: 'Spoiled must be a boolean',
    }
  );

  // Test array validation
  await assert.rejects(
    () =>
      client.addRecipeProductsToShoppingList(1, {
        excluded_product_ids: 'not-an-array',
      }),
    {
      message: 'Excluded product IDs must be an array',
    }
  );
  await assert.rejects(
    () =>
      client.addRecipeProductsToShoppingList(1, {
        excluded_product_ids: [1, 'abc', 3],
      }),
    {
      message: 'Product ID must be a positive integer',
    }
  );

  // Test file validation
  await assert.rejects(() => client.getFile('', 'test.jpg'), {
    message: 'File group is required and must be non-empty',
  });
  await assert.rejects(() => client.getFile('group', ''), {
    message: 'File name is required and must be non-empty',
  });

  // uploadFile validates parameters first, then API key
  const clientNoApiKey = new Grocy(BASE_URL);
  await assert.rejects(() => clientNoApiKey.uploadFile('', 'test.jpg', new Uint8Array()), {
    message: 'File group is required and must be non-empty',
  });

  // Test API key validation with valid parameters
  await assert.rejects(() => clientNoApiKey.uploadFile('group', 'test.jpg', new Uint8Array()), {
    message: 'API key is required. Use setApiKey() to set it.',
  });

  // With API key, parameter validation works
  await assert.rejects(() => client.uploadFile('', 'test.jpg', new Uint8Array()), {
    message: 'File group is required and must be non-empty',
  });
  await assert.rejects(() => client.uploadFile('group', '', new Uint8Array()), {
    message: 'File name is required and must be non-empty',
  });
  await assert.rejects(() => client.uploadFile('group', 'test.jpg', null), {
    message: 'File data is required',
  });

  // Test user validation
  await assert.rejects(() => client.createUser(null), {
    message: 'User data must be a non-null object',
  });
  await assert.rejects(() => client.createUser({}), {
    message: 'Username is required and must be non-empty',
  });
  await assert.rejects(() => client.createUser({ username: 'test' }), {
    message: 'Password is required and must be non-empty',
  });
  await assert.rejects(() => client.editUser('abc', {}), {
    message: 'User ID must be a positive integer',
  });

  // Test entity validation
  await assert.rejects(() => client.getObjects(''), {
    message: 'Entity name is required and must be non-empty',
  });
  await assert.rejects(() => client.addObject('', {}), {
    message: 'Entity name is required and must be non-empty',
  });
  await assert.rejects(() => client.addObject('products', null), {
    message: 'Entity data must be a non-null object',
  });

  // Test optional parameter validation
  const mockResponse = createMockResponse(200, []);

  // Test with valid optional parameters
  const fetchMock1 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.addProductToStock(1, { amount: 1, price: null, location_id: undefined });
  assert.strictEqual(fetchMock1.mock.calls.length, 1);

  // Test optional string validation
  const fetchMock2 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.setUserSetting('key', { value: null });
  assert.strictEqual(fetchMock2.mock.calls.length, 1);

  // Test validation with valid Date object
  const fetchMock3 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.executeChore(1, { tracked_time: new Date('2023-01-01') });
  assert.strictEqual(fetchMock3.mock.calls.length, 1);

  // Test string validation with valid non-required empty string
  const entity = 'products';
  await assert.rejects(() => client.getUserfields(entity, ''), {
    message: 'Object ID is required and must be non-empty',
  });

  // Test getUserfields with string objectId
  const fetchMock4 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.getUserfields(entity, 'string-id');
  assert.strictEqual(fetchMock4.mock.calls.length, 1);

  // Test max length validation
  const longString = 'a'.repeat(256);
  await assert.rejects(() => client.getProductByBarcode(longString), {
    message: 'Barcode must not exceed 200 characters',
  });

  // Test min length validation
  await assert.rejects(() => client.getUserSetting(''), {
    message: 'Setting key is required and must be non-empty',
  });

  // Test setUserSetting with null data
  await assert.rejects(() => client.setUserSetting('key', null), {
    message: 'Setting data must be a non-null object',
  });

  // Test other validation error paths
  await assert.rejects(() => client.addProductToStock(1, { amount: NaN }), {
    message: 'Amount must be a valid number',
  });

  // Test validateDate with non-string non-Date value
  await assert.rejects(
    () =>
      client.addProductToStock(1, {
        amount: 1,
        best_before_date: 123,
      }),
    {
      message: 'Best before date must be a Date object or date string',
    }
  );

  // Test validateOptionalString with string
  const fetchMock5 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.addProductToStock(1, { amount: 1, transaction_type: 'purchase' });
  assert.strictEqual(fetchMock5.mock.calls.length, 1);

  // Test validateArray with empty array
  const fetchMock6 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.addRecipeProductsToShoppingList(1, { excluded_product_ids: [] });
  assert.strictEqual(fetchMock6.mock.calls.length, 1);

  // Test optional array not provided
  const fetchMock7 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.addRecipeProductsToShoppingList(1, {});
  assert.strictEqual(fetchMock7.mock.calls.length, 1);

  // Test more validation edge cases
  await assert.rejects(() => client.deleteUser(0), {
    message: 'User ID must be a positive integer',
  });

  await assert.rejects(() => client.deleteFile(123, 'test.jpg'), {
    message: 'File group must be a string',
  });

  await assert.rejects(() => client.deleteFile('group', 123), {
    message: 'File name must be a string',
  });

  // Test string with minLength - 'a' is valid since minLength is 1
  // This test was incorrect - removing it since username 'a' is actually valid

  // Actually, let's test an actual case where minLength would fail - empty string with required: false
  await assert.rejects(() => client.editUser(1, { username: '' }), {
    message: 'Username is required and must be non-empty',
  });

  // Test more validateOptionalNumber cases
  const fetchMock8 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.addProductToStock(1, { amount: 1, price: 0 }); // 0 is valid
  assert.strictEqual(fetchMock8.mock.calls.length, 1);

  // Test string not a string when required is false
  const longGroupName = 'a'.repeat(101);
  await assert.rejects(() => client.getFile(longGroupName, 'test.jpg'), {
    message: 'File group must not exceed 100 characters',
  });

  // Test undoTask for more coverage
  await assert.rejects(() => client.undoTask('not-a-number'), {
    message: 'Task ID must be a positive integer',
  });

  // Test error path in request when no API key
  const clientNoApiKey2 = new Grocy(BASE_URL);
  await assert.rejects(() => clientNoApiKey2.addProductToStock(1, { amount: 1 }), {
    message: 'API key is required. Use setApiKey() to set it.',
  });

  // Test XSS sanitization for user-facing fields
  const fetchMock9 = t.mock.method(global, 'fetch', () => Promise.resolve(mockResponse));
  await client.createUser({
    username: 'test<script>alert("xss")</script>',
    password: 'password123',
    first_name: '<img src=x onerror=alert("xss")>',
  });
  assert.strictEqual(fetchMock9.mock.calls.length, 1);
  const [, createUserOptions] = fetchMock9.mock.calls[0].arguments;
  const sentData = JSON.parse(createUserOptions.body);
  // Username should be sanitized
  assert.strictEqual(
    sentData.username,
    'test&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
  );
  // Password should NOT be sanitized
  assert.strictEqual(sentData.password, 'password123');
  // First name should be sanitized
  assert.strictEqual(sentData.first_name, '&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;');
});
