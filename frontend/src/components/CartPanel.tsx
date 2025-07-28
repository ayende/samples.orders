import React from 'react';
import { CartItem } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign } from 'lucide-react';

interface CartPanelProps {
    cart: CartItem[];
    total: number;
    onUpdateCart: (productId: string, quantity: number, action: 'add' | 'remove') => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ cart, total, onUpdateCart }) => {
    const handleIncrease = (productId: string) => {
        onUpdateCart(productId, 1, 'add');
    };

    const handleDecrease = (productId: string, currentQuantity: number) => {
        if (currentQuantity > 1) {
            onUpdateCart(productId, 1, 'remove');
        } else {
            onUpdateCart(productId, currentQuantity, 'remove');
        }
    };

    const handleRemove = (productId: string, quantity: number) => {
        onUpdateCart(productId, quantity, 'remove');
    };

    return (
        <div className="cart-panel">
            <div className="panel-header">
                <ShoppingCart className="panel-icon" />
                <h2>Shopping Cart</h2>
                <span className="cart-count">{cart.length}</span>
            </div>

            <div className="cart-content">
                {cart.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingCart size={48} className="empty-icon" />
                        <p>Your cart is empty</p>
                        <small>Add items to your cart to see them here</small>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="item-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className="placeholder-image">
                                                <ShoppingCart size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-details">
                                        <h4 className="item-name">{item.name}</h4>
                                        <p className="item-price">${item.price.toFixed(2)}</p>
                                    </div>

                                    <div className="item-controls">
                                        <div className="quantity-controls">
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleDecrease(item.id, item.quantity)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="quantity">{item.quantity}</span>
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleIncrease(item.id)}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemove(item.id, item.quantity)}
                                            title="Remove from cart"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="item-total">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-footer">
                            <div className="cart-total">
                                <div className="total-row">
                                    <span className="total-label">
                                        <DollarSign size={16} />
                                        Total:
                                    </span>
                                    <span className="total-amount">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button className="checkout-btn">
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
