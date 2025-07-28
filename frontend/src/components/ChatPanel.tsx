import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '../types';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface ChatPanelProps {
    chat: Chat;
    onSendMessage: (message: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ chat, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await onSendMessage(newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSampleQuestions = () => [
        "What's the status of my recent order?",
        "How can I return an item?",
        "When will my order be delivered?",
        "Can you recommend similar products?"
    ];

    return (
        <div className="chat-panel">
            <div className="panel-header">
                <MessageCircle className="panel-icon" />
                <h2>AI Chat Support</h2>
                <div className="chat-status">
                    <div className="status-indicator online"></div>
                    <span>Online</span>
                </div>
            </div>

            <div className="chat-content">
                <div className="messages-container">
                    {chat.messages.length === 0 ? (
                        <div className="empty-chat">
                            <Bot size={48} className="empty-icon" />
                            <p>Welcome to our AI chat support!</p>
                            <small>Ask me anything about your orders, products, or shipping.</small>

                            <div className="sample-questions">
                                <p className="sample-title">Try asking:</p>
                                {getSampleQuestions().map((question, index) => (
                                    <button
                                        key={index}
                                        className="sample-question"
                                        onClick={() => setNewMessage(question)}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {chat.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                                >
                                    <div className="message-avatar">
                                        {message.sender === 'user' ? (
                                            <User size={20} />
                                        ) : (
                                            <Bot size={20} />
                                        )}
                                    </div>

                                    <div className="message-content">
                                        <div className="message-bubble">
                                            <p>{message.message}</p>
                                        </div>
                                        <div className="message-time">
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <form className="chat-input-form" onSubmit={handleSubmit}>
                    <div className="input-container">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            disabled={sending}
                            className="chat-input"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="send-button"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
