const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductWeight() {
  const productId = 'cmbvtw5220005vz0vdauop58r';
  
  try {
    // Query the ProductSku with related Product information
    const productSku = await prisma.productSku.findFirst({
      where: {
        productId: productId
      },
      include: {
        product: true
      }
    });

    if (!productSku) {
      console.log(`❌ No ProductSku found for product ID: ${productId}`);
      return;
    }

    // Display the results
    console.log('\n📦 Product Information:');
    console.log('------------------------');
    console.log(`Product ID: ${productSku.product.id}`);
    console.log(`Product Name: ${productSku.product.name}`);
    console.log(`Product Slug: ${productSku.product.slug}`);
    console.log(`Brand: ${productSku.product.brand || 'N/A'}`);
    
    console.log('\n📊 SKU Information:');
    console.log('------------------------');
    console.log(`SKU ID: ${productSku.id}`);
    console.log(`SKU Code: ${productSku.sku}`);
    console.log(`Size: ${productSku.size || 'N/A'}`);
    console.log(`Color: ${productSku.color || 'N/A'}`);
    console.log(`Price: $${productSku.price}`);
    console.log(`Stock: ${productSku.stock}`);
    
    console.log('\n⚖️  Weight Information:');
    console.log('------------------------');
    if (productSku.weight) {
      console.log(`✅ Weight is saved: ${productSku.weight} kg`);
      
      // Check if it's 2kg as expected
      const weightValue = parseFloat(productSku.weight.toString());
      if (weightValue === 2.000) {
        console.log(`✅ Weight matches expected value (2kg)`);
      } else {
        console.log(`⚠️  Weight (${weightValue}kg) differs from expected 2kg`);
      }
    } else {
      console.log(`❌ Weight is NOT saved (null)`);
    }
    
    console.log('\n📐 Other Physical Properties:');
    console.log('------------------------');
    console.log(`Dimensions: ${productSku.dimensions || 'N/A'}`);
    
    // Also check if there are multiple SKUs for this product
    const allSkus = await prisma.productSku.findMany({
      where: {
        productId: productId
      },
      select: {
        id: true,
        sku: true,
        weight: true,
        size: true,
        color: true
      }
    });
    
    if (allSkus.length > 1) {
      console.log(`\n📋 All SKUs for this product (${allSkus.length} total):`);
      console.log('------------------------');
      allSkus.forEach((sku, index) => {
        console.log(`${index + 1}. SKU: ${sku.sku}`);
        console.log(`   Size: ${sku.size || 'N/A'}, Color: ${sku.color || 'N/A'}`);
        console.log(`   Weight: ${sku.weight ? sku.weight + ' kg' : 'Not set'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkProductWeight();