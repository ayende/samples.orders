import axios from 'axios';
import { CartItem, Order, Chat, Product, ChatMessage } from '../types';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiService = {
    // Cart API
    async getCart(userId: string): Promise<{ cart: CartItem[]; total: number }> {
        const response = await api.get(`/cart?userId=${userId}`);
        return response.data;
    },

    async addToCart(userId: string, productId: string, quantity: number = 1): Promise<{ cart: CartItem[]; total: number }> {
        const response = await api.post(`/cart?userId=${userId}&id=${productId}&qty=${quantity}`);
        return response.data;
    },

    async removeFromCart(userId: string, productId: string, quantity: number = 1): Promise<{ cart: CartItem[]; total: number }> {
        const response = await api.delete(`/cart?userId=${userId}&id=${productId}&qty=${quantity}`);
        return response.data;
    },

    // Orders API
    async getOrders(userId: string): Promise<{ orders: Order[] }> {
        const response = await api.get(`/orders?userId=${userId}`);
        return response.data;
    },

    async cancelOrder(userId: string, orderId: string): Promise<void> {
        await api.post(`/orders/cancel?userId=${userId}&id=${orderId}`);
    },

    // Chat API
    async getChat(userId: string): Promise<{ chat: Chat }> {
        const response = await api.get(`/chat?userid=${userId}`);
        return response.data;
    },

    async sendMessage(userId: string, message: string, toolId?: string): Promise<{
        chatMessage: ChatMessage,
        conversationId: string,
        refreshCart: boolean
    }> {
        const response = await api.post(`/chat?userid=${userId}`, { message, toolId });
        return response.data;
    },

    async clearChat(userId: string): Promise<void> {
        await api.delete(`/chat?userid=${userId}`);
    },

    // Products API (additional endpoint)
    async getProducts(): Promise<{ products: Product[] }> {
        const response = await api.get('/products');
        return response.data;
    },
};
