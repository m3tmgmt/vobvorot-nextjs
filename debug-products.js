// Отладочный скрипт для проверки товаров
const { sharedProducts } = require('./src/lib/shared-data.ts');

console.log('Current products in shared-data:');
console.log(JSON.stringify(sharedProducts, null, 2));
console.log('Total products:', sharedProducts.length);