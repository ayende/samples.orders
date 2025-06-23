import { useEffect, useState } from 'react';
import type { Company, Order } from './model';
import { CancelOrderDialog } from './CancelOrderDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface OrdersPanelProps {
  company: Company | null;
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
}

export function OrdersPanel({ company, companies, onSelectCompany }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelDialog, setCancelDialog] = useState<{ orderId: string } | null>(null);
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

  // Always show the company selector
  const companyValue = company ? company.id : '';

  return (
    <div className={company ? 'orders-panel-list orders-panel-in-grid' : 'orders-panel-empty orders-panel-in-grid'}>
      <label htmlFor="company-select">Select a company:</label>
      <select
        id="company-select"
        className="company-select"
        value={companyValue}
        onChange={e => onSelectCompany(e.target.value)}
      >
        <option value="">Select a company</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.Name}</option>
        ))}
      </select>
      {!company && <div style={{marginTop: 16}}>Please select a company to view orders.</div>}
      {company && (
        <>
          {loading && <div className="orders-panel-loading">Loading orders...</div>}
          {error && <div className="orders-panel-error">{error}</div>}
          {!loading && !error && !orders.length && <div className="orders-panel-empty">No orders found</div>}
          {!loading && !error && orders.length > 0 && (
            <>
              <h3>Orders</h3>
              <ul>
                {orders.map(order => (
                  <li key={order.id} className="orders-panel-order">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span>Ordered At: {order.OrderedAt?.slice(0, 10)}</span>
                      <button
                        style={{background:'#e74c3c',color:'#fff',border:'none',borderRadius:'6px',padding:'0.4em 1em',marginLeft:'1em',cursor:'pointer'}}
                        onClick={() => setCancelDialog({ orderId: order.id })}
                      >
                        Cancel
                      </button>
                    </div>
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
                <span>Page {page} of {Math.ceil(total / pageSize)}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === Math.ceil(total / pageSize)}>&gt; Next</button>
              </div>
              {cancelDialog && (
                <CancelOrderDialog
                  orderId={cancelDialog.orderId}
                  open={true}
                  onClose={() => setCancelDialog(null)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
