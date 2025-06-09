// Тест API endpoints
const ADMIN_API_BASE = 'http://localhost:3000/api/admin';
const API_KEY = 'ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz';

async function testAPI() {
  console.log('Testing API endpoints...\n');

  // Test orders
  try {
    const ordersResponse = await fetch(`${ADMIN_API_BASE}/orders`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const ordersData = await ordersResponse.json();
    console.log('📦 ORDERS API:');
    console.log(`Total orders: ${ordersData.statusCounts?.total || 0}`);
    console.log(`Pending: ${ordersData.statusCounts?.pending || 0}`);
    console.log(`Orders data:`, ordersData.orders?.length || 0, 'orders');
    console.log('---\n');
  } catch (error) {
    console.error('Orders API error:', error);
  }

  // Test stats
  try {
    const statsResponse = await fetch(`${ADMIN_API_BASE}/stats?type=overview`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const statsData = await statsResponse.json();
    console.log('📊 STATS API:');
    console.log(`Total revenue: $${statsData.totalRevenue || 0}`);
    console.log(`Total orders: ${statsData.totalOrders || 0}`);
    console.log(`Total customers: ${statsData.totalCustomers || 0}`);
    console.log('---\n');
  } catch (error) {
    console.error('Stats API error:', error);
  }

  // Test products
  try {
    const productsResponse = await fetch(`${ADMIN_API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const productsData = await productsResponse.json();
    console.log('🛍️ PRODUCTS API:');
    console.log(`Total products: ${productsData.products?.length || 0}`);
    console.log(`Stats:`, productsData.stats);
    console.log('---\n');
  } catch (error) {
    console.error('Products API error:', error);
  }
}

testAPI();