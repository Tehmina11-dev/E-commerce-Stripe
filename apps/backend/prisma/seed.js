"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const products = [
        {
            name: 'Classic T-Shirt',
            description: '100% cotton crew-neck t-shirt.',
            price: 1999,
            currency: 'usd',
            stock: 100,
            imageUrl: 'https://via.placeholder.com/300?text=T-Shirt',
        },
        {
            name: 'Coffee Mug',
            description: 'Ceramic mug, holds 350ml.',
            price: 1299,
            currency: 'usd',
            stock: 200,
            imageUrl: 'https://via.placeholder.com/300?text=Mug',
        },
        {
            name: 'Sticker Pack',
            description: 'Set of 5 vinyl stickers.',
            price: 599,
            currency: 'usd',
            stock: 500,
            imageUrl: 'https://via.placeholder.com/300?text=Stickers',
        },
    ];
    for (const product of products) {
        await prisma.product.create({ data: product });
    }
    console.log(`Seeded ${products.length} products.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map