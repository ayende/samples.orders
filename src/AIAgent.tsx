import { useState } from 'react';

export function AIAgent() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    // Simulate AI response
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'AI response to: ' + input }]);
    }, 600);
    setInput('');
  };

  return (
    <div className="ai-agent-panel">
      <h3>AI Agent</h3>
      <div className="ai-agent-chat">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-agent-msg ai-agent-msg-${msg.sender}`}>{msg.text}</div>
        ))}
      </div>
      <div className="ai-agent-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
