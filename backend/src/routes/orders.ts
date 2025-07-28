import { Router, Request, Response } from 'express';
import { Order } from '../types';

import { documentStore } from '../services/databaseService';

const router = Router();

// GET /api/orders?userId=uid
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const session = documentStore.openSession();
        const orders = await session.query({ collection: 'Orders' })
            .whereEquals('Company', userId)
            .orderByDescending('OrderedAt')
            .take(5)
            .all();

        res.json({ orders });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// POST /api/orders/cancel?userId=uid&id=order_id
router.post('/cancel', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const orderId = req.query.id as string;

        if (!userId || !orderId) {
            return res.status(400).json({ error: 'userId and id are required' });
        }

        const session = documentStore.openSession();

        // Load the order document from RavenDB
        const order = await session.load<Order>(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Verify that the user id matches the Company field
        if (order.Company !== userId) {
            return res.status(403).json({ error: 'Access denied: Order does not belong to this user' });
        }

        // Verify that the order did not ship yet
        if (order.ShippedAt && order.ShippedAt !== 'cancelled') {
            return res.status(400).json({ error: 'Cannot cancel order: Order has already been shipped' });
        }

        // Set it to cancel
        order.ShippedAt = 'cancelled';

        await session.saveChanges();

        // Confirm to the caller
        res.json({
            message: 'Order cancelled successfully',
            orderId: orderId,
            status: 'cancelled'
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

export { router as orderRoutes };
