const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting all digital book products from shop...');
  
  try {
    // Delete all digital book products
    const deletedProducts = await prisma.shopProduct.deleteMany({
      where: { 
        type: 'DIGITAL_BOOK' 
      }
    });
    
    console.log(`✅ Deleted ${deletedProducts.count} digital book products`);
    console.log('📦 Shop is now dedicated to physical books only');
    
  } catch (error) {
    console.error('❌ Error deleting digital products:', error);
    throw error;
  }
}

main()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });