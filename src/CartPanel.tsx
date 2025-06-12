import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { Cart, Company } from './model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface CartPanelProps {
  company: Company;
}

export const CartPanel = forwardRef(function CartPanel({ company }: CartPanelProps, ref) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/cart?companyId=${company.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(setCart)
      .catch(() => setError('Failed to load cart'))
      .finally(() => setLoading(false));
  };

  const addToCart = async (productId: string) => {
    setLoading(true);
    setError(null);
    await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, productId })
    });
    fetchCart();
  };

  const removeFromCart = async (productId: string) => {
    setLoading(true);
    setError(null);
    await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, productId })
    });
    fetchCart();
  };

  useImperativeHandle(ref, () => ({ fetchCart, addToCart }), [company]);

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line
  }, [company.id]);

  if (loading) return <div className="cart-panel">Loading cart...</div>;
  if (error) return <div className="cart-panel-error">{error}</div>;
  if (!cart) return <div className="cart-panel-empty">Cart is empty</div>;

  return (
    <div className="cart-panel">
      <h3>Current Cart</h3>
      <div className="cart-panel-lines">
        <div className="cart-panel-lines-header">
          <div>Product</div>
          <div>Qty</div>
          <div>Total</div>
          <div></div>
        </div>
        {cart.Lines.map((line, idx) => (
          <div key={line.Product + '-' + idx} className="cart-panel-line">
            <div>{line.ProductName}</div>
            <div>{line.Quantity}</div>
            <div>${(line.PricePerUnit * line.Quantity).toFixed(2)}</div>
            <div>
              <button className="cart-panel-remove" onClick={() => removeFromCart(line.Product)} title="Remove">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={fetchCart} className="cart-panel-refresh">Refresh Cart</button>
    </div>
  );
});
