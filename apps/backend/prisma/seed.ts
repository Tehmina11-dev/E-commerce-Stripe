/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy products...');

  // Purane dummy products ko delete kar dete hain taaki duplicate na hon
  await prisma.product.deleteMany();

  const products = [
    {
      name: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 40h battery life.',
      price: 9900, // $99.00 (Stripe accepts cents)
      currency: 'usd',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      active: true,
    },
    {
      name: 'Minimalist Mechanical Keyboard',
      description: 'RGB backlit mechanical keyboard with tactile brown switches.',
      price: 7550, // $75.50
      currency: 'usd',
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
      active: true,
    },
    {
      name: 'Ultra-Wide Gaming Monitor',
      description: '34-inch curved gaming monitor with 144Hz refresh rate.',
      price: 34999, // $349.99
      currency: 'usd',
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
      active: true,
    },
  ];

  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: product,
    });
    console.log(`Created product: ${createdProduct.name} (ID: ${createdProduct.id})`);
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });