import React, { useState, useRef, useEffect } from 'react';
import { Chat, ChatMessage } from '../types';
import { MessageCircle, Send, Bot, User, X } from 'lucide-react';

interface ChatPanelProps {
    chat: Chat;
    onSendMessage: (message: string) => void;
    onClearChat: () => void;
}

// Simple markdown renderer for basic formatting
const renderMarkdown = (msg: ChatMessage) => {
    // Handle different message formats
    let text = msg.message || msg.answer?.message || 'No message content';

    // Convert **bold** to <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert `code` to <code>
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return { __html: formatted };
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ chat, onSendMessage, onClearChat }) => {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Update local messages when chat messages change from server
    useEffect(() => {
        // Always sync local messages with chat messages from server
        setLocalMessages(chat.messages || []);
        setIsThinking(false);
    }, [chat.messages]);

    // Scroll when local messages or thinking state changes
    useEffect(() => {
        scrollToBottom();
    }, [localMessages, isThinking]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const userMessage: ChatMessage = {
            userId: 'current-user',
            message: newMessage.trim(),
            sender: 'user',
            timestamp: new Date().toISOString(),
            requiredActions: []
        };

        // Add user message immediately
        setLocalMessages(prev => [...prev, userMessage]);
        setIsThinking(true);
        setSending(true);

        const messageToSend = newMessage.trim();
        setNewMessage('');

        try {
            await onSendMessage(messageToSend);
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove the last user message on error (since it's the most recent one)
            setLocalMessages(prev => prev.slice(0, -1));
            setIsThinking(false);
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
        "Did I get any cheese?",
        "Can you recommend similar products?",
        "What wine goes with my recent order?"
    ];

    return (
        <div className="chat-panel">
            <div className="panel-header">
                <MessageCircle className="panel-icon" />
                <h2>AI Chat Support</h2>
                <div className="chat-status">
                    <div className="status-indicator online"></div>
                    <span>Online</span>
                    <button
                        className="clear-chat-btn"
                        onClick={onClearChat}
                        title="Clear chat history"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="chat-content">
                <div className="messages-container">
                    {localMessages.length === 0 && !isThinking ? (
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
                            {localMessages.map((message, index) => (
                                <div
                                    key={`message-${index}`}
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
                                            <div dangerouslySetInnerHTML={renderMarkdown(message)} />
                                        </div>
                                        <div className="message-time">
                                            {formatTime(message.timestamp)}
                                        </div>
                                        {message.answer && message.answer.orders && (
                                            <div className="message-orders">
                                                <strong>Orders:</strong>
                                                <ul>
                                                    {message.answer.orders.map((order, idx) => (
                                                        <li key={idx}>
                                                            <a
                                                                href={`http://localhost:8080/studio/index.html#databases/edit?&collection=Orders&database=Orders&id=${encodeURIComponent(order)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {order}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {message.answer && message.answer.products && (
                                            <div className="message-products">
                                                <strong>Products:</strong>
                                                <ul>
                                                    {message.answer.products.map((product, idx) => (
                                                        <li key={idx}>
                                                            <a
                                                                href={`http://localhost:8080/studio/index.html#databases/edit?&collection=Products&database=Orders&id=${encodeURIComponent(product)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {product}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isThinking && (
                                <div className="message ai-message thinking-message">
                                    <div className="message-avatar">
                                        <Bot size={20} />
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble thinking-bubble">
                                            <div className="thinking-animation">
                                                <span className="emoji">🤔</span>
                                                <span className="emoji">💭</span>
                                                <span className="emoji">⚡</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
