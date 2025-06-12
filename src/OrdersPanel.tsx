import { useEffect, useState } from 'react';
import type { Company, Order } from './model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface OrdersPanelProps {
  company: Company | null;
}

export function OrdersPanel({ company }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 2;

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/orders?companyId=${encodeURIComponent(company.id)}&page=${page}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [company, page]);

  useEffect(() => {
    setPage(1);
  }, [company]);

  if (!company) return <div className="orders-panel-empty">Choose a company</div>;
  if (loading) return <div className="orders-panel-loading">Loading orders...</div>;
  if (error) return <div className="orders-panel-error">{error}</div>;
  if (!orders.length) return <div className="orders-panel-empty">No orders found</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="orders-panel-list">
      <h3>Orders</h3>
      <ul>
        {orders.map(order => (
          <li key={order.id} className="orders-panel-order">
            <div>Ordered At: {order.OrderedAt?.slice(0, 10)}</div>
            <ul className="orders-panel-lines">
              <li className="orders-panel-lines-header">
                <div>Product</div>
                <div>Qty</div>
                <div>Total</div>
              </li>
              {order.Lines.map((line, idx) => (
                <li key={line.Product + '-' + idx} className="orders-panel-line">
                  <div>{line.ProductName}</div>
                  <div>{line.Quantity}</div>
                  <div>${(line.PricePerUnit * line.Quantity * (1 - line.Discount)).toFixed(2)}</div>
                  {line.Discount > 0 && (
                    <div className="orders-panel-line-discount">
                      -{(line.Discount * 100).toFixed(0)}%
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="orders-panel-pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt; Next</button>
      </div>
    </div>
  );
}
