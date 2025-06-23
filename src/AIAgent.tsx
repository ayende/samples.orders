import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { CancelOrderDialog } from './CancelOrderDialog';
import type { ToolResponse } from './ravendb-ext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function AIAgent() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{ orderId: string, toolId: string } | null>(null);
  const chatIdRef = useRef<string | null>(null);

  const selectedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');

  async function ravendbAiTalk(prompt: string, companyId: string, chatId: string | null) {
    const body = { prompt, companyId, chatId };
    const res = await fetch(`${API_BASE_URL}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async function ravendbAiToolReplies(toolResponses: ToolResponse[], companyId: string, chatId: string) {
    const body = { toolResponses, companyId, chatId };
    const res = await fetch(`${API_BASE_URL}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setLoading(true);
    setInput('');
    try {
      if (selectedCompany.id === undefined) {
        setMessages(msgs => [...msgs, { sender: 'ai', text: 'AI error: no company selected.' }]);
        return;
      }
      const data = await ravendbAiTalk(input, selectedCompany.id, chatIdRef.current);
      chatIdRef.current = data.chatId;
      if (data.refreshCart) {
        (window as any).cartPanelRef.fetchCart();
      }
      for (const action of data.actions || []) {
        switch (action.name) {
          case 'CancelOrder':
            const orderId = action.arguments.orderId;
            setCancelDialog({ orderId, toolId: action.toolId });
            break;
        }
      }
      console.log('AI response:', data);
      setMessages(msgs => [...msgs, { sender: 'ai', text: data.answer }]);
    } catch {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'AI error: failed to get response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="ai-agent-panel">
        <h3>AI Agent</h3>
        <div className="ai-agent-chat">
          {messages.map((msg, idx) => (
            msg.sender === 'ai' ? (
              <div key={idx} className={`ai-agent-msg ai-agent-msg-ai`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : (
              <div key={idx} className={`ai-agent-msg ai-agent-msg-user`}>{msg.text}</div>
            )
          ))}
          {loading && <div className="ai-agent-msg ai-agent-msg-ai">AI is typing...</div>}
        </div>
        <div className="ai-agent-input-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
      {cancelDialog && (
        <CancelOrderDialog
          orderId={cancelDialog.orderId}
          open={true}
          onClose={async (result) => {
            const data = await ravendbAiToolReplies([{ ToolId: cancelDialog.toolId, Content: result.message }],
              selectedCompany.id, chatIdRef.current!);
            console.log('AI response:', data);
            setMessages(msgs => [...msgs, { sender: 'ai', text: data.answer }]);
            setCancelDialog(null);
          }}
        />
      )}
    </>
  );
}
