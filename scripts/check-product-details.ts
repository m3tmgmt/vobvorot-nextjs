import { prisma } from '../src/lib/prisma';

async function checkProductDetails(identifier?: string) {
  try {
    // If no identifier provided, use the default one
    const searchId = identifier || 'cmbvtw5220005vz0vdauop58r';
    
    console.log(`\n🔍 Searching for: ${searchId}`);
    console.log('=====================================\n');
    
    // First try to find by product ID
    let productWithSkus = await prisma.product.findUnique({
      where: { id: searchId },
      include: {
        skus: true,
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });
    
    // If not found by ID, try to find by SKU
    if (!productWithSkus) {
      const skuResult = await prisma.productSku.findUnique({
        where: { sku: searchId },
        include: {
          product: {
            include: {
              skus: true,
              category: true,
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      });
      
      if (skuResult) {
        productWithSkus = skuResult.product;
        console.log(`Found by SKU: ${searchId}`);
      }
    }
    
    if (!productWithSkus) {
      console.log(`❌ No product found with ID or SKU: ${searchId}`);
      return;
    }
    
    // Display product information
    console.log('\n📦 PRODUCT INFORMATION');
    console.log('------------------------');
    console.log(`ID: ${productWithSkus.id}`);
    console.log(`Name: ${productWithSkus.name}`);
    console.log(`Slug: ${productWithSkus.slug}`);
    console.log(`Brand: ${productWithSkus.brand || 'N/A'}`);
    console.log(`Category: ${productWithSkus.category.name}`);
    console.log(`Active: ${productWithSkus.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`Created: ${productWithSkus.createdAt.toLocaleString()}`);
    console.log(`Updated: ${productWithSkus.updatedAt.toLocaleString()}`);
    
    if (productWithSkus.images.length > 0) {
      console.log(`Primary Image: ${productWithSkus.images[0].url}`);
    }
    
    // Display all SKUs
    console.log(`\n📊 PRODUCT SKUS (${productWithSkus.skus.length} total)`);
    console.log('=====================================');
    
    productWithSkus.skus.forEach((sku, index) => {
      console.log(`\n${index + 1}. SKU: ${sku.sku}`);
      console.log('   ------------------------');
      console.log(`   ID: ${sku.id}`);
      console.log(`   Size: ${sku.size || 'N/A'}`);
      console.log(`   Color: ${sku.color || 'N/A'}`);
      console.log(`   Price: $${sku.price}`);
      console.log(`   Compare Price: ${sku.compareAtPrice ? '$' + sku.compareAtPrice : 'N/A'}`);
      console.log(`   Stock: ${sku.stock} units`);
      console.log(`   Low Stock Threshold: ${sku.lowStockThreshold || 'N/A'}`);
      console.log(`   Active: ${sku.isActive ? '✅ Yes' : '❌ No'}`);
      
      // Weight information
      console.log(`\n   ⚖️  WEIGHT: ${sku.weight ? `${sku.weight} kg` : '❌ NOT SET'}`);
      if (sku.weight) {
        const weightValue = parseFloat(sku.weight.toString());
        console.log(`   Weight (numeric): ${weightValue} kg`);
        if (searchId === 'cmbvtw5220005vz0vdauop58r' && weightValue === 2.000) {
          console.log(`   ✅ Weight matches expected 2kg`);
        }
      }
      
      console.log(`   📐 Dimensions: ${sku.dimensions || 'N/A'}`);
      console.log(`   Created: ${sku.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${sku.updatedAt.toLocaleString()}`);
    });
    
    // Summary of weight status
    const skusWithWeight = productWithSkus.skus.filter(sku => sku.weight !== null);
    const skusWithoutWeight = productWithSkus.skus.filter(sku => sku.weight === null);
    
    console.log('\n📈 WEIGHT SUMMARY');
    console.log('------------------------');
    console.log(`Total SKUs: ${productWithSkus.skus.length}`);
    console.log(`SKUs with weight: ${skusWithWeight.length} (${Math.round(skusWithWeight.length / productWithSkus.skus.length * 100)}%)`);
    console.log(`SKUs without weight: ${skusWithoutWeight.length} (${Math.round(skusWithoutWeight.length / productWithSkus.skus.length * 100)}%)`);
    
    if (skusWithoutWeight.length > 0) {
      console.log('\n⚠️  SKUs missing weight:');
      skusWithoutWeight.forEach(sku => {
        console.log(`   - ${sku.sku} (${sku.size || 'N/A'} / ${sku.color || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line argument
const identifier = process.argv[2];

// Run the check
checkProductDetails(identifier);