import { useState, useEffect } from 'react';
import type { Order } from './model';

interface CancelOrderDialogProps {
  orderId: string;
  open: boolean;
  onClose: (result: { success: boolean; message: string }) => void;
}

export function CancelOrderDialog({ orderId, open, onClose }: CancelOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details when dialog opens
  useEffect(() => {
    if (!open) return;
    setOrder(null);
    setError(null);
    fetch(`/api/orders/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then(setOrder)
      .catch(() => setError('Could not load order details'));
  }, [orderId, open]);

  if (!open) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      // Call backend API to cancel the order
      const res = await fetch(`/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        onClose({ success: true, message: 'Order was cancelled' });
      } else {
        const data = await res.json();
        onClose({ success: false, message: data.error || 'Failed to cancel order' });
      }
    } catch (e) {
      onClose({ success: false, message: 'Failed to cancel order: ' + e });
    } finally {
      setLoading(false);
    }
  };

  const handleNo = () => {
    onClose({ success: false, message: 'User aborted cancelation' });
  };

  let orderTotal = 0;
  if (order) {
    orderTotal = order.Lines.reduce((sum, line) => sum + line.PricePerUnit * line.Quantity * (1 - line.Discount), 0);
  }

  return (
    <div className="dialog-backdrop" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="dialog" style={{background:'#fff',padding:'2em',borderRadius:'10px',minWidth:'320px',boxShadow:'0 2px 16px rgba(0,0,0,0.15)'}}>
        <h3>Cancel Order</h3>
        <p>Are you sure you want to cancel order <b>{orderId}</b>?</p>
        {error && <div style={{color:'#e74c3c',marginBottom:'1em'}}>{error}</div>}
        {order && (
          <div style={{marginBottom:'1em'}}>
            <div><b>Total:</b> ${orderTotal.toFixed(2)}</div>
            <div><b>Products:</b></div>
            <ul style={{margin:'0.5em 0 0 1em',padding:0}}>
              {order.Lines.map((line, idx) => (
                <li key={idx}>{line.ProductName} &times; {line.Quantity} (${(line.PricePerUnit * line.Quantity * (1 - line.Discount)).toFixed(2)})</li>
              ))}
            </ul>
          </div>
        )}
        <div style={{display:'flex',gap:'1em',marginTop:'1.5em'}}>
          <button onClick={handleCancel} disabled={loading} style={{background:'#e74c3c',color:'#fff',padding:'0.7em 1.5em',borderRadius:'6px',border:'none'}}>Yes, Cancel</button>
          <button onClick={handleNo} disabled={loading} style={{background:'#ccc',color:'#333',padding:'0.7em 1.5em',borderRadius:'6px',border:'none'}}>No</button>
        </div>
      </div>
    </div>
  );
}
