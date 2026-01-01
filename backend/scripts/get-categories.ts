import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    console.log('\n=== AVAILABLE CATEGORIES ===\n');
    console.log(JSON.stringify(categories, null, 2));

    // Separate parent and subcategories
    const parents = categories.filter(c => c.parentId === null);
    const subcategories = categories.filter(c => c.parentId !== null);

    console.log('\n=== PARENT CATEGORIES ===\n');
    parents.forEach(cat => {
      console.log(`${cat.name} (${cat.id})`);
      const children = subcategories.filter(sub => sub.parentId === cat.id);
      children.forEach(child => {
        console.log(`  → ${child.name} (${child.id})`);
      });
    });

    console.log('\n=== SUBCATEGORIES FOR FRONTEND ===\n');
    console.log('Use these IDs in categoryId field:\n');
    subcategories.forEach(cat => {
      console.log(`"${cat.id}" // ${cat.name}`);
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCategories();
