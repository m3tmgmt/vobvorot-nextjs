-- Critical Performance Indexes for VobVorot Production
-- These indexes address the N+1 query problems and slow queries identified in the analysis

-- Products table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active 
ON products(category_id, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created 
ON products(is_active, created_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Product SKUs optimizations  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_skus_product_active 
ON product_skus(product_id, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_skus_stock_levels 
ON product_skus(stock, reserved_stock) 
WHERE is_active = true AND stock > 0;

-- Orders optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status, created_at DESC);

-- Stock reservations optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_reservations_expires 
ON stock_reservations(expires_at, status) 
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_reservations_sku_active 
ON stock_reservations(sku_id, status) 
WHERE status = 'ACTIVE';

-- Order items optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_sku 
ON order_items(order_id, sku_id);

-- Reviews optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_rating 
ON reviews(product_id, rating, created_at DESC);

-- User addresses optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_addresses_user_type 
ON user_addresses(user_id, type, is_default);

-- Categories optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_active 
ON categories(parent_id, is_active, sort_order) 
WHERE is_active = true;

-- Future letters optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_future_letters_delivery 
ON future_letters(delivery_date, status) 
WHERE status IN ('PENDING', 'SCHEDULED');

-- Product images optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_primary 
ON product_images(product_id, is_primary) 
WHERE is_primary = true;

-- Payment optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created 
ON payments(status, created_at DESC);

-- Order logs for audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_order_action 
ON order_logs(order_id, action, created_at DESC);

-- Composite index for common product queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_comprehensive 
ON products(category_id, is_active, created_at DESC, name) 
WHERE is_active = true;

-- Analysis and monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_revenue_analysis 
ON orders(created_at, total, payment_status) 
WHERE payment_status = 'COMPLETED';

ANALYZE products;
ANALYZE product_skus; 
ANALYZE orders;
ANALYZE stock_reservations;
ANALYZE order_items;