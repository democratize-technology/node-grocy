# node-grocy

A JavaScript wrapper for the Grocy REST API.

## About

node-grocy is a comprehensive client library for interacting with [Grocy](https://grocy.info/), an open-source self-hosted ERP system for your groceries and household management. This library provides a clean, Promise-based interface to all Grocy API endpoints.

## Features

- Full coverage of the Grocy API
- Promise-based async/await interface
- Error handling for various response types
- Comprehensive test suite
- No external dependencies

## Installation

```bash
npm install node-grocy
```

## Usage

```javascript
import Grocy from 'node-grocy';

// Initialize client
const grocy = new Grocy('https://your-grocy-instance.com', 'your-api-key');

// Get all products in stock
async function getStock() {
  try {
    const stock = await grocy.getStock();
    console.log('Products in stock:', stock);
  } catch (error) {
    console.error('Error fetching stock:', error.message);
  }
}

// Add a product to stock
async function addProduct(productId) {
  try {
    const data = {
      amount: 1,
      best_before_date: '2023-12-31',
      transaction_type: 'purchase',
      price: 2.99
    };
    const result = await grocy.addProductToStock(productId, data);
    console.log('Product added:', result);
  } catch (error) {
    console.error('Error adding product:', error.message);
  }
}

// Get volatile stock (due soon, overdue, expired, missing)
async function getVolatileStock() {
  try {
    const volatileStock = await grocy.getVolatileStock(7); // Products due within 7 days
    console.log('Products due soon:', volatileStock.due_products);
    console.log('Products overdue:', volatileStock.overdue_products);
    console.log('Products expired:', volatileStock.expired_products);
    console.log('Products missing:', volatileStock.missing_products);
  } catch (error) {
    console.error('Error fetching volatile stock:', error.message);
  }
}
```

## API Reference

### Constructor

```javascript
const grocy = new Grocy(baseUrl, apiKey);
```

- `baseUrl`: The base URL of your Grocy instance (with or without /api suffix)
- `apiKey`: Your Grocy API key

### Methods

The library includes methods for all Grocy API endpoints, organized into these categories:

#### System

- `getSystemInfo()`: Get information about the Grocy instance
- `getDbChangedTime()`: Get the time when the database was last changed
- `getConfig()`: Get all config settings
- `getTime(offset)`: Get the current server time

#### Stock Management

- `getStock()`: Get all products in stock
- `getStockEntry(entryId)`: Get a specific stock entry
- `editStockEntry(entryId, data)`: Edit a stock entry
- `getVolatileStock(dueSoonDays)`: Get products due soon, overdue, expired, or missing
- `getProductDetails(productId)`: Get details of a product
- `getProductByBarcode(barcode)`: Get product by barcode
- `addProductToStock(productId, data)`: Add product to stock
- `addProductToStockByBarcode(barcode, data)`: Add product to stock by barcode
- `consumeProduct(productId, data)`: Consume product from stock
- `consumeProductByBarcode(barcode, data)`: Consume product by barcode
- `transferProduct(productId, data)`: Transfer product between locations
- `inventoryProduct(productId, data)`: Set new amount for product
- `openProduct(productId, data)`: Mark product as opened

...and many more for shopping lists, chores, recipes, tasks, etc.

For detailed documentation on all methods and their parameters, please see the [full API documentation](https://github.com/your-username/node-grocy/docs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
