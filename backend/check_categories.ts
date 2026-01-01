import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, parentId: true, isActive: true }
  });
  
  console.log('Categories in database:');
  categories.forEach(cat => {
    const parent = cat.parentId ? ' (subcategory)' : ' (parent)';
    console.log(`  ${cat.name}${parent}: ${cat.id} (active: ${cat.isActive})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
