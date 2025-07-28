import React, { useState, useEffect } from 'react';
import { CartItem, Order, Chat } from './types';
import { apiService } from './services/api';
import { OrdersPanel } from './components/OrdersPanel';
import { CartPanel } from './components/CartPanel';
import { ChatPanel } from './components/ChatPanel';
import { ShoppingCart, Package, MessageCircle, Loader } from 'lucide-react';
import './App.css';

function App() {
  const [userId, setUserId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chat, setChat] = useState<Chat>({ userId: '', messages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for userId
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');

    if (!urlUserId) {
      // If no userId in URL, redirect to default userId
      const defaultUserId = 'companies/1-A';
      window.location.href = `${window.location.pathname}?userId=${encodeURIComponent(defaultUserId)}`;
      return;
    }

    // Set the userId from URL and initialize data
    setUserId(urlUserId);
    initializeData(urlUserId);
  }, []);

  const initializeData = async (currentUserId: string) => {
    try {
      setLoading(true);

      // Load all data in parallel using the provided userId
      const [cartData, ordersData, chatData] = await Promise.all([
        apiService.getCart(currentUserId),
        apiService.getOrders(currentUserId),
        apiService.getChat(currentUserId)
      ]);

      setCart(cartData.cart);
      setCartTotal(cartData.total);
      setOrders(ordersData.orders);
      setChat(chatData.chat);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error initializing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCartUpdate = async (productId: string, quantity: number, action: 'add' | 'remove') => {
    try {
      let result;
      if (action === 'add') {
        result = await apiService.addToCart(userId, productId, quantity);
      } else {
        result = await apiService.removeFromCart(userId, productId, quantity);
      }
      setCart(result.cart);
      setCartTotal(result.total);
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  const handleOrderCancel = async (orderId: string) => {
    try {
      const result = await apiService.cancelOrder(userId, orderId);
      setOrders(result.orders);
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      const result = await apiService.sendMessage(userId, message);
      setChat(result.chat);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <Loader className="spinner" size={48} />
        <p>Loading shopping dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <p>Error: {error}</p>
        <button onClick={() => initializeData(userId)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <ShoppingCart className="header-icon" />
          Shopping Dashboard
        </h1>
        <div className="header-stats">
          <div className="stat">
            <Package className="stat-icon" />
            <span>{orders.length} Orders</span>
          </div>
          <div className="stat">
            <ShoppingCart className="stat-icon" />
            <span>{cart.length} Items</span>
          </div>
          <div className="stat">
            <MessageCircle className="stat-icon" />
            <span>Chat Support</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-grid">
          {/* Left Column - Orders */}
          <div className="dashboard-section orders-section">
            <OrdersPanel
              orders={orders}
              onCancelOrder={handleOrderCancel}
              onAddToCart={(productId, quantity) => handleCartUpdate(productId, quantity, 'add')}
            />
          </div>

          {/* Right Column - Cart and Chat */}
          <div className="dashboard-right">
            {/* Top Right - Cart */}
            <div className="dashboard-section cart-section">
              <CartPanel
                cart={cart}
                total={cartTotal}
                onUpdateCart={handleCartUpdate}
              />
            </div>

            {/* Bottom Right - Chat */}
            <div className="dashboard-section chat-section">
              <ChatPanel
                chat={chat}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
