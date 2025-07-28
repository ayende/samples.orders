import React from 'react';
import { Order, OrderLine } from '../types';
import { Package, Calendar, DollarSign, CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';

interface OrdersPanelProps {
    orders: Order[];
    onCancelOrder: (orderId: string) => void;
    onAddToCart: (productId: string, quantity: number) => void;
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ orders, onCancelOrder, onAddToCart }) => {
    const getStatusIcon = (shippedAt: string | null) => {
        if (shippedAt === 'cancelled') return <XCircle className="status-icon cancelled" size={16} />;
        if (shippedAt && shippedAt !== 'cancelled') return <CheckCircle className="status-icon delivered" size={16} />;
        return <Clock className="status-icon processing" size={16} />;
    };

    const getStatusColor = (shippedAt: string | null) => {
        if (shippedAt === 'cancelled') return '#ef4444';
        if (shippedAt && shippedAt !== 'cancelled') return '#22c55e';
        return '#f59e0b';
    };

    const getStatusText = (shippedAt: string | null) => {
        if (shippedAt === 'cancelled') return 'Cancelled';
        if (shippedAt && shippedAt !== 'cancelled') return 'Shipped';
        return 'Processing';
    };

    const canCancelOrder = (shippedAt: string | null) => {
        return !shippedAt || shippedAt === null;
    };

    const calculateTotal = (lines: OrderLine[]): number => {
        return lines.reduce((total: number, line: OrderLine) => {
            const lineTotal = line.PricePerUnit * line.Quantity * (1 - line.Discount);
            return total + lineTotal;
        }, 0);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleCancelOrder = (orderId: string) => {
        onCancelOrder(orderId);

        
    };

    return (
        <div className="orders-panel">
            <div className="panel-header">
                <Package className="panel-icon" />
                <h2>Your Orders</h2>
                <span className="order-count">{orders.length}</span>
            </div>

            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} className="empty-icon" />
                        <p>No orders yet</p>
                        <small>Your orders will appear here once you make a purchase</small>
                    </div>
                ) : (
                    orders.map((order, index) => (
                        <div key={order.Company + index} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3 className="order-id">Order {order.Company}</h3>
                                    <div className="order-meta">
                                        <span className="order-date">
                                            <Calendar size={14} />
                                            {formatDate(order.OrderedAt)}
                                        </span>
                                        <span className="order-total">
                                            <DollarSign size={14} />
                                            ${(calculateTotal(order.Lines) + order.Freight).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="order-status" style={{ color: getStatusColor(order.ShippedAt) }}>
                                    {getStatusIcon(order.ShippedAt)}
                                    <span className="status-text">{getStatusText(order.ShippedAt)}</span>
                                    {canCancelOrder(order.ShippedAt) && (
                                        <button
                                            className="cancel-order-btn"
                                            onClick={() => handleCancelOrder(order.id)}
                                            title="Cancel Order"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="order-items">
                                {order.Lines.map((line: OrderLine, lineIndex: number) => (
                                    <div key={lineIndex} className="order-item">
                                        <div className="item-info">
                                            <span className="item-name">{line.ProductName}</span>
                                            <span className="item-details">
                                                Qty: {line.Quantity} × ${line.PricePerUnit.toFixed(2)}
                                                {line.Discount > 0 && (
                                                    <span className="discount"> ({(line.Discount * 100).toFixed(0)}% off)</span>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            className="add-to-cart-btn"
                                            onClick={() => onAddToCart(line.Product, 1)}
                                            title="Add to cart"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="shipping-address">
                                <small>📍 {order.ShipTo.Line1}, {order.ShipTo.City}, {order.ShipTo.Region} {order.ShipTo.PostalCode}</small>
                            </div>

                            {canCancelOrder(order.ShippedAt) && (
                                <button
                                    className="cancel-button"
                                    onClick={() => onCancelOrder(order.Company)}
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
