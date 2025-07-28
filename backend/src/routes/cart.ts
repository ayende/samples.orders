import { Router, Request, Response } from 'express';
import { CartItem, Product } from '../types';

import { documentStore } from '../services/databaseService';

class Cart {
    id: string;
    userId: string;
    items: CartItem[];

    constructor(userId: string) {
        this.id = `carts/${userId}`;
        this.userId = userId;
        this.items = [];
    }
}

const router = Router();

// GET /api/cart?userId=uid
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const session = documentStore.openSession();

        let cart = await session.load<Cart>(`carts/${userId}`) || new Cart(userId);

        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        res.json({ cart: cart.items, total });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart?userId=uid&id=product_id&qty=1
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const productId = req.query.id as string;
        const quantity = parseInt(req.query.qty as string) || 1;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId and id are required' });
        }

        const session = documentStore.openSession();
        const cartId = `carts/${userId}`;

        // Load cart from RavenDB or create if missing
        let cart = await session.load<Cart>(cartId) || new Cart(userId);

        // Get product details from dataStore for now (later can be from RavenDB too)
        const product = await session.load<Product>(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.id === productId);
        if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                id: productId,
                name: product.Name,
                price: product.PricePerUnit,
                quantity: quantity,
            });
        }

        await session.store(cart, cartId, Cart);
        await session.saveChanges();

        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const addedItem = cart.items.find(item => item.id === productId);

        res.json({
            message: 'Item added to cart',
            item: addedItem,
            cart: cart.items,
            total
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// DELETE /api/cart?userId=uid&id=product_id&qty=1
router.delete('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const productId = req.query.id as string;
        const quantity = parseInt(req.query.qty as string) || 1;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId and id are required' });
        }

        const session = documentStore.openSession();
        const cartId = `carts/${userId}`;

        // Load cart from RavenDB
        let cart = await session.load<Cart>(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.id === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Decrease quantity or remove item
        if (cart.items[itemIndex].quantity > quantity) {
            cart.items[itemIndex].quantity -= quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        await session.store(cart, cartId);
        await session.saveChanges();

        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({
            message: 'Item removed from cart',
            cart: cart.items,
            total
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

export { router as cartRoutes };
